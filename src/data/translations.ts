// Optional French/Arabic versions of catalog text. Stored as-is in the `translations` jsonb column
// of destinations, safaris and services; anything missing falls back to English.

import type { Locale } from "@/i18n/config";

export type TranslatedLocale = Exclude<Locale, "en">;
export const TRANSLATED_LOCALES: TranslatedLocale[] = ["fr", "ar"];
export type Translations<T> = Partial<Record<TranslatedLocale, Partial<T>>>;

/** Translated value if present (non-empty string / non-empty list), else the English one. */
export function pick<T extends object, K extends keyof T>(
  translations: Translations<T> | undefined,
  locale: Locale,
  key: K,
  english: NonNullable<T[K]>,
): NonNullable<T[K]> {
  if (locale === "en") return english;
  const value = translations?.[locale]?.[key];
  if (typeof value === "string" ? value.trim() !== "" : Array.isArray(value) ? value.length > 0 : false) {
    return value as NonNullable<T[K]>;
  }
  return english;
}
