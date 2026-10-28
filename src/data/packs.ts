// "Our packs": ready-made trips with a price per person.
// PLACEHOLDERS — the destinations, prices, nights and photos below are examples to be replaced with
// SAFRA's real packs (later editable from /admin, like destinations).

import type { Locale } from "@/i18n/config";

/** What a pack's price covers; labels live in t.packs.includes. */
export type PackInclude = "flights" | "hotel" | "breakfast" | "transfers" | "activities" | "visa" | "plan";

export interface Pack {
  slug: string;
  /** Catalog destination it belongs to (links the checkout to /trip data), if any. */
  destinationSlug: string;
  /** Price per person in DT, flights from Tunis included. */
  priceDT: number;
  nights: number;
  image: string;
  includes: PackInclude[];
  /** Vibe keys from the quiz (t.options.vibes). */
  vibes: string[];
  text: Record<Locale, { title: string; country: string; route: string; blurb: string }>;
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
    text: {
      en: { title: "Cairo long weekend", country: "Egypt", route: "Cairo · Giza", blurb: "The pyramids, the old souks and the Nile at night, in four easy days." },
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
    text: {
      en: { title: "Cairo & the Nile", country: "Egypt", route: "Cairo · Luxor · Aswan", blurb: "Temples by day, a felucca at sunset, and the train down the Nile." },
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
    text: {
      en: { title: "Istanbul & Cappadocia", country: "Türkiye", route: "Istanbul · Göreme", blurb: "Bosphorus evenings, then a sunrise among the balloons." },
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
    text: {
      en: { title: "Bangkok & Krabi", country: "Thailand", route: "Bangkok · Ao Nang", blurb: "Street food and rooftops first, then limestone cliffs and island days." },
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
    text: {
      en: { title: "Thai islands, slowly", country: "Thailand", route: "Phuket · Phi Phi · Krabi", blurb: "Three islands, beachfront rooms and a private longtail day." },
      fr: { title: "Les îles thaïes, en douceur", country: "Thaïlande", route: "Phuket · Phi Phi · Krabi", blurb: "Trois îles, des chambres face à la mer et une journée en longtail privé." },
      ar: { title: "جزر تايلاند على مهل", country: "تايلاند", route: "بوكيت · في في · كرابي", blurb: "ثلاث جزر، غرف على الشاطئ، ويوم كامل بقارب خاص." },
    },
  },
];

/** A pack as a page shows it: its text in the visitor's language. */
export type LocalizedPack = Omit<Pack, "text"> & Pack["text"]["en"];

export const localizePack = (p: Pack, locale: Locale): LocalizedPack => {
  const { text, ...rest } = p;
  return { ...rest, ...text[locale] };
};

export const getPacks = (locale: Locale): LocalizedPack[] =>
  [...localPacks].sort((a, b) => a.priceDT - b.priceDT).map((p) => localizePack(p, locale));
