// Visa services. Local fallback + seed source; read them through src/lib/catalog.ts.
// Mirrors the `services` table.

import { visaTranslations, type VisaText } from "./catalog-translations.ts";
import type { Translations } from "./translations";

export interface VisaService {
  slug: string;
  name: string;
  country: string;
  /** Emoji flag shown before the name, e.g. 🇹🇭 */
  flag: string;
  priceDT: number;
  description: string;
  /** What SAFRA does for the fee. */
  includes: string[];
  /** Documents the customer sends on WhatsApp. */
  documents: string[];
  /** French/Arabic text; applied by localizeVisaService(). */
  translations?: Translations<VisaText>;
}

const baseVisaServices: VisaService[] = [
  {
    slug: "thailand-visa",
    name: "Thailand Visa Assistance",
    country: "Thailand",
    flag: "🇹🇭",
    priceDT: 55,
    description: "",
    includes: ["Document checklist", "Document review", "Application preparation / guidance", "SAFRA support"],
    documents: [
      "Passport copy",
      "Personal photo",
      "Flight / travel details",
      "Accommodation details",
      "Bank statement / financial proof",
      "Employment / business documents if required",
    ],
  },
];

export const localVisaServices: VisaService[] = baseVisaServices.map((v) => ({ ...v, translations: visaTranslations[v.slug] }));
