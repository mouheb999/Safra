// Catalog reads for server components. Uses Supabase when configured, otherwise the local
// data in src/data (same content as supabase/seed.sql), so the site works without a backend.

import "server-only";
import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  DEFAULT_BRAIN_SETTINGS,
  localBrainBases,
  localBrainCountries,
  type BrainBase,
  type BrainCountry,
  type BrainSettings,
} from "@/data/brain";
import { localDestinations, type Destination } from "@/data/destinations";
import { localPacks, type Pack } from "@/data/packs";
import { localVisaServices, type VisaService } from "@/data/visas";
import {
  DEFAULT_DELIVERY_FEE_DT,
  DEFAULT_PLAN_PRICE_DT,
  EMPTY_ACCOUNTS,
  type CheckoutConfig,
  type PaymentAccounts,
} from "./payments";
import { DEFAULT_WHATSAPP_NUMBER, type BookingConfig, type BookingMode } from "./requests";
import type { Database } from "./supabase/database.types";
import { toBrainBase, toBrainCountry, toDestination, toPack, toVisaService } from "./supabase/mappers";
import { localizeDestination, localizePack, localizeVisaService } from "./localize";
import type { Locale } from "@/i18n/config";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(url && publishableKey);

/** Cookie-less client with the publishable key: catalog reads only, so pages can stay static. */
const publicClient = cache(() =>
  createClient<Database>(url!, publishableKey!, { auth: { persistSession: false, autoRefreshToken: false } }),
);

/** On a Supabase error, log and serve the local copy rather than taking the page down. */
async function readOr<T>(label: string, fallback: T, read: () => Promise<T>): Promise<T> {
  if (!isSupabaseConfigured) return fallback;
  try {
    return await read();
  } catch (error) {
    console.error(`[catalog] ${label}: falling back to local data`, error);
    return fallback;
  }
}

const getRawDestinations = cache(
  (): Promise<Destination[]> =>
    readOr("destinations", localDestinations, async () => {
      const { data, error } = await publicClient().from("destinations").select("*").order("sort_order");
      if (error) throw error;
      return data.map(toDestination);
    }),
);


const getRawVisaServices = cache(
  (): Promise<VisaService[]> =>
    readOr("services", localVisaServices, async () => {
      const { data, error } = await publicClient().from("services").select("*").order("sort_order").order("name");
      if (error) throw error;
      return data.map(toVisaService);
    }),
);

const getRawPacks = cache(
  (): Promise<Pack[]> =>
    readOr("packs", localPacks, async () => {
      const { data, error } = await publicClient().from("packs").select("*").order("price_dt").order("sort_order");
      if (error) throw error;
      return data.map(toPack);
    }),
);

/** Catalog in the visitor's language (English when no locale is given). */
export async function getDestinations(locale: Locale = "en"): Promise<Destination[]> {
  return (await getRawDestinations()).map((d) => localizeDestination(d, locale));
}


/** What the trip brain works from: active countries and bases (English; pages translate names) and its thresholds. */
export interface BrainData {
  countries: BrainCountry[];
  bases: BrainBase[];
  settings: BrainSettings;
}

const getRawBrain = cache(
  (): Promise<{ countries: BrainCountry[]; bases: BrainBase[] }> =>
    readOr("brain", { countries: localBrainCountries, bases: localBrainBases }, async () => {
      const [countries, bases] = await Promise.all([
        publicClient().from("brain_countries").select("*").order("sort_order"),
        publicClient().from("brain_bases").select("*").order("sort_order"),
      ]);
      if (countries.error) throw countries.error;
      if (bases.error) throw bases.error;
      return { countries: countries.data.map(toBrainCountry), bases: bases.data.map(toBrainBase) };
    }),
);

export async function getBrainData(): Promise<BrainData> {
  const [raw, settings] = await Promise.all([getRawBrain(), getSiteSettings()]);
  return { ...raw, settings: settings.brain };
}

/** Active packs, cheapest first, in the visitor's language. */
export async function getPacks(locale: Locale = "en"): Promise<Pack[]> {
  return [...(await getRawPacks())].sort((a, b) => a.priceDT - b.priceDT).map((p) => localizePack(p, locale));
}

export async function getVisaServices(locale: Locale = "en"): Promise<VisaService[]> {
  return (await getRawVisaServices()).map((v) => localizeVisaService(v, locale));
}

export interface SiteSettings {
  bookingMode: BookingMode;
  brain: BrainSettings;
  whatsappNumber: string;
  planPriceDT: number;
  deliveryFeeDT: number;
  accounts: PaymentAccounts;
}

/** What the public forms need: how to hand off a request, and to which WhatsApp number. */
export async function getBookingConfig(): Promise<BookingConfig> {
  const s = await getSiteSettings();
  return { mode: s.bookingMode, whatsappNumber: s.whatsappNumber };
}

/** What the trip plan checkout needs: price, delivery fee and the accounts customers pay into. */
export async function getCheckoutConfig(): Promise<CheckoutConfig> {
  const s = await getSiteSettings();
  return { planPriceDT: s.planPriceDT, deliveryFeeDT: s.deliveryFeeDT, accounts: s.accounts };
}

// Without settings, only cash on delivery is offered: no account numbers are ever made up.
const DEFAULT_SETTINGS: SiteSettings = {
  bookingMode: "whatsapp",
  brain: DEFAULT_BRAIN_SETTINGS,
  whatsappNumber: DEFAULT_WHATSAPP_NUMBER,
  planPriceDT: DEFAULT_PLAN_PRICE_DT,
  deliveryFeeDT: DEFAULT_DELIVERY_FEE_DT,
  accounts: EMPTY_ACCOUNTS,
};

export const getSiteSettings = cache(
  (): Promise<SiteSettings> =>
    readOr("site_settings", DEFAULT_SETTINGS, async () => {
      const { data, error } = await publicClient().from("site_settings").select("*").eq("id", 1).single();
      if (error) throw error;
      // `?? defaults`: the columns arrive with migration 20261026120000_plan_checkout; until then, keep working.
      return {
        bookingMode: data.booking_mode === "onsite" ? "onsite" : "whatsapp",
        brain: {
          minPocketTND: data.brain_min_pocket_tnd ?? DEFAULT_BRAIN_SETTINGS.minPocketTND,
          cardFeePct: data.brain_card_fee_pct == null ? DEFAULT_BRAIN_SETTINGS.cardFeePct : Number(data.brain_card_fee_pct),
          maxFlightSharePct: data.brain_max_flight_share ?? DEFAULT_BRAIN_SETTINGS.maxFlightSharePct,
          activityEveryDays: data.brain_activity_every ?? DEFAULT_BRAIN_SETTINGS.activityEveryDays,
        },
        whatsappNumber: data.whatsapp_number,
        planPriceDT: data.plan_price_dt ?? DEFAULT_PLAN_PRICE_DT,
        deliveryFeeDT: data.delivery_fee_dt ?? DEFAULT_DELIVERY_FEE_DT,
        accounts: {
          d17Number: data.d17_number ?? "",
          flouciNumber: data.flouci_number ?? "",
          wafacashName: data.wafacash_name ?? "",
          wafacashPhone: data.wafacash_phone ?? "",
          bankName: data.bank_name ?? "",
          bankHolder: data.bank_holder ?? "",
          bankRib: data.bank_rib ?? "",
        },
      };
    }),
);
