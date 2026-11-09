"use client";

// The trip plan checkout's questions: one per screen, with the same headings, choice cards, pills, steppers,
// buttons and pictures as "Find my trip". The last screen (TripRequestForm) asks for the details and payment.

import type { ReactNode, RefObject } from "react";
import { useTodayISO } from "@/components/forms";
import { ArrowIcon, OptionIcon, TravelerIcon } from "@/components/icons";
import { VISUALS } from "@/components/quiz/BrainQuiz";
import { Choice, DateField, Pill, StepVisual, Stepper, questionHeading, stepButton } from "@/components/quiz/controls";
import { GROUP_TYPES, type GroupType } from "@/data/brain";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n/fmt";
import type { Messages } from "@/i18n/messages/en";
import { formatDT, formatNumber } from "@/lib/budget";

export interface TripAnswers {
  destination: string;
  group: GroupType | "";
  travelers: number;
  /** "" when the visitor isn't sure yet. */
  date: string;
  /** null when the visitor isn't sure yet. */
  days: number | null;
  budget: number | null;
  notes: string;
}

/** Travelers preset by each group card (the stepper adjusts it). */
export const GROUP_TRAVELERS: Record<GroupType, number> = { solo: 1, couple: 2, honeymoon: 2, friends: 3, family: 4 };
const GROUP_ICON: Record<GroupType, string> = { solo: "Just me", couple: "Couple", honeymoon: "Couple", friends: "Friends", family: "Family" };

export const MAX_TRAVELERS = 20;
const DURATIONS = [4, 7, 10, 14] as const;
const BUDGETS = [2000, 3500, 5000, 8000, 12000] as const;

export function groupFor(travelers: number): GroupType | "" {
  return travelers === 1 ? "solo" : travelers === 2 ? "couple" : "";
}

export const durationLabel = (n: number, c: Messages["checkout"]) => (n === 7 ? c.oneWeek : n === 14 ? c.twoWeeks : fmt(c.days, { n }));
export const travelersLabel = (n: number, c: Messages["checkout"]) => (n === 1 ? c.oneTraveler : fmt(c.travelersValue, { n }));

/** One of SAFRA's destinations (the Trip brain countries), named in the visitor's language. */
export interface DestinationOption {
  code: string;
  name: string;
  /** English name, to recognise a destination passed in the URL whatever its language. */
  english: string;
}

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z\u0600-\u06ff]/g, "");
// Names a link may use for a destination listed under another one.
const ALIASES: Record<string, string> = { turkiye: "turkey", indonesia: "bali" };

/** The destination a link asked for (?desiredDestination=Thailand, a pack's country…), if SAFRA offers it. */
export function matchDestination(value: string, options: DestinationOption[]): DestinationOption | undefined {
  const key = norm(value);
  if (!key) return undefined;
  const wanted = ALIASES[key] ?? key;
  return options.find((o) => [o.code, o.name, o.english].some((n) => norm(n) === wanted));
}

/** The checkout's questions, one per screen like "Find my trip" ("where" only when no destination was chosen yet). */
export type TripStep = "where" | "who" | "when" | "budget";
export const tripSteps = (askDestination: boolean): TripStep[] => (askDestination ? ["where", "who", "when", "budget"] : ["who", "when", "budget"]);

/** Whether a step's answer lets the visitor continue (dates and duration are optional). */
export function stepComplete(step: TripStep, a: TripAnswers, destinationRequired: boolean, today: string): boolean {
  switch (step) {
    case "where":
      return !destinationRequired || a.destination.trim() !== "";
    case "who":
      return a.travelers >= 1;
    case "when":
      return !a.date || !today || a.date >= today;
    case "budget":
      return a.budget !== null && a.budget >= 1;
  }
}

/** The picture beside each step: the same ones as "Find my trip". */
const STEP_VISUAL: Record<TripStep, keyof typeof VISUALS> = { where: "Vibe", who: "Who", when: "When", budget: "Budget" };

