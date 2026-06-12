/**
 * POST /api/admin/questions/:id/transition — lifecycle governance.
 * Gated twice: middleware (ADMIN_TOKEN cookie) + Authentik forward-auth at
 * the proxy (adr-006 §3). Body: { to, reason?, approved_by? }.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { LIFECYCLE_STATES } from "@/lib/catalogue/enums";
import { transitionQuestion } from "@/lib/lifecycle";

const bodySchema = z.object({
  to: z.enum(LIFECYCLE_STATES),
  reason: z.string().max(500).optional(),
  approved_by: z.string().max(60).optional(),
});

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const result = transitionQuestion({
    questionId: id,
    to: parsed.data.to,
    actor: "admin",
    reason: parsed.data.reason,
    approvedBy: parsed.data.approved_by,
  });

  if (!result.ok) {
    const status =
      result.code === "not-found" ? 404 : result.code === "approval-required" ? 422 : 409;
    return NextResponse.json({ error: result.error, code: result.code }, { status });
  }
  return NextResponse.json({ transitioned: result });
}
