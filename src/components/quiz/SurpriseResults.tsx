"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type RefObject } from "react";
import { ArrowIcon, CheckIcon, ClockIcon, LockIcon, PaperPlaneIcon, WhatsAppIcon } from "@/components/icons";
import type { GroupType } from "@/data/brain";
import { useI18n } from "@/i18n/client";
import { fmt, label } from "@/i18n/fmt";
import { formatDT } from "@/lib/budget";
import type { BrainInput } from "@/lib/brain/engine";
import { encodeInput } from "@/lib/brain/input";
import type { SurpriseOption, SurprisePreview } from "@/lib/brain/preview";
import { CATEGORIES } from "@/lib/brain/pricing";
import { whatsappUrl } from "@/lib/requests";

const headingClass =
  "m-0 text-[38px] leading-[1.03] font-black tracking-[-0.03em] outline-none @min-[501px]:text-[44px] @min-[811px]:text-[56px] rtl:leading-[1.3] rtl:tracking-normal";

/** Collapsed, the locked block shows these money categories and the first days; "See the full outline" opens the rest. */
const PREVIEW_CATEGORIES = ["flights", "stays", "food", "activities"] as const;
const PREVIEW_DAYS = 2;

/**
 * "Surprise me" results: the 2 best trips for the budget given at the start, each with its total and a locked
 * block — where the money goes and the day-by-day program, blurred. "Unlock my program" opens the checkout.
 */
export function SurpriseResults({
  preview,
  input,
  whenLabel,
  planPriceDT,
  payOnline,
  whatsappNumber,
  onRestart,
  headingRef,
}: {
  preview: SurprisePreview | null;
  input: BrainInput;
  whenLabel: string;
  planPriceDT: number;
  payOnline: boolean;
  whatsappNumber: string;
  onRestart: () => void;
  headingRef: RefObject<HTMLHeadingElement | null>;
}) {
  const { t, locale } = useI18n();
  const b = t.brain;
  const actions = (
    <button type="button" onClick={onRestart} className="cursor-pointer justify-self-start rounded-full border border-ink/15 bg-white/70 px-5 py-3 font-extrabold hover:bg-white">
      {b.startAgain}
    </button>
  );

  if (!preview || preview.status !== "ok") {
    return (
      <div className="grid max-w-[760px] gap-5 pt-2">
        <h2 ref={headingRef} tabIndex={-1} className={headingClass}>
          {preview ? b.noneTitle : b.error}
        </h2>
        {preview ? <p className="m-0 text-lg font-bold opacity-85">{b.noneBody}</p> : null}
        <a href={whatsappUrl(t.whatsapp.hi, whatsappNumber)} className="justify-self-start rounded-full bg-orange px-6 py-3.5 font-black hover:brightness-95">
          {b.talk}
        </a>
        {actions}
      </div>
    );
  }

  const travelers = preview.travelers === 1 ? b.oneTraveler : fmt(b.travelersValue, { n: preview.travelers });
  return (
    <div className="grid gap-6">
      <div className="grid max-w-[820px] gap-3">
        <h2 ref={headingRef} tabIndex={-1} className={headingClass}>
          {b.resultsTitle}
        </h2>
        <p className="m-0 text-lg font-bold opacity-85">
          {fmt(b.resultsLead, { travelers, when: whenLabel, budget: formatDT(preview.totalBudgetTND, locale) })}
        </p>
      </div>

      <div className="grid gap-5 @min-[760px]:grid-cols-2">
        {preview.options.map((o, i) => (
          <OptionCard
            key={o.country}
            option={o}
            index={i}
            input={input}
            nights={preview.nights}
            travelers={preview.travelers}
            planPriceDT={planPriceDT}
            payOnline={payOnline}
          />
        ))}
      </div>

      <p className="m-0 text-sm opacity-70">{b.estimated}</p>
      {actions}
    </div>
  );
}

