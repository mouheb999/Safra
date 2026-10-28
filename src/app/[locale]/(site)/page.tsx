import type { Metadata } from "next";
import Link from "next/link";
import { HeroMedia } from "@/components/HeroMedia";
import { PacksSlider } from "@/components/packs/PacksSlider";
import { ArrowIcon, CompassIcon, GlobeIcon, SparklesIcon } from "@/components/icons";
import { getMessages } from "@/i18n";
import { localizedPath, type Locale } from "@/i18n/config";
import { routeLocale, type LocaleParams } from "@/i18n/server";
import { getDestinations, getPacks, getSiteSettings } from "@/lib/catalog";
import { HERO_POSTER, HERO_VIDEO, SITE_NAME, SITE_URL, pageMetadata } from "@/lib/site";

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
  const [destinations, settings, packs] = await Promise.all([getDestinations(locale), getSiteSettings(), getPacks(locale)]);

  return (
    <main className="overflow-x-hidden pb-24">
      <JsonLd locale={locale} destinations={destinations} phone={settings.whatsappNumber} description={t.meta.description} />
      {/* Hero: text and the two ways to start on one side, the video (or its poster) on the other. */}
      <section className="mx-auto grid max-w-[1180px] items-center gap-12 px-4 pt-12 sm:px-7 sm:pt-16 md:grid-cols-[minmax(0,1.05fr)_minmax(0,.95fr)] md:gap-10 lg:gap-16 lg:pt-14">
        <div className="mx-auto w-full max-w-[560px] md:mx-0">
          <h1 className="m-0 text-[64px] leading-[1.02] font-black tracking-[-0.035em] sm:text-[96px] md:text-[76px] lg:text-[104px] rtl:text-[56px] rtl:leading-[1.15] rtl:tracking-normal sm:rtl:text-[80px] md:rtl:text-[64px] lg:rtl:text-[72px]">
            {t.home.title1}
            <br />
            {t.home.title2}
          </h1>
          <p className="m-0 mt-6 max-w-[480px] text-lg leading-relaxed text-pretty opacity-85 sm:text-xl">{t.home.lead}</p>

          <div className="mt-8 grid grid-cols-2 gap-3">
            <StartCard href={href("/trip-request")} tone="bg-orange" icon={<CompassIcon size={28} color="#203D35" strokeWidth={1.6} />} title={t.home.knowTitle} body={t.home.knowBody} />
            <StartCard href={href("/find-my-trip")} tone="bg-sky" icon={<SparklesIcon size={28} color="#203D35" strokeWidth={1.6} />} title={t.home.surpriseTitle} body={t.home.surpriseBody} />
          </div>

          <Link
            href={href("/visas")}
            className="mt-5 inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white/70 px-4 py-2.5 text-sm font-bold transition-colors hover:bg-white"
          >
            <GlobeIcon size={16} color="#317DA1" strokeWidth={1.8} />
            {t.home.visaHelp}
            <ArrowIcon size={13} />
          </Link>
        </div>

        <div className="relative mx-auto w-full max-w-[460px] md:max-w-none">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[40px_40px_180px_40px] bg-sky lg:aspect-[11/12] rtl:rounded-[40px_40px_40px_180px]">
            <HeroMedia video={HERO_VIDEO} poster={HERO_POSTER} alt={t.home.heroAlt} />
          </div>
          <div className="absolute -bottom-3 -start-2 -rotate-6 rounded-xl border-2 border-dashed border-sea bg-cream px-5 py-2 text-center text-sea rtl:rotate-6" dir="ltr">
            <div className="text-base font-black tracking-[0.12em]">SAFRA</div>
            <div className="text-[10px] font-extrabold tracking-[0.14em]">EL NIDO · PH</div>
          </div>
        </div>
      </section>

      <PacksSlider packs={packs} />
    </main>
  );
}

/** One of the two ways to start: a coloured card with an icon, a title and one line. */
function StartCard({ href, tone, icon, title, body }: { href: string; tone: string; icon: React.ReactNode; title: string; body: string }) {
  return (
    <Link
      href={href}
      className={`group relative flex min-h-[176px] flex-col gap-3 rounded-[24px] p-5 transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_18px_30px_-18px_rgba(32,61,53,.45)] motion-reduce:transition-none motion-reduce:hover:translate-none lg:min-h-[190px] ${tone}`}
    >
      {icon}
      <span className="mt-auto grid gap-1.5">
        <span className="text-lg leading-tight font-extrabold">{title}</span>
        <span className="text-[13px] leading-snug opacity-85">{body}</span>
      </span>
      <span aria-hidden className="absolute end-4 top-4 opacity-40 transition-[opacity,transform] duration-300 group-hover:translate-x-0.5 group-hover:opacity-90 rtl:group-hover:-translate-x-0.5">
        <ArrowIcon size={18} />
      </span>
    </Link>
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
