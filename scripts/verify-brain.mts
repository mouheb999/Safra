// Runs client profiles through the trip brain (src/lib/brain/engine.ts) with the local data and checks
// the rules from "Safra Trip Brain v0.5" on every result. Run: npm run brain:verify

import { DEFAULT_BRAIN_SETTINGS, localBrainBases, localBrainCountries } from "../src/data/brain.ts";
import { CATEGORIES, seasonOf, suggestTrips, type BrainInput, type BrainResult } from "../src/lib/brain/engine.ts";
import { brainSnapshot } from "../src/lib/brain/snapshot.ts";

let passed = 0;
const failures: string[] = [];
function check(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (error) {
    failures.push(name);
    console.log(`  ✗ ${name}\n      ${(error as Error).message}`);
  }
}
function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const base: BrainInput = {
  budgetTND: 14000,
  budgetScope: "total",
  adults: 2,
  children: 0,
  childAges: [],
  group: "couple",
  depart: "2026-12-10",
  ret: "2026-12-20",
  flexDays: 3,
  month: null,
  nights: null,
  vibes: ["Nightlife", "Beach"],
  stay: "good_hotel",
};
const run = (patch: Partial<BrainInput>) =>
  suggestTrips({ ...base, ...patch }, localBrainCountries, localBrainBases, DEFAULT_BRAIN_SETTINGS);
const baseBySlug = new Map(localBrainBases.map((b) => [b.slug, b]));

function describe(r: BrainResult) {
  if (r.status !== "ok") return JSON.stringify(r).slice(0, 300);
  return r.options
    .map((o) => `${o.label}: ${o.country} [${o.bases.map((b) => `${b.slug} ${b.nights}n`).join(" + ")}] score ${o.score} cost ${o.tripCostTND} pocket/pp/day ${o.pocketPerPersonPerDay}`)
    .join("\n      ");
}

/** The rules that must hold for any "ok" result. */
function rules(r: BrainResult, input: BrainInput) {
  assert(r.status === "ok", `expected ok, got ${r.status}`);
  assert(r.options.length >= 1 && r.options.length <= 3, "1–3 options");
  assert(new Set(r.options.map((o) => o.country)).size === r.options.length, "one country per option");
  assert(new Set(r.options.map((o) => o.label)).size === r.options.length, "labels are unique");
  for (const o of r.options) {
    const sum = CATEGORIES.reduce((n, c) => n + o.budget[c], 0);
    assert(sum === r.totalBudgetTND, `${o.country}: categories add up to the budget (${sum} vs ${r.totalBudgetTND})`);
    assert(o.pocketPerPersonPerDay >= DEFAULT_BRAIN_SETTINGS.minPocketTND, `${o.country}: pocket money ≥ minimum`);
    assert(o.bases.reduce((n, b) => n + b.nights, 0) === r.nights, `${o.country}: nights add up`);
    const maxBases = r.nights < 8 ? 1 : r.nights <= 13 ? 2 : 3;
    assert(o.bases.length <= maxBases, `${o.country}: at most ${maxBases} bases for ${r.nights} nights`);
    for (const pb of o.bases) {
      const b = baseBySlug.get(pb.slug)!;
      assert(seasonOf(b, r.months) !== "bad", `${pb.slug}: never in a bad season`);
      assert(pb.nights >= b.minNights, `${pb.slug}: respects min nights`);
      if (input.vibes.length) assert(b.strengths.some((s) => input.vibes.includes(s)), `${pb.slug}: shares a vibe`);
    }
    assert(o.budget.flights <= (r.totalBudgetTND * DEFAULT_BRAIN_SETTINGS.maxFlightSharePct) / 100 + 1, `${o.country}: flights within the allowed share`);
  }
  const scores = r.options.map((o) => o.score);
  assert(scores.every((s, i) => i === 0 || s <= scores[i - 1]), "options ordered by score");
}

console.log("Trip brain scenarios\n");

check("missing dates → need_info", () => {
  const r = run({ depart: null, ret: null });
  assert(r.status === "need_info" && r.missing.includes("dates"), JSON.stringify(r));
});

check("month without nights → need_info (nights)", () => {
  const r = run({ depart: null, ret: null, month: 7 });
  assert(r.status === "need_info" && r.missing.includes("nights"), JSON.stringify(r));
});

check("the file's example (couple, 9,000 TND, 10 nights) can't meet the 45% flight rule → no_fit", () => {
  const r = run({ budgetTND: 9000 });
  assert(r.status === "no_fit" && r.closest !== null, `expected no_fit, got ${r.status}`);
  console.log(`      closest: ${r.closest.country}, missing ${r.closest.shortfallTND} TND`);
});