function OptionCard({
  option: o,
  index,
  input,
  nights,
  travelers,
  planPriceDT,
  payOnline,
}: {
  option: SurpriseOption;
  index: number;
  input: BrainInput;
  nights: number;
  travelers: number;
  planPriceDT: number;
  payOnline: boolean;
}) {
  const { t, locale, href } = useI18n();
  const b = t.brain;
  const group = b.groupTrip[input.group as GroupType];
  const why = o.vibesMatched.length
    ? fmt(b.why, { matched: o.vibesMatched.map((v) => label(t.options.vibes, v)).join(b.and), group })
    : fmt(b.whyNoVibes, { group });

  const checkout = new URLSearchParams({
    mode: "direct",
    pick: encodeInput(input),
    country: o.country,
    desiredDestination: o.countryName,
    budget: String(input.budgetTND),
    travelers: String(travelers),
    duration: `${nights + 1} days`,
  });
  if (input.depart) checkout.set("when", input.depart);
  const unlockHref = href(`/trip-request?${checkout}`);

  return (
    <article
      style={{ animationDelay: `${index * 110}ms` }}
      className="flex animate-enter flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_10px_30px_-18px_rgba(32,61,53,.35)] ring-1 ring-ink/8 motion-reduce:animate-none"
    >
      <div className="relative h-[170px] bg-linear-to-br from-sea to-ink">
        {o.image ? <Image src={o.image} alt="" fill sizes="(max-width: 760px) 100vw, 540px" className="object-cover" /> : null}
        <div aria-hidden className="absolute inset-0 bg-linear-to-t from-ink/75 to-transparent" />
        <span className={`absolute start-4 top-4 rounded-full px-3 py-1.5 text-xs font-black ${o.fits ? "bg-orange" : "bg-[#FEF3C7] text-[#92400E]"}`}>
          {b.labels[o.label]}
        </span>
        <div className="absolute inset-x-4 bottom-3 grid gap-0.5 text-cream">
          <h3 className="m-0 text-[28px] leading-tight font-black">{o.countryName}</h3>
          <span className="text-sm font-bold opacity-90">{o.stops.map((s) => fmt(b.nightsIn, { place: s.place, n: s.nights })).join(" → ")}</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <p className="m-0 flex items-start gap-2 text-sm font-bold text-sea">
          <span aria-hidden>{o.season === "best" ? "☀" : "⛅"}</span>
          {b.weather[o.season]}
        </p>
        <p className="m-0 text-[15px] leading-snug font-bold opacity-85">{why}</p>

        <div className="grid gap-1 rounded-2xl bg-sky/60 p-4">
          <span className="text-xs font-black tracking-[.08em] text-sea uppercase rtl:tracking-normal">{b.total}</span>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="text-[30px] leading-none font-black tracking-[-0.02em] tabular-nums rtl:tracking-normal">≈ {formatDT(o.tripCostTND, locale)}</span>
            <span className={`rounded-full px-2.5 py-1 text-xs font-black ${o.fits ? "bg-white" : "bg-[#FEF3C7] text-[#92400E]"}`}>
              {o.fits ? b.within : fmt(b.needs, { amount: formatDT(o.missingTND, locale) })}
            </span>
          </div>
          {o.fits ? <span className="text-sm font-bold">{fmt(b.pocket, { amount: formatDT(o.pocketPerPersonPerDay, locale) })}</span> : null}
        </div>


        <LockedProgram option={o} depart={input.depart} unlockHref={unlockHref} planPriceDT={planPriceDT} payOnline={payOnline} />
      </div>
    </article>
  );
}

/**
 * What the plan unlocks, stacked: where the money goes (category names, blurred amounts), then the
 * day-by-day program (day numbers and places, blurred details), then the unlock panel. The amounts and texts
 * under the blur are placeholders — the real split and plan are never sent to the browser, so removing the
 * blur reveals nothing. Urgency stays factual: days until departure, prices checked today, the plan's share
 * of the trip cost.
 */
