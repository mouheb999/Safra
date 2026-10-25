// Root layout of the public site, once per language: <html lang dir>, fonts, translations.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMessages } from "@/i18n";
import { I18nProvider } from "@/i18n/client";
import { dirOf, isLocale, localizedPath, locales, openGraphLocale } from "@/i18n/config";
import { SITE_NAME, SITE_URL, languageAlternates } from "@/lib/site";
import { cairo, nunito } from "../fonts";
import "../globals.css";

type Props = { children: React.ReactNode; params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}
// /de/… and other unknown prefixes are 404s.
export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getMessages(locale);
  const title = `${SITE_NAME} — ${t.meta.tagline}`;
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: `%s · ${SITE_NAME}` },
    description: t.meta.description,
    applicationName: SITE_NAME,
    alternates: { canonical: localizedPath(locale, "/"), languages: languageAlternates("/") },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title,
      description: t.meta.description,
      url: localizedPath(locale, "/"),
      locale: openGraphLocale[locale],
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <html lang={locale} dir={dirOf(locale)} className={`${nunito.variable} ${cairo.variable}`}>
      <body className="min-h-dvh bg-cream font-sans text-ink antialiased">
        <I18nProvider locale={locale} messages={getMessages(locale)}>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
