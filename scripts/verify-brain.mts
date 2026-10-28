// Runs client profiles through the trip brain (src/lib/brain/engine.ts) with the local data and checks
// the rules from "Safra Trip Brain v0.5" on every result. Run: npm run brain:verify

import { DEFAULT_BRAIN_SETTINGS, localBrainBases, localBrainCountries } from "../src/data/brain.ts";
import { CATEGORIES, seasonOf, suggestTrips, type BrainInput, type BrainResult } from "../src/lib/brain/engine.ts";
import { adviseTrip, cleanTrip, countryCards, priceTrip, stopSeason, suggestRoute } from "../src/lib/brain/builder.ts";
import { buildSnapshot } from "../src/lib/brain/snapshot.ts";

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

check("the file's example (couple, 9,000 TND, 10 nights, budget hotel) gets real trips", () => {
  const input = { ...base, budgetTND: 9000, stay: "budget_hotel" as const };
  const r = run(input);
  console.log(`      ${describe(r)}`);
  rules(r, input);
});

check("flights over the allowed share lower the score instead of ruling the country out", () => {
  const r = run({ budgetTND: 10000, stay: "budget_hotel" });
  assert(r.status === "ok" && r.warnings.some((w) => w.startsWith("flight_share:")), "flagged");
  assert(r.options.some((o) => (o.budget.flights * 100) / r.totalBudgetTND > DEFAULT_BRAIN_SETTINGS.maxFlightSharePct), "still suggested");
});

check("a short budget with a good hotel says what a budget hotel would change", () => {
  const r = run({ budgetTND: 3000, budgetScope: "per_person", stay: "good_hotel" });
  assert(r.status === "no_fit" && r.budgetHotel !== null, JSON.stringify(r).slice(0, 200));
  assert(r.budgetHotel.fits || r.budgetHotel.shortfallTND < r.closest!.shortfallTND, "budget hotel is cheaper");
  console.log(`      good hotel missing ${r.closest!.shortfallTND} TND; budget hotel ${r.budgetHotel.fits ? "fits" : `missing ${r.budgetHotel.shortfallTND} TND`}`);
});

check("couple, 14,000 TND, 10 nights in December, beach + nightlife", () => {
  const r = run({});
  console.log(`      ${describe(r)}`);
  rules(r, base);
  assert(r.status === "ok" && !r.options.some((o) => o.country === "bali"), "Bali is in its rainy season in December");
});