function LockedProgram({
  option: o,
  depart,
  unlockHref,
  planPriceDT,
  payOnline,
}: {
  option: SurpriseOption;
  /** Departure date (exact-dates answers only). */
  depart: string | null;
  unlockHref: string;
  planPriceDT: number;
  payOnline: boolean;
}) {
  const { t, locale } = useI18n();
  const b = t.brain;
  const [open, setOpen] = useState(false);
  const categories = open ? CATEGORIES : CATEGORIES.filter((c) => (PREVIEW_CATEGORIES as readonly string[]).includes(c));
  const shown = open ? o.days : o.days.slice(0, PREVIEW_DAYS);
  const more = o.days.length - shown.length;
  const outlineId = `outline-${o.country}`;
  const daysToGo = depart ? Math.ceil((Date.parse(`${depart}T00:00:00`) - Date.now()) / 86_400_000) : null;
  const share = o.tripCostTND > 0 ? Math.ceil((planPriceDT / o.tripCostTND) * 100) : null;
  const includes = [
    fmt(b.includes.days, { n: o.days.length }),
    b.includes.stays,
    b.includes.flights,
    ...(o.activityCount ? [fmt(b.includes.activities, { n: o.activityCount })] : []),
  ];

  return (
    <section
      aria-label={b.lockedHeader}
      className="relative mt-auto overflow-hidden rounded-[22px] bg-white shadow-[0_18px_40px_-28px_rgba(32,61,53,.6)] ring-1 ring-ink/12"
    >
      <div className="flex items-center justify-between gap-3 bg-ink px-4 py-3 text-cream">
        <span className="flex items-center gap-2 text-sm font-black">
          <LockIcon size={16} strokeWidth={2.4} />
          {b.lockedHeader}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-cream/12 px-2.5 py-1 text-[11px] font-black text-[#86EFAC]">
          <span aria-hidden className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#86EFAC] opacity-60 motion-reduce:hidden" />
            <span className="relative inline-flex size-2 rounded-full bg-[#86EFAC]" />
          </span>
          {b.lockedReady}
        </span>
      </div>

      <div id={outlineId} className="relative bg-cream/50">
        <h4 className="m-0 px-4 pt-3.5 pb-2 text-[13px] font-black tracking-[.04em] uppercase opacity-70 rtl:tracking-normal">{b.split}</h4>
        <ul className="m-0 grid list-none gap-x-4 gap-y-1.5 px-4 pb-3.5 @min-[640px]:grid-cols-2">
          {categories.map((c, i) => (
            <li key={c} className="flex items-baseline justify-between gap-2 text-[13px]">
              <span className="truncate opacity-80">{b.categories[c]}</span>
              <span aria-hidden className="font-black whitespace-nowrap tabular-nums blur-[5px] select-none">
                {formatDT(placeholderAmount(i, o.country), locale)}
              </span>
            </li>
          ))}
        </ul>
        <h4 className="m-0 border-t border-ink/8 px-4 pt-3.5 pb-1 text-[13px] font-black tracking-[.04em] uppercase opacity-70 rtl:tracking-normal">
          {b.program}
        </h4>
        <ol className="m-0 grid list-none p-0">
          {shown.map((d, i) => (
            <li key={d.day} className="grid grid-cols-[64px_minmax(0,1fr)] gap-x-2 border-t border-ink/6 px-4 py-2.5">
              <span className="text-xs leading-5 font-black text-sea">{fmt(b.day, { n: d.day })}</span>
              <span className="text-sm leading-5 font-extrabold">{fmt(b.dayKinds[d.kind], { place: d.place })}</span>
              <span aria-hidden className="col-start-2 text-[13px] leading-snug opacity-70 blur-[4px] select-none">
                {b.teaser[(i + o.country.length) % b.teaser.length]}
              </span>
            </li>
          ))}
        </ol>
        {/* A slow light sweep over the locked rows, then a fade into the unlock panel. */}
        <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden motion-reduce:hidden">
          <span className="absolute inset-0 animate-shimmer bg-linear-to-r from-transparent via-white/50 to-transparent" />
        </span>
        <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-linear-to-b from-transparent to-white" />
      </div>

      <div className="relative -mt-8 flex justify-center px-4 pb-1">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={outlineId}
          onClick={() => setOpen((v) => !v)}
          className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-black text-sea shadow-[0_4px_14px_-6px_rgba(32,61,53,.35)] ring-1 ring-ink/10 hover:ring-sea/40"
        >
          {open ? b.showLess : fmt(b.showAll, { n: o.days.length })}
          <span aria-hidden className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}>⌄</span>
        </button>
      </div>

      <div className="relative grid gap-3 px-4 pt-1 pb-4">
        <div className="grid justify-items-center gap-0.5 text-center">
          <strong className="text-[17px] leading-tight">{b.lockedTitle}</strong>
          {more > 0 ? <span className="text-xs font-bold opacity-65">{fmt(b.moreDays, { n: more })}</span> : null}
        </div>

        <p className="m-0 flex items-start gap-2 rounded-xl bg-[#FFF4ED] px-3 py-2.5 text-[13px] leading-snug font-bold text-[#9A3412]">
          <ClockIcon size={16} strokeWidth={2.4} className="mt-px shrink-0" />
          {daysToGo !== null && daysToGo > 0 && daysToGo <= 365 ? fmt(b.urgencyDays, { n: daysToGo }) : b.urgencyGeneric}
        </p>

        <ul className="m-0 grid list-none gap-1.5 p-0 text-[13.5px] font-semibold">
          {includes.map((item) => (
            <li key={item} className="flex items-start gap-2">
              <CheckIcon size={16} strokeWidth={2.8} className="mt-0.5 shrink-0 text-sea" />
              {item}
            </li>
          ))}
        </ul>

        <div className="flex items-start gap-3 rounded-2xl bg-[#ECFDF3] px-3.5 py-3 ring-1 ring-[#25D366]/30">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#25D366] text-white shadow-[0_6px_14px_-6px_rgba(37,211,102,.9)]">
            <WhatsAppIcon size={19} />
          </span>
          <span className="grid gap-0.5">
            <strong className="text-[14px] leading-tight text-[#14532D]">{t.checkout.assistTitle}</strong>
            <span className="text-[13px] leading-snug font-semibold text-[#166534]">{t.checkout.assistBody}</span>
          </span>
        </div>

        <Link
          href={unlockHref}
          className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-orange px-5 font-black text-ink shadow-[0_14px_28px_-14px_rgba(255,128,85,.95)] transition-[transform,filter] duration-200 hover:-translate-y-0.5 hover:brightness-105 active:translate-y-0 motion-reduce:transition-none"
        >
          <LockIcon size={16} strokeWidth={2.6} />
          {b.unlock}
          <ArrowIcon size={14} />
        </Link>

        <p className="m-0 flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-center text-xs font-bold opacity-70">
          {share !== null && share <= 5 ? (
            <>
              <span>{fmt(b.valueShare, { pct: share })}</span>
              <span aria-hidden>·</span>
            </>
          ) : null}
          <span>{payOnline ? b.trust : b.trustCod}</span>
        </p>
      </div>
    </section>
  );
}

/** A believable amount to blur (never the real one), stable per category and country. */
const placeholderAmount = (i: number, country: string) => {
  const h = (i * 7919 + country.length * 131) % 2800;
  return 150 + h - (h % 10);
};

export function LoadingStep({ headingRef }: { headingRef: RefObject<HTMLHeadingElement | null> }) {
  const { t } = useI18n();
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((n) => n + 1), 220);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="pt-[30px]">
      <h2 ref={headingRef} tabIndex={-1} className={headingClass}>
        {t.brain.loading}
        {".".repeat((tick % 3) + 1)}
      </h2>
      <div className="relative mt-7 h-[90px] overflow-hidden rounded-[18px] border border-dashed border-sea/50 bg-sky">
        <svg viewBox="0 0 280 90" width="100%" height="100%" aria-hidden>
          <path d="M8 66 Q70 18 136 44 T272 34" fill="none" stroke="var(--color-sea)" strokeWidth="2.4" strokeDasharray="5 6" />
        </svg>
        <div aria-hidden className="absolute top-[38px] left-3 animate-plane text-sea motion-reduce:animate-none" dir="ltr">
          <PaperPlaneIcon size={24} />
        </div>
      </div>
    </div>
  );
}
