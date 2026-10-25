import Image from "next/image";
import Link from "next/link";
import { fmt, getMessages, label } from "@/i18n";
import { localizedPath, type Locale } from "@/i18n/config";
import { formatRange } from "@/lib/budget";
import type { TripExperienceParams } from "@/lib/search-params";

/** Destination preview reached from the quiz results. Server-rendered from the URL parameters. */
export function TripExperience({ params, locale }: { params: TripExperienceParams; locale: Locale }) {
  const t = getMessages(locale);
  const d = params.destination;
  const when = params.when.trim() && params.when.trim() !== "—" ? params.when : "";
  // Quiz answers travel in English ("Next month", "5–7 days"); dates stay as typed.
  const whenLabel = when ? label(t.options.when, when) : t.trip.chooseDates;
  const durationLabel = params.duration ? label(t.options.duration, params.duration) : d.duration;
  const range = params.range ?? { min: d.minBudget, max: d.maxBudget };
  const match = params.match ?? d.match;

  const request = new URLSearchParams({ destination: d.slug });
  if (when) request.set("when", when);
  if (params.travelers) request.set("travelers", params.travelers);
  if (params.duration) request.set("duration", params.duration);
  if (params.category) request.set("category", params.category);
  request.set("budget", String(params.budget ?? d.estimatedTotal));

  return (
    <section className="@container px-[clamp(20px,3vw,32px)]">
      <div className="mx-auto grid max-w-[1120px] gap-6">
        <header className="relative h-[580px] animate-enter overflow-hidden rounded-[40px] motion-reduce:animate-none @max-[810px]:h-[480px] @max-[810px]:rounded-[28px]">
          <Image src={d.heroImage.src} alt="" fill preload sizes="(max-width: 1180px) 100vw, 1120px" className="object-cover" />
          <div
            aria-hidden
            className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.08)_0%,rgba(0,0,0,.52)_72%,rgba(0,0,0,.7)_100%)]"
          />
          <div className="absolute inset-x-6 bottom-6 z-10 grid max-w-[900px] gap-2.5 font-bold text-cream">
            <span className="justify-self-start rounded-full bg-orange px-3 py-[7px] text-xs font-black text-ink">
              {fmt(t.match, { n: match })}
            </span>
            <h1 className="m-0 text-[72px] leading-[1.02] font-black tracking-[-0.03em] @max-[810px]:text-[44px] @max-[500px]:text-[38px] rtl:leading-[1.25] rtl:tracking-normal">
              {d.title}
            </h1>
            <p className="m-0 text-2xl">{d.country}</p>
            <p className="m-0">{d.description}</p>
            <p className="m-0">{fmt(t.trip.whenAndDuration, { when: whenLabel, duration: durationLabel })}</p>
            <p className="m-0 font-black">{fmt(t.trip.budgetRange, { range: formatRange(range.min, range.max, locale) })}</p>
            <p className="m-0 text-[13px] font-normal opacity-85">{t.trip.disclaimer}</p>
          </div>
        </header>

        <div className="grid grid-cols-[minmax(0,1.1fr)_minmax(0,.9fr)] items-start gap-6 @max-[960px]:grid-cols-1">
          <section className="grid animate-enter gap-3 rounded-[22px] border border-ink/12 bg-white/65 p-[18px] motion-reduce:animate-none">
            <h2 className="m-0 text-4xl leading-[1.08] font-black">{t.trip.highlights}</h2>
            <div className="grid gap-2.5">
              {d.highlights.map((item) => (
                <div key={item} className="rounded-[14px] border border-ink/14 bg-white/80 px-3 py-2.5 font-extrabold">
                  {item}
                </div>
              ))}
            </div>
          </section>

          <aside className="grid animate-enter gap-3 rounded-[22px] bg-ink p-[18px] text-cream motion-reduce:animate-none">
            <div aria-hidden className="text-[28px] leading-none">
              🔒
            </div>
            <h3 className="m-0 text-[30px] leading-[1.1] font-black rtl:leading-[1.3]">{t.trip.planTitle}</h3>
            <p className="m-0 opacity-90">{t.trip.planBody}</p>
            <Link
              href={localizedPath(locale, `/trip-request?${request}`)}
              className="justify-self-start rounded-full bg-orange px-4 py-3 font-black text-ink hover:brightness-95"
            >
              {t.trip.planCta}
            </Link>
          </aside>
        </div>
      </div>
    </section>
  );
}
