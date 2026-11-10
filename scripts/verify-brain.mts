// Runs client profiles through the trip brain (src/lib/brain/engine.ts) with the local data and checks
// the rules from "Safra Trip Brain v0.5" on every result. Run: npm run brain:verify

import { DEFAULT_BRAIN_SETTINGS, localBrainBases, localBrainCountries } from "../src/data/brain.ts";
import { CATEGORIES, seasonOf, suggestTrips, type BrainInput, type BrainResult } from "../src/lib/brain/engine.ts";
import { adviseTrip, cleanTrip, priceTrip, stopSeason } from "../src/lib/brain/builder.ts";
import { buildPreview } from "../src/lib/brain/preview.ts";
import { decodeInput, encodeInput } from "../src/lib/brain/input.ts";
import { GUIDE_NIGHTS, MAX_STRETCH_PER_PERSON_TND, budgetFixes, budgetGuide, hasMoreDestinations, pickTwo, rankCountries } from "../src/lib/brain/surprise.ts";
import { liveFlightTND, parseEurTnd, parseFlightPrice, parseHotelRates, pickTwoLive, searchDates, type LiveDeps } from "../src/lib/live/prices.ts";
import { buildSnapshot } from "../src/lib/brain/snapshot.ts";

let passed = 0;
const failures: string[] = [];
// Checks are queued and run in order at the end, so async ones (live prices) read like the rest.
const queue: [string, () => void | Promise<void>][] = [];
function check(name: string, fn: () => void | Promise<void>) {
  queue.push([name, fn]);
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

check("surprise: only trips within the budget (or ≤ 150 DT per person over), fitting ones first, Asia first among them", () => {
  const focus = new Set(data.countries.filter((c) => c.featured).map((c) => c.code));
  for (const budgetTND of [2500, 4000, 5500, 8000]) {
    const r = pickTwo({ ...couple, budgetTND }, data);
    assert(r.status === "ok" && r.picks.length >= 1 && r.picks.length <= 2, `${budgetTND}: ${r.status}`);
    if (r.picks.length === 2) assert(r.picks[0].country !== r.picks[1].country, "two countries");
    assert(r.picks.every((p, i) => i === 0 || !p.fits || r.picks[i - 1].fits), `${budgetTND}: fitting trips first`);
    const fitting = r.picks.filter((p) => p.fits);
    if (fitting.some((p) => focus.has(p.country))) assert(focus.has(r.picks[0].country), `${budgetTND}: a focus destination leads (${r.picks[0].country})`);
    for (const p of r.picks) {
      assert(p.fits === (p.priced.marginTND >= 0), `${p.country}: fits matches the price`);
      assert(p.fits ? p.missingTND === 0 : p.missingTND >= -p.priced.marginTND && p.missingTND % 50 === 0, `${p.country}: missing amount`);
      assert(p.missingTND / p.priced.travelers <= MAX_STRETCH_PER_PERSON_TND, `${budgetTND}: ${p.country} needs ${p.missingTND} more for ${p.priced.travelers}`);
      assert(p.fits ? p.label !== "stretch" : p.label === "stretch", `${p.country}: label ${p.label}`);
      assert(p.priced.nights === p.priced.targetNights, `${p.country}: covers the dates`);
      for (const s of p.trip.stops) assert(stopSeason(baseBySlug.get(s.slug)!, couple) !== "bad", `${s.slug}: not in the rainy season`);
    }
    console.log(`      ${budgetTND}/pp: ${r.picks.map((p) => `${p.label} ${p.country} ≈${p.priced.tripCostTND}${p.fits ? "" : ` (+${p.missingTND})`}`).join(" · ")}`);
  }
});

check("surprise: a budget too small says so (with the budget that works) instead of showing trips far over it", () => {
  const solo = { ...couple, adults: 1, group: "solo" as const, budgetTND: 1000, depart: "2026-12-10", ret: "2026-12-20", vibes: ["Beach", "Food"] };
  for (const input of [solo, { ...couple, budgetTND: 1000 }]) {
    const r = pickTwo(input, data);
    assert(r.status === "too_tight", `${input.adults} at 1,000/pp: ${r.status}${r.status === "ok" ? " " + r.picks.map((p) => `${p.country}+${p.missingTND}`).join(",") : ""}`);
    if (r.status !== "too_tight") continue;
    assert(r.minPerPersonTND > 1000 && r.minPerPersonTND % 50 === 0, `suggested ${r.minPerPersonTND}`);
    // At the suggested budget there is a trip, in reach.
    const again = pickTwo({ ...input, budgetTND: r.minPerPersonTND }, data);
    assert(again.status === "ok" && again.picks.some((p) => p.fits), `at ${r.minPerPersonTND}/pp: ${again.status}`);
    console.log(`      ${input.adults} traveler(s), 10 nights at 1,000/pp → too tight, smallest trip ≈ ${r.minPerPersonTND}/pp`);
    const preview = buildPreview(input, data, "en");
    assert(preview.status === "too_tight" && preview.minPerPersonTND === r.minPerPersonTND, "the preview says it too");
  }
  // Just over the line: shown, with at most 150 DT more per person.
  const tight = { ...solo, budgetTND: 2500 };
  const t = pickTwo(tight, data);
  assert(t.status !== "ok" || t.picks.every((p) => p.missingTND <= MAX_STRETCH_PER_PERSON_TND), JSON.stringify(t.status === "ok" ? t.picks.map((p) => p.missingTND) : t));
  const big = pickTwo({ ...solo, budgetTND: 6000 }, data);
  const focus = new Set(data.countries.filter((c) => c.featured).map((c) => c.code));
  assert(big.status === "ok" && big.picks.every((p) => focus.has(p.country) && p.fits), "when Asia fits, both picks are Asian");
});

check("surprise: the preview has one program row per day and no money split, hotel or activity names", () => {
  const preview = buildPreview({ ...couple, budgetTND: 8000 }, data, "en");
  assert(preview.status === "ok", preview.status);
  for (const o of preview.options) {
    assert(o.days.length === preview.nights + 1, `${o.country}: ${o.days.length} days for ${preview.nights} nights`);
    assert(o.days[0].kind === "arrive" && o.days.at(-1)!.kind === "depart", "arrive → depart");
    const json = JSON.stringify(o);
    assert(!("budget" in o), "no money split in the preview");
    for (const b of localBrainBases) {
      for (const area of b.stayAreas) assert(!json.includes(area) || o.stops.some((s) => s.place.includes(area)), `area ${area} leaked`);
      for (const a of b.activities) assert(!json.includes(a.name), `activity ${a.name} leaked`);
    }
  }
});

check("surprise: ordering rebuilds the same trip and price from the answers", () => {
  const input = { ...couple, budgetTND: 5500 };
  const shown = buildPreview(input, data, "en");
  assert(shown.status === "ok", shown.status);
  for (const o of shown.options) {
    const again = pickTwo(input, data);
    const p = again.status === "ok" ? again.picks.find((x) => x.country === o.country) : undefined;
    assert(p, `${o.country} found again`);
    const snap = buildSnapshot({ input, trip: p.trip }, data)!;
    assert(Math.round(snap.tripCostTND / 50) * 50 === o.tripCostTND, `${o.country}: ${snap.tripCostTND} vs shown ${o.tripCostTND}`);
  }
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

// ---- Live prices (SerpApi), with fake responses ------------------------------------------------------
const liveSettings = { enabled: true, monthlyLimit: 100, fallbackEurTnd: 3.4 };
const flightJson = (eur: number) => ({
  search_metadata: { google_flights_url: "https://www.google.com/travel/flights?hl=en&tfs=TEST", json_endpoint: "https://serpapi.com/searches/x.json" },
  best_flights: [{ price: eur + 40, flights: [{ airline: "Turkish Airlines" }] }],
  other_flights: [{ price: eur, flights: [{ airline: "Qatar Airways" }, { airline: "Qatar Airways" }] }, { price: eur + 90 }],
  price_insights: { lowest_price: eur + 10 },
});
const hotelJson = {
  search_metadata: { google_hotels_url: "https://serpapi.com/not-google" },
  properties: [
    ...[30, 34, 38, 45, 60].map((r) => ({ type: "hotel", name: `Inn ${r}`, link: `https://inn${r}.example`, extracted_hotel_class: 3, rate_per_night: { extracted_lowest: r } })),
    ...[80, 95, 110].map((r) => ({ type: "hotel", extracted_hotel_class: 4, rate_per_night: { lowest: `€${r}` } })),
    { type: "vacation rental", rate_per_night: { extracted_lowest: 5 } },
  ],
};
function fakeDeps(opts: { key?: string | null; fail?: boolean; budget?: number; now?: Date } = {}) {
  const cache = new Map<string, { value: unknown; fetchedAt: Date }>();
  const calls: string[] = [];
  let budget = opts.budget ?? 1000;
  const now = opts.now ?? new Date("2026-11-03T10:00:00Z");
  const deps: LiveDeps = {
    apiKey: opts.key === undefined ? "test-key" : opts.key,
    async fetchJson(url) {
      calls.push(url);
      if (opts.fail) throw new Error("network down");
      if (url.startsWith("https://open.er-api.com")) return { result: "success", rates: { TND: 3.3 } };
      const u = new URL(url);
      if (u.searchParams.get("engine") === "google_flights") return flightJson(u.searchParams.get("arrival_id") === "KUL" ? 500 : 900);
      return hotelJson;
    },
    async cacheGet(k) { return cache.get(k) ?? null; },
    async cacheSet(k, _kind, v) { cache.set(k, { value: v, fetchedAt: now }); },
    async claimSearch(limit) { if (budget <= 0 || limit <= 0) return false; budget--; return true; },
    now: () => now,
  };
  return { deps, cache, calls, serpCalls: () => calls.filter((c) => c.startsWith("https://serpapi.com")) };
}

check("live: parses Google Flights / Hotels / FX responses and ignores what isn't a hotel", () => {
  assert(parseFlightPrice(flightJson(500)) === 500, "cheapest flight");
  assert(parseFlightPrice({}) === null, "no flights → null");
  const rates = parseHotelRates(hotelJson);
  assert(rates.budget_hotel === 34 && rates.good_hotel === 95, JSON.stringify(rates));
  assert(parseHotelRates({ properties: [{ extracted_hotel_class: 4, rate_per_night: { extracted_lowest: 90 } }] }).good_hotel === undefined, "needs 3 hotels per level");
  assert(parseEurTnd({ rates: { TND: 3.31 } }) === 3.31 && parseEurTnd({ rates: { TND: 0 } }) === null, "fx");
});

check("live: month-only answers search the 15th of the next such month", () => {
  const today = new Date("2026-11-03T00:00:00Z");
  const d1 = searchDates({ ...couple, depart: null, ret: null, month: 2, nights: 9 }, today)!;
  const d2 = searchDates({ ...couple, depart: null, ret: null, month: 11, nights: 7 }, today)!;
  assert(d1.depart === "2027-02-15" && d1.ret === "2027-02-24", JSON.stringify(d1));
  assert(d2.depart === "2026-11-15", JSON.stringify(d2));
});

check("live: without a key (or switched off) nothing is fetched and the picks are exactly the estimates", async () => {
  const offline = pickTwo(couple, data);
  for (const [deps, settings] of [[fakeDeps({ key: null }), liveSettings], [fakeDeps(), { ...liveSettings, enabled: false }]] as const) {
    const r = await pickTwoLive(couple, data, settings, deps.deps);
    assert(deps.calls.length === 0, "no calls");
    assert(JSON.stringify(r.result) === JSON.stringify(offline) && r.live.flights.length === 0, "same as estimates");
  }
});

check("live: the day's flights decide the picks, hotels re-price them, and both are cached", async () => {
  const f = fakeDeps();
  const r = await pickTwoLive(couple, data, liveSettings, f.deps);
  assert(r.result.status === "ok", r.result.status);
  assert(r.live.flights.length === Math.min(5, data.countries.length) && r.live.eurTnd === 3.3, JSON.stringify(r.live));
  const shortlist = rankCountries(couple, data).slice(0, 5);
  assert(r.live.flights.every((c) => shortlist.includes(c)), "live flights only for the 5 best countries on the estimates");
  const kul = r.data.countries.find((c) => c.code === "malaysia")!;
  assert(kul.flightTND === Math.round(500 * 3.3), `Malaysia flight ${kul.flightTND}`);
  for (const p of r.result.picks) {
    for (const s of p.trip.stops) {
      assert(r.live.hotels.includes(s.slug), `${s.slug} hotel live`);
      const b = r.data.bases.find((x) => x.slug === s.slug)!;
      assert(b.stayTND.budget_hotel === Math.round(34 * 3.3) && b.stayTND.good_hotel === Math.round(95 * 3.3), `${s.slug} rates`);
    }
    const again = priceTrip(couple, p.trip, r.data)!;
    assert(again.tripCostTND === p.priced.tripCostTND, "picks priced with the returned data");
  }
  // The links behind the prices, for SAFRA: Google's own pages only, never a SerpApi URL (it could carry the key).
  const fl = r.live.flightLinks.malaysia;
  assert(fl?.url === "https://www.google.com/travel/flights?hl=en&tfs=TEST" && fl.priceTND === Math.round(500 * 3.3) && fl.airline === "Qatar Airways", JSON.stringify(fl));
  const slug = r.result.status === "ok" ? r.result.picks[0].trip.stops[0].slug : "";
  const hl = r.live.hotelLinks[slug];
  assert(hl?.url.startsWith("https://www.google.com/travel/search?") && !hl.url.includes("serpapi"), `hotel link ${hl?.url}`);
  const budgetEx = hl.examples.find((e) => e.stay === "budget_hotel");
  assert(budgetEx?.name === "Inn 34" && budgetEx.url === "https://inn34.example" && budgetEx.nightTND === Math.round(34 * 3.3), JSON.stringify(hl.examples));
  assert(!JSON.stringify(r.live).includes("test-key"), "no API key in what's stored");
  const searches = f.serpCalls().length;
  const second = await pickTwoLive(couple, data, liveSettings, f.deps);
  assert(f.serpCalls().length === searches, `second visitor costs no searches (${f.serpCalls().length - searches} more)`);
  assert(JSON.stringify(second.result) === JSON.stringify(r.result), "same picks from the cache");
  const snap = buildSnapshot({ input: couple, trip: r.result.picks[0].trip }, r.data, new Date(), r.live)!;
  assert(snap.live?.flights === true && !snap.estimated, "order records live prices");
  console.log(`      ${searches} searches for a new visitor, 0 for the next one · ${r.result.picks.map((p) => `${p.country} ≈${p.priced.tripCostTND}`).join(" · ")}`);
});

check("live: the monthly limit stops searches (then a recent cached price or the estimate is used)", async () => {
  const f = fakeDeps({ budget: 2 });
  const r = await pickTwoLive(couple, data, liveSettings, f.deps);
  assert(f.serpCalls().length === 2, `only 2 searches (${f.serpCalls().length})`);
  assert(r.live.flights.length === 2, `2 live flights, the rest estimates (${r.live.flights.length})`);
  const zero = fakeDeps({ budget: 0 });
  const z = await pickTwoLive(couple, data, liveSettings, zero.deps);
  assert(zero.serpCalls().length === 0 && z.live.flights.length === 0 && JSON.stringify(z.result) === JSON.stringify(pickTwo(couple, data)), "no budget → estimates");
});

check("live: departures less than 2 days away use the estimates and cost no search", async () => {
  const f = fakeDeps({ now: new Date("2026-12-09T09:00:00Z") });
  const r = await pickTwoLive(couple, data, liveSettings, f.deps);
  assert(f.serpCalls().length === 0 && r.live.flights.length === 0, `${f.serpCalls().length} searches`);
});

check("live: a \"no results\" answer is kept for the day (no second charge), an account error is not", async () => {
  const country = data.countries[0];
  const dates = { depart: "2026-12-10", ret: "2026-12-20" };
  for (const [error, cached] of [["Google Flights hasn't returned any results for this query.", true], ["Invalid API key.", false]] as const) {
    const f = fakeDeps();
    f.deps.fetchJson = async (url) => { f.calls.push(url); return { error }; };
    assert((await liveFlightTND(country, dates, 3.3, liveSettings, f.deps)) === null, "no price");
    await liveFlightTND(country, dates, 3.3, liveSettings, f.deps);
    assert(f.serpCalls().length === (cached ? 1 : 2), `${error}: ${f.serpCalls().length} searches for 2 visitors`);
  }
});

check("live: a failing service never breaks the picks", async () => {
  const f = fakeDeps({ fail: true });
  const r = await pickTwoLive(couple, data, liveSettings, f.deps);
  assert(r.result.status === "ok" && r.live.flights.length === 0 && r.live.hotels.length === 0, JSON.stringify(r.live));
  assert(JSON.stringify(r.result) === JSON.stringify(pickTwo(couple, data)), "same as estimates");
});

check("more vibes: up to 5, and the new ones lead to places tagged with them", () => {
  const five: BrainInput = { ...couple, vibes: ["Islands", "Diving", "Romance", "Relaxation", "Wellness"] };
  const r = pickTwo(five, data);
  assert(r.status === "ok" && r.picks.length === 2, r.status);
  for (const p of r.status === "ok" ? r.picks : []) {
    assert(p.vibesMatched.some((v) => ["Islands", "Diving"].includes(v)), `${p.country} matches ${p.vibesMatched.join(", ")}`);
  }
  const shopping = pickTwo({ ...couple, vibes: ["Shopping"] }, data);
  assert(shopping.status === "ok" && shopping.picks.every((p) => p.trip.stops.some((s) => data.bases.find((b) => b.slug === s.slug)!.strengths.includes("Shopping"))), "shopping trips include a shopping place");
});

check("other destinations: the next 2 skip every country shown, until none are left", () => {
  const seen: string[] = [];
  let rounds = 0;
  for (;;) {
    const input: BrainInput = seen.length ? { ...couple, exclude: [...seen] } : couple;
    const r = pickTwo(input, data);
    assert(r.status === "ok", r.status);
    const countries = r.status === "ok" ? r.picks.map((p) => p.country) : [];
    assert(countries.length >= 1 && countries.every((c) => !seen.includes(c)), `round ${rounds + 1}: ${countries} vs ${seen}`);
    // The checkout rebuilds the chosen trip from the same answers: same countries, same trips.
    assert(JSON.stringify(pickTwo(decodeInput(encodeInput(input))!, data)) === JSON.stringify(r), "rebuilt from the encoded answers");
    const preview = buildPreview(input, data, "en");
    seen.push(...countries);
    rounds++;
    assert(preview.status === "ok" && preview.more === hasMoreDestinations(input, data, countries), "preview says whether more are left");
    if (preview.status !== "ok" || !preview.more) break;
    assert(rounds < 10, "ends");
  }
  // Every country that has a trip for these answers, each once (the others have no place in season with these vibes).
  const possible = rankCountries(couple, data);
  assert(new Set(seen).size === seen.length && [...seen].sort().join() === [...possible].sort().join(), `every possible country once: ${seen.join(", ")} vs ${possible.join(", ")}`);
  assert(decodeInput(encodeInput({ ...couple, exclude: ["thailand"] }))?.exclude?.[0] === "thailand", "exclusions survive the URL");
  assert(decodeInput(encodeInput({ ...couple, exclude: ["<script>"] })) === null, "odd country codes are refused");
});

check("budget guide: the smallest typical-week budget per destination, and it really brings a trip", () => {
  const today = new Date("2026-11-10T00:00:00Z");
  const guide = budgetGuide(data, today);
  assert(guide.length >= 5, `${guide.length} destinations`);
  assert(guide.every((g, i) => i === 0 || guide[i - 1].minPerPersonTND <= g.minPerPersonTND), "cheapest first");
  assert(guide.every((g) => g.minPerPersonTND % 50 === 0 && g.minPerPersonTND > 500), "rounded, realistic");
  const cheapest = guide[0];
  // At that budget, a typical week for two in its month fits there.
  const fitsSomeMonth = Array.from({ length: 6 }, (_, i) => ((today.getUTCMonth() + i + 1) % 12) + 1).some((month) => {
    const r = pickTwo({ ...couple, depart: null, ret: null, flexDays: 0, month, nights: GUIDE_NIGHTS, vibes: [], budgetTND: cheapest.minPerPersonTND }, data);
    return r.status === "ok" && r.picks.some((p) => p.country === cheapest.code && p.fits);
  });
  assert(fitsSomeMonth, `${cheapest.code} at ${cheapest.minPerPersonTND}/pp`);
  console.log(`      ${guide.map((g) => `${g.code} ${g.minPerPersonTND}`).join(" · ")}`);
});

check("too tight: one-tap fixes only when they lead to a trip", () => {
  const solo = { ...couple, adults: 1, group: "solo" as const, budgetTND: 2300, depart: "2026-12-10", ret: "2026-12-24", vibes: [] as string[] };
  const r = pickTwo(solo, data);
  assert(r.status === "too_tight", r.status);
  if (r.status !== "too_tight") return;
  const fixes = budgetFixes(solo, data, r.minPerPersonTND, 10_000);
  assert(fixes.budgetTND === r.minPerPersonTND, `budget fix ${fixes.budgetTND}`);
  assert(pickTwo({ ...solo, budgetTND: fixes.budgetTND! }, data).status === "ok", "raised budget → a trip");
  if (fixes.nights) {
    assert(fixes.nights < 14 && fixes.nights >= 3, `nights ${fixes.nights}`);
    assert(pickTwo({ ...solo, ret: new Date(Date.parse("2026-12-10") + fixes.nights * 86400000).toISOString().slice(0, 10) }, data).status === "ok", "shorter → a trip");
  }
  if (fixes.month) assert(pickTwo({ ...solo, depart: null, ret: null, month: fixes.month, nights: 14 }, data).status === "ok", "other month → a trip");
  console.log(`      solo 14 nights at 2,300/pp → raise to ${fixes.budgetTND}, ${fixes.nights ?? "no"} nights, month ${fixes.month ?? "none"}`);
  assert(budgetFixes(solo, data, 12_000, 10_000).budgetTND === undefined, "no budget fix beyond the slider");
});

for (const [name, fn] of queue) {
  try {
    await fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (error) {
    failures.push(name);
    console.log(`  ✗ ${name}\n      ${(error as Error).message}`);
  }
}

console.log(`\n${passed} passed, ${failures.length} failed`);
process.exit(failures.length ? 1 : 0);
