import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getMessages, label } from "@/i18n";
import { localizedPath } from "@/i18n/config";
import { routeLocale, type LocaleParams } from "@/i18n/server";
import { formatRange } from "@/lib/budget";
import { getDestinations } from "@/lib/catalog";
import { pageMetadata } from "@/lib/site";

export const revalidate = 300;

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await routeLocale(params);
  return pageMetadata(locale, { ...getMessages(locale).meta.experiences, path: "/experiences" });
}

export default async function ExperiencesPage({ params }: LocaleParams) {
  const locale = await routeLocale(params);
  const t = getMessages(locale);
  const href = (path: string) => localizedPath(locale, path);
  const destinations = await getDestinations(locale);

  return (
    <main className="px-4 pt-12 pb-24 sm:px-7">
      <div className="mx-auto max-w-[1180px]">
        <p className="text-xs font-black tracking-[0.12em] text-sea rtl:tracking-normal">{t.experiences.eyebrow}</p>
        <h1 className="mt-3 text-[40px] leading-[1.05] font-black tracking-[-0.03em] sm:text-[56px] rtl:leading-[1.3] rtl:tracking-normal">
          {t.experiences.title}
        </h1>
        <p className="mt-4 max-w-[760px] text-lg">{t.experiences.intro}</p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {destinations.map((d, i) => (
            <article key={d.slug} className="grid overflow-hidden rounded-[28px] border border-ink/12 bg-white/70">
              <div className="relative aspect-[4/3]">
                <Image
                  src={d.cardImage.src}
                  alt={d.cardImage.alt}
                  fill
                  preload={i === 0}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
                  className="object-cover"
                />
              </div>
              <div className="grid content-start gap-2.5 p-5">
                <p className="m-0 text-sm font-extrabold tracking-wide text-sea uppercase">{d.country}</p>
                <h2 className="m-0 text-2xl leading-tight font-black">{d.title}</h2>
                <p className="m-0 opacity-85">{d.description}</p>
                <p className="m-0 font-bold">
                  {d.duration} · {formatRange(d.minBudget, d.maxBudget, locale)}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {d.highlights.map((h) => (
                    <span key={h} className="rounded-full border border-ink/15 px-2.5 py-1 text-xs font-bold">
                      {label(t.options.vibes, h)}
                    </span>
                  ))}
                </div>
                <Link
                  href={href(`/trip?destination=${d.slug}`)}
                  className="mt-2 justify-self-start rounded-full bg-orange px-4 py-2.5 font-extrabold hover:brightness-95"
                >
                  {t.quiz.explore}
                </Link>
              </div>
            </article>
          ))}
        </div>

        <section className="mt-14 grid gap-4 rounded-[28px] bg-ink p-6 text-cream sm:grid-cols-[1fr_auto] sm:items-center sm:p-8">
          <div>
            <h2 className="m-0 text-2xl font-black">{t.experiences.notSure}</h2>
            <p className="m-0 mt-1 opacity-85">{t.experiences.notSureBody}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href={href("/find-my-trip")} className="rounded-full bg-orange px-5 py-3 font-extrabold text-ink hover:brightness-95">
              {t.home.cta}
            </Link>
            <Link href={href("/safari")} className="rounded-full border border-cream/40 px-5 py-3 font-extrabold hover:bg-cream/10">
              {t.experiences.safaris}
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
