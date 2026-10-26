import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BudgetDiscovery } from "@/components/budget/BudgetDiscovery";
import { CompassIcon, GlobeIcon, SparklesIcon } from "@/components/icons";
import { getMessages } from "@/i18n";
import { localizedPath, type Locale } from "@/i18n/config";
import { routeLocale, type LocaleParams } from "@/i18n/server";
import { getDestinations, getSiteSettings } from "@/lib/catalog";
import { SITE_NAME, SITE_URL, pageMetadata } from "@/lib/site";

// Re-read the catalog every 5 minutes (static otherwise).
export const revalidate = 300;

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await routeLocale(params);
  const t = getMessages(locale);
  return { ...pageMetadata(locale, { title: `${SITE_NAME} — ${t.meta.tagline}`, description: t.meta.description, path: "/" }), title: { absolute: `${SITE_NAME} — ${t.meta.tagline}` } };
}

export default async function HomePage({ params }: LocaleParams) {
  const locale = await routeLocale(params);
  const t = getMessages(locale);
  const href = (path: string) => localizedPath(locale, path);
  const [destinations, settings] = await Promise.all([getDestinations(locale), getSiteSettings()]);

  return (
    <main className="overflow-x-hidden pb-24">
      <JsonLd locale={locale} destinations={destinations} phone={settings.whatsappNumber} description={t.meta.description} />
      {/* Hero */}
      <section className="mx-auto max-w-[460px] px-4 pt-14 sm:pt-16">
        <h1 className="text-[64px] leading-[1.02] font-black tracking-[-0.03em] sm:text-[96px] rtl:text-[56px] rtl:leading-[1.15] rtl:tracking-normal sm:rtl:text-[80px]">
          {t.home.title1}
          <br />
          {t.home.title2}
        </h1>
        <p className="mt-6 text-lg sm:text-xl">{t.meta.tagline}</p>

        <div className="mt-8 grid grid-cols-2 gap-2.5">
          <Link
            href={href("/trip-request")}
            className="flex min-h-[174px] flex-col gap-3 rounded-[24px] bg-orange p-5 transition-transform hover:-translate-y-0.5"
          >
            <CompassIcon size={28} color="#203D35" strokeWidth={1.6} />
            <span className="text-lg leading-tight font-extrabold">{t.home.knowTitle}</span>
            <span className="text-[13px] leading-snug">{t.home.knowBody}</span>
          </Link>
          <Link
            href={href("/find-my-trip")}
            className="flex min-h-[174px] flex-col gap-3 rounded-[24px] bg-sky p-5 transition-transform hover:-translate-y-0.5"
          >
            <SparklesIcon size={28} color="#203D35" strokeWidth={1.6} />
            <span className="text-lg leading-tight font-extrabold">{t.home.surpriseTitle}</span>
            <span className="text-[13px] leading-snug">{t.home.surpriseBody}</span>
          </Link>
        </div>

        <Link
          href={href("/visas")}
          className="mt-5 inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white/70 px-4 py-2 text-sm font-bold hover:bg-white"
        >
          <GlobeIcon size={16} color="#203D35" strokeWidth={1.8} />
          {t.home.visaHelp}
        </Link>

        <div className="relative mt-14">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[40px_40px_180px_40px] rtl:rounded-[40px_40px_40px_180px]">
            <Image
              src="https://framerusercontent.com/images/GL4tcr2qJCc1BJINLyIiLL1ySA.jpg"
              alt={t.home.heroAlt}
              fill
              preload
              sizes="(max-width: 500px) 100vw, 460px"
              className="object-cover"
            />
          </div>
          <div className="absolute -bottom-3 -start-2 -rotate-6 rounded-xl border-2 border-dashed border-sea bg-cream px-5 py-2 text-center text-sea rtl:rotate-6" dir="ltr">
            <div className="text-base font-black tracking-[0.12em]">SAFRA</div>
            <div className="text-[10px] font-extrabold tracking-[0.14em]">EL NIDO · PH</div>
          </div>
        </div>
      </section>

      <BudgetDiscovery destinations={destinations} />
    </main>
  );
}

/** schema.org data for search engines (rendered as JSON, not visible). */
function JsonLd({
  locale,
  destinations,
  phone,
  description,
}: {
  locale: Locale;
  destinations: Awaited<ReturnType<typeof getDestinations>>;
  phone: string;
  description: string;
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    name: SITE_NAME,
    url: `${SITE_URL}${localizedPath(locale, "/")}`,
    description,
    inLanguage: locale,
    logo: `${SITE_URL}/icon.svg`,
    telephone: `+${phone}`,
    areaServed: "TN",
    currenciesAccepted: "TND",
    makesOffer: destinations.map((d) => ({
      "@type": "Offer",
      itemOffered: { "@type": "TouristTrip", name: `${d.title}, ${d.country}`, description: d.description },
      priceSpecification: { "@type": "PriceSpecification", minPrice: d.minBudget, maxPrice: d.maxBudget, priceCurrency: "TND" },
      url: `${SITE_URL}${localizedPath(locale, `/trip?destination=${d.slug}`)}`,
    })),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
