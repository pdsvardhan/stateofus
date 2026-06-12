/**
 * POST /api/answers — THE write path of the product.
 *
 * feat-anonymous-participation: no auth, device cookie identity (AC 369/370).
 * feat-vote-dedup: UPSERT per (question, device) — update, never duplicate
 * (AC 379); per-IP + per-device rate limits + burst gate (AC 380/381).
 * feat-question-lifecycle: only active questions answerable (AC 361).
 *
 * The whole write — answer UPSERT + aggregate update across overall/state/
 * city dims — is one transaction.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { rawDb } from "@/lib/db/client";
import { getOrCreateDevice } from "@/lib/identity";
import { checkRate, hashIp } from "@/lib/rate-limit";
import { isAnswerable } from "@/lib/lifecycle";
import { validatePayload } from "@/lib/interactions/payloads";
import { updateAggregate } from "@/lib/aggregates";
import type { LifecycleState, Mode } from "@/lib/catalogue/enums";

const bodySchema = z.object({
  question_id: z.string().min(3).max(20),
  payload: z.record(z.string(), z.unknown()),
});

export async function POST(req: NextRequest) {
  let device;
  try {
    device = await getOrCreateDevice();
  } catch {
    return NextResponse.json(
      { error: "identity unavailable (server misconfigured)" },
      { status: 503 }
    );
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";

  const ipCheck = checkRate({ scope: "ip", key: hashIp(ip) });
  if (!ipCheck.allowed) {
    return NextResponse.json(
      { error: "too many answers — slow down", reason: ipCheck.reason },
      { status: 429 }
    );
  }
  const deviceCheck = checkRate({ scope: "device", key: device.device_hash });
  if (!deviceCheck.allowed) {
    return NextResponse.json(
      { error: "too many answers — slow down", reason: deviceCheck.reason },
      { status: 429 }
    );
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  const { question_id, payload } = parsed.data;

  const q = rawDb
    .prepare("SELECT id, mode, status, options_json FROM questions WHERE id = ?")
    .get(question_id) as
    | { id: string; mode: Mode; status: LifecycleState; options_json: string }
    | undefined;
  if (!q) {
    return NextResponse.json({ error: "question not found" }, { status: 404 });
  }
  if (!isAnswerable(q.status)) {
    return NextResponse.json(
      {
        error:
          q.status === "frozen"
            ? "this edition is frozen — results stay open, answers are closed"
            : `question is ${q.status} and not accepting answers`,
        status: q.status,
      },
      { status: 409 }
    );
  }

  const optionKeys = (
    JSON.parse(q.options_json) as { key: string }[]
  ).map((o) => o.key);
  const validated = validatePayload(q.mode, payload, optionKeys);
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  let outcome: "created" | "updated" = "created";
  const tx = rawDb.transaction(() => {
    const previous = rawDb
      .prepare(
        "SELECT payload_json, region_state, region_city FROM answers WHERE question_id = ? AND device_id = ?"
      )
      .get(q.id, device.id) as
      | { payload_json: string; region_state: string | null; region_city: string | null }
      | undefined;

    const prevPayload = previous
      ? (JSON.parse(previous.payload_json) as Record<string, unknown>)
      : null;

    rawDb
      .prepare(
        `INSERT INTO answers (question_id, device_id, payload_json, region_state, region_city)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(question_id, device_id)
         DO UPDATE SET payload_json = excluded.payload_json, answered_at = datetime('now')`
      )
      .run(
        q.id,
        device.id,
        JSON.stringify(validated.payload),
        device.region_state,
        device.region_city
      );
    outcome = previous ? "updated" : "created";

    updateAggregate({
      questionId: q.id,
      mode: q.mode,
      dim: "overall",
      dimKey: "",
      payload: validated.payload,
      previousPayload: prevPayload,
    });
    const state = previous?.region_state ?? device.region_state;
    if (state) {
      updateAggregate({
        questionId: q.id,
        mode: q.mode,
        dim: "state",
        dimKey: state,
        payload: validated.payload,
        previousPayload: prevPayload,
      });
    }
    const city = previous?.region_city ?? device.region_city;
    if (city) {
      updateAggregate({
        questionId: q.id,
        mode: q.mode,
        dim: "city",
        dimKey: city,
        payload: validated.payload,
        previousPayload: prevPayload,
      });
    }
  });
  tx();

  const agg = rawDb
    .prepare(
      "SELECT agg_json, sample_n FROM question_aggregates WHERE question_id = ? AND dim = 'overall' AND dim_key = ''"
    )
    .get(q.id) as { agg_json: string; sample_n: number };

  return NextResponse.json(
    {
      outcome,
      question_id: q.id,
      aggregate: JSON.parse(agg.agg_json),
      sample_n: agg.sample_n,
      your_payload: validated.payload,
    },
    { status: outcome === "created" ? 201 : 200 }
  );
}
