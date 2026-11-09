// What a trip-builder order stores (requests.quiz_answers): the answers and the trip the visitor built,
// re-priced by the server (the browser's numbers are never trusted), with the brain's tips at that moment.
// The admin request page reads it back.

import type { StayType } from "../../data/brain";
import { activitiesFor, adviseTrip, cleanTrip, priceTrip, stopSeason, type BuilderData, type BuiltTrip, type StopSeason, type Tip } from "./builder.ts";
import type { BrainInput } from "./engine.ts";
import type { EncodedBuild } from "./input.ts";
import type { Budget } from "./pricing.ts";
import { NO_LIVE, type FlightLink, type HotelLink, type LiveInfo } from "../live/prices.ts";

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
  /** True unless the flights and every stay's hotel prices were the day's live prices. */
  estimated: boolean;
  /** Which prices were live (SerpApi) when the customer ordered. Missing on orders placed before live prices. */
  live?: {
    flights: boolean;
    hotels: string[];
    eurTnd: number | null;
    checkedAt: string | null;
    /** The day's Google Flights search behind the live flight price (orders placed before links: missing). */
    flightLink?: FlightLink | null;
    /** The day's Google Hotels search behind each live stay price, by base slug. */
    hotelLinks?: Record<string, HotelLink>;
  };
  computedAt: string;
}

export function buildSnapshot(build: EncodedBuild, data: BuilderData, now = new Date(), liveInfo: LiveInfo = NO_LIVE): TripBrainSnapshot | null {
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
    estimated: !(liveInfo.flights.includes(trip.country) && trip.stops.every((s) => liveInfo.hotels.includes(s.slug))),
    live: {
      flights: liveInfo.flights.includes(trip.country),
      hotels: trip.stops.map((s) => s.slug).filter((slug) => liveInfo.hotels.includes(slug)),
      eurTnd: liveInfo.eurTnd,
      checkedAt: liveInfo.checkedAt,
      flightLink: liveInfo.flightLinks[trip.country] ?? null,
      hotelLinks: Object.fromEntries(trip.stops.flatMap((s) => (liveInfo.hotelLinks[s.slug] ? [[s.slug, liveInfo.hotelLinks[s.slug]] as const] : []))),
    },
    computedAt: now.toISOString(),
  };
}

export function isBrainSnapshot(value: unknown): value is TripBrainSnapshot {
  const v = value as { kind?: unknown; version?: unknown } | null;
  return typeof v === "object" && v !== null && v.kind === BRAIN_SNAPSHOT_KIND && v.version === 2;
}
