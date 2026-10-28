// Request payloads + the WhatsApp messages SAFRA receives. The English text matches the live site,
// plus a "Reference: SAFRA-1000" line once the request has been stored (src/app/actions/submit-request.ts).

import type { VisaService } from "@/data/visas";
import type { Locale } from "@/i18n/config";
import { fmt } from "@/i18n/fmt";
import en, { type Messages } from "@/i18n/messages/en";
import { METHOD_NAME, type PaymentMethod } from "./payments";

/** Used when site settings can't be read; the live number is set in /admin/settings. */
export const DEFAULT_WHATSAPP_NUMBER = "21697433003";

/** Set in /admin/settings. 'whatsapp': open a prefilled message. 'onsite': confirm on the site. */
export type BookingMode = "whatsapp" | "onsite";

/** What the forms need to know about how to hand a request over. */
export interface BookingConfig {
  mode: BookingMode;
  whatsappNumber: string;
}

export type YesNo = "" | "Yes" | "No";

export interface TripRequest {
  kind: "trip";
  /** Language the visitor used (stored with the request, and the WhatsApp message language). */
  locale: Locale;
  /** "trip" when the visitor came from a destination page, "direct" when they typed one in. */
  source: "trip" | "direct";
  /** Catalog slug of the selected destination, or "" for free text. */
  destinationSlug: string;
  fullName: string;
  whatsapp: string;
  travelers: string;
  /** Destination line shown to SAFRA (desired destination or the selected trip's country). */
  destination: string;
  category: string;
  preferredDate: string;
  durationDays: string;
  budgetDT: string;
  notes: string;
  /** How the trip plan is paid; the price comes from /admin/settings. */
  paymentMethod: PaymentMethod;
  /** Cash on delivery only. */
  governorate: string;
  address: string;
}

export interface VisaRequest {
  kind: "visa";
  /** Language the visitor used (stored with the request, and the WhatsApp message language). */
  locale: Locale;
  service: VisaService;
  fullName: string;
  whatsapp: string;
  travelers: string;
  category: string;
  dateOfBirth: string;
  nationality: string;
  passportNumber: string;
  passportExpiry: string;
  arrivalDate: string;
  departureDate: string;
  purposeOfTravel: string;
  occupationStatus: string;
  flightBooked: YesNo;
  accommodationBooked: YesNo;
  /** Visited the service's country before. */
  previousVisit: YesNo;
  previousVisaRefusal: YesNo;
  notes: string;
}


export type ConciergeRequest = TripRequest | VisaRequest;

/** A request as the forms build it; useConciergeSubmit adds the page's language. */
export type RequestDraft = DistributiveOmit<ConciergeRequest, "locale">;
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

const dash = (value: string) => value || "—";

/** WhatsApp wording in the visitor's language (defaults to the original English text). */
type Wording = Messages["whatsapp"];

const yesNo = (value: YesNo, w: Wording) => (value === "Yes" ? w.yes : value === "No" ? w.no : dash(value));

/** Second line of every message once the request is stored, so SAFRA can look it up. */
const referenceLine = (w: Wording, reference?: string) => (reference ? `${fmt(w.reference, { ref: reference })}\n` : "");

/** Trip plan orders: what is paid, how, and where to deliver. */
function orderLines(r: TripRequest, w: Wording, totalDT?: number): string[] {
  if (!r.paymentMethod) return [];
  const method = r.paymentMethod === "cod" ? w.cod : r.paymentMethod === "bank" ? w.bank : METHOD_NAME[r.paymentMethod];
  return [
    ...(totalDT ? [fmt(w.order, { total: totalDT })] : []),
    fmt(w.payment, { v: method }),
    ...(r.paymentMethod === "cod" ? [fmt(w.deliverTo, { v: [r.address, r.governorate].filter(Boolean).join(", ") })] : []),
  ];
}

function tripRequestMessage(r: TripRequest | VisaRequest, w: Wording, reference?: string, totalDT?: number): string {
  const line = (template: string, v: string) => fmt(template, { v });
  const lines = [
    w.hi,
    `${referenceLine(w, reference)}${r.kind === "visa" ? w.sendVisa : w.sendTrip}`,
    line(w.name, dash(r.fullName)),
    line(w.travelers, dash(r.travelers)),
    line(w.whatsapp, dash(r.whatsapp)),
    ...(r.category ? [line(w.category, r.category)] : []),
    ...(r.kind === "visa"
      ? [
          fmt(w.service, { name: r.service.name, price: r.service.priceDT }),
          line(w.destinationCountry, r.service.country),
          line(w.dateOfBirth, dash(r.dateOfBirth)),
          line(w.nationality, dash(r.nationality)),
          line(w.passportNumber, dash(r.passportNumber)),
          line(w.passportExpiry, dash(r.passportExpiry)),
          line(w.arrival, dash(r.arrivalDate)),
          line(w.departure, dash(r.departureDate)),
          line(w.purpose, dash(r.purposeOfTravel)),
          line(w.occupation, dash(r.occupationStatus)),
          line(w.flight, yesNo(r.flightBooked, w)),
          line(w.accommodation, yesNo(r.accommodationBooked, w)),
          fmt(w.previousVisit, { country: r.service.country, v: yesNo(r.previousVisit, w) }),
          line(w.refusal, yesNo(r.previousVisaRefusal, w)),
          line(w.additionalNotes, dash(r.notes)),
          line(w.documents, r.service.documents.join(w.list)),
        ]
      : [
          line(w.destination, dash(r.destination)),
          line(w.preferredDate, dash(r.preferredDate)),
          line(w.duration, dash(r.durationDays)),
          line(w.budget, dash(r.budgetDT)),
          line(w.notes, dash(r.notes)),
          ...orderLines(r, w, totalDT),
        ]),
    r.kind === "trip" && r.paymentMethod
      ? r.paymentMethod === "cod"
        ? w.closingCod
        : w.closingReceipt
      : w.closingTrip,
  ];
  return lines.join("\n");
}


/**
 * The message SAFRA receives, written with `wording` (the visitor's language; English by default).
 * `totalDT`: the amount of a trip plan order, as charged by submit_request().
 */
export function requestMessage(r: ConciergeRequest, reference?: string, wording: Wording = en.whatsapp, totalDT?: number): string {
  return tripRequestMessage(r, wording, reference, totalDT);
}

// Straight to api.whatsapp.com: the wa.me short link redirects there but turns 4-byte emoji
// (the 👋 in every message) into "�" on the way.
export function whatsappUrl(message: string, number: string = DEFAULT_WHATSAPP_NUMBER): string {
  return `https://api.whatsapp.com/send?phone=${number}&text=${encodeURIComponent(message)}`;
}