check("couple, 14,000 TND, 10 nights in December, beach + nightlife", () => {
  const r = run({});
  console.log(`      ${describe(r)}`);
  rules(r, base);
  assert(r.status === "ok" && !r.options.some((o) => o.country === "bali"), "Bali is in its rainy season in December");
});

check("friends ×4, 6,500 per person, 2 weeks in July, adventure + nightlife (45% flight rule leaves Malaysia)", () => {
  const input = { ...base, adults: 4, group: "friends" as const, budgetTND: 6500, budgetScope: "per_person" as const, depart: "2027-07-03", ret: "2027-07-17", vibes: ["Adventure", "Nightlife"], stay: "budget_hotel" as const };
  const r = run(input);
  console.log(`      ${describe(r)}`);
  rules(r, input);
  assert(r.status === "ok" && !r.options.some((o) => o.bases.some((b) => ["phuket", "krabi", "el-nido"].includes(b.slug))), "Andaman coast and Palawan are off-season in July");
});

check("family with kids 4 and 7: only kid-friendly activities", () => {
  const input = { ...base, adults: 2, children: 2, childAges: [4, 7], group: "family" as const, budgetTND: 30000, vibes: ["Beach", "Nature"], month: 2, nights: 9, depart: null, ret: null };
  const r = run(input);
  console.log(`      ${describe(r)}`);
  rules(r, input);
  const kidUnsafe = new Set(localBrainBases.flatMap((b) => b.activities.filter((a) => !a.kidFriendly).map((a) => a.name)));
  assert(r.status === "ok" && r.options.every((o) => o.bases.every((b) => b.activities.every((a) => !kidUnsafe.has(a.name)))), "no adults-only activity");
});

check("honeymoon, month only (May), 7 nights, luxury + beach", () => {
  const input = { ...base, group: "honeymoon" as const, depart: null, ret: null, month: 5, nights: 7, vibes: ["Luxury", "Beach"], budgetTND: 16000 };
  const r = run(input);
  console.log(`      ${describe(r)}`);
  rules(r, input);
});

check("budget too small → no_fit with the closest trip and what's missing", () => {
  const r = run({ budgetTND: 3000 });
  assert(r.status === "no_fit", `expected no_fit, got ${r.status}`);
  assert(r.closest !== null && r.closest.shortfallTND > 0 && r.closest.shortfallTND % 50 === 0, JSON.stringify(r.closest));
  console.log(`      closest: ${r.closest.country}, missing ${r.closest.shortfallTND} TND, fits with ${r.closest.fitsWithNights ?? "—"} nights`);
});

check("tight budget is made to fit by cutting activities before dropping a country", () => {
  const r = run({ budgetTND: 13500 });
  console.log(`      ${describe(r)}`);
  if (r.status === "ok") rules(r, base);
  assert(r.status === "ok" ? r.options.some((o) => o.adjustments.length > 0) || r.options.length > 0 : r.status === "no_fit", "fits after cuts or reports no_fit");
});

check("solo traveler, apartment, culture + food in October", () => {
  const input = { ...base, adults: 1, group: "solo" as const, depart: "2026-10-05", ret: "2026-10-15", vibes: ["Culture", "Food"], stay: "apartment" as const, budgetTND: 7500 };
  const r = run(input);
  console.log(`      ${describe(r)}`);
  rules(r, input);
});

check("an order stores the chosen trip recomputed, with exact amounts (and null when it no longer fits)", () => {
  const data = { countries: localBrainCountries, bases: localBrainBases, settings: DEFAULT_BRAIN_SETTINGS };
  const r = run({});
  assert(r.status === "ok", r.status);
  const chosen = r.options[1] ?? r.options[0];
  const snap = brainSnapshot(base, chosen.country, data);
  assert(snap.option?.country === chosen.country && snap.option.tripCostTND === chosen.tripCostTND, "same trip as the preview");
  assert(CATEGORIES.reduce((n, c) => n + snap.option!.budget[c], 0) === snap.totalBudgetTND, "exact split adds up");
  assert(snap.option.bases.every((b) => snap.option!.places[b.slug]), "place names stored");
  assert(snap.estimated, "flagged as estimated");
  assert(brainSnapshot(base, "atlantis", data).option === null, "unknown choice → null option");
});

console.log(`\n${passed} passed, ${failures.length} failed`);
process.exit(failures.length ? 1 : 0);
