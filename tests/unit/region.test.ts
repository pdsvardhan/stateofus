/**
 * feat-region-capture — unit tests over the real db (no mocks).
 *
 *  AC376: coarse region derives from IP on first visit (ensureRegion)
 *  AC377: one-tap correction backfills answers + recomputes aggregates
 *  AC378: city/state granularity only — the canonical 36-state vocabulary
 *  + ISO 3166-2:IN code mapping (old AND new codes), private-IP null cases,
 *    non-IN → null, user-corrected regions never overwritten by geoip.
 */
import { rmSync } from "node:fs";
import { describe, expect, it } from "vitest";

process.env.DATABASE_FILE = "./data/unit-region.db";
process.env.DEVICE_HASH_SALT = "test-salt";
rmSync("./data/unit-region.db", { force: true });
rmSync("./data/unit-region.db-wal", { force: true });

const { rawDb } = await import("@/lib/db/client");
const { updateAggregate } = await import("@/lib/aggregates");
const { INDIAN_STATES, stateFromIsoCode, isIndianState } = await import(
  "@/lib/region/states"
);
const { lookupRegion, isPrivateIp } = await import("@/lib/region/geo");
const { ensureRegion } = await import("@/lib/region/resolve");
const { applyRegionCorrection } = await import("@/lib/region/correct");

function insertDevice(
  hash: string,
  region?: { state: string; city: string | null; source: string }
): number {
  const info = region
    ? rawDb
        .prepare(
          "INSERT INTO devices (device_hash, region_state, region_city, region_source) VALUES (?, ?, ?, ?)"
        )
        .run(hash, region.state, region.city, region.source)
    : rawDb.prepare("INSERT INTO devices (device_hash) VALUES (?)").run(hash);
  return Number(info.lastInsertRowid);
}

function deviceRow(id: number) {
  return rawDb
    .prepare(
      "SELECT id, device_hash, region_city, region_state, region_source FROM devices WHERE id = ?"
    )
    .get(id) as {
    id: number;
    device_hash: string;
    region_city: string | null;
    region_state: string | null;
    region_source: string | null;
  };
}

describe("AC378 — canonical state vocabulary", () => {
  it("has exactly 36 unique states/UTs", () => {
    expect(INDIAN_STATES).toHaveLength(36);
    expect(new Set(INDIAN_STATES).size).toBe(36);
  });

  it("isIndianState guards the vocabulary", () => {
    expect(isIndianState("Karnataka")).toBe(true);
    expect(isIndianState("Bengaluru")).toBe(false);
    expect(isIndianState(42)).toBe(false);
  });
});

describe("ISO 3166-2:IN code → state mapping", () => {
  it("maps the common codes", () => {
    expect(stateFromIsoCode("KA")).toBe("Karnataka");
    expect(stateFromIsoCode("TN")).toBe("Tamil Nadu");
    expect(stateFromIsoCode("MH")).toBe("Maharashtra");
    expect(stateFromIsoCode("DL")).toBe("Delhi");
    expect(stateFromIsoCode("JK")).toBe("Jammu and Kashmir");
    expect(stateFromIsoCode("LA")).toBe("Ladakh");
  });

  it("maps BOTH old and new ISO codes (dataset vintage must not matter)", () => {
    expect(stateFromIsoCode("OR")).toBe("Odisha");
    expect(stateFromIsoCode("OD")).toBe("Odisha");
    expect(stateFromIsoCode("CT")).toBe("Chhattisgarh");
    expect(stateFromIsoCode("CG")).toBe("Chhattisgarh");
    expect(stateFromIsoCode("TG")).toBe("Telangana");
    expect(stateFromIsoCode("TS")).toBe("Telangana");
    expect(stateFromIsoCode("UT")).toBe("Uttarakhand");
    expect(stateFromIsoCode("UK")).toBe("Uttarakhand");
    // merged UT — all three codes land on the merged name
    expect(stateFromIsoCode("DN")).toBe("Dadra and Nagar Haveli and Daman and Diu");
    expect(stateFromIsoCode("DD")).toBe("Dadra and Nagar Haveli and Daman and Diu");
    expect(stateFromIsoCode("DH")).toBe("Dadra and Nagar Haveli and Daman and Diu");
  });

  it("is case-insensitive and null-safe", () => {
    expect(stateFromIsoCode("ka")).toBe("Karnataka");
    expect(stateFromIsoCode(" wb ")).toBe("West Bengal");
    expect(stateFromIsoCode("XX")).toBeNull();
    expect(stateFromIsoCode("")).toBeNull();
    expect(stateFromIsoCode(null)).toBeNull();
    expect(stateFromIsoCode(undefined)).toBeNull();
  });

  it("every mapped value is in the canonical list", () => {
    for (const code of ["AP", "AR", "AS", "BR", "CG", "GA", "GJ", "HR", "HP", "JH", "KA", "KL", "MP", "MH", "MN", "ML", "MZ", "NL", "OD", "PB", "RJ", "SK", "TN", "TS", "TR", "UP", "UK", "WB", "AN", "CH", "DH", "DL", "JK", "LA", "LD", "PY"]) {
      const state = stateFromIsoCode(code);
      expect(state).not.toBeNull();
      expect(isIndianState(state)).toBe(true);
    }
  });
});

