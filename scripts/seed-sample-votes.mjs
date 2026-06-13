/**
 * scripts/seed-sample-votes.mjs — committed, repeatable demo/sample-data seed.
 *
 * Ensures every interaction mode + every DV renderer has at least one ACTIVE
 * question (creates 6 fixed-id stub questions covering the otherwise-unused
 * modes logo_quick_pick / rank_order / podium_slots and DVs cups / coins /
 * medal / heatmatrix / sankey), then seeds believable vote distributions
 * through the real POST /api/answers write path. A few questions are left
 * low-data on purpose so the "still counting" state stays exercised.
 *
 * Synthetic data only — random distributions, not real opinion. Idempotent:
 * stubs upsert by fixed id; re-running just adds more synthetic votes.
 *
 * Run (on the server, app must be up):
 *   ADMIN_TOKEN=<token> BASE=http://127.0.0.1:8510 node scripts/seed-sample-votes.mjs
 */
import { createHash } from "node:crypto";

const BASE = process.env.BASE || "http://127.0.0.1:8510";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
if (!ADMIN_TOKEN) {
  console.error("ADMIN_TOKEN env is required (stub-question creation is admin-gated).");
  process.exit(1);
}
const ADMIN_COOKIE = createHash("sha256").update(ADMIN_TOKEN).digest("hex");

const r = (n) => Math.floor(Math.random() * n);
const hex32 = () => createHash("sha256").update(Math.random() + ":" + Date.now() + ":" + r(1e9)).digest("hex").slice(0, 32);
const randIp = () => `${1 + r(223)}.${r(255)}.${r(255)}.${1 + r(254)}`;
const pick = (a) => a[r(a.length)];
const skew = (n) => { const x = Math.random(); return Math.min(n - 1, Math.floor(x * x * n)); };
const STATES = ["Maharashtra", "Uttar Pradesh", "Tamil Nadu", "West Bengal", "Karnataka", "Delhi", "Gujarat", "Kerala", "Rajasthan", "Bihar", "Telangana", "Punjab", "Madhya Pradesh", "Odisha"];
const CAT = "Daily Life and Livability";

// ---- stub questions covering the unused modes + DVs (fixed ids → idempotent) ----
const opt = (...labels) => labels.map((label, i) => ({ key: `opt-${i}`, label }));
const STUBS = [
  { id: "NEW-90", mode: "logo_quick_pick", primary_dv: "medal", text: "Which brand actually owns your morning?", options: opt("Amul", "Nescafé", "Tata Tea", "Britannia") },
  { id: "NEW-91", mode: "rank_order", primary_dv: "coins", text: "Rank these by how much you'd hate losing them for a week.", options: opt("Phone", "Fridge", "Wi-Fi", "Geyser") },
  { id: "NEW-92", mode: "podium_slots", primary_dv: "podium", text: "Build the podium: India's all-time best street food.", options: opt("Vada pav", "Pani puri", "Samosa", "Dosa", "Momos") },
  { id: "NEW-93", mode: "quick_pick", primary_dv: "cups", text: "What fills your cup on a rough day?", options: opt("Chai", "Coffee", "Filter coffee", "Nimbu paani") },
  { id: "NEW-94", mode: "tradeoff_cards", primary_dv: "sankey", text: "One stays in your city forever — the metro or the flyovers?", options: opt("The metro", "The flyovers") },
  { id: "NEW-95", mode: "bucket_sort", primary_dv: "heatmatrix", text: "Sort these chores by how much you dread them.", options: opt("Dishes", "Laundry", "Cooking", "Cleaning"), targets: { kind: "buckets", labels: ["Love it", "Don't mind", "Dread it"] } },
];

async function jx(path, init) {
  const res = await fetch(BASE + path, init).catch(() => null);
  return res;
}

async function ensureStub(s) {
  const body = {
    id: s.id, category: CAT, text: s.text, mode: s.mode, options: s.options,
    primary_dv: s.primary_dv, geo: false,
    ...(s.targets ? { targets: s.targets } : {}),
  };
  const res = await jx("/api/admin/questions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: `sou_admin=${ADMIN_COOKIE}` },
    body: JSON.stringify(body),
  });
  const okCreate = res && (res.ok || res.status === 409);
  // activate (idempotent — already-active transition is a no-op/!ok we ignore)
  await jx(`/api/admin/questions/${s.id}/transition`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: `sou_admin=${ADMIN_COOKIE}` },
    body: JSON.stringify({ to: "active", reason: "demo sample-data seed", approved_by: "seed:demo" }),
  });
  console.log(`stub ${s.id} (${s.mode}/${s.primary_dv}) create=${res ? res.status : "ERR"}`);
  return okCreate;
}

