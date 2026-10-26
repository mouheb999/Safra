// Labels and formatting shared by the admin pages.

import { METHOD_NAME, isPaymentMethod } from "@/lib/payments";
import type { Enums } from "@/lib/supabase/database.types";

export type RequestStatus = Enums<"request_status">;
export type RequestKind = Enums<"request_kind">;

/** Pipeline order; "cancelled" sits outside the happy path. */
export const STATUSES: RequestStatus[] = ["new", "contacted", "quoted", "paid", "closed", "cancelled"];

export const STATUS_LABEL: Record<RequestStatus, string> = {
  new: "New",
  contacted: "Contacted",
  quoted: "Quoted",
  paid: "Paid",
  closed: "Closed",
  cancelled: "Cancelled",
};

export const STATUS_STYLE: Record<RequestStatus, string> = {
  new: "bg-orange text-ink",
  contacted: "bg-sky text-ink",
  quoted: "bg-[#FFF3C4] text-ink",
  paid: "bg-[#CDEBD3] text-ink",
  closed: "bg-ink/10 text-ink",
  cancelled: "bg-ink/5 text-ink/60 line-through",
};

/** The obvious next step for the primary button on the request page. */
export const NEXT_STATUS: Partial<Record<RequestStatus, RequestStatus>> = {
  new: "contacted",
  contacted: "quoted",
  quoted: "paid",
  paid: "closed",
};

export const KIND_LABEL: Record<RequestKind, string> = { trip: "Trip", visa: "Visa", safari: "Safari" };

/** requests.channel: how the request reached SAFRA. */
export const CHANNEL_LABEL: Record<string, string> = {
  whatsapp: "sent via WhatsApp",
  onsite: "reserved on the site — contact the customer",
};

/** requests.payment_method of a trip plan order. */
export const paymentLabel = (method: string) => (isPaymentMethod(method) ? METHOD_NAME[method] : method);

export const SOURCE_LABEL: Record<Enums<"request_source">, string> = {
  quiz: "Quiz",
  trip: "Destination page",
  direct: "Typed destination",
  visa: "Visa page",
  safari: "Safari page",
};

const dateTime = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Tunis" });
const dateOnly = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "UTC" });

export const formatDateTime = (iso: string) => dateTime.format(new Date(iso));
/** For Postgres `date` values (no time zone). */
export const formatDate = (isoDate: string | null) => (isoDate ? dateOnly.format(new Date(`${isoDate}T00:00:00Z`)) : "—");
export const formatDT = (value: number | null) => (value === null ? "—" : `${value.toLocaleString("en-US")} DT`);

/** WhatsApp link to reply to a customer, opening with their reference. */
/** Language the customer used on the site (requests.locale). */
export const LANGUAGE_LABEL: Record<string, string> = { en: "English", fr: "French", ar: "Arabic" };

/** Opening line for the admin's first WhatsApp message, in the customer's language. */
const GREETING: Record<string, (firstName: string, reference: string) => string> = {
  en: (n, ref) => `Hi ${n}, this is SAFRA about your request${ref ? ` ${ref}` : ""}.`,
  fr: (n, ref) => `Bonjour ${n}, ici SAFRA au sujet de votre demande${ref ? ` ${ref}` : ""}.`,
  ar: (n, ref) => `مرحبًا ${n}، معك سفرة بخصوص طلبك${ref ? ` ${ref}` : ""}.`,
};

export function customerWhatsappUrl(phone: string, name: string, reference: string | null, locale = "en"): string {
  const digits = phone.replace(/\D/g, "");
  const firstName = name.trim().split(/\s+/)[0] ?? "";
  const text = (GREETING[locale] ?? GREETING.en)(firstName, reference ?? "");
  return `https://api.whatsapp.com/send?phone=${digits}&text=${encodeURIComponent(text)}`;
}
