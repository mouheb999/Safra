import type { Metadata } from "next";
import Link from "next/link";
import { getPacks } from "@/data/packs";
import { ArrowIcon, SparklesIcon } from "@/components/icons";
import { PackCard } from "@/components/packs/PackCard";
import { getMessages } from "@/i18n";
import { localizedPath } from "@/i18n/config";
import { routeLocale, type LocaleParams } from "@/i18n/server";
import { pageMetadata } from "@/lib/site";

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await routeLocale(params);
  return pageMetadata(locale, { ...getMessages(locale).meta.packs, path: "/packs" });
}

export default async function PacksPage({ params }: LocaleParams) {
  const locale = await routeLocale(params);
  const t = getMessages(locale);
  const packs = getPacks(locale);

  return (
    <main className="px-4 pt-12 pb-24 sm:px-7 lg:pt-16">
      <div className="mx-auto max-w-[1180px]">
        <header className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,.9fr)] lg:items-end lg:gap-12">
          <div>
            <p className="m-0 text-xs font-black tracking-[0.14em] text-sea rtl:tracking-normal">{t.packs.eyebrow}</p>
            <h1 className="m-0 mt-3 text-[40px] leading-[1.04] font-black tracking-[-0.03em] sm:text-[58px] text-balance rtl:leading-[1.3] rtl:tracking-normal">
              {t.packs.title}
            </h1>
          </div>
          <p className="m-0 max-w-[520px] text-lg leading-relaxed opacity-85 lg:pb-2">{t.packs.intro}</p>
        </header>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:mt-14 lg:grid-cols-3 lg:gap-6">
          {packs.map((p, i) => (
            <PackCard key={p.slug} pack={p} preload={i < 3} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px" />
          ))}

          <Link
            href={localizedPath(locale, "/find-my-trip")}
            className="group flex min-h-[320px] flex-col justify-between gap-6 rounded-[28px] bg-ink p-7 text-cream transition-transform duration-300 hover:-translate-y-1 motion-reduce:transition-none"
          >
            <span className="grid size-12 place-items-center rounded-2xl bg-cream/10 text-orange">
              <SparklesIcon size={24} strokeWidth={1.7} />
            </span>
            <span className="grid gap-2">
              <span className="text-[28px] leading-tight font-black">{t.packs.customTitle}</span>
              <span className="text-[15px] leading-snug opacity-80">{t.packs.customBody}</span>
            </span>
            <span className="inline-flex items-center gap-2 self-start rounded-full bg-orange px-5 py-3 font-extrabold text-ink">
              {t.packs.customCta}
              <ArrowIcon size={14} />
            </span>
          </Link>
        </div>

        <p className="mt-8 text-sm opacity-70">{t.packs.note}</p>
      </div>
    </main>
  );
}
