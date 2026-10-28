// SAFRA trip brain data: the countries and bases the questionnaire picks from (tables brain_countries /
// brain_bases, edited in /admin/brain). This file is the local fallback and the source for
// supabase/seed.sql (npm run db:seed:generate).
//
// ALL PRICES ARE STARTER ESTIMATES in TND, to be checked and corrected by SAFRA in the admin.
// The site labels every amount as estimated until live price sources are connected.

import type { Translations } from "./translations";

export const GROUP_TYPES = ["solo", "couple", "honeymoon", "friends", "family"] as const;
export type GroupType = (typeof GROUP_TYPES)[number];

export const STAY_TYPES = ["budget_hotel", "good_hotel", "apartment"] as const;
export type StayType = (typeof STAY_TYPES)[number];

export interface BrainActivity {
  name: string;
  /** Vibe keys (t.options.vibes). */
  vibes: string[];
  /** Per person, TND. */
  priceTND: number;
  /** Needs booking ahead (later: live price); otherwise a typical price. */
  booking: boolean;
  kidFriendly: boolean;
}

export interface BrainCountry {
  code: string;
  name: string;
  /** Main arrival airport(s). */
  airport: string;
  /** Round trip from Tunis-Carthage per person, economy with a checked bag. */
  flightTND: number;
  /** One way, door to door, typical 1-stop itinerary. */
  flightHours: number;
  /** What SAFRA charges per traveler for the visa (0 = none needed). */
  visaTND: number;
  /** Per person, per move between two bases (domestic flight / ferry). */
  internalMoveTND: number;
  /** Travel insurance per person per day. */
  insuranceDayTND: number;
  /** eSIM per adult for the trip. */
  esimTND: number;
  image: string;
  sortOrder: number;
  translations?: Translations<{ name: string }>;
}

export interface BrainBase {
  slug: string;
  countryCode: string;
  place: string;
  /** What the place is strong in (vibe keys). */
  strengths: string[];
  /** Months (1–12). Months in neither list are "bad": the base is never suggested then. */
  bestMonths: number[];
  okMonths: number[];
  /** SAFRA-approved areas to stay in. */
  stayAreas: string[];
  minNights: number;
  /** false = nightlife-only: never suggested to families with young children. */
  familyOk: boolean;
  /** How well it suits each group, 0–1. */
  groupFit: Record<GroupType, number>;
  /** Per night per room (hotels: 2 people; apartment: up to 4). */
  stayTND: Record<StayType, number>;
  /** Food per person per day: "budget" tier for budget hotels, "mid" otherwise. */
  foodTND: { budget: number; mid: number };
  /** Local transport per person per day. */
  transportDayTND: number;
  /** Arrival or departure transfer, per group, one way. */
  transferTND: number;
  activities: BrainActivity[];
  sortOrder: number;
  translations?: Translations<{ place: string }>;
}

const fit = (solo: number, couple: number, honeymoon: number, friends: number, family: number) => ({ solo, couple, honeymoon, friends, family });
const stay = (budget_hotel: number, good_hotel: number, apartment: number) => ({ budget_hotel, good_hotel, apartment });
const act = (name: string, priceTND: number, vibes: string[], booking: boolean, kidFriendly: boolean): BrainActivity => ({
  name,
  priceTND,
  vibes,
  booking,
  kidFriendly,
});
const months = (...m: number[]) => m;
const tr = (fr: string, ar: string) => ({ fr: { place: fr }, ar: { place: ar } });

