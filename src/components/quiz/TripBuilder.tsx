"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, type ReactNode, type RefObject } from "react";
import { BudgetRange } from "@/components/budget/BudgetRange";
import { ArrowIcon } from "@/components/icons";
import type { BrainBase, StayType } from "@/data/brain";
import { pick } from "@/data/translations";
import { useI18n } from "@/i18n/client";
import { fmt, label } from "@/i18n/fmt";
import { formatBudget, formatDT } from "@/lib/budget";
import {
  MAX_STOPS,
  STAY_ORDER,
  activitiesFor,
  adviseTrip,
  countryCards,
  priceTrip,
  stopSeason,
  suggestRoute,
  type BuilderData,
  type BuiltStop,
  type BuiltTrip,
  type PricedTrip,
  type StopSeason,
  type Tip,
} from "@/lib/brain/builder";
import type { BrainInput } from "@/lib/brain/engine";
import { encodeBuild } from "@/lib/brain/input";
import { CATEGORIES, roomsFor } from "@/lib/brain/pricing";

/** What the visitor has built so far (kept by BrainQuiz, so going back to the questions loses nothing). */
export interface BuildState {
  country: string | null;
  trip: BuiltTrip | null;
}

/** Visitors see amounts to the nearest 10 DT: estimates, not quotes. */
const r10 = (n: number) => Math.round(n / 10) * 10;

const SEASON_TONE: Record<StopSeason, string> = {
  best: "bg-[#DCFCE7] text-[#166534]",
  ok: "bg-[#FEF3C7] text-[#92400E]",
  bad: "bg-[#FEE2E2] text-[#991B1B]",
};
const SEASON_ICON: Record<StopSeason, string> = { best: "☀", ok: "⛅", bad: "🌧" };

const headingClass =
  "m-0 text-[34px] leading-[1.05] font-black tracking-[-0.03em] outline-none @min-[501px]:text-[42px] @min-[811px]:text-[52px] rtl:leading-[1.3] rtl:tracking-normal";

/**
 * "Find my trip", second half: the visitor picks a country, gets a suggested route that fits their answers,
 * then reshapes it — places, nights, hotel level, activities — while the budget and the brain's tips update
 * live (src/lib/brain/builder.ts). "Get my full plan" opens the checkout with the trip they built.
 */
export function TripBuilder({
  input,
  data,
  state,
  setState,
  onBudget,
  onEditAnswers,
  whenLabel,
  headingRef,
}: {
  input: BrainInput;
  data: BuilderData;
  state: BuildState;
  setState: (s: BuildState) => void;
  /** New budget per person. */
  onBudget: (budget: number) => void;
  onEditAnswers: () => void;
  whenLabel: string;
  headingRef: RefObject<HTMLHeadingElement | null>;
}) {
  const { country, trip } = state;
  if (!country || !trip) {
    return (
      <CountryPicker
        input={input}
        data={data}
        onBudget={onBudget}
        onEditAnswers={onEditAnswers}
        headingRef={headingRef}
        onPick={(code, route) => setState({ country: code, trip: route })}
      />
    );
  }
  return (
    <Builder
      input={input}
      data={data}
      trip={trip}
      setTrip={(next) => setState({ country, trip: next })}
      onBudget={onBudget}
      onBack={() => setState({ country: null, trip: null })}
      onEditAnswers={onEditAnswers}
      whenLabel={whenLabel}
      headingRef={headingRef}
    />
  );
}

// ---- Country picker -----------------------------------------------------------------------------

