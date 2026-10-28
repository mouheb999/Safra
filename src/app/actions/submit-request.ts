"use server";

// Stores a concierge request through public.submit_request() and returns its SAFRA reference.
// The database re-checks everything (constraints + business rules); this layer rejects malformed
// payloads early and turns database errors into messages the visitor can act on.

import { z } from "zod";
import { getMessages, type Messages } from "@/i18n";
import { isLocale, type Locale } from "@/i18n/config";
import { getSiteSettings } from "@/lib/catalog";
import { GOVERNORATES, PAYMENT_METHODS } from "@/lib/payments";
import type { BookingConfig, ConciergeRequest } from "@/lib/requests";
import { getAdminClient } from "@/lib/supabase/admin";

/** What a trip plan order was charged (by submit_request, from /admin/settings). */
export interface OrderAmounts {
  planPriceDT: number;
  deliveryFeeDT: number;
  totalDT: number;
}

export type SubmitResult =
  /** Stored: confirm on the site (booking.mode 'onsite') or put the reference in the WhatsApp message. */
  | { status: "saved"; reference: string; booking: BookingConfig; order?: OrderAmounts }
  /** The visitor needs to fix something; don't hand off yet. */
  | { status: "invalid"; message: string }
  /** Storage is down or not configured: open WhatsApp anyway so the lead isn't lost. */
  | { status: "unavailable"; booking: BookingConfig };

/** The request schema with its error messages in the visitor's language. */
function requestSchema(e: Messages["errors"]) {
  const text = (max: number) => z.string().trim().max(max);
  const required = (max: number) => text(max).min(1, e.required);
  const whatsapp = text(40).refine((v) => {
    const digits = v.replace(/\D/g, "").length;
    return digits >= 6 && digits <= 15;
  }, e.phone);
  const travelers = z.string().regex(/^[1-9]\d?$/, e.travelers);
  const amount = z.string().regex(/^[1-9]\d{0,7}$/, e.budget);
  const optionalDate = z.union([z.literal(""), z.iso.date(e.date)]);
  const date = z.iso.date(e.date);
  const yesNo = z.enum(["Yes", "No"], e.yesNo);
  const locale = z.enum(["en", "fr", "ar"]);

  const governorate = z.union([z.literal(""), z.enum(GOVERNORATES.map((g) => g.value) as [string, ...string[]])], e.address);

  return z.discriminatedUnion("kind", [
    z
      .object({
      kind: z.literal("trip"),
      locale,
      source: z.enum(["trip", "direct"]),
      destinationSlug: text(40),
      fullName: required(120),
      whatsapp,
      travelers,
      destination: text(120),
      category: text(50),
      preferredDate: optionalDate,
      durationDays: z.union([z.literal(""), z.string().regex(/^[1-9]\d{0,2}$/)]),
      budgetDT: amount,
      notes: text(1500),
      paymentMethod: z.enum(PAYMENT_METHODS, e.payment),
      governorate,
      address: text(300),
    })
      // Cash on delivery needs somewhere to deliver; online payments keep no address.
      .refine((r) => r.paymentMethod !== "cod" || (r.governorate && r.address), { message: e.address, path: ["address"] })
      .transform((r) => (r.paymentMethod === "cod" ? r : { ...r, governorate: "", address: "" })),
    z.object({
      kind: z.literal("visa"),
      locale,
      service: z.object({ slug: text(40) }),
      fullName: required(120),
      whatsapp,
      travelers,
      category: text(50),
      dateOfBirth: date,
      nationality: required(120),
      passportNumber: required(40),
      passportExpiry: date,
      arrivalDate: date,
      departureDate: date,
      purposeOfTravel: required(120),
      occupationStatus: required(120),
      flightBooked: yesNo,
      accommodationBooked: yesNo,
      previousVisit: yesNo,
      previousVisaRefusal: yesNo,
      notes: text(1500),
    }),
  ]);
}

/** submit_request() raises these (22023) in English; the visitor sees them in their language. */
const DATABASE_MESSAGES: Record<string, keyof Messages["errors"]> = {
  "This visa service is not available.": "serviceUnavailable",
  "Arrival date must be today or later.": "arrivalPast",
  "Passport expiry must be in the future.": "passportExpired",
  "Date of birth must be in the past.": "dobFuture",
  "This payment method is not available.": "paymentUnavailable",
  "Delivery address is required.": "address",
  "Only trip plans can be ordered.": "invalid",
};

/** Postgres codes raised by submit_request / table constraints for bad input. */
const INPUT_ERRORS = new Set(["22023", "23514", "22007", "22008", "22P02"]);

export async function submitRequest(request: ConciergeRequest, honeypot = ""): Promise<SubmitResult> {
  const settings = await getSiteSettings();
  const booking: BookingConfig = { mode: settings.bookingMode, whatsappNumber: settings.whatsappNumber };
  // Nothing stored → there is nothing to confirm on the site, so the fallback is always WhatsApp.
  const unavailable: SubmitResult = { status: "unavailable", booking: { ...booking, mode: "whatsapp" } };

  // Bots fill the hidden field; humans never see it. Don't store, don't tell.
  if (honeypot) return unavailable;

  const locale: Locale = isLocale(request?.locale) ? request.locale : "en";
  const e = getMessages(locale).errors;
  const parsed = requestSchema(e).safeParse(request);
  if (!parsed.success) return { status: "invalid", message: parsed.error.issues[0]?.message ?? e.check };

  const admin = getAdminClient();
  if (!admin) return unavailable;

  const data = parsed.data;
  const payload =
    data.kind === "visa"
      ? { ...data, service: undefined, serviceSlug: data.service.slug, source: "visa" }
      : data;

  const { data: rows, error } = await admin.rpc("submit_request", { payload });
  if (error) {
    if (error.code && INPUT_ERRORS.has(error.code)) {
      // submit_request raises 22023 with a visitor-facing message; constraint errors don't have one.
      const known = error.code === "22023" ? DATABASE_MESSAGES[error.message] : undefined;
      return {
        status: "invalid",
        message: known ? e[known] : error.code === "22023" && locale === "en" ? error.message : e.invalid,
      };
    }
    console.error("[submit_request] storage failed, handing off to WhatsApp without a reference", error);
    return unavailable;
  }

  const row = rows?.[0];
  if (!row?.reference) return unavailable;
  const order =
    data.kind === "trip" && row.total_dt
      ? { planPriceDT: row.plan_price_dt, deliveryFeeDT: row.delivery_fee_dt, totalDT: row.total_dt }
      : undefined;
  return { status: "saved", reference: row.reference, booking, order };
}
