/**
 * scripts/seed-demo-content.mjs — demo/test data seed (DEMO-* questions + coverage votes).
 *
 * Goal: give a tester result pages for EVERY interaction mode and EVERY DV.
 *  1. Author ~16 DEMO-* questions for the thin modes/DVs, with VALID
 *     (mode -> primary_dv) pairings per the DV registry supportedModes.
 *  2. Repoint NEW-91 (rank_order+coins, an invalid pairing whose primary DV
 *     never renders) to a valid DV (board).
 *  3. Seed believable random vote distributions through the real
 *     POST /api/answers write path so each mode and each VALIDLY-PAIRED DV
 *     has >=3 questions revealed (sample_n >= MIN_REVEAL_N = 10). A handful of
 *     active questions are left below threshold on purpose (still-counting).
 *  4. Scan the whole active catalogue for any other invalid (mode,primary_dv)
 *     pairings and report them.
 *
 * Synthetic data only. Idempotent: DEMO ids upsert; vote seeding tops up to
 * target (re-running adds nothing once a question is at/over target).
 *
 * Run (on the server, app up):
 *   cd /mnt/storage/websites/stateofus && set -a && . ./.env && set +a \
 *     && BASE=http://127.0.0.1:8510 node scripts/seed-demo-content.mjs
 */
import { createHash } from "node:crypto";

const BASE = process.env.BASE || "http://127.0.0.1:8510";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
if (!ADMIN_TOKEN) {
  console.error("ADMIN_TOKEN env is required (question creation is admin-gated).");
  process.exit(1);
}
const ADMIN_COOKIE = createHash("sha256").update(ADMIN_TOKEN).digest("hex");
const MIN_REVEAL_N = 10;

/* ----------------------------- registry mirror ---------------------------- */
// iter-5: PICK_MODES gained coin_allocation / bracket / pin_map (all { counts });
// new modes spectrum / two_axis added. Mirrors lib/dv/transforms PICK_MODES +
// components/dv/*.tsx supportedModes.
const PICK_MODES = [
  "quick_pick", "logo_quick_pick", "tradeoff_cards",
  "coin_allocation", "bracket", "pin_map",
];
const ALL_MODES = [
  "quick_pick", "tradeoff_cards", "swipe_stack", "bucket_sort",
  "tier_placement", "rank_order", "podium_slots", "logo_quick_pick",
  "spectrum", "coin_allocation", "two_axis", "bracket", "pin_map",
];
// DV -> modes it can render (mirrors components/dv/*.tsx supportedModes)
const DV_SUPPORTED = {
  split: [...PICK_MODES, "swipe_stack"],
  radial: [...PICK_MODES],
  liquid: [...PICK_MODES, "swipe_stack"],
  cups: [...PICK_MODES, "swipe_stack"],
  coins: [...PICK_MODES, "swipe_stack"],
  map: [...PICK_MODES, "swipe_stack"],
  bubblemap: [...ALL_MODES],
  tier: ["bucket_sort", "tier_placement"],
  board: ["rank_order", "swipe_stack", "bucket_sort", "tier_placement", "bracket"],
  podium: ["podium_slots", "rank_order", ...PICK_MODES],
  medal: ["podium_slots", "rank_order", ...PICK_MODES],
  treemap: [...PICK_MODES, "bucket_sort", "tier_placement"],
  heatmatrix: ["bucket_sort", "tier_placement", "two_axis"],
  sankey: [...PICK_MODES],
  distribution: ["spectrum"],
};
const ALL_DVS = Object.keys(DV_SUPPORTED);
const valid = (mode, dv) => (DV_SUPPORTED[dv] || []).includes(mode);

/* ------------------------------- helpers ---------------------------------- */
const r = (n) => Math.floor(Math.random() * n);
const hex32 = () =>
  createHash("sha256").update(Math.random() + ":" + Date.now() + ":" + r(1e9)).digest("hex").slice(0, 32);
