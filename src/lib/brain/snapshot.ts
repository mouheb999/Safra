// What a trip-builder order stores (requests.quiz_answers): the answers and the trip the visitor built,
// re-priced by the server (the browser's numbers are never trusted), with the brain's tips at that moment.
// The admin request page reads it back.

import type { StayType } from "../../data/brain";
import { activitiesFor, adviseTrip, cleanTrip, priceTrip, stopSeason, type BuilderData, type BuiltTrip, type StopSeason, type Tip } from "./builder.ts";
import type { BrainInput } from "./engine.ts";
import type { EncodedBuild } from "./input.ts";
import type { Budget } from "./pricing.ts";

export const BRAIN_SNAPSHOT_KIND = "trip_brain";

export interface TripBrainSnapshot {
  kind: typeof BRAIN_SNAPSHOT_KIND;
  version: 2;
  input: BrainInput;
  trip: BuiltTrip;
  countryName: string;
  stops: {
    slug: string;
    place: string;
    nights: number;
    stay: StayType;
    season: StopSeason;
    stayArea: string;
    activities: { name: string; priceTND: number; booking: boolean }[];
    costTND: number;
  }[];
  budget: Budget;
  tripCostTND: number;
  totalBudgetTND: number;
  nights: number;
  targetNights: number;
  travelers: number;
  pocketPerPersonPerDay: number;
  /** Left after the minimum pocket money; negative = the visitor is short by that much. */
  marginTND: number;
  tips: Tip[];
  /** The reference prices are starter estimates until SAFRA confirms them. */
  estimated: boolean;
  computedAt: string;
}

export function buildSnapshot(build: EncodedBuild, data: BuilderData, now = new Date()): TripBrainSnapshot | null {
  const trip = cleanTrip(build.input, build.trip, data);
  const priced = priceTrip(build.input, trip, data);
  const country = data.countries.find((c) => c.code === trip.country);
  if (!priced || !country || trip.stops.length === 0) return null;
  return {
    kind: BRAIN_SNAPSHOT_KIND,
    version: 2,
    input: build.input,
    trip,
    countryName: country.name,
    stops: trip.stops.map((s, i) => {
      const base = data.bases.find((b) => b.slug === s.slug)!;
      const offered = activitiesFor(base, build.input);
      return {
        slug: s.slug,
        place: base.place,
        nights: s.nights,
        stay: s.stay,
        season: stopSeason(base, build.input),
        stayArea: base.stayAreas[0] ?? "",
        activities: offered.filter((a) => s.activities.includes(a.name)).map((a) => ({ name: a.name, priceTND: a.priceTND, booking: a.booking })),
        costTND: priced.stopCostsTND[i],
      };
    }),
    budget: priced.budget,
    tripCostTND: priced.tripCostTND,
    totalBudgetTND: priced.totalBudgetTND,
    nights: priced.nights,
    targetNights: priced.targetNights,
    travelers: priced.travelers,
    pocketPerPersonPerDay: priced.pocketPerPersonPerDay,
    marginTND: priced.marginTND,
    tips: adviseTrip(build.input, trip, data),
    estimated: true,
    computedAt: now.toISOString(),
  };
}

export function isBrainSnapshot(value: unknown): value is TripBrainSnapshot {
  const v = value as { kind?: unknown; version?: unknown } | null;
  return typeof v === "object" && v !== null && v.kind === BRAIN_SNAPSHOT_KIND && v.version === 2;
}
