// Catalog reads for server components. Uses Supabase when configured, otherwise the local
// data in src/data (same content as supabase/seed.sql), so the site works without a backend.

import "server-only";
import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import { localDestinations, type Destination } from "@/data/destinations";
import { localSafaris, type Safari } from "@/data/safaris";
import { localVisaServices, type VisaService } from "@/data/visas";
import { DEFAULT_WHATSAPP_NUMBER, type BookingConfig, type BookingMode } from "./requests";
import type { Database } from "./supabase/database.types";
import { toDestination, toSafari, toVisaService } from "./supabase/mappers";
import { localizeDestination, localizeSafari, localizeVisaService } from "./localize";
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

const getRawSafaris = cache(
  (): Promise<Safari[]> =>
    readOr("safaris", localSafaris, async () => {
      const { data, error } = await publicClient().from("safaris").select("*").order("sort_order");
      if (error) throw error;
      return data.map(toSafari);
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

/** Catalog in the visitor's language (English when no locale is given). */
export async function getDestinations(locale: Locale = "en"): Promise<Destination[]> {
  return (await getRawDestinations()).map((d) => localizeDestination(d, locale));
}

export async function getSafaris(locale: Locale = "en"): Promise<Safari[]> {
  return (await getRawSafaris()).map((x) => localizeSafari(x, locale));
}

export async function getVisaServices(locale: Locale = "en"): Promise<VisaService[]> {
  return (await getRawVisaServices()).map((v) => localizeVisaService(v, locale));
}

export interface SiteSettings {
  bookingMode: BookingMode;
  whatsappNumber: string;
}

/** What the public forms need: how to hand off a request, and to which WhatsApp number. */
export async function getBookingConfig(): Promise<BookingConfig> {
  const s = await getSiteSettings();
  return { mode: s.bookingMode, whatsappNumber: s.whatsappNumber };
}

const DEFAULT_SETTINGS: SiteSettings = { bookingMode: "whatsapp", whatsappNumber: DEFAULT_WHATSAPP_NUMBER };

export const getSiteSettings = cache(
  (): Promise<SiteSettings> =>
    readOr("site_settings", DEFAULT_SETTINGS, async () => {
      const { data, error } = await publicClient().from("site_settings").select("booking_mode, whatsapp_number").eq("id", 1).single();
      if (error) throw error;
      return { bookingMode: data.booking_mode === "onsite" ? "onsite" : "whatsapp", whatsappNumber: data.whatsapp_number };
    }),
);