const randIp = () => `${1 + r(223)}.${r(255)}.${r(255)}.${1 + r(254)}`;
const pick = (a) => a[r(a.length)];
const skew = (n) => { const x = Math.random(); return Math.min(n - 1, Math.floor(x * x * n)); };
const STATES = [
  "Maharashtra", "Uttar Pradesh", "Tamil Nadu", "West Bengal", "Karnataka",
  "Delhi", "Gujarat", "Kerala", "Rajasthan", "Bihar", "Telangana", "Punjab",
  "Madhya Pradesh", "Odisha", "Assam", "Haryana", "Jharkhand",
];
const opt = (...labels) => labels.map((label, i) => ({ key: `opt-${i}`, label }));
// a "natural" vote target: mostly mid, a few big, a couple near-threshold
const naturalTarget = () => {
  const roll = Math.random();
  if (roll < 0.12) return 12 + r(7);        // just-revealed (12-18)
  if (roll < 0.78) return 25 + r(55);       // healthy (25-80)
  return 95 + r(80);                        // headline (95-175)
};

async function jx(path, init) {
  return await fetch(BASE + path, init).catch(() => null);
}

/* ------------------------------ DEMO questions ---------------------------- */
// Each: valid (mode, primary_dv); secondary_dvs all support the mode too.
const CAT = {
  city: "City and Place Experience",
  daily: "Daily Life and Livability",
  ent: "Entertainment and Culture",
  brand: "Consumption and Brand Experience",
  mirror: "Identity Opinion and Society",
  fun: "Fun and Internet Chaos",
};
// ids must match /^(C[1-6]-\d{1,3}|Q-\d{3}|NEW-\d{1,3})$/ — use the NEW-2xx
// manual range (distinct from the existing NEW-9x stubs). notes tags them.
const DEMO = [
  { id: "NEW-201", category: CAT.brand, mode: "logo_quick_pick", primary_dv: "medal", secondary_dvs: ["coins"], text: "Which brand actually earns the gold in your kitchen?", options: opt("Amul", "Tata", "Nestlé", "Patanjali") },
  { id: "NEW-202", category: CAT.brand, mode: "logo_quick_pick", primary_dv: "coins", secondary_dvs: ["cups"], text: "Which app quietly drains your wallet the most?", options: opt("Swiggy", "Zomato", "Amazon", "BigBasket") },
  { id: "NEW-203", category: CAT.ent, mode: "rank_order", primary_dv: "medal", secondary_dvs: ["board"], text: "Rank these IPL franchises by sheer drama.", options: opt("CSK", "MI", "RCB", "KKR") },
  { id: "NEW-204", category: CAT.fun, mode: "rank_order", primary_dv: "board", secondary_dvs: ["podium"], text: "Rank these late excuses, worst to most believable.", options: opt("Traffic", "Alarm failed", "Stomach upset", "Network down") },
  { id: "NEW-205", category: CAT.ent, mode: "podium_slots", primary_dv: "podium", secondary_dvs: ["medal"], text: "Build the podium: greatest Bollywood villains ever.", options: opt("Gabbar", "Mogambo", "Crime Master Gogo", "Kancha", "Lion") },
  { id: "NEW-206", category: CAT.city, mode: "podium_slots", primary_dv: "medal", secondary_dvs: ["podium"], text: "Podium time: India's best cities for street food.", options: opt("Mumbai", "Delhi", "Kolkata", "Hyderabad", "Indore") },
  { id: "NEW-207", category: CAT.daily, mode: "quick_pick", primary_dv: "coins", secondary_dvs: ["radial"], text: "Where does most of your salary secretly vanish?", options: opt("Rent", "Food delivery", "EMIs", "Subscriptions") },
  { id: "NEW-208", category: CAT.fun, mode: "tradeoff_cards", primary_dv: "coins", secondary_dvs: ["split"], text: "One has to go forever: chai or coffee?", options: opt("Chai", "Coffee") },
  { id: "NEW-209", category: CAT.daily, mode: "quick_pick", primary_dv: "cups", secondary_dvs: ["liquid"], text: "What fills your cup on a Monday morning?", options: opt("Chai", "Filter coffee", "Green tea", "Just water") },
  { id: "NEW-210", category: CAT.mirror, mode: "tradeoff_cards", primary_dv: "cups", secondary_dvs: ["radial"], text: "Pick a side: early bird or night owl?", options: opt("Early bird", "Night owl") },
  { id: "NEW-211", category: CAT.city, mode: "tradeoff_cards", primary_dv: "sankey", secondary_dvs: ["split"], text: "Your city keeps only one forever: the metro or the lake?", options: opt("The metro", "The lake") },
  { id: "NEW-212", category: CAT.mirror, mode: "quick_pick", primary_dv: "sankey", secondary_dvs: ["radial"], text: "When plans change last-minute, you mostly feel…", options: opt("Relieved", "Annoyed", "Anxious", "Thrilled") },
  { id: "NEW-213", category: CAT.daily, mode: "bucket_sort", primary_dv: "heatmatrix", secondary_dvs: ["tier"], text: "Sort these chores by how much you dread them.", options: opt("Dishes", "Laundry", "Cooking", "Sweeping", "Ironing"), targets: { kind: "buckets", labels: ["Love it", "Don't mind", "Dread it"] } },
  { id: "NEW-214", category: CAT.mirror, mode: "tier_placement", primary_dv: "heatmatrix", secondary_dvs: ["tier"], text: "Tier these life goals by how much they actually matter to you.", options: opt("Money", "Fame", "Family", "Freedom", "Health"), targets: { kind: "tiers", labels: ["S", "A", "B", "C"] } },
  { id: "NEW-215", category: CAT.daily, mode: "rank_order", primary_dv: "podium", secondary_dvs: ["board"], text: "Rank these by how much you'd hate losing them for a week.", options: opt("Phone", "Wi-Fi", "Fridge", "Geyser") },
  { id: "NEW-216", category: CAT.ent, mode: "swipe_stack", primary_dv: "coins", secondary_dvs: ["split"], text: "Swipe: would you rewatch these on a lazy Sunday?", options: opt("Sholay", "DDLJ", "3 Idiots", "Gully Boy", "RRR") },
  // iter-5 new modes (DEMO-* per mode; ids stay in the NEW-2xx manual range
  // because questionInsertSchema rejects DEMO-* ids — same reason NEW-201..216
  // above use NEW-*). notes tag them so they read as the per-mode demos.
  // DEMO-SPEC — spectrum: options[0]/[1] are the scale's end labels.
  { id: "NEW-217", category: CAT.mirror, mode: "spectrum", primary_dv: "distribution", secondary_dvs: [], text: "On work, where do you sit: hustle or balance?", options: opt("All balance", "All hustle") },
  // DEMO-COIN — coin_allocation: spend a 10-coin budget across options.
  { id: "NEW-218", category: CAT.daily, mode: "coin_allocation", primary_dv: "coins", secondary_dvs: ["radial"], text: "Split 10 coins: where should your city spend next?", options: opt("Roads", "Parks", "Transit", "Schools", "Hospitals") },
  // DEMO-2AX — two_axis: targets = [xLow, xHigh, yLow, yHigh] quadrant axes.
  { id: "NEW-219", category: CAT.fun, mode: "two_axis", primary_dv: "heatmatrix", secondary_dvs: [], text: "Place each app: boring↔fun, useful↔useless.", options: opt("Instagram", "LinkedIn", "WhatsApp", "Notes", "YouTube"), targets: { kind: "buckets", labels: ["Boring", "Fun", "Useful", "Useless"] } },
  // DEMO-BRKT — bracket: single-elim, crown a champion.
  { id: "NEW-220", category: CAT.ent, mode: "bracket", primary_dv: "board", secondary_dvs: [], text: "Bracket it out: the ultimate Indian street snack.", options: opt("Pani puri", "Vada pav", "Samosa", "Pav bhaji", "Bhel", "Kachori", "Dosa", "Momos") },
  // DEMO-PIN — pin_map: options are regions; pin where you stand.
  { id: "NEW-221", category: CAT.city, mode: "pin_map", primary_dv: "map", secondary_dvs: ["bubblemap"], text: "Which state genuinely feels like home to you?", options: opt("Maharashtra", "Karnataka", "Tamil Nadu", "Delhi", "West Bengal", "Kerala", "Gujarat", "Punjab") },
];

