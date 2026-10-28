// "Our packs": ready-made trips with a price per person, edited in /admin/catalog (table public.packs).
// This file is the local fallback when Supabase isn't configured, and the source for supabase/seed.sql
// (npm run db:seed:generate). The packs below are PLACEHOLDERS: example destinations, prices and photos.

import type { Translations } from "./translations";

/** What a pack's price covers; labels live in t.packs.includes. */
export const PACK_INCLUDES = ["flights", "hotel", "breakfast", "transfers", "activities", "visa", "plan"] as const;
export type PackInclude = (typeof PACK_INCLUDES)[number];

/** The pack text that has French/Arabic versions. */
export interface PackText {
  title: string;
  country: string;
  route: string;
  blurb: string;
}

export interface Pack extends PackText {
  slug: string;
  /** Catalog destination it belongs to (the checkout uses it), or "" for none. */
  destinationSlug: string;
  /** Price per person in DT, flights from Tunis included. */
  priceDT: number;
  nights: number;
  image: string;
  includes: PackInclude[];
  /** Vibe keys from the quiz (t.options.vibes). */
  vibes: string[];
  translations?: Translations<PackText>;
}

export const localPacks: Pack[] = [
  {
    slug: "cairo-weekend",
    destinationSlug: "egypt",
    priceDT: 1490,
    nights: 4,
    image: "https://framerusercontent.com/images/EdMMpeTsjEBWluFXZ2r0bI5Xxo.jpg",
    includes: ["flights", "hotel", "breakfast", "transfers", "visa", "plan"],
    vibes: ["Culture", "City"],
    title: "Cairo long weekend",
    country: "Egypt",
    route: "Cairo · Giza",
    blurb: "The pyramids, the old souks and the Nile at night, in four easy days.",
    translations: {
      fr: { title: "Long week-end au Caire", country: "Égypte", route: "Le Caire · Gizeh", blurb: "Les pyramides, les vieux souks et le Nil la nuit, en quatre jours tranquilles." },
      ar: { title: "عطلة طويلة في القاهرة", country: "مصر", route: "القاهرة · الجيزة", blurb: "الأهرامات والأسواق القديمة والنيل ليلًا، في أربعة أيام مريحة." },
    },
  },
  {
    slug: "nile-classic",
    destinationSlug: "egypt",
    priceDT: 2390,
    nights: 7,
    image: "https://images.unsplash.com/photo-1771325676184-44d8035e3cd1?w=1400&q=85",
    includes: ["flights", "hotel", "breakfast", "transfers", "activities", "visa", "plan"],
    vibes: ["Culture", "Adventure"],
    title: "Cairo & the Nile",
    country: "Egypt",
    route: "Cairo · Luxor · Aswan",
    blurb: "Temples by day, a felucca at sunset, and the train down the Nile.",
    translations: {
      fr: { title: "Le Caire et le Nil", country: "Égypte", route: "Le Caire · Louxor · Assouan", blurb: "Des temples le jour, une felouque au coucher du soleil et le train le long du Nil." },
      ar: { title: "القاهرة والنيل", country: "مصر", route: "القاهرة · الأقصر · أسوان", blurb: "معابد في النهار، فلوكة عند الغروب، والقطار على طول النيل." },
    },
  },
  {
    slug: "cappadocia-istanbul",
    destinationSlug: "turkiye",
    priceDT: 2890,
    nights: 6,
    image: "https://framerusercontent.com/images/g7qTJCUK0HIbl4Od1pOA1so1eg.jpg",
    includes: ["flights", "hotel", "breakfast", "transfers", "activities", "plan"],
    vibes: ["Culture", "Food", "City"],
    title: "Istanbul & Cappadocia",
    country: "Türkiye",
    route: "Istanbul · Göreme",
    blurb: "Bosphorus evenings, then a sunrise among the balloons.",
    translations: {
      fr: { title: "Istanbul et la Cappadoce", country: "Turquie", route: "Istanbul · Göreme", blurb: "Des soirées sur le Bosphore, puis un lever de soleil parmi les montgolfières." },
      ar: { title: "إسطنبول وكابادوكيا", country: "تركيا", route: "إسطنبول · غوريمه", blurb: "أمسيات على البوسفور، ثم شروق الشمس بين المناطيد." },
    },
  },
  {
    slug: "bangkok-krabi",
    destinationSlug: "thailand",
    priceDT: 4290,
    nights: 9,
    image: "https://framerusercontent.com/images/snHq8305shuNdUjeU5oyWBUIZw.jpg",
    includes: ["flights", "hotel", "breakfast", "transfers", "activities", "visa", "plan"],
    vibes: ["Beach", "Nightlife", "Food"],
    title: "Bangkok & Krabi",
    country: "Thailand",
    route: "Bangkok · Ao Nang",
    blurb: "Street food and rooftops first, then limestone cliffs and island days.",
    translations: {
      fr: { title: "Bangkok et Krabi", country: "Thaïlande", route: "Bangkok · Ao Nang", blurb: "Street food et rooftops d’abord, puis falaises calcaires et journées sur les îles." },
      ar: { title: "بانكوك وكرابي", country: "تايلاند", route: "بانكوك · آو نانغ", blurb: "أكل الشارع والأسطح أولًا، ثم المنحدرات الصخرية وأيام الجزر." },
    },
  },
  {
    slug: "thai-islands",
    destinationSlug: "thailand",
    priceDT: 7490,
    nights: 11,
    image: "https://framerusercontent.com/images/GL4tcr2qJCc1BJINLyIiLL1ySA.jpg",
    includes: ["flights", "hotel", "breakfast", "transfers", "activities", "visa", "plan"],
    vibes: ["Beach", "Luxury", "Nature"],
    title: "Thai islands, slowly",
    country: "Thailand",
    route: "Phuket · Phi Phi · Krabi",
    blurb: "Three islands, beachfront rooms and a private longtail day.",
    translations: {
      fr: { title: "Les îles thaïes, en douceur", country: "Thaïlande", route: "Phuket · Phi Phi · Krabi", blurb: "Trois îles, des chambres face à la mer et une journée en longtail privé." },
      ar: { title: "جزر تايلاند على مهل", country: "تايلاند", route: "بوكيت · في في · كرابي", blurb: "ثلاث جزر، غرف على الشاطئ، ويوم كامل بقارب خاص." },
    },
  },
];
