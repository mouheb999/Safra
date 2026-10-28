// Database rows → app models. Type-only imports keep this runnable from scripts/verify-db.mts.

import type { BrainActivity, BrainBase, BrainCountry, GroupType, StayType } from "@/data/brain";
import type { Destination, DurationBand, Traveler } from "@/data/destinations";
import type { Pack, PackInclude, PackText } from "@/data/packs";
import type { Safari } from "@/data/safaris";
import type { Tables } from "./database.types";

import type { VisaService } from "@/data/visas";
import type { DestinationText, SafariText, VisaText } from "@/data/catalog-translations";
import type { Translations } from "@/data/translations";

/** jsonb `translations` column → typed map (empty object when absent). */
const translationsOf = <T,>(value: unknown): Translations<T> =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Translations<T>) : {};

export type DestinationRow = Tables<"destinations">;
export type SafariRow = Tables<"safaris">;
export type ServiceRow = Tables<"services">;
export type PackRow = Tables<"packs">;
export type BrainCountryRow = Tables<"brain_countries">;
export type BrainBaseRow = Tables<"brain_bases">;

export function toBrainCountry(row: BrainCountryRow): BrainCountry {
  return {
    code: row.code,
    name: row.name,
    airport: row.airport,
    flightTND: row.flight_tnd,
    flightHours: Number(row.flight_hours),
    visaTND: row.visa_tnd,
    internalMoveTND: row.internal_move_tnd,
    insuranceDayTND: row.insurance_day_tnd,
    esimTND: row.esim_tnd,
    image: row.image_url,
    sortOrder: row.sort_order,
    translations: translationsOf<{ name: string }>(row.translations),
  };
}

export function toBrainBase(row: BrainBaseRow): BrainBase {
  const fit = (row.group_fit ?? {}) as Partial<Record<GroupType, number>>;
  const stay = row.stay_tnd as Record<StayType, number>;
  return {
    slug: row.slug,
    countryCode: row.country_code,
    place: row.place,
    strengths: row.strengths,
    bestMonths: row.best_months,
    okMonths: row.ok_months,
    stayAreas: row.stay_areas,
    minNights: row.min_nights,
    familyOk: row.family_ok,
    groupFit: { solo: fit.solo ?? 0.5, couple: fit.couple ?? 0.5, honeymoon: fit.honeymoon ?? 0.5, friends: fit.friends ?? 0.5, family: fit.family ?? 0.5 },
    stayTND: { budget_hotel: stay.budget_hotel, good_hotel: stay.good_hotel, apartment: stay.apartment },
    foodTND: { budget: row.food_budget_tnd, mid: row.food_mid_tnd },
    transportDayTND: row.transport_day_tnd,
    transferTND: row.transfer_tnd,
    activities: (Array.isArray(row.activities) ? row.activities : []) as unknown as BrainActivity[],
    sortOrder: row.sort_order,
    translations: translationsOf<{ place: string }>(row.translations),
  };
}

export function toPack(row: PackRow): Pack {
  return {
    slug: row.slug,
    title: row.title,
    country: row.country,
    route: row.route,
    blurb: row.blurb,
    destinationSlug: row.destination_slug ?? "",
    priceDT: row.price_dt,
    nights: row.nights,
    image: row.image_url,
    // The table only accepts known values (check constraint).
    includes: row.includes as PackInclude[],
    vibes: row.vibes,
    translations: translationsOf<PackText>(row.translations),
  };
}

export function toVisaService(row: ServiceRow): VisaService {
  return {
    slug: row.slug,
    name: row.name,
    country: row.country,
    flag: row.flag,
    priceDT: row.price_dt,
    description: row.description,
    includes: row.includes,
    documents: row.documents,
    translations: translationsOf<VisaText>(row.translations),
  };
}

export function toDestination(row: DestinationRow): Destination {
  return {
    slug: row.slug,
    country: row.country,
    title: row.title,
    description: row.description,
    highlights: row.highlights,
    match: row.match_default,
    duration: row.duration,
    estimatedTotal: row.estimated_total,
    minBudget: row.min_budget,
    maxBudget: row.max_budget,
    heroImage: { src: row.hero_image_url, alt: row.hero_image_alt },
    cardImage: { src: row.card_image_url, alt: row.card_image_alt },
    teaser: { budget: row.teaser_budget, duration: row.teaser_duration, tags: row.teaser_tags },
    quiz: {
      tags: row.quiz_tags,
      durationBands: row.duration_bands as DurationBand[],
      monthAffinity: row.month_affinity,
      travelerSuitability: row.traveler_suitability as Record<Traveler, number>,
    },
    translations: translationsOf<DestinationText>(row.translations),
  };
}

export function toSafari(row: SafariRow): Safari {
  return {
    slug: row.slug,
    name: row.name,
    description: row.description,
    duration: row.duration,
    highlights: row.highlights,
    image: { src: row.image_url, alt: row.image_alt },
    translations: translationsOf<SafariText>(row.translations),
  };
}