export const localBrainCountries: BrainCountry[] = [
  {
    code: "thailand",
    name: "Thailand",
    airport: "BKK",
    flightTND: 2400,
    flightHours: 15,
    visaTND: 55,
    internalMoveTND: 220,
    insuranceDayTND: 6,
    esimTND: 45,
    image: "https://framerusercontent.com/images/snHq8305shuNdUjeU5oyWBUIZw.jpg",
    sortOrder: 0,
    translations: { fr: { name: "Thaïlande" }, ar: { name: "تايلاند" } },
  },
  {
    code: "bali",
    name: "Bali, Indonesia",
    airport: "DPS",
    flightTND: 2900,
    flightHours: 19,
    visaTND: 140,
    internalMoveTND: 120,
    insuranceDayTND: 6,
    esimTND: 50,
    image: "",
    sortOrder: 1,
    translations: { fr: { name: "Bali, Indonésie" }, ar: { name: "بالي، إندونيسيا" } },
  },
  {
    code: "malaysia",
    name: "Malaysia",
    airport: "KUL",
    flightTND: 2300,
    flightHours: 14,
    visaTND: 0,
    internalMoveTND: 200,
    insuranceDayTND: 6,
    esimTND: 40,
    image: "",
    sortOrder: 2,
    translations: { fr: { name: "Malaisie" }, ar: { name: "ماليزيا" } },
  },
  {
    code: "vietnam",
    name: "Vietnam",
    airport: "HAN / SGN",
    flightTND: 2600,
    flightHours: 17,
    visaTND: 90,
    internalMoveTND: 230,
    insuranceDayTND: 6,
    esimTND: 40,
    image: "",
    sortOrder: 3,
    translations: { fr: { name: "Viêt Nam" }, ar: { name: "فيتنام" } },
  },
  {
    code: "philippines",
    name: "Philippines",
    airport: "MNL",
    flightTND: 2800,
    flightHours: 18,
    visaTND: 0,
    internalMoveTND: 300,
    insuranceDayTND: 6,
    esimTND: 50,
    image: "",
    sortOrder: 4,
    translations: { fr: { name: "Philippines" }, ar: { name: "الفلبين" } },
  },
];