describe("private/LAN IPs — never geo-resolved", () => {
  it("flags every private/special range", () => {
    for (const ip of [
      "10.0.0.1",
      "192.168.1.5",
      "172.16.0.1",
      "172.20.1.1",
      "172.31.255.255",
      "127.0.0.1",
      "169.254.10.10",
      "100.64.0.1", // CGNAT
      "0.0.0.0",
      "::1",
      "fe80::1",
      "fd00::1",
      "::ffff:192.168.1.1",
    ]) {
      expect(isPrivateIp(ip), ip).toBe(true);
      expect(lookupRegion(ip), ip).toBeNull();
    }
  });

  it("does not flag public IPs", () => {
    expect(isPrivateIp("8.8.8.8")).toBe(false);
    expect(isPrivateIp("49.207.50.10")).toBe(false);
    expect(isPrivateIp("172.15.0.1")).toBe(false);
    expect(isPrivateIp("172.32.0.1")).toBe(false);
  });
});

describe("lookupRegion — geoip → {state, city} | null", () => {
  it("resolves an Indian IP to full state name + city", () => {
    expect(lookupRegion("49.207.50.10")).toEqual({
      state: "Karnataka",
      city: "Bengaluru",
    });
    expect(lookupRegion("103.21.124.1")).toEqual({
      state: "Maharashtra",
      city: "Mumbai",
    });
  });

  it("handles IPv4-mapped IPv6", () => {
    expect(lookupRegion("::ffff:49.207.50.10")).toEqual({
      state: "Karnataka",
      city: "Bengaluru",
    });
  });

  it("non-IN country → null", () => {
    expect(lookupRegion("8.8.8.8")).toBeNull();
  });

  it("IN IP without a known subdivision → null (no fake precision)", () => {
    expect(lookupRegion("115.240.0.1")).toBeNull();
  });

  it("garbage / empty → null", () => {
    expect(lookupRegion("")).toBeNull();
    expect(lookupRegion("   ")).toBeNull();
    expect(lookupRegion("not-an-ip")).toBeNull();
    expect(lookupRegion(null)).toBeNull();
    expect(lookupRegion(undefined)).toBeNull();
  });
});

describe("AC376 — ensureRegion resolves on first visit, never overwrites", () => {
  it("fills region from IP when region_source IS NULL and persists it", () => {
    const id = insertDevice("hash-fresh");
    const device = deviceRow(id);
    const resolved = ensureRegion(device, "49.207.50.10");
    expect(resolved.region_state).toBe("Karnataka");
    expect(resolved.region_city).toBe("Bengaluru");
    expect(resolved.region_source).toBe("ip-geo");

    const persisted = deviceRow(id);
    expect(persisted.region_state).toBe("Karnataka");
    expect(persisted.region_city).toBe("Bengaluru");
    expect(persisted.region_source).toBe("ip-geo");
  });

  it("leaves the device untouched on a private IP (retries next visit)", () => {
    const id = insertDevice("hash-lan");
    const resolved = ensureRegion(deviceRow(id), "192.168.1.5");
    expect(resolved.region_source).toBeNull();
    expect(deviceRow(id).region_state).toBeNull();
  });

  it("never overwrites a user-corrected region (correction sticks)", () => {
    const id = insertDevice("hash-corrected", {
      state: "Kerala",
      city: "Kochi",
      source: "user-corrected",
    });
    const resolved = ensureRegion(deviceRow(id), "49.207.50.10");
    expect(resolved.region_state).toBe("Kerala");
    expect(resolved.region_source).toBe("user-corrected");
    expect(deviceRow(id).region_state).toBe("Kerala");
  });
});

