"use client";

// Page 1 of the trip plan checkout: the trip itself, answered with the same choice cards, pills and
// steppers as "Find my trip". Page 2 (TripRequestForm) asks for the visitor's details and payment.

import type { ReactNode } from "react";
import { useTodayISO } from "@/components/forms";
import { ArrowIcon, OptionIcon, TravelerIcon } from "@/components/icons";
import { Choice, DateField, Pill, Stepper } from "@/components/quiz/controls";
import { GROUP_TYPES, type GroupType } from "@/data/brain";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n/fmt";
import type { Messages } from "@/i18n/messages/en";
import { formatDT, formatNumber } from "@/lib/budget";
import { cardClass } from "./RequestHeader";

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

/** Page 1 can be left once these are answered (date and duration are optional). */
export function tripComplete(a: TripAnswers, destinationRequired: boolean, today: string): boolean {
  return (
    (!destinationRequired || a.destination.trim() !== "") &&
    a.travelers >= 1 &&
    a.budget !== null &&
    a.budget >= 1 &&
    (!a.date || !today || a.date >= today)
  );
}

export function TripChoices({
  answers: a,
  setAnswers,
  askDestination,
  destinationRequired,
  onNext,
}: {
  answers: TripAnswers;
  setAnswers: React.Dispatch<React.SetStateAction<TripAnswers>>;
  askDestination: boolean;
  destinationRequired: boolean;
  onNext: () => void;
}) {
  const { t, locale } = useI18n();
  const c = t.checkout;
  const today = useTodayISO();
  const set = <K extends keyof TripAnswers>(key: K, value: TripAnswers[K]) => setAnswers((x) => ({ ...x, [key]: value }));
  const budgetText = a.budget === null ? "" : formatNumber(a.budget, locale);

  return (
    <section className={`${cardClass} gap-7 p-6 @max-[560px]:p-5`}>
      {askDestination ? (
        <Question title={`${c.qWhere}${destinationRequired ? " *" : ""}`} id="q-where">
          <input
            aria-labelledby="q-where"
            type="text"
            maxLength={120}
            value={a.destination}
            onChange={(e) => set("destination", e.target.value)}
            placeholder={t.request.desiredPlaceholder}
            className="w-full min-w-0 rounded-[20px] border border-ink/16 bg-white/80 px-4 py-4 text-lg font-extrabold placeholder:font-bold placeholder:opacity-60"
          />
        </Question>
      ) : null}

      <Question title={c.qWho} id="q-who">
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
      </Question>

      <Question title={c.qWhen} id="q-when">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2.5 @max-[420px]:grid-cols-1">
          <DateField label={c.dateLabel} value={a.date} min={today} onChange={(v) => set("date", v)} />
          <Pill active={a.date === ""} onClick={() => set("date", "")}>
            {c.notSure}
          </Pill>
        </div>
      </Question>

      <Question title={c.qLong} id="q-long">
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
      </Question>

      <Question title={`${c.qBudget} *`} id="q-budget">
        <p className="m-0 -mt-1 font-bold opacity-80">{c.budgetLead}</p>
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
      </Question>

      <Question title={c.qNotes} id="q-notes">
        <textarea
          aria-labelledby="q-notes"
          rows={3}
          maxLength={1500}
          value={a.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder={t.forms.notesPlaceholder}
          className="w-full min-w-0 resize-y rounded-[20px] border border-ink/16 bg-white/80 px-4 py-3"
        />
      </Question>

      <button
        type="button"
        disabled={!tripComplete(a, destinationRequired, today)}
        onClick={onNext}
        className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-orange px-7 py-[18px] text-lg font-black disabled:cursor-not-allowed disabled:bg-[#B9C0B8]"
      >
        {c.toDetails} <ArrowIcon />
      </button>
    </section>
  );
}

function Question({ title, id, children }: { title: string; id: string; children: ReactNode }) {
  return (
    <div role="group" aria-labelledby={id} className="grid gap-3">
      <h2 id={id} className="m-0 text-[28px] leading-tight font-black tracking-[-0.02em] @max-[560px]:text-2xl rtl:tracking-normal">
        {title}
      </h2>
      {children}
    </div>
  );
}