function payloadFor(mode, opts, targets) {
  const keys = opts.map((o) => o.key);
  if (["quick_pick", "logo_quick_pick", "tradeoff_cards"].includes(mode)) return { pick: keys[skew(keys.length)] };
  if (mode === "swipe_stack") { const votes = {}; for (const k of keys) votes[k] = Math.random() < 0.6 ? "yes" : "no"; return { votes }; }
  if (["bucket_sort", "tier_placement"].includes(mode)) {
    const labels = (targets && targets.labels) || ["A", "B", "C"];
    const placements = {}; for (const k of keys) placements[k] = labels[skew(labels.length)]; return { placements };
  }
  if (mode === "rank_order") { const o = [...keys]; for (let i = o.length - 1; i > 0; i--) { const j = r(i + 1);[o[i], o[j]] = [o[j], o[i]]; } return { order: o }; }
  if (mode === "podium_slots") { const o = [...keys]; for (let i = o.length - 1; i > 0; i--) { const j = r(i + 1);[o[i], o[j]] = [o[j], o[i]]; } return { slots: { first: o[0], second: o[1], third: o[2] } }; }
  return null;
}

const CURRENT = {};
async function loadCurrent() {
  const res = await jx("/api/admin/questions", { headers: { Cookie: `sou_admin=${ADMIN_COOKIE}` } });
  if (res && res.ok) for (const q of (await res.json()).questions) CURRENT[q.id] = q.sample_n || 0;
}

async function seedVotes(id, target, geo) {
  const res = await jx(`/api/questions/${id}`);
  if (!res || !res.ok) return console.log(`seed ${id}: SKIP (fetch ${res ? res.status : "ERR"})`);
  const q = (await res.json()).question;
  if (q.status !== "active") return console.log(`seed ${id}: SKIP (${q.status})`);
  const have = CURRENT[id] || 0;
  const toSeed = Math.max(0, target - have); // idempotent top-up to target
  let ok = 0;
  for (let i = 0; i < toSeed; i++) {
    const headers = { "Content-Type": "application/json", Cookie: `sou_device=${hex32()}`, "X-Forwarded-For": randIp() };
    if (geo) await jx("/api/region/correct", { method: "POST", headers, body: JSON.stringify({ state: pick(STATES) }) });
    const a = await jx("/api/answers", { method: "POST", headers, body: JSON.stringify({ question_id: id, payload: payloadFor(q.mode, q.options, q.targets) }) });
    if (a && a.ok) ok++;
  }
  console.log(`seed ${id} (${q.mode}/${q.primary_dv}) have=${have} +${ok} → ~${have + ok}`);
}

// coverage: one rich question per DV/mode + the 6 stubs; a couple left low-data.
const COVERAGE = [
  { id: "C2-27", n: 60 }, { id: "C1-21", n: 55 }, { id: "Q-403", n: 50 },
  { id: "C1-23", n: 60 }, { id: "C1-24", n: 55 }, { id: "C1-29", n: 50 },
  { id: "C1-25", n: 60, geo: true }, { id: "C4-34", n: 45, geo: true }, { id: "C6-22", n: 55 },
  { id: "NEW-90", n: 50 }, { id: "NEW-91", n: 45 }, { id: "NEW-92", n: 55 },
  { id: "NEW-93", n: 60 }, { id: "NEW-94", n: 50 }, { id: "NEW-95", n: 55 },
  // deliberately low-data (exercise still-counting): a couple of fresh ids
  { id: "C1-31", n: 3 }, { id: "C2-25", n: 2 },
];

(async () => {
  console.log("== ensuring stub questions ==");
  for (const s of STUBS) await ensureStub(s);
  await loadCurrent();
  console.log("== seeding votes (idempotent top-up to target) ==");
  for (const c of COVERAGE) await seedVotes(c.id, c.n, !!c.geo);
  console.log("== done ==");
})();
