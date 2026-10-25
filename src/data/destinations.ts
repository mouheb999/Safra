// Local destination catalog: the fallback when Supabase isn't configured, and the source
// for supabase/seed.sql (npm run db:seed:generate). Read it through src/lib/catalog.ts.

import { destinationTranslations, type DestinationText } from "./catalog-translations.ts";
import type { Translations } from "./translations";

export type Traveler = "Just me" | "Couple" | "Friends" | "Family";
export type DurationBand = "Weekend" | "5–7 days" | "8–12 days" | "2+ weeks";

export interface Img {
  src: string;
  alt: string;
}

export interface Destination {
  slug: string;
  country: string;
  /** Experience title, e.g. "Cairo & the Nile". */
  title: string;
  description: string;
  highlights: string[];
  /** Default match shown when no quiz score is passed in. */
  match: number;
  duration: string;
  estimatedTotal: number;
  minBudget: number;
  maxBudget: number;
  heroImage: Img;
  cardImage: Img;
  /** Home page teaser copy. */
  teaser: { budget: number; duration: string; tags: string[] };
  /** Quiz scoring inputs. */
  quiz: {
    tags: string[];
    durationBands: DurationBand[];
    /** Months (1–12) when the destination is in season. */
    monthAffinity: number[];
    travelerSuitability: Record<Traveler, number>;
  };
  /** French/Arabic text; applied by localizeDestination(). */
  translations?: Translations<DestinationText>;
}

const baseDestinations: Destination[] = [
  {
    slug: "thailand",
    country: "Thailand",
    title: "Krabi & the Andaman coast",
    description:
      "A warm tropical escape with dramatic limestone coastlines, soft sea breezes, and easy island-hopping energy.",
    highlights: ["Turquoise coast", "Island energy", "Tropical flavours"],
    match: 94,
    duration: "7–9 days",
    estimatedTotal: 5850,
    minBudget: 4200,
    maxBudget: 7500,
    heroImage: { src: "https://framerusercontent.com/images/snHq8305shuNdUjeU5oyWBUIZw.jpg", alt: "Krabi coast cliffs" },
    cardImage: { src: "https://framerusercontent.com/images/snHq8305shuNdUjeU5oyWBUIZw.jpg", alt: "Krabi coast cliffs" },
    teaser: { budget: 2900, duration: "7–9 days", tags: ["Beach", "Nightlife", "Adventure"] },
    quiz: {
      tags: ["Beach", "Nightlife", "Adventure", "Food", "Nature", "Relaxation"],
      durationBands: ["8–12 days", "2+ weeks"],
      monthAffinity: [11, 12, 1, 2, 3, 4],
      travelerSuitability: { "Just me": 0.7, Couple: 0.9, Friends: 0.95, Family: 0.85 },
    },
  },
  {
    slug: "egypt",
    country: "Egypt",
    title: "Cairo & the Nile",
    description:
      "A vivid mix of timeless atmosphere and city rhythm, where golden tones and deep history shape the journey.",
    highlights: ["Desert landscapes", "Rich heritage", "Warm evenings"],
    match: 88,
    duration: "6 days",
    estimatedTotal: 3000,
    minBudget: 2200,
    maxBudget: 3800,
    heroImage: {
      src: "https://images.unsplash.com/photo-1771325676184-44d8035e3cd1?w=1400&q=85",
      alt: "Egypt desert and pyramids",
    },
    cardImage: { src: "https://framerusercontent.com/images/EdMMpeTsjEBWluFXZ2r0bI5Xxo.jpg", alt: "Pyramids at sunset" },
    teaser: { budget: 2200, duration: "6 days", tags: ["Culture", "Adventure"] },
    quiz: {
      tags: ["Culture", "City", "Nature", "Food"],
      durationBands: ["Weekend", "5–7 days"],
      monthAffinity: [10, 11, 12, 1, 2, 3, 4],
      travelerSuitability: { "Just me": 0.9, Couple: 0.95, Friends: 0.8, Family: 0.75 },
    },
  },
  {
    slug: "turkiye",
    country: "Türkiye",
    title: "Cappadocia & Istanbul",
    description:
      "An expressive blend of dramatic scenery and city pulse, where layered culture and bold flavor meet every day.",
    highlights: ["Dramatic landscapes", "Layered culture", "Vibrant food"],
    match: 90,
    duration: "5 days",
    estimatedTotal: 3800,
    minBudget: 2800,
    maxBudget: 4800,
    // The live site used a Thai beach photo here by mistake; this is the Cappadocia shot from the home page.
    heroImage: { src: "https://framerusercontent.com/images/g7qTJCUK0HIbl4Od1pOA1so1eg.jpg", alt: "Hot-air balloons over Cappadocia" },
    cardImage: { src: "https://framerusercontent.com/images/g7qTJCUK0HIbl4Od1pOA1so1eg.jpg", alt: "Hot-air balloons over Cappadocia" },
    teaser: { budget: 2600, duration: "5 days", tags: ["Culture", "Adventure", "Nightlife"] },
    quiz: {
      tags: ["Culture", "Food", "City", "Luxury", "Adventure"],
      durationBands: ["5–7 days", "8–12 days"],
      monthAffinity: [4, 5, 6, 9, 10, 11],
      travelerSuitability: { "Just me": 0.78, Couple: 0.92, Friends: 0.96, Family: 0.74 },
    },
  },
];

export const localDestinations: Destination[] = baseDestinations.map((d) => ({ ...d, translations: destinationTranslations[d.slug] }));

/** Looks a slug up in a catalog (undefined when the slug is unknown or missing). */
export function findDestination(catalog: Destination[], slug: string | undefined): Destination | undefined {
  return catalog.find((d) => d.slug === slug);
}
