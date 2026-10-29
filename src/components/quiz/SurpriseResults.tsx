"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type RefObject } from "react";
import { BudgetRange } from "@/components/budget/BudgetRange";
import { ArrowIcon, PaperPlaneIcon } from "@/components/icons";
import type { GroupType } from "@/data/brain";
import { useI18n } from "@/i18n/client";
import { fmt, label } from "@/i18n/fmt";
import { BUDGET_STEP, clampBudget, formatBudget, formatDT } from "@/lib/budget";
import type { BrainInput } from "@/lib/brain/engine";
import { encodeInput } from "@/lib/brain/input";
import type { SurpriseOption, SurprisePreview } from "@/lib/brain/preview";
import { CATEGORIES } from "@/lib/brain/pricing";
import { whatsappUrl } from "@/lib/requests";

const headingClass =
  "m-0 text-[38px] leading-[1.03] font-black tracking-[-0.03em] outline-none @min-[501px]:text-[44px] @min-[811px]:text-[56px] rtl:leading-[1.3] rtl:tracking-normal";

/** How many program days show (blurred) before the lock. */
const PREVIEW_DAYS = 4;

/**
 * "Surprise me" results: the 2 best trips, each with its money and a locked, blurred day-by-day program.
 * The visitor can move the budget here and the trips update; "Unlock my program" opens the checkout.
 */
