"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { BudgetRange } from "@/components/budget/BudgetRange";
import { useTodayISO } from "@/components/forms";
import { ArrowIcon, OptionIcon, TravelerIcon } from "@/components/icons";
import { GROUP_TYPES, type GroupType } from "@/data/brain";
import { useI18n } from "@/i18n/client";
import { fmt, label } from "@/i18n/fmt";
import type { Locale } from "@/i18n/config";
import { DEFAULT_BUDGET, DISCOVERY_BUDGET_KEY, clampBudget, formatBudget } from "@/lib/budget";
import type { BuilderData } from "@/lib/brain/builder";
import type { BrainInput } from "@/lib/brain/engine";
import { MAX_VIBES, VIBE_OPTIONS, vibesForCategory } from "@/lib/quiz";
import type { QuizPrefill } from "@/lib/search-params";
import { Choice, DateField, Pill, Stepper, choiceBase } from "./controls";
import { TripBuilder, type BuildState } from "./TripBuilder";

const STEPS = ["Budget", "When", "Who", "Vibe"] as const;
type QuestionStep = (typeof STEPS)[number];
type Step = QuestionStep | "Build";

const unsplash = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1000&q=85`;
const VISUALS: Record<QuestionStep, { image: string; position?: string }> = {
  Budget: { image: "https://framerusercontent.com/images/snHq8305shuNdUjeU5oyWBUIZw.jpg" },
  When: { image: unsplash("photo-1535392432937-a27c36ec07b5") },
  Who: { image: unsplash("photo-1508904635850-d986b19765d0"), position: "50% 80%" },
  Vibe: { image: unsplash("photo-1595495745827-85bcc5c9a028") },
};

/** The questionnaire's state; `budget` is per person (the home slider's value). */
interface Answers {
  budget: number;
  whenMode: "dates" | "month";
  depart: string;
  ret: string;
  flexDays: number;
  month: number | null;
  nights: number;
  group: GroupType | "";
  adults: number;
  children: number;
  childAges: number[];
  vibes: string[];
}

const DEFAULT_ADULTS: Record<GroupType, number> = { solo: 1, couple: 2, honeymoon: 2, friends: 3, family: 2 };
const GROUP_ICON: Record<GroupType, string> = { solo: "Just me", couple: "Couple", honeymoon: "Couple", friends: "Friends", family: "Family" };

const headingClass =
  "m-0 text-[38px] leading-[1.03] font-black tracking-[-0.03em] outline-none @min-[501px]:text-[44px] @min-[811px]:text-[56px] rtl:leading-[1.3] rtl:tracking-normal";

function toInput(a: Answers): BrainInput {
  return {
    budgetTND: a.budget,
    budgetScope: "per_person",
    adults: a.adults,
    children: a.children,
    childAges: a.childAges,
    group: (a.group || "couple") as GroupType,
    depart: a.whenMode === "dates" ? a.depart || null : null,
    ret: a.whenMode === "dates" ? a.ret || null : null,
    flexDays: a.whenMode === "dates" ? a.flexDays : 0,
    month: a.whenMode === "month" ? a.month : null,
    nights: a.whenMode === "month" ? a.nights : null,
    vibes: a.vibes,
    // The hotel level is chosen per place in the builder; this only seeds the suggested route.
    stay: "good_hotel",
  };
}

/**
 * "Find my trip": four quick questions (budget, when, who, vibe), then the trip builder — the visitor picks a
 * country and shapes their own trip while the brain prices it live and advises (src/lib/brain/builder.ts).
 */
export function BrainQuiz({ prefill, data }: { prefill: QuizPrefill; data: BuilderData }) {
  const { t, locale } = useI18n();
  const today = useTodayISO();
  const [answers, setAnswers] = useState<Answers>(() => ({
    budget: prefill.budget ?? DEFAULT_BUDGET,
    whenMode: "dates",
    depart: "",
    ret: "",
    flexDays: 0,
    month: null,
    nights: 10,
    group: "",
    adults: 2,
    children: 0,
    childAges: [],
    vibes: vibesForCategory(prefill.category),
  }));
  const [step, setStep] = useState<Step>("Budget");
  const [build, setBuild] = useState<BuildState>({ country: null, trip: null });
  const input = useMemo(() => toInput(answers), [answers]);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  // No ?budget= in the URL: pick up the value chosen on the home page slider.
  useEffect(() => {
    if (prefill.budget !== null) return;
    try {
      const stored = Number(sessionStorage.getItem(DISCOVERY_BUDGET_KEY));
      if (stored > 0) setAnswers((a) => ({ ...a, budget: clampBudget(stored) }));
    } catch {
      // sessionStorage unavailable
    }
  }, [prefill.budget]);

  // Move focus to the new question for keyboard and screen-reader users (not on first load).
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step, build.country]);

  const set = <K extends keyof Answers>(key: K, value: Answers[K]) => setAnswers((a) => ({ ...a, [key]: value }));

  const canContinue = (s: QuestionStep): boolean => {
    const a = answers;
    switch (s) {
      case "Budget":
        return true;
      case "When":
        return a.whenMode === "dates"
          ? Boolean(a.depart && a.ret && a.ret > a.depart && (!today || a.depart >= today))
          : a.month !== null && a.nights >= 3;
      case "Who":
        return a.group !== "" && a.adults >= 1 && a.childAges.length === a.children;
      case "Vibe":
        return a.vibes.length > 0;
    }
  };

  const index = STEPS.indexOf(step as QuestionStep);
  const isQuestion = index !== -1;
  const progress = isQuestion ? index + 1 : STEPS.length + 1;
  const goBack = () => setStep(STEPS[Math.max(0, index - 1)]);
  const goNext = () => setStep(index < STEPS.length - 1 ? STEPS[index + 1] : "Build");

  const visualStep: QuestionStep = isQuestion ? (step as QuestionStep) : "Budget";
  const visual = { ...VISUALS[visualStep], ...t.brain.visuals[visualStep] };

  return (
    <section className="@container relative mx-auto min-h-[620px] w-full max-w-[1120px]">
      <div className="mb-3.5 flex items-center justify-between">
        <div className="text-[15px] font-extrabold tabular-nums">{String(progress).padStart(2, "0")}/05</div>
        <div className="flex w-[120px] gap-1.5" aria-hidden>
          {[...STEPS, "Build"].map((s, i) => (
            <span key={s} className={`h-1 flex-1 rounded-full transition-colors ${i < progress ? "bg-orange" : "bg-[#D2D8CF]"}`} />
          ))}
        </div>
      </div>

      <div className={`grid min-w-0 items-start gap-7 ${isQuestion ? "grid-cols-[minmax(0,1.6fr)_minmax(220px,.95fr)] @max-[810px]:grid-cols-1 @max-[810px]:gap-4" : ""}`}>
        <div className="min-w-0">
          {isQuestion && step !== "Budget" ? (
            <button type="button" onClick={goBack} className="mb-2.5 cursor-pointer p-0 font-extrabold">
              {t.quiz.back}
            </button>
          ) : null}

          {isQuestion ? (
            <div key={step} className="grid animate-step gap-6 motion-reduce:animate-none">
              <h2 ref={headingRef} tabIndex={-1} className={headingClass}>
                {t.brain.headings[step as QuestionStep]}
              </h2>

              {step === "Budget" ? (
                <>
                  <p className="m-0 text-lg font-bold opacity-85">{t.brain.budgetLead}</p>
                  <div className="mt-4 px-0.5 pt-1">
                    <div className="mb-4 text-center text-[clamp(44px,8cqw,76px)] leading-none font-black tracking-[-0.03em] tabular-nums">
                      {formatBudget(answers.budget, locale)}
                    </div>
                    <BudgetRange value={answers.budget} onChange={(v) => set("budget", v)} />
                  </div>
                </>
              ) : null}

              {step === "When" ? <WhenStep answers={answers} set={set} today={today} /> : null}
              {step === "Who" ? <WhoStep answers={answers} setAnswers={setAnswers} /> : null}

              {step === "Vibe" ? (
                <>
                  <p className="m-0 text-xl font-bold opacity-85">{t.brain.vibeLead}</p>
                  <div className="grid grid-cols-3 gap-2.5 @max-[500px]:grid-cols-2">
                    {VIBE_OPTIONS.map((v) => {
                      const active = answers.vibes.includes(v);
                      return (
                        <button
                          key={v}
                          type="button"
                          aria-pressed={active}
                          onClick={() =>
                            setAnswers((a) =>
                              a.vibes.includes(v)
                                ? { ...a, vibes: a.vibes.filter((x) => x !== v) }
                                : a.vibes.length >= MAX_VIBES
                                  ? a
                                  : { ...a, vibes: [...a.vibes, v] },
                            )
                          }
                          className={`${choiceBase} flex items-center justify-center gap-2 rounded-2xl ${active ? "border-orange bg-orange" : "bg-white/67"}`}
                        >
                          <span className="inline-flex size-[30px] items-center justify-center rounded-full bg-white/67">
                            <OptionIcon kind="vibe" name={v} />
                          </span>
                          <span className="@max-[500px]:text-sm">{label(t.options.vibes, v)}</span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="m-0 font-bold opacity-85">{fmt(t.quiz.selected, { n: answers.vibes.length, max: MAX_VIBES })}</p>
                </>
              ) : null}

              <button
                type="button"
                disabled={!canContinue(step as QuestionStep)}
                onClick={goNext}
                className="mt-2 inline-flex cursor-pointer items-center gap-2 justify-self-start rounded-full bg-orange px-7 py-[18px] font-black disabled:cursor-not-allowed disabled:bg-[#B9C0B8]"
              >
                {step === "Vibe" ? t.brain.next : t.quiz.continue} <ArrowIcon />
              </button>
            </div>
          ) : null}

          {step === "Build" ? (
            <TripBuilder
              input={input}
              data={data}
              state={build}
              setState={setBuild}
              onBudget={(v) => set("budget", v)}
              onEditAnswers={() => setStep("Budget")}
              whenLabel={whenText(answers, locale)}
              headingRef={headingRef}
            />
          ) : null}
        </div>

        {isQuestion ? (
          <aside className="relative w-full self-stretch @max-[810px]:hidden">
            <div className="sticky top-2.5 grid gap-2">
              <div className="text-xs font-black tracking-[.12em] text-sea rtl:tracking-normal">{visual.label}</div>
              <div className="text-[13px] font-bold opacity-80">{visual.detail}</div>
              <Image
                src={visual.image}
                alt=""
                width={760}
                height={860}
                preload
                sizes="380px"
                className="mt-2 h-[430px] w-full rounded-[80px_24px_100px_28px] bg-sky object-cover shadow-[0_12px_28px_rgba(32,61,53,.18)] rtl:rounded-[24px_80px_28px_100px]"
                style={{ objectPosition: visual.position }}
              />
            </div>
          </aside>
        ) : null}
      </div>
    </section>
  );
}

// ---- Steps ----------------------------------------------------------------------------------

function WhenStep({ answers: a, set, today }: { answers: Answers; set: <K extends keyof Answers>(k: K, v: Answers[K]) => void; today: string }) {
  const { t, locale } = useI18n();
  // The next 12 months, starting with the current one (computed once `today` is known, after mount).
  const months = useMemo(() => {
    if (!today) return [];
    const [y, m] = today.split("-").map(Number);
    const name = new Intl.DateTimeFormat(locale === "ar" ? "ar-TN-u-nu-latn" : locale, { month: "short", year: "numeric", timeZone: "UTC" });
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(Date.UTC(y, m - 1 + i, 1));
      return { month: d.getUTCMonth() + 1, label: name.format(d) };
    });
  }, [today, locale]);

  return (
    <>
      <div role="radiogroup" className="inline-flex justify-self-start rounded-full bg-ink/6 p-1">
        {(["dates", "month"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            role="radio"
            aria-checked={a.whenMode === mode}
            onClick={() => set("whenMode", mode)}
            className={`cursor-pointer rounded-full px-5 py-2.5 font-extrabold transition-colors ${a.whenMode === mode ? "bg-white shadow-[0_2px_8px_rgba(32,61,53,.12)]" : "opacity-70"}`}
          >
            {mode === "dates" ? t.brain.whenDates : t.brain.whenMonth}
          </button>
        ))}
      </div>

      {a.whenMode === "dates" ? (
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-2.5">
            <DateField label={t.brain.depart} value={a.depart} min={today} onChange={(v) => set("depart", v)} />
            <DateField label={t.brain.ret} value={a.ret} min={a.depart || today} onChange={(v) => set("ret", v)} />
          </div>
          <div className="grid gap-2">
            <span className="font-bold">{t.brain.flex}</span>
            <div className="flex flex-wrap gap-2">
              {[0, 1, 2, 3].map((n) => (
                <Pill key={n} active={a.flexDays === n} onClick={() => set("flexDays", n)}>
                  {n === 0 ? t.brain.flexNone : fmt(t.brain.flexDays, { n })}
                </Pill>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-5">
          <div className="grid grid-cols-4 gap-2 @max-[500px]:grid-cols-3">
            {months.map((m) => (
              <Pill key={m.label} active={a.month === m.month} onClick={() => set("month", m.month)}>
                {m.label}
              </Pill>
            ))}
          </div>
          <Stepper label={t.brain.nights} value={a.nights} min={3} max={30} onChange={(v) => set("nights", v)} display={fmt(t.brain.nightsValue, { n: a.nights })} />
        </div>
      )}
    </>
  );
}

function WhoStep({ answers: a, setAnswers }: { answers: Answers; setAnswers: React.Dispatch<React.SetStateAction<Answers>> }) {
  const { t } = useI18n();
  const setChildren = (n: number) =>
    setAnswers((x) => ({ ...x, children: n, childAges: x.childAges.slice(0, n).concat(Array(Math.max(0, n - x.childAges.length)).fill(6)) }));
  return (
    <>
      <div className="grid grid-cols-3 gap-2.5 @max-[560px]:grid-cols-2">
        {GROUP_TYPES.map((g) => (
          <Choice
            key={g}
            active={a.group === g}
            onClick={() =>
              setAnswers((x) => ({
                ...x,
                group: g,
                adults: DEFAULT_ADULTS[g],
                children: g === "family" ? Math.max(1, x.children) : 0,
                childAges: g === "family" ? (x.childAges.length ? x.childAges : [6]) : [],
              }))
            }
            icon={g === "honeymoon" ? <OptionIcon kind="vibe" name="Luxury" /> : <TravelerIcon name={GROUP_ICON[g]} />}
          >
            {t.brain.groups[g]}
          </Choice>
        ))}
      </div>
      {a.group ? (
        <div className="grid animate-fade gap-4 rounded-[20px] bg-white/60 p-4 ring-1 ring-ink/8">
          <div className="grid grid-cols-2 gap-3 @max-[420px]:grid-cols-1">
            <Stepper label={t.brain.adults} value={a.adults} min={1} max={9} onChange={(v) => setAnswers((x) => ({ ...x, adults: v }))} />
            <Stepper label={t.brain.children} value={a.children} min={0} max={6} onChange={setChildren} />
          </div>
          {a.children > 0 ? (
            <div className="grid grid-cols-3 gap-2.5 @max-[500px]:grid-cols-2">
              {a.childAges.map((age, i) => (
                <label key={i} className="grid gap-1.5 text-sm font-bold">
                  {fmt(t.brain.childAge, { n: i + 1 })}
                  <select
                    value={age}
                    onChange={(e) =>
                      setAnswers((x) => ({ ...x, childAges: x.childAges.map((v, j) => (j === i ? Number(e.target.value) : v)) }))
                    }
                    className="w-full rounded-xl border border-ink/25 bg-white px-3 py-2.5"
                  >
                    {Array.from({ length: 18 }, (_, n) => (
                      <option key={n} value={n}>
                        {fmt(t.brain.ageValue, { n })}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

function whenText(a: Answers, locale: Locale): string {
  const tag = locale === "ar" ? "ar-TN-u-nu-latn" : locale;
  if (a.whenMode === "month" && a.month) {
    return new Intl.DateTimeFormat(tag, { month: "long", timeZone: "UTC" }).format(new Date(Date.UTC(2026, a.month - 1, 1)));
  }
  const d = (s: string) => new Date(`${s}T00:00:00Z`);
  const f = new Intl.DateTimeFormat(tag, { day: "numeric", month: "short", timeZone: "UTC" });
  return a.depart && a.ret ? `${f.format(d(a.depart))} – ${f.format(d(a.ret))}` : "";
}
