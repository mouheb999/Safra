import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BudgetSlider } from "@/components/budget/BudgetSlider";
import { CompassIcon, GlobeIcon, SparklesIcon } from "@/components/icons";
import { fmt, getMessages, label } from "@/i18n";
import { localizedPath, type Locale } from "@/i18n/config";
import { routeLocale, type LocaleParams } from "@/i18n/server";
import { formatDT } from "@/lib/budget";
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
  const [featured, ...others] = destinations;
  const tag = (value: string) => label(t.options.vibes, value);

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

      {/* Budget */}
      <section className="mx-auto mt-24 max-w-[560px] px-4 text-center">
        <h2 className="text-[34px] leading-[1.08] font-black tracking-[-0.02em] sm:text-[44px] rtl:leading-[1.3] rtl:tracking-normal">
          {t.home.budgetTitle}
        </h2>
        <p className="mt-3 text-lg">{t.home.budgetBody}</p>
        <div className="mt-10 text-start">
          <BudgetSlider />
        </div>
      </section>

      {/* Trip teasers */}
      <section className="mx-auto mt-14 max-w-[1180px]">
        <div className="flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-4 sm:px-7">
          <Link
            href={href(`/trip?destination=${featured.slug}`)}
            className="w-[86vw] max-w-[560px] shrink-0 snap-start overflow-hidden rounded-[0_40px_40px_40px] bg-ink text-cream rtl:rounded-[40px_0_40px_40px]"
          >
            <div className="relative h-[240px] sm:h-[300px]">
              <Image src={featured.cardImage.src} alt={featured.cardImage.alt} fill sizes="560px" className="object-cover" />
            </div>
            <div className="grid gap-3 p-6 sm:p-7">
              <span className="justify-self-start rounded-full bg-orange px-3 py-1.5 text-xs font-black text-ink">
                {fmt(t.match, { n: featured.match })}
              </span>
              <h3 className="text-4xl font-black tracking-[-0.02em] sm:text-[44px] rtl:tracking-normal">{featured.country}</h3>
              <p className="text-lg">
                {fmt(t.home.featuredMeta, { duration: featured.teaser.duration, budget: formatDT(featured.teaser.budget, locale) })}
              </p>
              <div className="flex flex-wrap gap-2">
                {featured.teaser.tags.map((x) => (
                  <span key={x} className="rounded-full border border-cream/40 px-3 py-1 text-xs font-bold">
                    {tag(x)}
                  </span>
                ))}
              </div>
            </div>
          </Link>
          {others.map((d) => (
            <Link key={d.slug} href={href(`/trip?destination=${d.slug}`)} className="w-[60vw] max-w-[260px] shrink-0 snap-start">
              <div className="relative h-[240px] overflow-hidden rounded-[120px_120px_28px_28px]">
                <Image src={d.cardImage.src} alt={d.cardImage.alt} fill sizes="260px" className="object-cover" />
              </div>
              <h3 className="mt-4 text-2xl font-black">{d.country}</h3>
              <p className="mt-1">{fmt(t.home.teaserMeta, { budget: formatDT(d.teaser.budget, locale), duration: d.teaser.duration })}</p>
              <p className="mt-2 text-xs font-semibold">{d.teaser.tags.map(tag).join(" · ")}</p>
            </Link>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-center gap-3 text-sm">
          <span className="flex gap-1.5" aria-hidden>
            <span className="h-1.5 w-5 rounded-full bg-orange" />
            <span className="h-1.5 w-1.5 rounded-full bg-ink/20" />
            <span className="h-1.5 w-1.5 rounded-full bg-ink/20" />
          </span>
          {t.home.slide}
        </div>

        <div className="mt-7 text-center">
          <Link href={href("/find-my-trip")} className="inline-flex rounded-full bg-orange px-8 py-4 text-lg font-extrabold hover:brightness-95">
            {t.home.cta}
          </Link>
          <p className="mt-6 px-4 text-xs">{t.home.disclaimer}</p>
        </div>
      </section>
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