export function SurpriseResults({
  preview,
  input,
  whenLabel,
  planPriceDT,
  whatsappNumber,
  refreshing,
  onBudget,
  onChange,
  onRestart,
  headingRef,
}: {
  preview: SurprisePreview | null;
  input: BrainInput;
  whenLabel: string;
  planPriceDT: number;
  whatsappNumber: string;
  refreshing: boolean;
  /** New budget per person. */
  onBudget: (budget: number) => void;
  onChange: () => void;
  onRestart: () => void;
  headingRef: RefObject<HTMLHeadingElement | null>;
}) {
  const { t, locale } = useI18n();
  const b = t.brain;
  const actions = (
    <div className="flex flex-wrap items-center gap-4">
      <button type="button" onClick={onChange} className="cursor-pointer rounded-full border border-ink/15 bg-white/70 px-5 py-3 font-extrabold hover:bg-white">
        {b.changeAnswers}
      </button>
      <button type="button" onClick={onRestart} className="cursor-pointer font-bold text-sea underline">
        {b.startAgain}
      </button>
    </div>
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

      <BudgetEditor value={input.budgetTND} refreshing={refreshing} onCommit={onBudget} />

      <div className={`grid gap-5 transition-opacity duration-300 @min-[760px]:grid-cols-2 ${refreshing ? "pointer-events-none opacity-45" : ""}`}>
        {preview.options.map((o, i) => (
          <OptionCard
            key={o.country}
            option={o}
            index={i}
            input={input}
            nights={preview.nights}
            travelers={preview.travelers}
            totalBudget={preview.totalBudgetTND}
            planPriceDT={planPriceDT}
            onBudget={onBudget}
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
  totalBudget,
  planPriceDT,
  onBudget,
}: {
  option: SurpriseOption;
  index: number;
  input: BrainInput;
  nights: number;
  travelers: number;
  totalBudget: number;
  planPriceDT: number;
  onBudget: (budget: number) => void;
}) {
  const { t, locale, href } = useI18n();
  const b = t.brain;
  const group = b.groupTrip[input.group as GroupType];
  const why = o.vibesMatched.length
    ? fmt(b.why, { matched: o.vibesMatched.map((v) => label(t.options.vibes, v)).join(b.and), group })
    : fmt(b.whyNoVibes, { group });
  // The per-person budget that would cover what's missing (when the slider can reach it).
  const needed = o.fits ? null : clampBudget(input.budgetTND + Math.ceil(o.missingTND / travelers / BUDGET_STEP) * BUDGET_STEP);

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
          {needed && needed > input.budgetTND ? (
            <button type="button" onClick={() => onBudget(needed)} className="mt-1 cursor-pointer justify-self-start rounded-full bg-ink px-4 py-2 text-sm font-black text-cream hover:bg-orange hover:text-ink">
              {fmt(b.tryBudget, { amount: formatDT(needed, locale) })}
            </button>
          ) : null}
        </div>

        <details className="group rounded-2xl ring-1 ring-ink/10">
          <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-extrabold">
            {b.split}
            <span aria-hidden className="transition-transform group-open:rotate-180">⌄</span>
          </summary>
          <ul className="m-0 grid list-none gap-2 px-4 pb-4">
            {CATEGORIES.map((c) => (
              <li key={c} className="grid gap-1">
                <span className="flex justify-between gap-3 text-sm">
                  <span className="opacity-80">{b.categories[c]}</span>
                  <span className="font-black tabular-nums">{formatDT(Math.max(0, o.budget[c]), locale)}</span>
                </span>
                <span aria-hidden className="h-1.5 overflow-hidden rounded-full bg-ink/8">
                  <span
                    className={`block h-full rounded-full ${c === "pocket_money" ? "bg-sea" : "bg-orange"}`}
                    style={{ width: `${Math.max(0, Math.min(100, (o.budget[c] / totalBudget) * 100))}%` }}
                  />
                </span>
              </li>
            ))}
          </ul>
        </details>

        <LockedProgram option={o} unlockHref={unlockHref} planPriceDT={planPriceDT} />
      </div>
    </article>
  );
}

/**
 * The program's shape — day numbers and places — over blurred placeholder text. The real plan is never sent
 * to the browser, so there is nothing to reveal by removing the blur.
 */
function LockedProgram({ option: o, unlockHref, planPriceDT }: { option: SurpriseOption; unlockHref: string; planPriceDT: number }) {
  const { t, locale } = useI18n();
  const b = t.brain;
  const shown = o.days.slice(0, PREVIEW_DAYS);
  const more = o.days.length - shown.length;

  return (
    <section aria-label={b.program} className="relative mt-auto overflow-hidden rounded-2xl bg-cream/60 ring-1 ring-ink/10">
      <h4 className="m-0 px-4 pt-3.5 pb-1 text-sm font-black">{b.program}</h4>
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

      <div className="relative -mt-16 grid justify-items-center gap-2 bg-linear-to-b from-transparent via-white/95 to-white px-4 pt-14 pb-4 text-center">
        <span aria-hidden className="grid size-10 place-items-center rounded-full bg-ink text-lg text-cream shadow-[0_6px_16px_rgba(32,61,53,.3)]">
          🔒
        </span>
        <strong className="text-base">{b.lockedTitle}</strong>
        {more > 0 ? <span className="text-xs font-bold opacity-70">{fmt(b.moreDays, { n: more })}</span> : null}
        <span className="text-sm opacity-80">{o.activityCount ? fmt(b.lockedBody, { n: o.activityCount }) : b.lockedBodyNoActs}</span>
        <Link
          href={unlockHref}
          className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-5 py-3.5 font-black text-cream transition-colors hover:bg-orange hover:text-ink"
        >
          {fmt(b.unlock, { price: formatDT(planPriceDT, locale) })}
          <ArrowIcon size={14} />
        </Link>
      </div>
    </section>
  );
}

/** The budget slider on the results: trips update a moment after the visitor lets go. */
function BudgetEditor({ value, refreshing, onCommit }: { value: number; refreshing: boolean; onCommit: (budget: number) => void }) {
  const { t, locale } = useI18n();
  const [draft, setDraft] = useState(value);
  const [synced, setSynced] = useState(value);
  // A budget set from outside (the "Try … per person" button) moves the slider too.
  if (value !== synced) {
    setSynced(value);
    setDraft(value);
  }
  useEffect(() => {
    if (draft === value) return;
    const timer = setTimeout(() => onCommit(draft), 450);
    return () => clearTimeout(timer);
  }, [draft, value, onCommit]);

  return (
    <div className="grid max-w-[640px] gap-3 rounded-[24px] bg-white/75 px-5 pt-4 pb-5 ring-1 ring-ink/8">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className="font-extrabold">{t.brain.editBudget}</span>
        <span className="text-[28px] leading-none font-black tracking-[-0.02em] tabular-nums">{formatBudget(draft, locale)}</span>
      </div>
      <BudgetRange value={draft} onChange={setDraft} />
      <p aria-live="polite" className={`m-0 h-4 text-sm font-bold text-sea transition-opacity ${refreshing ? "opacity-100" : "opacity-0"}`}>
        {refreshing ? t.brain.updating : ""}
      </p>
    </div>
  );
}

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