async function ensureQuestion(q) {
  // sanity: never author an invalid primary pairing
  if (!valid(q.mode, q.primary_dv)) {
    console.log(`SKIP ${q.id}: invalid pairing ${q.mode}/${q.primary_dv}`);
    return false;
  }
  const body = {
    id: q.id, category: q.category, text: q.text, mode: q.mode, options: q.options,
    primary_dv: q.primary_dv, secondary_dvs: q.secondary_dvs || [], geo: false,
    notes: "synthetic demo seed (seed-demo-content.mjs)",
    ...(q.targets ? { targets: q.targets } : {}),
  };
  const res = await jx("/api/admin/questions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: `sou_admin=${ADMIN_COOKIE}` },
    body: JSON.stringify(body),
  });
  if (!res) { console.log(`create ${q.id}: NETWORK ERR`); return false; }
  const exists = res.ok || res.status === 409 || res.status === 200;
  if (!exists) {
    const t = await res.text().catch(() => "");
    console.log(`create ${q.id}: FAILED ${res.status} ${t.slice(0, 160)}`);
    return false; // do NOT pretend it transitioned
  }
  const tr = await jx(`/api/admin/questions/${q.id}/transition`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: `sou_admin=${ADMIN_COOKIE}` },
    body: JSON.stringify({ to: "active", reason: "demo sample-data seed", approved_by: "seed:demo" }),
  });
  console.log(`question ${q.id} (${q.mode}/${q.primary_dv}) create=${res.status} transition=${tr ? tr.status : "ERR"} -> active`);
  return true;
}