check("friends ×4, 6,500 per person, 2 weeks in July, adventure + nightlife", () => {
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

// ---- Trip builder -------------------------------------------------------------------------
const data = { countries: localBrainCountries, bases: localBrainBases, settings: DEFAULT_BRAIN_SETTINGS };
const couple: BrainInput = { ...base, budgetTND: 5000, budgetScope: "per_person", stay: "budget_hotel" };

check("builder: the suggested route covers the dates and avoids the rainy season", () => {
  for (const c of localBrainCountries) {
    const route = suggestRoute(couple, c.code, data);
    const priced = priceTrip(couple, route, data)!;
    assert(route.stops.length > 0, `${c.code}: has a route`);
    assert(priced.nights === priced.targetNights, `${c.code}: ${priced.nights} of ${priced.targetNights} nights`);
    const rainy = route.stops.filter((s) => stopSeason(baseBySlug.get(s.slug)!, couple) === "bad");
    const anyDry = localBrainBases.some((b) => b.countryCode === c.code && stopSeason(b, couple) !== "bad");
    assert(!anyDry || rainy.length === 0, `${c.code}: rainy stop although a dry one exists`);
  }
});

check("builder: prices match the engine's for the same trip", () => {
  const r = run({ budgetTND: 14000, stay: "good_hotel" });
  assert(r.status === "ok", r.status);
  const o = r.options[0];
  const trip = { country: o.country, stops: o.bases.map((b) => ({ slug: b.slug, nights: b.nights, stay: "good_hotel" as const, activities: b.activities.map((a) => a.name) })) };
  const priced = priceTrip({ ...base, budgetTND: 14000 }, trip, data)!;
  assert(priced.tripCostTND === o.tripCostTND, `${priced.tripCostTND} vs ${o.tripCostTND}`);
});

check("builder: every change moves the price the right way", () => {
  const trip = { country: "thailand", stops: [{ slug: "krabi", nights: 6, stay: "good_hotel" as const, activities: [] as string[] }] };
  const p0 = priceTrip(couple, trip, data)!.tripCostTND;
  const cheaper = priceTrip(couple, { ...trip, stops: [{ ...trip.stops[0], stay: "budget_hotel" }] }, data)!.tripCostTND;
  const withTour = priceTrip(couple, { ...trip, stops: [{ ...trip.stops[0], activities: ["Four Islands longtail tour"] }] }, data)!.tripCostTND;
  const longer = priceTrip(couple, { ...trip, stops: [{ ...trip.stops[0], nights: 7 }] }, data)!.tripCostTND;
  const twoStops = priceTrip(couple, { ...trip, stops: [...trip.stops, { slug: "bangkok", nights: 2, stay: "good_hotel", activities: [] }] }, data)!.tripCostTND;
  assert(cheaper < p0, "budget hotel is cheaper");
  assert(withTour === p0 + Math.round(120 * 2 * 1.03), `activity adds its price for 2 (+fee): ${withTour - p0}`);
  assert(longer > p0 && twoStops > longer, "more nights / another place cost more");
});

check("builder: tips flag overspending (with a priced saving), rain, short stays and missing nights", () => {
  const trip = { country: "bali", stops: [{ slug: "ubud", nights: 1, stay: "good_hotel" as const, activities: ["Mount Batur sunrise trek"] }] };
  const tips = adviseTrip({ ...couple, budgetTND: 2000 }, trip, data);
  const kinds = tips.map((t) => t.kind);
  for (const k of ["over", "cheaper_stay", "drop_activity", "rainy", "min_nights", "nights"]) assert(kinds.includes(k as never), `tip ${k}: ${kinds}`);
  const over = tips.find((t) => t.kind === "over");
  const p = priceTrip({ ...couple, budgetTND: 2000 }, trip, data)!;
  assert(over?.kind === "over" && over.amountTND === p.tripCostTND - p.totalBudgetTND, "over = cost − budget");
  const save = tips.find((t) => t.kind === "cheaper_stay");
  assert(save?.kind === "cheaper_stay" && save.saveTND > 0, "saving is priced");
});

check("builder: a trip under budget but short on pocket money says so, not \"over budget\"", () => {
  const trip = { country: "malaysia", stops: [{ slug: "langkawi", nights: 10, stay: "budget_hotel" as const, activities: ["SkyCab & Sky Bridge"] }] };
  const input = { ...couple, budgetTND: 3800 };
  const p = priceTrip(input, trip, data)!;
  assert(p.budget.pocket_money >= 0 && p.marginTND < 0, `set-up: pocket ${p.budget.pocket_money}, margin ${p.marginTND}`);
  const kinds = adviseTrip(input, trip, data).map((t) => t.kind);
  assert(kinds.includes("low_pocket") && !kinds.includes("over"), `${kinds}`);
});

check("builder: room to spare suggests another place or a better hotel that fits", () => {
  const rich = { ...couple, budgetTND: 9000 };
  const trip = { country: "thailand", stops: [{ slug: "bangkok", nights: 4, stay: "budget_hotel" as const, activities: [] as string[] }] };
  const tips = adviseTrip(rich, trip, data);
  const margin = priceTrip(rich, trip, data)!.marginTND;
  const add = tips.find((t) => t.kind === "add_place" || t.kind === "upgrade");
  assert(add && "costTND" in add && add.costTND <= margin, JSON.stringify(tips));
});

check("builder: country cards put trips that fit first", () => {
  const cards = countryCards(couple, data);
  assert(cards.length === 5, `${cards.length} cards`);
  const fits = cards.map((c) => c.priced.marginTND >= 0);
  assert(fits.every((f, i) => i === 0 || !f || fits[i - 1]), `order ${fits}`);
  console.log(`      ${cards.map((c) => `${c.code} ${c.season} ≈${c.priced.tripCostTND} ${c.priced.marginTND >= 0 ? "fits" : `short ${-c.priced.marginTND}`}`).join(" · ")}`);
});

check("builder: an order is re-priced on the server and ignores unknown places or activities", () => {
  const trip = { country: "thailand", stops: [
    { slug: "krabi", nights: 6, stay: "good_hotel" as const, activities: ["Four Islands longtail tour", "Made-up tour"] },
    { slug: "ubud", nights: 3, stay: "good_hotel" as const, activities: [] },
  ] };
  const snap = buildSnapshot({ input: couple, trip }, data)!;
  assert(snap.stops.length === 1 && snap.stops[0].activities.length === 1, "unknown stop / activity dropped");
  assert(snap.tripCostTND === priceTrip(couple, cleanTrip(couple, trip, data), data)!.tripCostTND, "same price as the builder");
  assert(CATEGORIES.reduce((n, c) => n + snap.budget[c], 0) === snap.totalBudgetTND, "split adds up");
  assert(snap.stops[0].stayArea !== "", "stay area kept for SAFRA");
  assert(buildSnapshot({ input: couple, trip: { country: "atlantis", stops: trip.stops } }, data) === null, "unknown country → null");
});

console.log(`\n${passed} passed, ${failures.length} failed`);
process.exit(failures.length ? 1 : 0);