export function TripChoices({
  answers: a,
  setAnswers,
  step,
  isFirst,
  isLast,
  destinationRequired,
  destinations,
  chips,
  onNext,
  onBack,
  headingRef,
}: {
  answers: TripAnswers;
  setAnswers: React.Dispatch<React.SetStateAction<TripAnswers>>;
  step: TripStep;
  isFirst: boolean;
  isLast: boolean;
  destinationRequired: boolean;
  destinations: DestinationOption[];
  /** Shown under the first question (pack, destination or category chosen before). */
  chips?: ReactNode;
  onNext: () => void;
  onBack: () => void;
  headingRef: RefObject<HTMLHeadingElement | null>;
}) {
  const { t, locale } = useI18n();
  const c = t.checkout;
  const today = useTodayISO();
  const set = <K extends keyof TripAnswers>(key: K, value: TripAnswers[K]) => setAnswers((x) => ({ ...x, [key]: value }));
  const budgetText = a.budget === null ? "" : formatNumber(a.budget, locale);
  const title = { where: c.qWhere, who: c.qWho, when: c.qWhen, budget: c.qBudget }[step];
  const visual = { ...VISUALS[STEP_VISUAL[step]], ...t.brain.visuals[STEP_VISUAL[step]] };
  const subHeading = "m-0 text-xl font-black tracking-[-0.01em] rtl:tracking-normal";

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1.6fr)_minmax(220px,.95fr)] items-start gap-7 @max-[810px]:grid-cols-1 @max-[810px]:gap-4">
      <div className="min-w-0">
        {!isFirst ? (
          <button type="button" onClick={onBack} className="mb-2.5 cursor-pointer p-0 font-extrabold">
            {t.quiz.back}
          </button>
        ) : null}

        <div key={step} className="grid animate-step gap-6 motion-reduce:animate-none">
          <h2 id={`q-${step}`} ref={headingRef} tabIndex={-1} className={questionHeading}>
            {title}
          </h2>
          {isFirst ? chips : null}

          {step === "where" ? (
            <>
              <p className="m-0 text-lg font-bold opacity-85">{c.tripLead}</p>
              {/* Only SAFRA's destinations: the visitor picks one. */}
              <div className="relative">
                <select
                  aria-labelledby="q-where"
                  value={a.destination}
                  onChange={(e) => set("destination", e.target.value)}
                  className={`w-full min-w-0 cursor-pointer appearance-none rounded-[20px] border bg-white/80 py-4 ps-4 pe-12 text-lg font-extrabold ${
                    a.destination ? "border-orange ring-1 ring-orange" : "border-ink/16 text-ink/60"
                  }`}
                >
                  <option value="">{c.pickDestination}</option>
                  {destinations.map((d) => (
                    <option key={d.code} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
                <svg
                  aria-hidden
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="pointer-events-none absolute end-4 top-1/2 -translate-y-1/2"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
            </>
          ) : null}

          {step === "who" ? (
            <>
              <div className="grid grid-cols-3 gap-2.5 @max-[560px]:grid-cols-2">
                {GROUP_TYPES.map((g) => (
                  <Choice
                    key={g}
                    active={a.group === g}
                    onClick={() => setAnswers((x) => ({ ...x, group: g, travelers: GROUP_TRAVELERS[g] }))}
                    icon={g === "honeymoon" ? <OptionIcon kind="vibe" name="Luxury" /> : <TravelerIcon name={GROUP_ICON[g]} />}
                  >
                    {t.brain.groups[g]}
                  </Choice>
                ))}
              </div>
              <div className="rounded-[20px] bg-white/60 p-4 ring-1 ring-ink/8">
                <Stepper
                  label={c.travelers}
                  value={a.travelers}
                  min={1}
                  max={MAX_TRAVELERS}
                  onChange={(n) =>
                    setAnswers((x) => {
                      // Families and friends come in any size; solo/couple follow the count.
                      const keep = x.group === "family" || x.group === "friends" || (x.group !== "" && GROUP_TRAVELERS[x.group] === n);
                      return { ...x, travelers: n, group: keep ? x.group : groupFor(n) };
                    })
                  }
                />
              </div>
            </>
          ) : null}

          {step === "when" ? (
            <>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2.5 @max-[420px]:grid-cols-1">
                <DateField label={c.dateLabel} value={a.date} min={today} onChange={(v) => set("date", v)} />
                <Pill active={a.date === ""} onClick={() => set("date", "")}>
                  {c.notSure}
                </Pill>
              </div>
              <div role="group" aria-labelledby="q-long" className="grid gap-3">
                <h3 id="q-long" className={subHeading}>
                  {c.qLong}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {DURATIONS.map((n) => (
                    <Pill key={n} active={a.days === n} onClick={() => set("days", n)}>
                      {durationLabel(n, c)}
                    </Pill>
                  ))}
                  <Pill active={a.days === null} onClick={() => set("days", null)}>
                    {c.notSure}
                  </Pill>
                </div>
                {a.days !== null ? (
                  <div className="animate-fade rounded-[20px] bg-white/60 p-4 ring-1 ring-ink/8">
                    <Stepper label={c.daysLabel} value={a.days} min={1} max={60} onChange={(n) => set("days", n)} display={durationLabel(a.days, c)} />
                  </div>
                ) : null}
              </div>
            </>
          ) : null}

          {step === "budget" ? (
            <>
              <p className="m-0 text-lg font-bold opacity-85">{c.budgetLead}</p>
              <label className="flex items-baseline justify-center gap-2 rounded-[20px] bg-white/60 px-4 py-4 ring-1 ring-ink/8 focus-within:ring-2 focus-within:ring-orange">
                <input
                  aria-labelledby="q-budget"
                  inputMode="numeric"
                  dir="ltr"
                  value={budgetText}
                  style={{ width: `${Math.max(budgetText.length, 5) + 0.5}ch` }}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "").slice(0, 7);
                    set("budget", digits ? Number(digits) : null);
                  }}
                  placeholder="3,500"
                  className="max-w-full min-w-0 bg-transparent text-center text-[clamp(40px,9cqw,64px)] leading-none font-black tracking-[-0.03em] tabular-nums outline-none placeholder:opacity-30"
                />
                <span className="text-2xl font-black opacity-70">{locale === "ar" ? "د.ت" : "DT"}</span>
              </label>
              <div className="flex flex-wrap justify-center gap-2">
                {BUDGETS.map((n) => (
                  <Pill key={n} active={a.budget === n} onClick={() => set("budget", n)}>
                    {formatDT(n, locale)}
                  </Pill>
                ))}
              </div>
              <div role="group" aria-labelledby="q-notes" className="grid gap-3">
                <h3 id="q-notes" className={subHeading}>
                  {c.qNotes}
                </h3>
                <textarea
                  aria-labelledby="q-notes"
                  rows={3}
                  maxLength={1500}
                  value={a.notes}
                  onChange={(e) => set("notes", e.target.value)}
                  placeholder={t.forms.notesPlaceholder}
                  className="w-full min-w-0 resize-y rounded-[20px] border border-ink/16 bg-white/80 px-4 py-3"
                />
              </div>
            </>
          ) : null}

          <button type="button" disabled={!stepComplete(step, a, destinationRequired, today)} onClick={onNext} className={stepButton}>
            {isLast ? c.toDetails : t.quiz.continue} <ArrowIcon />
          </button>
        </div>
      </div>

      <StepVisual {...visual} />
    </div>
  );
}