describe("AC377 — correction backfills answers and recomputes aggregates", () => {
  it("moves the device's answers + state/city aggregate dims to the corrected region", () => {
    rawDb
      .prepare(
        `INSERT INTO questions (id, category, text, mode, options_json, primary_dv, source, status, geo)
         VALUES ('RG-01', 'Daily Life and Livability', 'test?', 'quick_pick', ?, 'map', 'manual', 'active', 1)`
      )
      .run(
        JSON.stringify([
          { key: "opt-0", label: "A" },
          { key: "opt-1", label: "B" },
        ])
      );

    const devA = insertDevice("hash-correct-a", {
      state: "Telangana",
      city: "Hyderabad",
      source: "ip-geo",
    });
    const devB = insertDevice("hash-correct-b", {
      state: "Karnataka",
      city: null,
      source: "ip-geo",
    });

    // write answers + aggregates exactly like POST /api/answers does
    const writeAnswer = (
      deviceId: number,
      payload: Record<string, unknown>,
      state: string,
      city: string | null
    ) => {
      rawDb
        .prepare(
          "INSERT INTO answers (question_id, device_id, payload_json, region_state, region_city) VALUES ('RG-01', ?, ?, ?, ?)"
        )
        .run(deviceId, JSON.stringify(payload), state, city);
      updateAggregate({
        questionId: "RG-01",
        mode: "quick_pick",
        dim: "overall",
        dimKey: "",
        payload,
        previousPayload: null,
      });
      updateAggregate({
        questionId: "RG-01",
        mode: "quick_pick",
        dim: "state",
        dimKey: state,
        payload,
        previousPayload: null,
      });
      if (city) {
        updateAggregate({
          questionId: "RG-01",
          mode: "quick_pick",
          dim: "city",
          dimKey: city,
          payload,
          previousPayload: null,
        });
      }
    };
    writeAnswer(devA, { pick: "opt-0" }, "Telangana", "Hyderabad");
    writeAnswer(devB, { pick: "opt-1" }, "Karnataka", null);

    const { recomputedQuestionIds } = applyRegionCorrection(devA, "Kerala", "Kochi");
    expect(recomputedQuestionIds).toEqual(["RG-01"]);

    // device row corrected
    const dev = deviceRow(devA);
    expect(dev.region_state).toBe("Kerala");
    expect(dev.region_city).toBe("Kochi");
    expect(dev.region_source).toBe("user-corrected");

    // answers backfilled
    const ans = rawDb
      .prepare(
        "SELECT region_state, region_city FROM answers WHERE question_id = 'RG-01' AND device_id = ?"
      )
      .get(devA) as { region_state: string; region_city: string };
    expect(ans).toEqual({ region_state: "Kerala", region_city: "Kochi" });

    // aggregates recomputed: old state dim gone, corrected dims present
    const dims = rawDb
      .prepare(
        "SELECT dim, dim_key, agg_json, sample_n FROM question_aggregates WHERE question_id = 'RG-01' ORDER BY dim, dim_key"
      )
      .all() as { dim: string; dim_key: string; agg_json: string; sample_n: number }[];

    const byKey = Object.fromEntries(dims.map((d) => [`${d.dim}:${d.dim_key}`, d]));
    expect(byKey["state:Telangana"]).toBeUndefined();
    expect(byKey["city:Hyderabad"]).toBeUndefined();
    expect(byKey["state:Kerala"].sample_n).toBe(1);
    expect(JSON.parse(byKey["state:Kerala"].agg_json).counts).toEqual({ "opt-0": 1 });
    expect(byKey["city:Kochi"].sample_n).toBe(1);
    expect(byKey["state:Karnataka"].sample_n).toBe(1);
    expect(JSON.parse(byKey["state:Karnataka"].agg_json).counts).toEqual({ "opt-1": 1 });
    expect(byKey["overall:"].sample_n).toBe(2);
    expect(JSON.parse(byKey["overall:"].agg_json).counts).toEqual({
      "opt-0": 1,
      "opt-1": 1,
    });
  });
});