async function repointNew91() {
  // PATCH the primary_dv via the admin update route. Only if it's still the
  // broken coins pairing.
  const res = await jx(`/api/admin/questions/NEW-91`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: `sou_admin=${ADMIN_COOKIE}` },
    body: JSON.stringify({ primary_dv: "board" }),
  });
  console.log(`repoint NEW-91 coins->board: ${res ? res.status : "ERR"}`);
}

/* ------------------------------- vote seeding ----------------------------- */
function payloadFor(mode, opts, targets) {
  const keys = opts.map((o) => o.key);
  if (["quick_pick", "logo_quick_pick", "tradeoff_cards"].includes(mode)) return { pick: keys[skew(keys.length)] };
  if (mode === "swipe_stack") { const votes = {}; for (const k of keys) votes[k] = Math.random() < 0.6 ? "yes" : "no"; return { votes }; }
  if (["bucket_sort", "tier_placement"].includes(mode)) {
    const labels = (targets && targets.labels) || ["A", "B", "C"];
    const placements = {};
    const off = r(labels.length);
    keys.forEach((k, i) => { placements[k] = labels[(i + off) % labels.length]; });
    return { placements };
  }
  if (mode === "rank_order") { const o = [...keys]; for (let i = o.length - 1; i > 0; i--) { const j = r(i + 1);[o[i], o[j]] = [o[j], o[i]]; } return { order: o }; }
  if (mode === "podium_slots") { const o = [...keys]; for (let i = o.length - 1; i > 0; i--) { const j = r(i + 1);[o[i], o[j]] = [o[j], o[i]]; } return { slots: { first: o[0], second: o[1], third: o[2] } }; }
  // iter-5 new modes
  if (mode === "spectrum") { const x = Math.random(); return { value: Math.min(100, Math.floor(x * 101)) }; }
  if (mode === "coin_allocation") {
    // spend 1..10 coins, weighted toward a couple of options
    const alloc = {};
    let budget = 10;
    const order = [...keys].sort(() => 0.5 - Math.random());
    for (let i = 0; i < order.length && budget > 0; i++) {
      const last = i === order.length - 1;
      const give = last ? budget : r(Math.min(budget, 5) + 1);
      if (give > 0) alloc[order[i]] = give;
      budget -= give;
    }
    if (Object.keys(alloc).length === 0) alloc[keys[0]] = 1; // never empty
    return { alloc };
  }
  if (mode === "two_axis") { const quads = ["q1", "q2", "q3", "q4"]; const placements = {}; keys.forEach((k) => { placements[k] = quads[r(4)]; }); return { placements }; }
  if (mode === "bracket") return { winner: keys[skew(keys.length)] };
  if (mode === "pin_map") return { region: keys[skew(keys.length)] };
  return null;
}

