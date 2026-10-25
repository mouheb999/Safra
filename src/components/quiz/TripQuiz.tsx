"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { BudgetRange } from "@/components/budget/BudgetRange";
import { ArrowIcon, OptionIcon, PaperPlaneIcon, TravelerIcon } from "@/components/icons";
import { DEFAULT_BUDGET, DISCOVERY_BUDGET_KEY, clampBudget, formatBudget, formatRange } from "@/lib/budget";
import {
  DURATION_OPTIONS,
  MAX_VIBES,
  QUESTION_STEPS,
  TRAVELER_OPTIONS,
  VIBE_OPTIONS,
  WHEN_OPTIONS,
  canContinue,
  emptyAnswers,
  reasonText,
  scoreDestinations,
  tripHref,
  vibesForCategory,
  type QuizAnswers,
  type QuizResult,
  type QuizStep,
} from "@/lib/quiz";
import type { Destination } from "@/data/destinations";
import { useI18n } from "@/i18n/client";
import { fmt, label } from "@/i18n/fmt";
import type { QuizPrefill } from "@/lib/search-params";

const LOAD_DELAY_MS = 1600;

const unsplash = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1000&q=85`;

type QuestionStep = (typeof QUESTION_STEPS)[number];

/** Side image per question (its caption comes from t.quiz.visuals). */
const VISUALS: Record<QuestionStep, { image: string; position?: string }> = {
  Budget: { image: "https://framerusercontent.com/images/snHq8305shuNdUjeU5oyWBUIZw.jpg" },
  When: { image: unsplash("photo-1535392432937-a27c36ec07b5") },
  Duration: { image: unsplash("photo-1586022045497-31fcf76fa6cc"), position: "50% 65%" },
  Travelers: { image: unsplash("photo-1508904635850-d986b19765d0"), position: "50% 80%" },
  Vibe: { image: unsplash("photo-1595495745827-85bcc5c9a028") },
};

const headingClass =
  "m-0 text-[38px] leading-[1.03] font-black tracking-[-0.03em] outline-none @min-[501px]:text-[44px] @min-[811px]:text-[58px] rtl:leading-[1.3] rtl:tracking-normal";

export function TripQuiz({ destinations, prefill }: { destinations: Destination[]; prefill: QuizPrefill }) {
  const { t, locale, href } = useI18n();
  const [answers, setAnswers] = useState<QuizAnswers>(() =>
    emptyAnswers(prefill.budget ?? DEFAULT_BUDGET, vibesForCategory(prefill.category)),
  );
  const [step, setStep] = useState<QuizStep>("Budget");
  const [shuffleSeed, setShuffleSeed] = useState(0);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const isFirstRender = useRef(true);

  // No ?budget= in the URL: pick up the value chosen on the home page slider.
  useEffect(() => {
    if (prefill.budget !== null) return;
    try {
      const stored = Number(sessionStorage.getItem(DISCOVERY_BUDGET_KEY));
      if (stored > 0) setAnswers((prev) => ({ ...prev, budget: clampBudget(stored) }));
    } catch {
      // sessionStorage unavailable
    }
  }, [prefill.budget]);

  // Move focus to the new question for keyboard and screen-reader users (not on first load).
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step]);

  useEffect(() => {
    if (step !== "Loading") return;
    const timeout = setTimeout(() => setStep("Results"), LOAD_DELAY_MS);
    return () => clearTimeout(timeout);
  }, [step]);

  const results = useMemo(
    () => (step === "Results" ? scoreDestinations(destinations, answers, shuffleSeed) : []),
    [answers, destinations, shuffleSeed, step],
  );

  const set = <K extends keyof QuizAnswers>(key: K, value: QuizAnswers[K]) =>
    setAnswers((prev) => ({ ...prev, [key]: value }));

  const toggleVibe = (vibe: string) =>
    setAnswers((prev) => {
      if (prev.vibes.includes(vibe)) return { ...prev, vibes: prev.vibes.filter((v) => v !== vibe) };
      if (prev.vibes.length >= MAX_VIBES) return prev;
      return { ...prev, vibes: [...prev.vibes, vibe] };
    });

  const questionIndex = QUESTION_STEPS.indexOf(step as (typeof QUESTION_STEPS)[number]);
  const isQuestion = questionIndex !== -1;
  const progress = isQuestion ? questionIndex + 1 : 5;

  const goBack = () => {
    if (!isQuestion) setStep("Vibe");
    else if (questionIndex > 0) setStep(QUESTION_STEPS[questionIndex - 1]);
  };
  const goNext = () => setStep(questionIndex < QUESTION_STEPS.length - 1 ? QUESTION_STEPS[questionIndex + 1] : "Loading");

  const visualStep: QuestionStep = isQuestion ? (step as QuestionStep) : "Budget";
  const visual = { ...VISUALS[visualStep], ...t.quiz.visuals[visualStep] };

  return (
    <section className="@container relative mx-auto min-h-[620px] w-full max-w-[1088px] rounded-[30px] @max-[810px]:p-6">
      <div className="mb-3.5 flex items-center justify-between">
        <div className="text-[15px] font-extrabold">{String(progress).padStart(2, "0")}/05</div>
        <div className="flex w-[120px] gap-1.5" aria-hidden>
          {[1, 2, 3, 4, 5].map((bar) => (
            <span key={bar} className={`h-1 flex-1 rounded-full ${bar <= progress ? "bg-orange" : "bg-[#D2D8CF]"}`} />
          ))}
        </div>
      </div>

      <div className={`grid min-w-0 items-start gap-7 ${isQuestion ? "grid-cols-[minmax(0,1.6fr)_minmax(220px,.95fr)] @max-[810px]:grid-cols-1 @max-[810px]:gap-4" : ""}`}>
        <main className={`min-w-0 ${isQuestion ? "max-w-[760px]" : ""}`}>
          {step !== "Budget" ? (
            <button type="button" onClick={goBack} className="mb-2.5 cursor-pointer p-0 font-extrabold">
              {t.quiz.back}
            </button>
          ) : null}

          {isQuestion ? (
            <div key={step} className="grid animate-step gap-6 motion-reduce:animate-none">
              <h2 ref={headingRef} tabIndex={-1} className={headingClass}>
                {t.quiz.headings[step as QuestionStep]}
              </h2>

              {step === "Budget" ? (
                <>
                  <p className="m-0 text-xl font-bold opacity-85">{t.quiz.budgetLead}</p>
                  <p className="m-0 text-[13px] font-bold opacity-75">{t.quiz.budgetNote}</p>
                  <div className="mt-6 px-0.5 pt-1">
                    <div className="mb-4 text-center text-[clamp(44px,8cqw,76px)] leading-none font-black tracking-[-0.03em]">
                      {formatBudget(answers.budget, locale)}
                    </div>
                    <BudgetRange value={answers.budget} onChange={(v) => set("budget", v)} />
                  </div>
                </>
              ) : null}

              {step === "When" ? (
                <>
                  <ChoiceGrid>
                    {WHEN_OPTIONS.map((o) => (
                      <Choice key={o} active={answers.when === o} onClick={() => set("when", o)} icon={<OptionIcon kind="when" name={o} />}>
                        {label(t.options.when, o)}
                      </Choice>
                    ))}
                  </ChoiceGrid>
                  {answers.when === "Pick dates" ? (
                    <div className="grid grid-cols-2 gap-2.5">
                      <DateField label={t.quiz.startDate} value={answers.startDate} onChange={(v) => set("startDate", v)} />
                      <DateField label={t.quiz.endDate} value={answers.endDate} min={answers.startDate} onChange={(v) => set("endDate", v)} />
                    </div>
                  ) : null}
                </>
              ) : null}

              {step === "Duration" ? (
                <ChoiceGrid>
                  {DURATION_OPTIONS.map((o) => (
                    <Choice key={o} active={answers.duration === o} onClick={() => set("duration", o)} icon={<OptionIcon kind="duration" name={o} />}>
                      {label(t.options.duration, o)}
                    </Choice>
                  ))}
                </ChoiceGrid>
              ) : null}

              {step === "Travelers" ? (
                <ChoiceGrid>
                  {TRAVELER_OPTIONS.map((o) => (
                    <Choice key={o} active={answers.travelers === o} onClick={() => set("travelers", o)} icon={<TravelerIcon name={o} />}>
                      {label(t.options.travelers, o)}
                    </Choice>
                  ))}
                </ChoiceGrid>
              ) : null}

              {step === "Vibe" ? (
                <>
                  <p className="m-0 text-xl font-bold opacity-85">{t.quiz.vibeLead}</p>
                  <div className="grid grid-cols-3 gap-2.5 @max-[500px]:grid-cols-2">
                    {VIBE_OPTIONS.map((v) => {
                      const active = answers.vibes.includes(v);
                      return (
                        <button
                          key={v}
                          type="button"
                          aria-pressed={active}
                          onClick={() => toggleVibe(v)}
                          className={`${choiceBase} flex items-center justify-center gap-2 rounded-2xl ${active ? "border-orange bg-orange" : "bg-white/67"}`}
                        >
                          <span className="inline-flex size-[30px] items-center justify-center rounded-full bg-white/67">
                            <OptionIcon kind="vibe" name={v} />
                          </span>
                          <span className="@max-[500px]:text-sm">{label(t.options.vibes, v)}</span>
                          {active ? <Check /> : null}
                        </button>
                      );
                    })}
                  </div>
                  <p className="m-0 font-bold opacity-85">
                    {fmt(t.quiz.selected, { n: answers.vibes.length, max: MAX_VIBES })}
                  </p>
                </>
              ) : null}

              <button
                type="button"
                disabled={!canContinue(step, answers)}
                onClick={goNext}
                className="mt-3 inline-flex cursor-pointer items-center gap-2 justify-self-start rounded-full bg-orange px-7 py-[18px] font-black disabled:cursor-not-allowed disabled:bg-[#B9C0B8]"
              >
                {step === "Vibe" ? t.quiz.findEscape : t.quiz.continue} <ArrowIcon />
              </button>

              {/* Small-screen stand-in for the side image */}
              <div aria-hidden className="mt-3 hidden gap-2 @max-[810px]:grid">
                <Image
                  src={visual.image}
                  alt=""
                  width={1520}
                  height={260}
                  sizes="100vw"
                  className="h-[130px] w-full rounded-[42px_24px_52px_22px] object-cover @max-[500px]:h-[100px]"
                  style={{ objectPosition: visual.position }}
                />
                <div className="text-xs font-black tracking-[.08em] text-sea rtl:tracking-normal">{visual.label}</div>
              </div>
            </div>
          ) : null}

          {step === "Loading" ? <LoadingStep headingRef={headingRef} /> : null}

          {step === "Results" ? (
            <div className="grid gap-4">
              <h2 ref={headingRef} tabIndex={-1} className={`${headingClass} max-w-[900px]`}>
                {t.quiz.resultsTitle}
              </h2>
              <p className="m-0 font-bold">{t.quiz.resultsLead}</p>
              <p className="m-0 text-[13px] opacity-75">{t.quiz.resultsNote}</p>
              {results.length === 0 ? (
                <p className="m-0 text-[13px] font-bold opacity-75">{t.quiz.noMatches}</p>
              ) : null}

              {results[0] ? <FeaturedResult result={results[0]} answers={answers} category={prefill.category} /> : null}

              <div className="grid animate-enter grid-cols-2 gap-3 [animation-delay:.08s] motion-reduce:animate-none @max-[810px]:grid-cols-1">
                {results.slice(1).map((r) => (
                  <article key={r.destination.slug} className="grid min-w-0 gap-2.5 rounded-[20px] border border-ink/12 bg-white/67 p-2.5">
                    <div className="relative h-[190px] overflow-hidden rounded-[14px]">
                      <Image src={r.destination.cardImage.src} alt="" fill sizes="(max-width: 810px) 100vw, 520px" className="object-cover" />
                    </div>
                    <div className="grid min-w-0 content-start gap-2">
                      <MatchChip value={r.matchPercent} small />
                      <h3 className="m-0 text-[22px] font-black">{r.destination.title}</h3>
                      <p className="m-0 font-bold opacity-80">{r.destination.country}</p>
                      <p className="m-0 font-bold">{fmt(t.quiz.estimatedBudget, { range: formatRange(r.rangeMin, r.rangeMax, locale) })}</p>
                      <p className="m-0 font-bold">{fmt(t.quiz.recommendedDuration, { duration: label(t.options.duration, r.duration) })}</p>
                      <p className="m-0 opacity-85">{r.tags.map((tag) => label(t.options.vibes, tag)).join(" · ")}</p>
                      <Link
                        href={href(tripHref(r, answers, prefill.category))}
                        className="justify-self-start rounded-full border border-orange px-3.5 py-2.5 font-extrabold hover:bg-orange/15"
                      >
                        {t.quiz.explore}
                      </Link>
                    </div>
                  </article>
                ))}
              </div>

              <div className="flex animate-enter flex-wrap items-center gap-2.5 [animation-delay:.14s] motion-reduce:animate-none">
                <div className="mt-5 basis-full text-2xl font-black">{t.quiz.notFeeling}</div>
                <button
                  type="button"
                  onClick={() => {
                    setShuffleSeed((s) => s + 1);
                    setStep("Loading");
                  }}
                  className="cursor-pointer rounded-full bg-orange px-3.5 py-2.5 font-extrabold"
                >
                  {t.quiz.surpriseAgain}
                </button>
                <button type="button" onClick={() => setStep("Budget")} className="cursor-pointer font-extrabold underline">
                  {t.quiz.changeAnswers}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAnswers(emptyAnswers(prefill.budget ?? DEFAULT_BUDGET));
                    setStep("Budget");
                  }}
                  className="cursor-pointer font-bold text-orange underline"
                >
                  {t.quiz.startAgain}
                </button>
              </div>
            </div>
          ) : null}
        </main>

        {isQuestion ? (
          <aside className="relative w-full self-stretch @max-[810px]:hidden">
            <div className="sticky top-2.5 grid gap-2">
              <div className="text-xs font-black tracking-[.12em] text-sea rtl:tracking-normal">{visual.label}</div>
              <div className="text-[13px] font-bold opacity-80">{visual.detail}</div>
              <svg viewBox="0 0 210 70" width="100%" height="50" aria-hidden>
                <path d="M8 50 Q70 6 132 28 T206 16" fill="none" stroke="var(--color-sea)" strokeWidth="2" strokeDasharray="4 5" />
              </svg>
              <Image
                src={visual.image}
                alt=""
                width={760}
                height={860}
                preload
                sizes="380px"
                className="h-[430px] w-full rounded-[80px_24px_100px_28px] object-cover shadow-[0_12px_28px_rgba(32,61,53,.18)] rtl:rounded-[24px_80px_28px_100px]"
              />
              <div className="absolute end-2.5 top-[94px] rounded-full bg-orange px-2.5 py-2">
                <PaperPlaneIcon size={14} />
              </div>
            </div>
          </aside>
        ) : null}
      </div>
    </section>
  );
}

const choiceBase =
  "relative min-h-24 min-w-0 cursor-pointer rounded-[20px] border border-ink/16 px-4 py-3.5 text-start font-extrabold transition-all @max-[810px]:min-h-20 pointer-fine:hover:-translate-y-0.5 pointer-fine:hover:shadow-[0_10px_24px_rgba(32,61,53,.12)] motion-reduce:transition-none motion-reduce:hover:translate-none";

function ChoiceGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>;
}

function Choice({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: ReactNode; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`${choiceBase} ${active ? "border-orange bg-orange" : "bg-white/67"}`}
    >
      {active ? <Check /> : null}
      <span className="flex min-w-0 items-center gap-2.5 text-lg @max-[810px]:text-base">
        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-white/67">{icon}</span>
        {children}
      </span>
    </button>
  );
}

function Check() {
  return (
    <span aria-hidden className="absolute end-2.5 top-2.5 grid size-5 place-items-center rounded-full bg-white/70 text-xs font-black">
      ✓
    </span>
  );
}

function DateField({ label, value, min, onChange }: { label: string; value: string; min?: string; onChange: (v: string) => void }) {
  return (
    <label className="grid gap-1.5 font-bold">
      {label}
      <input
        type="date"
        value={value}
        min={min || undefined}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-w-0 rounded-xl border border-ink/25 px-3 py-2.5"
      />
    </label>
  );
}

function MatchChip({ value, small = false }: { value: number; small?: boolean }) {
  const { t } = useI18n();
  return (
    <span className={`justify-self-start rounded-full bg-orange font-black ${small ? "px-[9px] py-[5px] text-[11px]" : "px-2.5 py-1.5 text-xs"}`}>
      {fmt(t.match, { n: value })}
    </span>
  );
}

function LoadingStep({ headingRef }: { headingRef: RefObject<HTMLHeadingElement | null> }) {
  const { t } = useI18n();
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((n) => n + 1), 220);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="pt-[30px]">
      <h2 ref={headingRef} tabIndex={-1} className={headingClass}>
        {t.quiz.loading}
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

function FeaturedResult({ result: r, answers, category }: { result: QuizResult; answers: QuizAnswers; category: string }) {
  const { t, locale, href } = useI18n();
  return (
    <article className="grid animate-enter grid-cols-[minmax(0,1.15fr)_minmax(0,.95fr)] items-stretch gap-4 rounded-3xl border border-ink/12 bg-white/67 p-3 motion-reduce:animate-none @max-[810px]:grid-cols-1">
      <div className="relative min-h-[420px] overflow-hidden rounded-[80px_24px_100px_28px] rtl:rounded-[24px_80px_28px_100px] @max-[810px]:h-[340px] @max-[810px]:min-h-[340px] @max-[500px]:h-[260px] @max-[500px]:min-h-[260px]">
        <Image src={r.destination.cardImage.src} alt="" fill sizes="(max-width: 810px) 100vw, 560px" className="object-cover" />
      </div>
      <div className="grid content-start gap-2.5 p-2">
        <MatchChip value={r.matchPercent} />
        <h3 className="m-0 text-[32px] font-black">{r.destination.title}</h3>
        <p className="m-0 font-bold opacity-80">{r.destination.country}</p>
        <p className="m-0 font-bold">{fmt(t.quiz.estimatedBudget, { range: formatRange(r.rangeMin, r.rangeMax, locale) })}</p>
        <p className="m-0 font-bold">{fmt(t.quiz.recommendedDuration, { duration: label(t.options.duration, r.duration) })}</p>
        <div className="flex flex-wrap gap-2">
          {r.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-white/85 px-2.5 py-1.5 font-bold">
              {label(t.options.vibes, tag)}
            </span>
          ))}
        </div>
        <div className="grid gap-1.5 rounded-[14px] bg-white/66 px-3 py-2.5">
          <div className="text-xs font-black tracking-[.08em] text-sea rtl:tracking-normal">{t.quiz.briefLabel}</div>
          <p className="m-0 text-sm leading-[1.4] font-black">{t.quiz.briefTitle}</p>
          <p className="m-0 text-sm leading-[1.45]">{reasonText(answers, r.destination.country, t, locale)}</p>
        </div>
        <Link
          href={href(tripHref(r, answers, category))}
          className="justify-self-start rounded-full bg-orange px-3.5 py-2.5 font-extrabold hover:brightness-95"
        >
          {t.quiz.explore}
        </Link>
      </div>
    </article>
  );
}