function CountryPicker({
  input,
  data,
  onBudget,
  onEditAnswers,
  onPick,
  headingRef,
}: {
  input: BrainInput;
  data: BuilderData;
  onBudget: (budget: number) => void;
  onEditAnswers: () => void;
  onPick: (code: string, route: BuiltTrip) => void;
  headingRef: RefObject<HTMLHeadingElement | null>;
}) {
  const { t, locale } = useI18n();
  const b = t.brain;
  const cards = useMemo(() => countryCards(input, data), [input, data]);
  const first = cards[0]?.priced;
  const travelers = first ? (first.travelers === 1 ? b.oneTraveler : fmt(b.travelersValue, { n: first.travelers })) : "";
  const nights = first ? fmt(b.nightsValue, { n: first.targetNights }) : "";

  return (
    <div className="grid gap-6">
      <div className="grid max-w-[760px] gap-3">
        <h2 ref={headingRef} tabIndex={-1} className={headingClass}>
          {b.countriesTitle}
        </h2>
        <p className="m-0 text-lg font-bold opacity-85">{fmt(b.countriesLead, { travelers, nights })}</p>
      </div>

      <div className="max-w-[560px] rounded-[24px] bg-white/75 px-5 pt-4 pb-5 ring-1 ring-ink/8">
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-4">
          <span className="font-extrabold">{b.budgetTitle} · {b.perPersonBudget}</span>
          <span className="text-[26px] leading-none font-black tabular-nums">{formatBudget(input.budgetTND, locale)}</span>
        </div>
        <BudgetRange value={input.budgetTND} onChange={onBudget} />
      </div>

      <ul className="m-0 grid list-none gap-5 p-0 @min-[620px]:grid-cols-2 @min-[960px]:grid-cols-3">
        {cards.map((card, i) => {
          const c = data.countries.find((x) => x.code === card.code)!;
          const name = pick(c.translations, locale, "name", c.name);
          const route = card.route.stops.map((s) => placeName(data, s.slug, locale)).join(" · ");
          const fits = card.priced.marginTND >= 0;
          const over = -card.priced.budget.pocket_money;
          return (
            <li
              key={card.code}
              style={{ animationDelay: `${i * 70}ms` }}
              className="flex animate-enter flex-col overflow-hidden rounded-[26px] bg-white shadow-[0_10px_30px_-18px_rgba(32,61,53,.35)] ring-1 ring-ink/8 motion-reduce:animate-none"
            >
              <div className="relative h-[130px] bg-linear-to-br from-sea to-ink">
                {c.image ? <Image src={c.image} alt="" fill sizes="(max-width: 960px) 50vw, 360px" className="object-cover" /> : null}
                <div aria-hidden className="absolute inset-0 bg-linear-to-t from-ink/75 to-transparent" />
                <SeasonChip season={card.season} className="absolute start-3.5 top-3.5" />
                <h3 className="absolute start-4 bottom-3 m-0 text-[24px] leading-tight font-black text-cream">{name}</h3>
              </div>
              <div className="flex flex-1 flex-col gap-3 p-4">
                <p className="m-0 text-sm font-bold opacity-75">{route}</p>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="grid">
                    <span className="text-xs font-black tracking-[.06em] text-sea uppercase rtl:tracking-normal">{b.suggested}</span>
                    <span className="text-[24px] leading-tight font-black tabular-nums">≈ {formatDT(r10(card.priced.tripCostTND), locale)}</span>
                  </span>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-black ${fits ? "bg-[#DCFCE7] text-[#166534]" : "bg-[#FEF3C7] text-[#92400E]"}`}>
                    {fits ? b.fits : over > 0 ? fmt(b.over, { amount: formatDT(r10(over), locale) }) : b.tightChip}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onPick(card.code, card.route)}
                  className="mt-auto inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 font-black text-cream transition-colors hover:bg-orange hover:text-ink"
                >
                  {b.build} <ArrowIcon size={14} />
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <button type="button" onClick={onEditAnswers} className="cursor-pointer justify-self-start rounded-full border border-ink/15 bg-white/70 px-5 py-3 font-extrabold hover:bg-white">
        {b.changeAnswers}
      </button>
    </div>
  );
}

// ---- Builder ------------------------------------------------------------------------------------

function Builder({
  input,
  data,
  trip,
  setTrip,
  onBudget,
  onBack,
  onEditAnswers,
  whenLabel,
  headingRef,
}: {
  input: BrainInput;
  data: BuilderData;
  trip: BuiltTrip;
  setTrip: (t: BuiltTrip) => void;
  onBudget: (budget: number) => void;
  onBack: () => void;
  onEditAnswers: () => void;
  whenLabel: string;
  headingRef: RefObject<HTMLHeadingElement | null>;
}) {
  const { t, locale, href } = useI18n();
  const b = t.brain;
  const country = data.countries.find((c) => c.code === trip.country)!;
  const countryName = pick(country.translations, locale, "name", country.name);
  const priced = useMemo(() => priceTrip(input, trip, data), [input, trip, data]);
  const tips = useMemo(() => adviseTrip(input, trip, data), [input, trip, data]);
  const travelers = input.adults + input.children === 1 ? b.oneTraveler : fmt(b.travelersValue, { n: input.adults + input.children });

  const updateStop = (i: number, patch: Partial<BuiltStop>) => setTrip({ ...trip, stops: trip.stops.map((s, j) => (j === i ? { ...s, ...patch } : s)) });
  const removeStop = (i: number) => setTrip({ ...trip, stops: trip.stops.filter((_, j) => j !== i) });
  const addStop = (base: BrainBase) =>
    setTrip({ ...trip, stops: [...trip.stops, { slug: base.slug, nights: base.minNights, stay: trip.stops.at(-1)?.stay ?? "good_hotel", activities: [] }] });
  const indexOf = (slug: string) => trip.stops.findIndex((s) => s.slug === slug);

  const applyTip = (tip: Tip) => {
    switch (tip.kind) {
      case "cheaper_stay":
      case "upgrade":
        return updateStop(indexOf(tip.slug), { stay: tip.stay });
      case "drop_activity": {
        const i = indexOf(tip.slug);
        return updateStop(i, { activities: trip.stops[i].activities.filter((a) => a !== tip.name) });
      }
      case "min_nights":
        return updateStop(indexOf(tip.slug), { nights: tip.nights });
      case "nights": {
        const last = trip.stops.length - 1;
        return updateStop(last, { nights: Math.max(1, trip.stops[last].nights + tip.target - tip.planned) });
      }
      case "add_place": {
        const base = data.bases.find((x) => x.slug === tip.slug);
        return base ? addStop(base) : undefined;
      }
    }
  };

  const checkoutHref = priced && trip.stops.length ? href(checkoutUrl(input, trip, priced, countryName)) : null;
  const remaining = data.bases.filter((x) => x.countryCode === trip.country && !trip.stops.some((s) => s.slug === x.slug));

  return (
    <div className="grid gap-6 pb-24 min-[960px]:pb-0">
      <div className="grid gap-3">
        <button type="button" onClick={onBack} className="cursor-pointer justify-self-start p-0 font-extrabold">
          <span aria-hidden className="inline-block rtl:rotate-180">←</span> {b.allCountries}
        </button>
        <h2 ref={headingRef} tabIndex={-1} className={headingClass}>
          {fmt(b.title, { country: countryName })}
        </h2>
        <p className="m-0 max-w-[760px] text-lg font-bold opacity-85">{fmt(b.lead, { when: whenLabel, travelers })}</p>
      </div>

      <div className="grid items-start gap-6 @min-[900px]:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid min-w-0 gap-5">
          <Tips tips={tips} data={data} onApply={applyTip} empty={trip.stops.length === 0} />

          {trip.stops.length === 0 ? (
            <p className="m-0 rounded-[24px] border-2 border-dashed border-ink/15 p-6 text-center font-bold opacity-75">{b.empty}</p>
          ) : (
            <ol className="m-0 grid list-none gap-4 p-0">
              {trip.stops.map((stop, i) => (
                <StopCard
                  key={stop.slug}
                  index={i}
                  stop={stop}
                  base={data.bases.find((x) => x.slug === stop.slug)!}
                  input={input}
                  costTND={priced?.stopCostsTND[i] ?? 0}
                  feePct={data.settings.cardFeePct}
                  onChange={(patch) => updateStop(i, patch)}
                  onRemove={() => removeStop(i)}
                />
              ))}
            </ol>
          )}

          <section className="grid gap-3 rounded-[24px] bg-white/60 p-5 ring-1 ring-ink/8">
            <div>
              <h3 className="m-0 text-xl font-black">{b.addPlace}</h3>
              <p className="m-0 text-sm font-bold opacity-70">
                {trip.stops.length >= MAX_STOPS ? b.maxStops : fmt(b.addHint, { country: countryName })}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {remaining.map((base) => {
                const season = stopSeason(base, input);
                return (
                  <button
                    key={base.slug}
                    type="button"
                    disabled={trip.stops.length >= MAX_STOPS}
                    onClick={() => addStop(base)}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-ink/15 bg-white px-3.5 py-2 text-sm font-extrabold transition-colors hover:border-ink/40 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <span aria-hidden className="text-base leading-none">+</span>
                    {placeName(data, base.slug, locale)}
                    <span className={`rounded-full px-1.5 text-xs ${SEASON_TONE[season]}`} title={b.weather[season]}>
                      <span aria-hidden>{SEASON_ICON[season]}</span>
                      <span className="sr-only">{b.weather[season]}</span>
                    </span>
                    <span className="font-semibold opacity-60">{base.strengths.slice(0, 2).map((v) => label(t.options.vibes, v)).join(", ")}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => setTrip(suggestRoute(input, trip.country, data))}
              className="cursor-pointer rounded-full border border-ink/15 bg-white/70 px-5 py-3 font-extrabold hover:bg-white"
            >
              {b.reset}
            </button>
            <button type="button" onClick={() => setTrip({ ...trip, stops: [] })} className="cursor-pointer font-bold text-sea underline">
              {b.clear}
            </button>
            <button type="button" onClick={onEditAnswers} className="cursor-pointer font-bold text-sea underline">
              {b.changeAnswers}
            </button>
          </div>
        </div>

        <aside className="min-w-0 @min-[900px]:sticky @min-[900px]:top-28">
          <BudgetPanel input={input} priced={priced} checkoutHref={checkoutHref} onBudget={onBudget} />
        </aside>
      </div>

      {/* Phones: the total and the button stay in reach while scrolling the stops. */}
      {priced ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-cream/10 bg-ink px-4 py-3 text-cream shadow-[0_-10px_30px_rgba(0,0,0,.18)] min-[960px]:hidden">
          <div className="mx-auto flex max-w-[640px] items-center justify-between gap-3">
            <div className="grid min-w-0">
              <span className="truncate text-lg font-black tabular-nums">
                ≈ {formatDT(r10(priced.tripCostTND), locale)}{" "}
                <span className="text-sm font-bold opacity-70">{fmt(b.ofBudget, { amount: formatDT(priced.totalBudgetTND, locale) })}</span>
              </span>
              <MarginLine priced={priced} compact className="truncate text-xs" />
            </div>
            {checkoutHref ? (
              <Link href={checkoutHref} className="shrink-0 rounded-full bg-orange px-4 py-2.5 text-sm font-black text-ink">
                {b.cta}
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function checkoutUrl(input: BrainInput, trip: BuiltTrip, priced: PricedTrip, countryName: string): string {
  const p = new URLSearchParams({
    mode: "direct",
    build: encodeBuild({ input, trip }),
    desiredDestination: countryName,
    budget: String(input.budgetTND),
    travelers: String(priced.travelers),
    duration: `${priced.nights + 1} days`,
  });
  if (input.depart) p.set("when", input.depart);
  return `/trip-request?${p}`;
}

const placeName = (data: BuilderData, slug: string, locale: Parameters<typeof pick>[1]) => {
  const base = data.bases.find((x) => x.slug === slug);
  return base ? pick(base.translations, locale, "place", base.place) : slug;
};

function SeasonChip({ season, className = "" }: { season: StopSeason; className?: string }) {
  const { t } = useI18n();
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-black ${SEASON_TONE[season]} ${className}`}>
      <span aria-hidden>{SEASON_ICON[season]}</span>
      {t.brain.weather[season]}
    </span>
  );
}

function StopCard({
  index,
  stop,
  base,
  input,
  costTND,
  feePct,
  onChange,
  onRemove,
}: {
  index: number;
  stop: BuiltStop;
  base: BrainBase;
  input: BrainInput;
  costTND: number;
  feePct: number;
  onChange: (patch: Partial<BuiltStop>) => void;
  onRemove: () => void;
}) {
  const { t, locale } = useI18n();
  const b = t.brain;
  const place = pick(base.translations, locale, "place", base.place);
  const offered = activitiesFor(base, input);
  const fee = 1 + feePct / 100;
  const btn = "grid size-9 cursor-pointer place-items-center rounded-full border border-ink/16 bg-white text-lg font-black disabled:cursor-default disabled:opacity-35";

  return (
    <li className="grid animate-fade gap-4 rounded-[24px] bg-white p-5 shadow-[0_8px_24px_-18px_rgba(32,61,53,.4)] ring-1 ring-ink/8 motion-reduce:animate-none">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-ink font-black text-cream">{index + 1}</span>
          <div className="grid min-w-0 gap-1">
            <h3 className="m-0 truncate text-xl leading-tight font-black">{place}</h3>
            <SeasonChip season={stopSeason(base, input)} className="justify-self-start" />
          </div>
        </div>
        <button type="button" onClick={onRemove} aria-label={fmt(b.remove, { place })} className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-full text-xl opacity-60 hover:bg-ink/6 hover:opacity-100">
          ×
        </button>
      </div>

      <div className="grid gap-4 @min-[560px]:grid-cols-[auto_minmax(0,1fr)]">
        <div className="grid content-start gap-1.5">
          <span className="text-sm font-bold opacity-75">{b.stopNights}</span>
          <div className="flex items-center gap-2.5">
            <button type="button" aria-label={`${b.stopNights} −`} disabled={stop.nights <= 1} onClick={() => onChange({ nights: stop.nights - 1 })} className={btn}>
              −
            </button>
            <span aria-live="polite" className="min-w-[2ch] text-center text-xl font-black tabular-nums">
              {stop.nights}
            </span>
            <button type="button" aria-label={`${b.stopNights} +`} disabled={stop.nights >= 30} onClick={() => onChange({ nights: stop.nights + 1 })} className={btn}>
              +
            </button>
          </div>
        </div>
        <div className="grid min-w-0 gap-1.5">
          <span className="text-sm font-bold opacity-75">{b.stopStay}</span>
          <div role="radiogroup" aria-label={b.stopStay} className="grid grid-cols-3 gap-1.5">
            {STAY_ORDER.map((stay: StayType) => {
              const active = stop.stay === stay;
              const night = Math.round(base.stayTND[stay] * roomsFor(stay, input) * fee);
              return (
                <button
                  key={stay}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => onChange({ stay })}
                  className={`grid min-w-0 cursor-pointer gap-0.5 rounded-2xl border px-2.5 py-2 text-start transition-colors ${active ? "border-orange bg-orange/90" : "border-ink/14 bg-white hover:border-ink/35"}`}
                >
                  <span className="text-[13px] leading-tight font-extrabold @min-[640px]:text-sm">{b.stays[stay]}</span>
                  <span className="text-xs font-bold opacity-70 tabular-nums">{fmt(b.perNight, { amount: formatDT(r10(night), locale) })}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid gap-2">
        <span className="text-sm font-bold opacity-75">{b.activities}</span>
        {offered.length === 0 ? (
          <span className="text-sm opacity-60">{b.noActivities}</span>
        ) : (
          <div className="flex flex-wrap gap-2">
            {offered.map((a) => {
              const on = stop.activities.includes(a.name);
              return (
                <button
                  key={a.name}
                  type="button"
                  aria-pressed={on}
                  onClick={() => onChange({ activities: on ? stop.activities.filter((x) => x !== a.name) : [...stop.activities, a.name] })}
                  className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-bold transition-colors ${on ? "border-sea bg-sea text-white" : "border-ink/15 bg-white hover:border-ink/35"}`}
                >
                  <span aria-hidden className="w-3 text-center">{on ? "✓" : "+"}</span>
                  {a.name}
                  <span className={`tabular-nums ${on ? "opacity-85" : "opacity-55"}`}>· {fmt(b.perPerson, { amount: formatDT(a.priceTND, locale) })}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <p className="m-0 text-sm font-bold opacity-65">{fmt(b.stopCost, { amount: formatDT(r10(costTND), locale) })}</p>
    </li>
  );
}

function Tips({ tips, data, onApply, empty }: { tips: Tip[]; data: BuilderData; onApply: (tip: Tip) => void; empty: boolean }) {
  const { t, locale } = useI18n();
  const b = t.brain;
  if (empty) return null;
  const place = (slug: string) => placeName(data, slug, locale);
  const money = (n: number) => formatDT(r10(n), locale);
  const text = (tip: Tip): string => {
    switch (tip.kind) {
      case "over":
        return fmt(b.tips.over, { amount: money(tip.amountTND) });
      case "low_pocket":
        return fmt(b.tips.low_pocket, { amount: formatDT(Math.floor(tip.pocketTND / 5) * 5, locale), min: formatDT(tip.minTND, locale) });
      case "cheaper_stay":
        return fmt(b.tips.cheaper_stay, { stay: b.stays[tip.stay].toLowerCase(), place: place(tip.slug), amount: money(tip.saveTND) });
      case "drop_activity":
        return fmt(b.tips.drop_activity, { name: tip.name, amount: money(tip.saveTND) });
      case "rainy":
        return fmt(b.tips.rainy, { place: place(tip.slug) });
      case "min_nights":
        return fmt(b.tips.min_nights, { place: place(tip.slug), n: tip.nights });
      case "nights":
        return fmt(tip.planned < tip.target ? b.tips.nightsShort : b.tips.nightsLong, { planned: tip.planned, target: tip.target });
      case "many_moves":
        return b.tips.many_moves;
      case "add_place":
        return fmt(b.tips.add_place, { place: place(tip.slug), amount: money(tip.costTND) });
      case "upgrade":
        return fmt(b.tips.upgrade, { stay: b.stays[tip.stay].toLowerCase(), place: place(tip.slug), amount: money(tip.costTND) });
    }
  };
  const action = (tip: Tip): string | null => {
    switch (tip.kind) {
      case "cheaper_stay":
      case "drop_activity":
      case "nights":
      case "add_place":
      case "upgrade":
        return b.tipActions[tip.kind];
      case "min_nights":
        return fmt(b.tipActions.min_nights, { n: tip.nights });
      default:
        return null;
    }
  };
  const tone = (tip: Tip) =>
    tip.kind === "over" || tip.kind === "rainy" ? "border-[#FCA5A5] bg-[#FEF2F2]" : tip.kind === "low_pocket" ? "border-[#FCD34D] bg-[#FFFBEB]" : tip.kind === "add_place" || tip.kind === "upgrade" ? "border-[#86EFAC] bg-[#F0FDF4]" : "border-ink/10 bg-white";

  return (
    <section aria-live="polite" className="grid gap-2.5 rounded-[24px] bg-sky/70 p-4 ring-1 ring-sea/20">
      <span className="flex items-center gap-2 text-xs font-black tracking-[.1em] text-sea uppercase rtl:tracking-normal">
        <BrainIcon /> {b.tipsTitle}
      </span>
      {tips.length === 0 ? (
        <p className="m-0 font-bold">{b.allGood}</p>
      ) : (
        <ul className="m-0 grid list-none gap-2 p-0">
          {tips.map((tip, i) => {
            const act = action(tip);
            return (
              <li key={`${tip.kind}-${i}`} className={`flex flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-2xl border px-3.5 py-2.5 ${tone(tip)}`}>
                <span className="min-w-0 flex-1 text-[15px] font-bold">{text(tip)}</span>
                {act ? (
                  <button type="button" onClick={() => onApply(tip)} className="shrink-0 cursor-pointer rounded-full bg-ink px-3.5 py-1.5 text-sm font-black text-cream hover:bg-orange hover:text-ink">
                    {act}
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/** Green: enough pocket money. Amber: it fits, but leaves little to spend. Red: over the whole budget. */
function MarginLine({ priced, compact = false, className = "" }: { priced: PricedTrip; compact?: boolean; className?: string }) {
  const { t, locale } = useI18n();
  const pocket = formatDT(Math.max(0, Math.floor(priced.pocketPerPersonPerDay / 5) * 5), locale);
  const over = -priced.budget.pocket_money;
  const [tone, text] =
    over > 0
      ? ["text-[#FCA5A5]", fmt(t.brain.short, { amount: formatDT(r10(over), locale) })]
      : priced.marginTND < 0
        ? ["text-[#FCD34D]", fmt(compact ? t.brain.leftShort : t.brain.tight, { amount: pocket })]
        : ["text-[#86EFAC]", fmt(compact ? t.brain.leftShort : t.brain.left, { amount: pocket })];
  return <span className={`font-bold ${tone} ${className}`}>{text}</span>;
}

function BudgetPanel({
  input,
  priced,
  checkoutHref,
  onBudget,
}: {
  input: BrainInput;
  priced: PricedTrip | null;
  checkoutHref: string | null;
  onBudget: (budget: number) => void;
}) {
  const { t, locale } = useI18n();
  const b = t.brain;
  const total = priced?.totalBudgetTND ?? 0;
  const share = (n: number) => (total > 0 ? Math.max(0, Math.min(100, (n / total) * 100)) : 0);
  const segments: { key: string; value: number; tone: string }[] = priced
    ? [
        { key: "flights", value: priced.budget.flights, tone: "bg-orange" },
        { key: "stays", value: priced.budget.stays, tone: "bg-[#F5C9A8]" },
        { key: "rest", value: priced.tripCostTND - priced.budget.flights - priced.budget.stays, tone: "bg-sky" },
      ]
    : [];
  const used = priced ? share(priced.tripCostTND) : 0;

  return (
    <div className="grid gap-4 rounded-[28px] bg-ink p-5 text-cream shadow-[0_18px_40px_-24px_rgba(0,0,0,.5)]">
      <span className="text-xs font-black tracking-[.12em] text-orange uppercase rtl:tracking-normal">{b.budgetTitle}</span>

      <div className="grid gap-2">
        <div className="flex items-baseline justify-between gap-3 text-sm font-bold opacity-85">
          <span>{b.perPersonBudget}</span>
          <span className="tabular-nums">{formatBudget(input.budgetTND, locale)}</span>
        </div>
        <BudgetRange value={input.budgetTND} onChange={onBudget} />
      </div>

      {priced ? (
        <>
          <div className="grid gap-1 border-t border-cream/15 pt-4">
            <span className="text-sm font-bold opacity-75">{b.tripCost}</span>
            <span className="text-[34px] leading-none font-black tracking-[-0.02em] tabular-nums rtl:tracking-normal">≈ {formatDT(r10(priced.tripCostTND), locale)}</span>
            <span className="text-sm font-bold opacity-75">{fmt(b.ofBudget, { amount: formatDT(total, locale) })}</span>
          </div>

          <div aria-hidden className={`flex h-3 overflow-hidden rounded-full bg-cream/12 ${used >= 100 ? "ring-2 ring-[#FCA5A5]" : ""}`}>
            {segments.map((s) => (
              <span key={s.key} className={`h-full transition-[width] duration-300 ${s.tone}`} style={{ width: `${share(s.value)}%` }} />
            ))}
          </div>
          <MarginLine priced={priced} className="text-[15px]" />
          <span className="text-sm font-bold opacity-75">{fmt(b.nightsPlanned, { planned: priced.nights, target: priced.targetNights })}</span>

          <details className="group rounded-2xl bg-cream/6 ring-1 ring-cream/12">
            <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-extrabold">
              {b.breakdown}
              <span aria-hidden className="transition-transform group-open:rotate-180">⌄</span>
            </summary>
            <ul className="m-0 grid list-none gap-1.5 px-4 pb-4 text-sm">
              {CATEGORIES.map((c) => (
                <li key={c} className="flex justify-between gap-3">
                  <span className="opacity-80">{b.categories[c]}</span>
                  <span className={`font-black tabular-nums ${priced.budget[c] < 0 ? "text-[#FCA5A5]" : ""}`}>{formatDT(r10(priced.budget[c]), locale)}</span>
                </li>
              ))}
            </ul>
          </details>
        </>
      ) : null}

      {checkoutHref ? (
        <Link
          href={checkoutHref}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-orange px-5 py-3.5 font-black text-ink transition-[filter] hover:brightness-95"
        >
          {b.cta} <ArrowIcon size={14} />
        </Link>
      ) : null}
      <p className="m-0 flex gap-2 text-xs font-bold opacity-70">
        <span aria-hidden>🔒</span>
        {b.ctaHint}
      </p>
      <p className="m-0 text-xs opacity-60">{b.estimated}</p>
    </div>
  );
}

function BrainIcon(): ReactNode {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9.5 3a3 3 0 0 0-3 3 3 3 0 0 0-2.5 4.5A3 3 0 0 0 5 16a3 3 0 0 0 4.5 3V3Z" />
      <path d="M14.5 3a3 3 0 0 1 3 3 3 3 0 0 1 2.5 4.5A3 3 0 0 1 19 16a3 3 0 0 1-4.5 3V3Z" />
    </svg>
  );
}