async function seedVotes(id, target, have) {
  // `have` (current sample_n) is passed from the admin list — the public
  // /api/questions/:id endpoint does NOT expose sample_n, so reading it there
  // would always be 0 and break idempotent top-up.
  const res = await jx(`/api/questions/${id}`);
  if (!res || !res.ok) { console.log(`seed ${id}: SKIP (fetch ${res ? res.status : "ERR"})`); return; }
  const q = (await res.json()).question;
  if (q.status !== "active") { console.log(`seed ${id}: SKIP (${q.status})`); return; }
  const toSeed = Math.max(0, target - have);
  const geo = !!q.geo;
  let ok = 0;
  for (let i = 0; i < toSeed; i++) {
    const headers = { "Content-Type": "application/json", Cookie: `sou_device=${hex32()}`, "X-Forwarded-For": randIp() };
    if (geo) await jx("/api/region/correct", { method: "POST", headers, body: JSON.stringify({ state: pick(STATES) }) });
    const a = await jx("/api/answers", { method: "POST", headers, body: JSON.stringify({ question_id: id, payload: payloadFor(q.mode, q.options, q.targets) }) });
    if (a && a.ok) ok++;
  }
  console.log(`seed ${id} (${q.mode}/${q.primary_dv}${geo ? "/geo" : ""}) have=${have} +${ok} -> ~${have + ok}`);
}

/* --------------------------------- planner -------------------------------- */
async function loadActive() {
  const res = await jx("/api/admin/questions?status=active", { headers: { Cookie: `sou_admin=${ADMIN_COOKIE}` } });
  if (!res || !res.ok) { console.error("could not load active questions"); process.exit(1); }
  return (await res.json()).questions;
}

(async () => {
  console.log("== 1. authoring DEMO questions ==");
  for (const q of DEMO) await ensureQuestion(q);

  console.log("\n== 2. repoint broken NEW-91 ==");
  await repointNew91();

  console.log("\n== 3. building coverage plan ==");
  const active = await loadActive();
  const byId = new Map(active.map((q) => [q.id, q]));
  const revealed = (q) => (q.sample_n || 0) >= MIN_REVEAL_N;

  // invalid-pairing scan (anti-gaslight: surface broken result pages)
  const invalidPairs = active.filter((q) => !valid(q.mode, q.primary_dv));

  // selection set (question ids -> target votes)
  const planTarget = new Map();
  const ensureN = (cands, need, label) => {
    // count already-revealed among candidates first
    let count = cands.filter(revealed).length + cands.filter((q) => planTarget.has(q.id) && !revealed(q)).length;
    const pool = cands.filter((q) => !revealed(q) && !planTarget.has(q.id));
    for (const q of pool) {
      if (count >= need) break;
      planTarget.set(q.id, naturalTarget());
      count++;
    }
    if (count < need) console.log(`  ! ${label}: only ${count}/${need} reachable (not enough active questions)`);
  };

  // per-DV coverage: only questions whose (mode,primary_dv) is VALID count
  for (const dv of ALL_DVS) {
    const cands = active.filter((q) => q.primary_dv === dv && valid(q.mode, q.primary_dv));
    ensureN(cands, 3, `DV ${dv}`);
  }
  // per-mode coverage
  for (const mode of ALL_MODES) {
    const cands = active.filter((q) => q.mode === mode && valid(q.mode, q.primary_dv));
    ensureN(cands, 3, `mode ${mode}`);
  }
  // always seed the DEMO questions to a healthy target
  for (const q of DEMO) if (byId.has(q.id) && !planTarget.has(q.id)) planTarget.set(q.id, naturalTarget());

  console.log(`  plan: ${planTarget.size} questions to top-up`);

  console.log("\n== 4. seeding votes ==");
  for (const [id, target] of planTarget) {
    const have = (byId.get(id)?.sample_n) || 0;
    await seedVotes(id, target, have);
  }

  console.log("\n== invalid (mode,primary_dv) pairings in active catalogue ==");
  if (invalidPairs.length === 0) console.log("  none");
  else for (const q of invalidPairs) console.log(`  ${q.id}  ${q.mode} + ${q.primary_dv}  (DV won't render)`);

  console.log("\n== done ==");
})();
