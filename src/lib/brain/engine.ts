// SAFRA trip brain, Mode A (Suggest): picks and costs up to 3 trips in 3 countries for a client's answers.
// Deterministic and pure (no I/O, type-only imports) so it runs the same on the server, in the admin and in
// scripts/verify-brain.mts. Follows "Safra Trip Brain v0.5" steps 1 and 4–7; prices come from SAFRA's
// tables (src/data/brain.ts / brain_* tables) and are estimates until live sources are connected.

import type { BrainActivity, BrainBase, BrainCountry, BrainSettings, GroupType, StayType } from "../../data/brain";

export interface BrainInput {
  budgetTND: number;
  budgetScope: "total" | "per_person";
  adults: number;
  children: number;
  childAges: number[];
  group: GroupType;
  /** Exact dates (YYYY-MM-DD) … */
  depart: string | null;
  ret: string | null;
  flexDays: number;
  /** … or just a month (1–12) and a number of nights. */
  month: number | null;
  nights: number | null;
  vibes: string[];
  stay: StayType;
}

export const CATEGORIES = [
  "flights",
  "stays",
  "visa",
  "local_transport",
  "food",
  "activities",
  "insurance",
  "sim_esim",
  "pocket_money",
] as const;
export type Category = (typeof CATEGORIES)[number];
export type Budget = Record<Category, number>;

export type Season = "best" | "ok";
export type Label = "best_value" | "best_experience" | "easiest";
export const LABELS: Label[] = ["best_value", "best_experience", "easiest"];

export interface PlannedBase {
  slug: string;
  nights: number;
  season: Season;
  stayArea: string;
  activities: Pick<BrainActivity, "name" | "priceTND" | "booking">[];
}

export interface BrainOption {
  country: string;
  label: Label;
  bases: PlannedBase[];
  /** Exact amounts for the whole group, TND; they add up to the client's budget. */
  budget: Budget;
  /** Categories 1–8. */
  tripCostTND: number;
  pocketPerPersonPerDay: number;
  /** Worst season across the bases. */
  season: Season;
  vibesMatched: string[];
  score: number;
  scoreParts: { budget: number; vibe: number; season: number; group: number; ease: number };
  /** What was cut to fit the budget. */
  adjustments: ("fewer_activities" | "no_activities" | "fewer_bases")[];
}

interface Trip {
  nights: number;
  days: number;
  travelers: number;
  totalBudgetTND: number;
  months: number[];
}

export interface NoFit {
  country: string;
  bases: PlannedBase[];
  tripCostTND: number;
  /** What's missing to keep the minimum pocket money. */
  shortfallTND: number;
  /** Fewest-cut trip length that fits, if any. */
  fitsWithNights: number | null;
}

export type BrainResult =
  | { status: "need_info"; missing: ("budget" | "travelers" | "dates" | "nights")[] }
  | ({ status: "ok"; options: BrainOption[]; warnings: string[] } & Trip)
  | ({
      status: "no_fit";
      closest: NoFit | null;
      /** Only when a better stay was asked for: whether a budget hotel fits, or what it would still miss. */
      budgetHotel: { fits: boolean; shortfallTND: number } | null;
      warnings: string[];
    } & Trip);

// ---- Answers ----------------------------------------------------------------------------

