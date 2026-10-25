// Helpers for pages under app/[locale].

import { notFound } from "next/navigation";
import { isLocale, type Locale } from "./config";

export type LocaleParams = { params: Promise<{ locale: string }> };

/** The page's language from its route params (404 for anything unexpected). */
export async function routeLocale(params: Promise<{ locale: string }>): Promise<Locale> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return locale;
}
