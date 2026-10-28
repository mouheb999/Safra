// The trip brain's cost formulas (section 4–6 of the brain): one place, used by the engine's suggestions,
// the visitor's own trip in the builder, and the server when an order is stored. Pure; client-safe.

import type { BrainBase, BrainCountry, BrainSettings, StayType } from "../../data/brain";

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

export interface Party {
  adults: number;
  children: number;
}

export interface CostedStop {
  base: BrainBase;
  nights: number;
  stay: StayType;
  /** Per person, TND. */
  activityPrices: number[];
}

export interface Costing {
  /** pocket_money is what's left of the budget (negative when the trip costs more). */
  budget: Budget;
  tripCostTND: number;
  nights: number;
  days: number;
  travelers: number;
  pocketPerPersonPerDay: number;
  /** What each stop costs on the ground (stay, food, transport, activities), card fee included. */
  stopCostsTND: number[];
}

/** Hotels: 2 per room, a child counts half. Apartments: up to 4. */
export const roomsFor = (stay: StayType, p: Party) =>
  stay === "apartment" ? Math.ceil((p.adults + p.children) / 4) : Math.ceil((p.adults + p.children * 0.5) / 2);

export function priceStops(country: BrainCountry, stops: CostedStop[], party: Party, settings: BrainSettings, totalBudgetTND: number): Costing {
  const fee = 1 + settings.cardFeePct / 100;
  const travelers = party.adults + party.children;
  const eaters = party.adults + party.children * 0.6;
  const nights = stops.reduce((n, s) => n + s.nights, 0);
  const days = nights + 1;

  const parts = stops.map((s) => {
    const tier = s.stay === "budget_hotel" ? "budget" : "mid";
    return {
      stays: s.nights * s.base.stayTND[s.stay] * roomsFor(s.stay, party),
      transport: s.nights * s.base.transportDayTND * travelers + s.base.transferTND * 2,
      food: s.nights * s.base.foodTND[tier] * eaters,
      activities: s.activityPrices.reduce((n, p) => n + p, 0) * travelers,
    };
  });
  const sum = (k: keyof (typeof parts)[number]) => parts.reduce((n, p) => n + p[k], 0);

  const budget: Budget = {
    flights: Math.round(country.flightTND * travelers * fee),
    stays: Math.round(sum("stays") * fee),
    visa: country.visaTND * travelers,
    local_transport: Math.round((sum("transport") + country.internalMoveTND * travelers * Math.max(0, stops.length - 1)) * fee),
    food: Math.round(sum("food") * fee),
    activities: Math.round(sum("activities") * fee),
    insurance: country.insuranceDayTND * travelers * days,
    sim_esim: Math.round(country.esimTND * party.adults * fee),
    pocket_money: 0,
  };
  const tripCostTND = CATEGORIES.slice(0, 8).reduce((n, c) => n + budget[c], 0);
  budget.pocket_money = totalBudgetTND - tripCostTND;
  return {
    budget,
    tripCostTND,
    nights,
    days,
    travelers,
    pocketPerPersonPerDay: Math.floor(budget.pocket_money / travelers / days),
    stopCostsTND: parts.map((p) => Math.round((p.stays + p.transport + p.food + p.activities) * fee)),
  };
}