export const localBrainBases: BrainBase[] = [
  // Thailand
  {
    slug: "bangkok", countryCode: "thailand", place: "Bangkok", sortOrder: 0,
    strengths: ["City", "Food", "Nightlife", "Culture"],
    bestMonths: months(11, 12, 1, 2), okMonths: months(3, 4, 5, 6, 7, 8, 9, 10),
    stayAreas: ["Sukhumvit (Asok–Phrom Phong)", "Silom", "Riverside"], minNights: 2, familyOk: true,
    groupFit: fit(0.9, 0.8, 0.6, 0.9, 0.7), stayTND: stay(110, 230, 190), foodTND: { budget: 35, mid: 65 }, transportDayTND: 20, transferTND: 90,
    activities: [
      act("Grand Palace & Wat Pho", 70, ["Culture"], false, true),
      act("Chao Phraya dinner cruise", 130, ["Food", "Luxury"], true, true),
      act("Street-food night tour", 110, ["Food", "Nightlife"], true, true),
      act("Muay Thai night", 160, ["Nightlife", "Adventure"], true, false),
    ],
    translations: tr("Bangkok", "بانكوك"),
  },
  {
    slug: "phuket", countryCode: "thailand", place: "Phuket", sortOrder: 1,
    strengths: ["Beach", "Nightlife", "Luxury"],
    bestMonths: months(11, 12, 1, 2, 3, 4), okMonths: months(5, 10),
    stayAreas: ["Kata", "Karon", "Kamala"], minNights: 3, familyOk: true,
    groupFit: fit(0.6, 0.9, 0.9, 0.9, 0.8), stayTND: stay(120, 260, 220), foodTND: { budget: 40, mid: 70 }, transportDayTND: 30, transferTND: 110,
    activities: [
      act("Phi Phi & Maya Bay speedboat day", 230, ["Beach", "Nature", "Adventure"], true, true),
      act("Big Buddha & Old Phuket Town", 60, ["Culture"], false, true),
      act("Promthep Cape sunset & seafood dinner", 90, ["Food"], false, true),
      act("Bangla Road night out", 80, ["Nightlife"], false, false),
    ],
    translations: tr("Phuket", "بوكيت"),
  },
  {
    slug: "krabi", countryCode: "thailand", place: "Krabi (Ao Nang)", sortOrder: 2,
    strengths: ["Beach", "Nature", "Adventure"],
    bestMonths: months(11, 12, 1, 2, 3, 4), okMonths: months(5, 10),
    stayAreas: ["Ao Nang", "Railay", "Klong Muang"], minNights: 3, familyOk: true,
    groupFit: fit(0.8, 0.9, 0.8, 0.9, 0.8), stayTND: stay(100, 220, 180), foodTND: { budget: 35, mid: 65 }, transportDayTND: 25, transferTND: 80,
    activities: [
      act("Four Islands longtail tour", 120, ["Beach", "Nature"], true, true),
      act("Railay rock climbing half-day", 190, ["Adventure"], true, false),
      act("Mangrove kayaking", 110, ["Nature", "Adventure"], true, true),
    ],
    translations: tr("Krabi (Ao Nang)", "كرابي (آو نانغ)"),
  },
  {
    slug: "chiang-mai", countryCode: "thailand", place: "Chiang Mai", sortOrder: 3,
    strengths: ["Culture", "Nature", "Food", "Adventure"],
    bestMonths: months(11, 12, 1, 2), okMonths: months(5, 6, 7, 8, 9, 10),
    stayAreas: ["Old City", "Nimmanhaemin"], minNights: 3, familyOk: true,
    groupFit: fit(0.9, 0.8, 0.6, 0.8, 0.8), stayTND: stay(80, 180, 150), foodTND: { budget: 30, mid: 50 }, transportDayTND: 15, transferTND: 50,
    activities: [
      act("Ethical elephant sanctuary day", 260, ["Nature"], true, true),
      act("Doi Suthep temple & viewpoint", 50, ["Culture"], false, true),
      act("Thai cooking class", 120, ["Food"], true, true),
    ],
    translations: tr("Chiang Mai", "شيانغ ماي"),
  },
  {
    slug: "koh-samui", countryCode: "thailand", place: "Koh Samui", sortOrder: 4,
    strengths: ["Beach", "Luxury", "Nature"],
    bestMonths: months(1, 2, 3, 4, 5, 6, 7, 8), okMonths: months(9),
    stayAreas: ["Chaweng Noi", "Lamai", "Bophut"], minNights: 3, familyOk: true,
    groupFit: fit(0.5, 0.9, 1, 0.7, 0.8), stayTND: stay(130, 280, 230), foodTND: { budget: 45, mid: 75 }, transportDayTND: 30, transferTND: 90,
    activities: [
      act("Ang Thong Marine Park day", 220, ["Nature", "Beach"], true, true),
      act("Fisherman's Village evening market", 40, ["Food", "Culture"], false, true),
      act("Thai spa afternoon", 150, ["Luxury"], true, false),
    ],
    translations: tr("Koh Samui", "كوه ساموي"),
  },
  // Bali
  {
    slug: "ubud", countryCode: "bali", place: "Ubud", sortOrder: 0,
    strengths: ["Culture", "Nature", "Food"],
    bestMonths: months(4, 5, 6, 7, 8, 9, 10), okMonths: months(3, 11),
    stayAreas: ["Central Ubud", "Penestanan", "Sayan"], minNights: 2, familyOk: true,
    groupFit: fit(0.9, 0.9, 0.9, 0.7, 0.7), stayTND: stay(90, 200, 170), foodTND: { budget: 30, mid: 60 }, transportDayTND: 25, transferTND: 70,
    activities: [
      act("Tegallalang rice terraces", 90, ["Nature"], false, true),
      act("Mount Batur sunrise trek", 170, ["Adventure", "Nature"], true, false),
      act("Balinese cooking class", 110, ["Food", "Culture"], true, true),
    ],
    translations: tr("Ubud", "أوبود"),
  },
  {
    slug: "seminyak", countryCode: "bali", place: "Seminyak & Canggu", sortOrder: 1,
    strengths: ["Beach", "Nightlife", "Food", "Luxury"],
    bestMonths: months(4, 5, 6, 7, 8, 9, 10), okMonths: months(3, 11),
    stayAreas: ["Seminyak", "Berawa (Canggu)"], minNights: 3, familyOk: true,
    groupFit: fit(0.8, 0.9, 0.8, 1, 0.6), stayTND: stay(110, 240, 200), foodTND: { budget: 40, mid: 70 }, transportDayTND: 25, transferTND: 50,
    activities: [
      act("Surf lesson", 110, ["Adventure", "Beach"], true, true),
      act("Beach club afternoon", 120, ["Nightlife", "Luxury"], false, false),
      act("Tanah Lot sunset temple", 50, ["Culture"], false, true),
    ],
    translations: tr("Seminyak et Canggu", "سيمينياك وتشانغو"),
  },
  {
    slug: "uluwatu", countryCode: "bali", place: "Uluwatu", sortOrder: 2,
    strengths: ["Beach", "Luxury", "Adventure"],
    bestMonths: months(4, 5, 6, 7, 8, 9, 10), okMonths: months(3, 11),
    stayAreas: ["Uluwatu", "Bingin", "Jimbaran"], minNights: 2, familyOk: true,
    groupFit: fit(0.6, 0.9, 1, 0.8, 0.6), stayTND: stay(120, 280, 230), foodTND: { budget: 40, mid: 75 }, transportDayTND: 30, transferTND: 60,
    activities: [
      act("Uluwatu temple & Kecak fire dance", 60, ["Culture"], true, true),
      act("Jimbaran seafood dinner on the beach", 100, ["Food"], false, true),
      act("Nusa Penida day trip", 230, ["Nature", "Beach", "Adventure"], true, false),
    ],
    translations: tr("Uluwatu", "أولواتو"),
  },
  // Malaysia
  {
    slug: "kuala-lumpur", countryCode: "malaysia", place: "Kuala Lumpur", sortOrder: 0,
    strengths: ["City", "Food", "Culture", "Nightlife"],
    bestMonths: months(1, 2, 6, 7, 8), okMonths: months(3, 4, 5, 9, 10, 11, 12),
    stayAreas: ["Bukit Bintang", "KLCC"], minNights: 2, familyOk: true,
    groupFit: fit(0.9, 0.8, 0.6, 0.9, 0.8), stayTND: stay(90, 190, 150), foodTND: { budget: 30, mid: 50 }, transportDayTND: 15, transferTND: 60,
    activities: [
      act("Petronas Towers skybridge", 110, ["City"], true, true),
      act("Batu Caves", 20, ["Culture"], false, true),
      act("Jalan Alor food night", 60, ["Food", "Nightlife"], false, true),
    ],
    translations: tr("Kuala Lumpur", "كوالالمبور"),
  },
  {
    slug: "langkawi", countryCode: "malaysia", place: "Langkawi", sortOrder: 1,
    strengths: ["Beach", "Nature", "Luxury"],
    bestMonths: months(12, 1, 2, 3), okMonths: months(4, 5, 6, 7, 8, 11),
    stayAreas: ["Pantai Cenang", "Pantai Tengah"], minNights: 3, familyOk: true,
    groupFit: fit(0.6, 0.9, 0.9, 0.7, 0.9), stayTND: stay(100, 230, 190), foodTND: { budget: 30, mid: 60 }, transportDayTND: 30, transferTND: 40,
    activities: [
      act("SkyCab & Sky Bridge", 90, ["Nature"], true, true),
      act("Mangrove kayak & eagle watching", 140, ["Nature", "Adventure"], true, true),
      act("Island hopping", 90, ["Beach"], true, true),
    ],
    translations: tr("Langkawi", "لنكاوي"),
  },
  {
    slug: "penang", countryCode: "malaysia", place: "Penang (George Town)", sortOrder: 2,
    strengths: ["Food", "Culture", "City"],
    bestMonths: months(12, 1, 2, 3, 4), okMonths: months(5, 6, 7, 8, 9, 10, 11),
    stayAreas: ["George Town heritage zone", "Gurney"], minNights: 2, familyOk: true,
    groupFit: fit(0.9, 0.8, 0.6, 0.8, 0.8), stayTND: stay(80, 170, 140), foodTND: { budget: 25, mid: 45 }, transportDayTND: 15, transferTND: 50,
    activities: [
      act("Street art & clan houses walk", 40, ["Culture"], false, true),
      act("Penang Hill & Kek Lok Si", 70, ["Culture", "Nature"], false, true),
      act("Hawker food tour", 90, ["Food"], true, true),
    ],
    translations: tr("Penang (George Town)", "بينانغ (جورج تاون)"),
  },
  // Vietnam
  {
    slug: "hanoi", countryCode: "vietnam", place: "Hanoi", sortOrder: 0,
    strengths: ["City", "Culture", "Food"],
    bestMonths: months(10, 11, 3, 4), okMonths: months(12, 1, 2, 5, 6, 7, 8, 9),
    stayAreas: ["Old Quarter", "Hoan Kiem"], minNights: 2, familyOk: true,
    groupFit: fit(0.9, 0.8, 0.6, 0.8, 0.7), stayTND: stay(70, 160, 130), foodTND: { budget: 25, mid: 45 }, transportDayTND: 15, transferTND: 60,
    activities: [
      act("Old Quarter street-food walk", 80, ["Food"], true, true),
      act("Temple of Literature & Hoan Kiem Lake", 30, ["Culture"], false, true),
      act("Water puppet show", 30, ["Culture"], true, true),
    ],
    translations: tr("Hanoï", "هانوي"),
  },
  {
    slug: "ha-long", countryCode: "vietnam", place: "Ha Long Bay", sortOrder: 1,
    strengths: ["Nature", "Luxury", "Adventure"],
    bestMonths: months(3, 4, 5, 10, 11), okMonths: months(9, 12, 1, 2),
    stayAreas: ["Overnight cruise (Lan Ha side)"], minNights: 1, familyOk: true,
    groupFit: fit(0.7, 0.9, 1, 0.8, 0.8), stayTND: stay(200, 380, 380), foodTND: { budget: 30, mid: 50 }, transportDayTND: 10, transferTND: 120,
    activities: [
      act("Kayaking among the karsts", 60, ["Nature", "Adventure"], true, true),
      act("Cave & floating village visit", 50, ["Nature", "Culture"], true, true),
    ],
    translations: tr("Baie d’Along", "خليج ها لونغ"),
  },
  {
    slug: "hoi-an", countryCode: "vietnam", place: "Hoi An", sortOrder: 2,
    strengths: ["Culture", "Food", "Beach"],
    bestMonths: months(2, 3, 4, 5, 6, 7), okMonths: months(1, 8),
    stayAreas: ["Old Town", "An Bang beach"], minNights: 3, familyOk: true,
    groupFit: fit(0.8, 0.9, 0.9, 0.7, 0.9), stayTND: stay(70, 160, 130), foodTND: { budget: 25, mid: 45 }, transportDayTND: 15, transferTND: 70,
    activities: [
      act("Lantern-making & Old Town by night", 40, ["Culture"], false, true),
      act("Basket boat & cooking class", 120, ["Food"], true, true),
      act("My Son sanctuary at sunrise", 90, ["Culture", "Adventure"], true, true),
    ],
    translations: tr("Hội An", "هوي آن"),
  },
  {
    slug: "ho-chi-minh", countryCode: "vietnam", place: "Ho Chi Minh City", sortOrder: 3,
    strengths: ["City", "Nightlife", "Food"],
    bestMonths: months(12, 1, 2, 3, 4), okMonths: months(5, 6, 7, 8, 9, 10, 11),
    stayAreas: ["District 1", "District 3"], minNights: 2, familyOk: true,
    groupFit: fit(0.9, 0.7, 0.5, 0.9, 0.6), stayTND: stay(75, 170, 140), foodTND: { budget: 25, mid: 45 }, transportDayTND: 15, transferTND: 50,
    activities: [
      act("Cu Chi tunnels half-day", 90, ["Culture", "Adventure"], true, true),
      act("Mekong Delta day", 130, ["Nature", "Food"], true, true),
      act("Rooftop bars night", 80, ["Nightlife"], false, false),
    ],
    translations: tr("Hô Chi Minh-Ville", "مدينة هو تشي منه"),
  },
  {
    slug: "phu-quoc", countryCode: "vietnam", place: "Phu Quoc", sortOrder: 4,
    strengths: ["Beach", "Luxury", "Nature"],
    bestMonths: months(11, 12, 1, 2, 3, 4), okMonths: months(5, 10),
    stayAreas: ["Long Beach", "Ong Lang"], minNights: 3, familyOk: true,
    groupFit: fit(0.5, 0.9, 1, 0.7, 0.9), stayTND: stay(100, 230, 190), foodTND: { budget: 30, mid: 60 }, transportDayTND: 25, transferTND: 50,
    activities: [
      act("Southern islands snorkelling", 150, ["Beach", "Nature"], true, true),
      act("Hon Thom cable car", 110, ["Adventure"], true, true),
      act("Night market seafood", 60, ["Food"], false, true),
    ],
    translations: tr("Phú Quốc", "فو كوك"),
  },
  // Philippines
  {
    slug: "el-nido", countryCode: "philippines", place: "El Nido", sortOrder: 0,
    strengths: ["Beach", "Nature", "Adventure"],
    bestMonths: months(12, 1, 2, 3, 4, 5), okMonths: months(6, 11),
    stayAreas: ["El Nido town", "Corong-Corong", "Las Cabanas"], minNights: 3, familyOk: true,
    groupFit: fit(0.8, 0.9, 0.9, 1, 0.7), stayTND: stay(110, 250, 200), foodTND: { budget: 35, mid: 65 }, transportDayTND: 25, transferTND: 120,
    activities: [
      act("Island hopping: lagoons tour", 120, ["Beach", "Nature"], true, true),
      act("Kayaking the Big Lagoon", 60, ["Adventure", "Nature"], true, true),
      act("Sunset at Las Cabanas", 20, ["Beach"], false, true),
    ],
    translations: tr("El Nido", "إل نيدو"),
  },
  {
    slug: "coron", countryCode: "philippines", place: "Coron", sortOrder: 1,
    strengths: ["Adventure", "Nature", "Beach"],
    bestMonths: months(12, 1, 2, 3, 4, 5), okMonths: months(6, 11),
    stayAreas: ["Coron town", "Busuanga"], minNights: 2, familyOk: true,
    groupFit: fit(0.8, 0.8, 0.7, 0.9, 0.6), stayTND: stay(90, 200, 170), foodTND: { budget: 30, mid: 60 }, transportDayTND: 25, transferTND: 80,
    activities: [
      act("Kayangan Lake & Twin Lagoon tour", 120, ["Nature", "Beach"], true, true),
      act("Wreck diving (2 dives)", 330, ["Adventure"], true, false),
      act("Maquinit hot springs", 30, ["Nature"], false, true),
    ],
    translations: tr("Coron", "كورون"),
  },
  {
    slug: "bohol", countryCode: "philippines", place: "Bohol (Panglao)", sortOrder: 2,
    strengths: ["Beach", "Nature", "Adventure"],
    bestMonths: months(1, 2, 3, 4, 5), okMonths: months(6, 12),
    stayAreas: ["Alona Beach", "Dumaluan"], minNights: 3, familyOk: true,
    groupFit: fit(0.6, 0.8, 0.8, 0.8, 0.9), stayTND: stay(90, 200, 170), foodTND: { budget: 30, mid: 55 }, transportDayTND: 25, transferTND: 60,
    activities: [
      act("Chocolate Hills & tarsiers day", 150, ["Nature"], true, true),
      act("Balicasag island snorkelling", 130, ["Beach", "Nature"], true, true),
      act("Loboc river lunch cruise", 80, ["Food"], true, true),
    ],
    translations: tr("Bohol (Panglao)", "بوهول (بانغلاو)"),
  },
  {
    slug: "siargao", countryCode: "philippines", place: "Siargao", sortOrder: 3,
    strengths: ["Beach", "Adventure", "Nightlife"],
    bestMonths: months(3, 4, 5, 6, 7, 8, 9), okMonths: months(2, 10),
    stayAreas: ["General Luna", "Cloud 9 area"], minNights: 3, familyOk: true,
    groupFit: fit(0.9, 0.8, 0.8, 1, 0.5), stayTND: stay(90, 210, 170), foodTND: { budget: 30, mid: 60 }, transportDayTND: 30, transferTND: 90,
    activities: [
      act("Surf lesson at Cloud 9", 100, ["Adventure", "Beach"], true, true),
      act("Three-islands hopping", 110, ["Beach", "Nature"], true, true),
      act("Sugba Lagoon trip", 120, ["Nature"], true, true),
    ],
    translations: tr("Siargao", "سيارغاو"),
  },
];

/** Thresholds from section 10 of the brain (site_settings, editable in /admin/settings). */
export interface BrainSettings {
  minPocketTND: number;
  cardFeePct: number;
  /** A country is dropped when its flights are over this share of the budget (%). */
  maxFlightSharePct: number;
  /** One paid activity every N days per base. */
  activityEveryDays: number;
}

export const DEFAULT_BRAIN_SETTINGS: BrainSettings = { minPocketTND: 25, cardFeePct: 3, maxFlightSharePct: 45, activityEveryDays: 2 };