const DAY = 86_400_000;
const parseDate = (s: string | null) => {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(`${s}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? null : d;
};

/** Months the trip touches (1–12). */
export function tripMonths(input: BrainInput): number[] {
  const a = parseDate(input.depart);
  const b = parseDate(input.ret);
  if (a && b && b > a) {
    const out: number[] = [];
    const cursor = new Date(Date.UTC(a.getUTCFullYear(), a.getUTCMonth(), 1));
    while (cursor <= b && out.length < 12) {
      out.push(cursor.getUTCMonth() + 1);
      cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    }
    return out;
  }
  return input.month ? [input.month] : [];
}

export function tripNights(input: BrainInput): number | null {
  const a = parseDate(input.depart);
  const b = parseDate(input.ret);
  if (a && b && b > a) return Math.round((b.getTime() - a.getTime()) / DAY);
  return input.nights && input.nights > 0 ? input.nights : null;
}

function missingInfo(input: BrainInput): ("budget" | "travelers" | "dates" | "nights")[] {
  const missing: ("budget" | "travelers" | "dates" | "nights")[] = [];
  if (!(input.budgetTND > 0)) missing.push("budget");
  if (!(input.adults >= 1)) missing.push("travelers");
  if (tripMonths(input).length === 0) missing.push("dates");
  else if (!tripNights(input)) missing.push("nights");
  return missing;
}

// ---- Steps ------------------------------------------------------------------------------

export function seasonOf(base: BrainBase, months: number[]): Season | "bad" {
  if (months.some((m) => !base.bestMonths.includes(m) && !base.okMonths.includes(m))) return "bad";
  return months.some((m) => base.okMonths.includes(m)) ? "ok" : "best";
}

const seasonScore = (s: Season) => (s === "best" ? 1 : 0.5);
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const maxBases = (nights: number) => (nights < 8 ? 1 : nights <= 13 ? 2 : 3);

function subsets<T>(items: T[], max: number): T[][] {
  const out: T[][] = [];
  const walk = (start: number, current: T[]) => {
    if (current.length > 0) out.push(current);
    if (current.length === max) return;
    for (let i = start; i < items.length; i++) walk(i + 1, [...current, items[i]]);
  };
  walk(0, []);
  return out;
}

interface Ctx {
  input: BrainInput;
  settings: BrainSettings;
  trip: Trip;
  youngKids: boolean;
}

interface Unit {
  bases: BrainBase[];
  seasons: Season[];
  vibeCover: number;
  vibesMatched: string[];
  groupFit: number;
}

/** Step 1: possible trip units in a country, best first (season, then vibe, then group, then fewer moves). */
function candidateUnits(country: BrainCountry, bases: BrainBase[], ctx: Ctx): Unit[] {
  const { input, trip } = ctx;
  const usable = bases.filter(
    (b) =>
      b.countryCode === country.code &&
      seasonOf(b, trip.months) !== "bad" &&
      (input.vibes.length === 0 || b.strengths.some((s) => input.vibes.includes(s))) &&
      (!ctx.youngKids || b.familyOk),
  );
  return subsets(usable, maxBases(trip.nights))
    .filter((combo) => combo.reduce((n, b) => n + b.minNights, 0) <= trip.nights)
    .map((combo) => {
      const seasons = combo.map((b) => seasonOf(b, trip.months) as Season);
      const vibesMatched = input.vibes.filter((v) => combo.some((b) => b.strengths.includes(v)));
      return {
        bases: [...combo].sort((a, b) => a.sortOrder - b.sortOrder),
        seasons,
        vibesMatched,
        vibeCover: input.vibes.length ? vibesMatched.length / input.vibes.length : 0.5,
        groupFit: combo.reduce((n, b) => n + b.groupFit[input.group], 0) / combo.length,
      };
    })
    .sort(
      (a, b) =>
        avg(b.seasons.map(seasonScore)) - avg(a.seasons.map(seasonScore)) ||
        b.vibeCover - a.vibeCover ||
        b.groupFit - a.groupFit ||
        a.bases.length - b.bases.length,
    );
}

const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);

/** Nights per base: each gets its minimum, the rest goes where the client's vibes are strongest. */
function splitNights(unit: Unit, nights: number, vibes: string[]): number[] {
  const split = unit.bases.map((b) => b.minNights);
  const weight = unit.bases.map((b) => 1 + b.strengths.filter((s) => vibes.includes(s)).length);
  for (let left = nights - split.reduce((a, b) => a + b, 0); left > 0; left--) {
    let pick = 0;
    for (let i = 1; i < split.length; i++) if (split[i] / weight[i] < split[pick] / weight[pick]) pick = i;
    split[pick]++;
  }
  return split;
}

/** Step 4: about one paid activity every N days per base, matching the vibes (kid-friendly with young kids). */
function pickActivities(base: BrainBase, nights: number, every: number, ctx: Ctx) {
  if (every <= 0) return [];
  const count = Math.floor(nights / every);
  return base.activities
    .filter((a) => !ctx.youngKids || a.kidFriendly)
    .map((a) => ({ a, hits: a.vibes.filter((v) => ctx.input.vibes.includes(v)).length }))
    .sort((x, y) => y.hits - x.hits || x.a.priceTND - y.a.priceTND)
    .slice(0, count)
    .map(({ a }) => ({ name: a.name, priceTND: a.priceTND, booking: a.booking }));
}

interface Costed {
  bases: PlannedBase[];
  budget: Budget;
  tripCostTND: number;
  pocketPerPersonPerDay: number;
}

/** Steps 4–6: the 9 categories for the whole group, in TND. Card fee on everything paid abroad. */
function cost(country: BrainCountry, unit: Unit, activityEvery: number, ctx: Ctx): Costed {
  const { input, trip, settings } = ctx;
  const fee = 1 + settings.cardFeePct / 100;
  const nights = splitNights(unit, trip.nights, input.vibes);
  const rooms = input.stay === "apartment" ? Math.ceil((input.adults + input.children) / 4) : Math.ceil((input.adults + input.children * 0.5) / 2);
  const eaters = input.adults + input.children * 0.6;
  const tier = input.stay === "budget_hotel" ? "budget" : "mid";

  const bases: PlannedBase[] = unit.bases.map((b, i) => ({
    slug: b.slug,
    nights: nights[i],
    season: unit.seasons[i],
    stayArea: b.stayAreas[0] ?? "",
    activities: pickActivities(b, nights[i], activityEvery, ctx),
  }));

  const sum = (f: (b: BrainBase, i: number) => number) => unit.bases.reduce((n, b, i) => n + f(b, i), 0);
  const budget: Budget = {
    flights: flightCost(country, ctx),
    stays: Math.round(sum((b, i) => nights[i] * b.stayTND[input.stay] * rooms) * fee),
    visa: country.visaTND * trip.travelers,
    local_transport: Math.round(
      (sum((b, i) => nights[i] * b.transportDayTND * trip.travelers + b.transferTND * 2) +
        country.internalMoveTND * trip.travelers * (unit.bases.length - 1)) *
        fee,
    ),
    food: Math.round(sum((b, i) => nights[i] * b.foodTND[tier] * eaters) * fee),
    activities: Math.round(bases.reduce((n, b) => n + b.activities.reduce((m, a) => m + a.priceTND, 0), 0) * trip.travelers * fee),
    insurance: country.insuranceDayTND * trip.travelers * trip.days,
    sim_esim: Math.round(country.esimTND * input.adults * fee),
    pocket_money: 0,
  };
  const tripCostTND = CATEGORIES.slice(0, 8).reduce((n, c) => n + budget[c], 0);
  budget.pocket_money = trip.totalBudgetTND - tripCostTND;
  return {
    bases,
    budget,
    tripCostTND,
    pocketPerPersonPerDay: Math.floor(budget.pocket_money / trip.travelers / trip.days),
  };
}

const flightCost = (country: BrainCountry, ctx: Ctx) =>
  Math.round(country.flightTND * ctx.trip.travelers * (1 + ctx.settings.cardFeePct / 100));

const fits = (c: Costed, ctx: Ctx) => c.pocketPerPersonPerDay >= ctx.settings.minPocketTND;
const shortfall = (c: Costed, ctx: Ctx) =>
  Math.max(0, ctx.settings.minPocketTND * ctx.trip.travelers * ctx.trip.days - c.budget.pocket_money);

/**
 * Step 6 for one country: the best unit, made to fit if possible — fewer paid activities, then none,
 * then one base less. Never lowers quality. Returns the fitted plan or, if nothing fits, the closest one.
 */
function planCountry(country: BrainCountry, bases: BrainBase[], ctx: Ctx) {
  const units = candidateUnits(country, bases, ctx);
  if (units.length === 0) return { fitted: null, closest: null };
  const every = ctx.settings.activityEveryDays;
  const best = units[0];
  const attempts: { unit: Unit; every: number; adjustments: BrainOption["adjustments"] }[] = [
    { unit: best, every, adjustments: [] },
    { unit: best, every: every * 2, adjustments: ["fewer_activities"] },
    { unit: best, every: 0, adjustments: ["no_activities"] },
  ];
  // One base less: the best smaller unit made of the same bases.
  const smaller = units.find((u) => u.bases.length === best.bases.length - 1 && u.bases.every((b) => best.bases.includes(b)));
  if (smaller) {
    attempts.push({ unit: smaller, every, adjustments: ["fewer_bases"] });
    attempts.push({ unit: smaller, every: 0, adjustments: ["fewer_bases", "no_activities"] });
  }
  let closest: { unit: Unit; costed: Costed } | null = null;
  for (const a of attempts) {
    const costed = cost(country, a.unit, a.every, ctx);
    if (fits(costed, ctx)) return { fitted: { unit: a.unit, costed, adjustments: a.adjustments }, closest: null };
    if (!closest || shortfall(costed, ctx) < shortfall(closest.costed, ctx)) closest = { unit: a.unit, costed };
  }
  return { fitted: null, closest };
}

/** Step 7: 0–100 from the client's answers and the costed trip. */
function score(country: BrainCountry, unit: Unit, costed: Costed, ctx: Ctx) {
  const min = ctx.settings.minPocketTND;
  // Flights taking more than the allowed share of the budget lower the budget score (0 at 25 points over).
  const flightShare = (costed.budget.flights * 100) / ctx.trip.totalBudgetTND;
  const flightPenalty = clamp01(1 - Math.max(0, flightShare - ctx.settings.maxFlightSharePct) / 25);
  const parts = {
    budget: 30 * clamp01((costed.pocketPerPersonPerDay - min) / Math.max(2 * min, 60)) * flightPenalty,
    vibe: 25 * unit.vibeCover,
    season: 20 * avg(unit.seasons.map(seasonScore)),
    group: 15 * unit.groupFit,
    ease: 10 * clamp01(1 - Math.max(0, country.flightHours - 12) / 12 - 0.15 * (unit.bases.length - 1)),
  };
  const rounded = Object.fromEntries(Object.entries(parts).map(([k, v]) => [k, Math.round(v * 10) / 10])) as typeof parts;
  return { total: Math.round(parts.budget + parts.vibe + parts.season + parts.group + parts.ease), parts: rounded };
}

/** Labels describe the result: each of the (up to) 3 options gets the one it wins among those not yet labelled. */
function assignLabels(options: Omit<BrainOption, "label">[]): BrainOption[] {
  const criteria: Record<Label, (o: Omit<BrainOption, "label">) => number> = {
    best_value: (o) => o.pocketPerPersonPerDay,
    best_experience: (o) => o.scoreParts.vibe + o.scoreParts.season,
    easiest: (o) => o.scoreParts.ease,
  };
  const left = [...options];
  const labelled = new Map<Omit<BrainOption, "label">, Label>();
  for (const label of LABELS) {
    if (left.length === 0) break;
    const winner = left.reduce((a, b) => (criteria[label](b) > criteria[label](a) ? b : a));
    labelled.set(winner, label);
    left.splice(left.indexOf(winner), 1);
  }
  return options.map((o) => ({ ...o, label: labelled.get(o)! }));
}

export function suggestTrips(input: BrainInput, countries: BrainCountry[], bases: BrainBase[], settings: BrainSettings): BrainResult {
  const missing = missingInfo(input);
  if (missing.length) return { status: "need_info", missing };

  const travelers = input.adults + input.children;
  const nights = tripNights(input)!;
  const trip: Trip = {
    nights,
    days: nights + 1,
    travelers,
    totalBudgetTND: input.budgetScope === "per_person" ? input.budgetTND * travelers : input.budgetTND,
    months: tripMonths(input),
  };
  const youngKids = input.children > 0 && (input.childAges.length < input.children || input.childAges.some((a) => a < 12));
  const ctx: Ctx = { input, settings, trip, youngKids };
  const warnings = ["estimated_prices"];

  const fitted: Omit<BrainOption, "label">[] = [];
  const near: { country: BrainCountry; unit: Unit; costed: Costed; gap: number }[] = [];
  for (const country of [...countries].sort((a, b) => a.sortOrder - b.sortOrder)) {
    const plan = planCountry(country, bases, ctx);
    // Flights over the allowed share don't rule a country out (that asked for budgets far above the real
    // cost); they lower its score instead, and are flagged for SAFRA.
    if (flightCost(country, ctx) * 100 > trip.totalBudgetTND * settings.maxFlightSharePct) warnings.push(`flight_share:${country.code}`);
    if (plan.fitted) {
      const { unit, costed, adjustments } = plan.fitted;
      const s = score(country, unit, costed, ctx);
      fitted.push({
        country: country.code,
        bases: costed.bases,
        budget: costed.budget,
        tripCostTND: costed.tripCostTND,
        pocketPerPersonPerDay: costed.pocketPerPersonPerDay,
        season: unit.seasons.includes("ok") ? "ok" : "best",
        vibesMatched: unit.vibesMatched,
        score: s.total,
        scoreParts: s.parts,
        adjustments,
      });
    } else if (plan.closest) {
      near.push({ country, ...plan.closest, gap: shortfall(plan.closest.costed, ctx) });
    }
  }

  if (fitted.length > 0) {
    const top = fitted.sort((a, b) => b.score - a.score).slice(0, 3);
    return { status: "ok", options: assignLabels(top), warnings, ...trip };
  }

  // Section 7: nothing fits — the closest option, what's missing, how many nights would fit, and what a
  // budget hotel would change (quality is never lowered on its own, so the visitor decides).
  let budgetHotel: { fits: boolean; shortfallTND: number } | null = null;
  if (input.stay !== "budget_hotel") {
    const alt = suggestTrips({ ...input, stay: "budget_hotel" }, countries, bases, settings);
    if (alt.status === "ok") budgetHotel = { fits: true, shortfallTND: 0 };
    else if (alt.status === "no_fit" && alt.closest) budgetHotel = { fits: false, shortfallTND: alt.closest.shortfallTND };
  }
  const closest = near.sort((a, b) => a.gap - b.gap)[0];
  if (!closest) return { status: "no_fit", closest: null, budgetHotel, warnings, ...trip };
  let fitsWithNights: number | null = null;
  const minNights = closest.unit.bases.reduce((n, b) => n + b.minNights, 0);
  for (let n = nights - 1; n >= Math.max(3, minNights); n--) {
    const shorter: Ctx = { ...ctx, trip: { ...trip, nights: n, days: n + 1 } };
    if (fits(cost(closest.country, closest.unit, 0, shorter), shorter)) {
      fitsWithNights = n;
      break;
    }
  }
  return {
    status: "no_fit",
    closest: {
      country: closest.country.code,
      bases: closest.costed.bases,
      tripCostTND: closest.costed.tripCostTND,
      shortfallTND: Math.ceil(closest.gap / 50) * 50,
      fitsWithNights,
    },
    budgetHotel,
    warnings,
    ...trip,
  };
}

/** The locked preview: every amount rounded to the nearest 50 TND so it can't be matched to a hotel or flight. */
export function previewBudget(budget: Budget): Budget {
  return Object.fromEntries(CATEGORIES.map((c) => [c, Math.round(budget[c] / 50) * 50])) as Budget;
}
export const round50 = (n: number) => Math.round(n / 50) * 50;
