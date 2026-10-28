// Database rows → app models. Type-only imports keep this runnable from scripts/verify-db.mts.

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
