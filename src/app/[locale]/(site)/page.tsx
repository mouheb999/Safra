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

          {/* "Surprise me" sits on the right in every language (in Arabic it comes first, which is the right). */}
          <div className="mt-8 grid grid-cols-2 gap-3">
            <StartCard href={href("/trip-request")} icon={<CompassIcon size={26} color="#203D35" strokeWidth={1.7} />} title={t.home.knowTitle} body={t.home.knowBody} />
            <StartCard href={href("/find-my-trip")} className="rtl:order-first" icon={<SparklesIcon size={26} color="#203D35" strokeWidth={1.7} />} title={t.home.surpriseTitle} body={t.home.surpriseBody} />
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

        {/* A 16:9 player frame, like a YouTube video. */}
        <div className="relative mx-auto aspect-video w-full max-w-[640px] overflow-hidden rounded-[24px] bg-ink shadow-[0_24px_50px_-28px_rgba(32,61,53,.55)] md:max-w-none">
          <HeroMedia video={HERO_VIDEO} poster={HERO_POSTER} alt={t.home.heroAlt} />
        </div>
      </section>

      <PacksSlider packs={packs} />
    </main>
  );
}

/** One of the two ways to start: the two cards look the same (same size, colours and button), only the icon and words differ. */
function StartCard({ href, icon, title, body, className = "" }: { href: string; icon: React.ReactNode; title: string; body: string; className?: string }) {
  return (
    <Link
      href={href}
      className={`group relative flex min-h-[184px] flex-col gap-3 rounded-[24px] border border-ink/10 bg-white/85 p-5 shadow-[0_1px_2px_rgba(32,61,53,.06)] transition-[transform,box-shadow,border-color] duration-300 ease-out hover:-translate-y-1 hover:border-orange/60 hover:shadow-[0_18px_34px_-20px_rgba(32,61,53,.45)] motion-reduce:transition-none motion-reduce:hover:translate-none lg:min-h-[196px] ${className}`}
    >
      <span className="grid size-12 place-items-center rounded-2xl bg-orange/18">{icon}</span>
      <span className="mt-auto grid gap-1.5">
        <span className="text-lg leading-tight font-extrabold">{title}</span>
        <span className="text-[13px] leading-snug opacity-75">{body}</span>
      </span>
      <span
        aria-hidden
        className="absolute end-4 top-4 grid size-9 place-items-center rounded-full bg-ink text-cream transition-transform duration-300 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5"
      >
        <ArrowIcon size={15} />
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
