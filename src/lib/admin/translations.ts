// French / Arabic versions of catalog text, edited in /admin/catalog and stored in each row's
// `translations` column ({ fr: {...}, ar: {...} }). Empty fields fall back to the English text.

import type { DestinationText, VisaText } from "@/data/catalog-translations";
import type { PackText } from "@/data/packs";
import type { TranslatedLocale } from "@/data/translations";

export const TRANSLATED_LOCALES: { locale: TranslatedLocale; label: string; dir: "ltr" | "rtl" }[] = [
  { locale: "fr", label: "French", dir: "ltr" },
  { locale: "ar", label: "Arabic", dir: "rtl" },
];

export interface TranslatedField<K extends string = string> {
  key: K;
  label: string;
  /** "lines": one item per line (stored as a list). */
  kind: "text" | "textarea" | "lines";
  max: number;
}

export const DESTINATION_FIELDS: TranslatedField<keyof DestinationText>[] = [
  { key: "country", label: "Country", kind: "text", max: 80 },
  { key: "title", label: "Title", kind: "text", max: 120 },
  { key: "duration", label: "Recommended duration", kind: "text", max: 40 },
  { key: "teaserDuration", label: "Teaser duration", kind: "text", max: 40 },
  { key: "description", label: "Description", kind: "textarea", max: 600 },
  { key: "highlights", label: "Highlights (one per line)", kind: "lines", max: 80 },
  { key: "heroAlt", label: "Hero image description", kind: "text", max: 160 },
  { key: "cardAlt", label: "Card image description", kind: "text", max: 160 },
];


export const PACK_FIELDS: TranslatedField<keyof PackText>[] = [
  { key: "title", label: "Title", kind: "text", max: 80 },
  { key: "country", label: "Country", kind: "text", max: 60 },
  { key: "route", label: "Route", kind: "text", max: 120 },
  { key: "blurb", label: "Short description", kind: "textarea", max: 300 },
];

export const VISA_FIELDS: TranslatedField<keyof VisaText>[] = [
  { key: "name", label: "Name", kind: "text", max: 120 },
  { key: "country", label: "Country", kind: "text", max: 80 },
  { key: "description", label: "Short description", kind: "textarea", max: 600 },
  { key: "includes", label: "What’s included (one per line)", kind: "lines", max: 120 },
  { key: "documents", label: "Documents (one per line)", kind: "lines", max: 120 },
];

/** Form input name for one translated field, e.g. "tr:fr:title". */
export const translationInputName = (locale: TranslatedLocale, key: string) => `tr:${locale}:${key}`;

type Stored = Partial<Record<TranslatedLocale, Record<string, string | string[]>>>;

/** Current value of a translated field, as the form shows it. */
export function translationValue(stored: unknown, locale: TranslatedLocale, field: TranslatedField): string {
  const value = (stored as Stored | null)?.[locale]?.[field.key];
  return Array.isArray(value) ? value.join("\n") : (value ?? "");
}

/** Reads the translated fields from a submitted form; returns an error message for over-long text. */
export function readTranslations(
  fd: FormData,
  fields: TranslatedField[],
): { translations: Stored; error: null } | { translations: null; error: string } {
  const translations: Stored = {};
  for (const { locale, label: language } of TRANSLATED_LOCALES) {
    const entry: Record<string, string | string[]> = {};
    for (const field of fields) {
      const raw = String(fd.get(translationInputName(locale, field.key)) ?? "").trim();
      if (!raw) continue;
      const value = field.kind === "lines" ? raw.split("\n").map((s) => s.trim()).filter(Boolean) : raw;
      const parts = Array.isArray(value) ? value : [value];
      if (parts.some((p) => p.length > field.max)) {
        return { translations: null, error: `${language} ${field.label.replace(/ \(.*\)$/, "").toLowerCase()} is too long (max ${field.max}).` };
      }
      if (Array.isArray(value) && value.length > 15) return { translations: null, error: `${language} ${field.label}: too many lines.` };
      entry[field.key] = value;
    }
    if (Object.keys(entry).length > 0) translations[locale] = entry;
  }
  return { translations, error: null };
}

export const BRAIN_COUNTRY_FIELDS: TranslatedField<"name">[] = [{ key: "name", label: "Country name", kind: "text", max: 80 }];

export const BRAIN_BASE_FIELDS: TranslatedField<"place">[] = [{ key: "place", label: "Place name", kind: "text", max: 80 }];
