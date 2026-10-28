"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition, type ReactNode, type RefObject } from "react";
import { suggestBrainTrips } from "@/app/actions/brain";
import { BudgetRange } from "@/components/budget/BudgetRange";
import { useTodayISO } from "@/components/forms";
import { ArrowIcon, OptionIcon, PaperPlaneIcon, TravelerIcon } from "@/components/icons";
import { GROUP_TYPES, STAY_TYPES, type GroupType, type StayType } from "@/data/brain";
import { useI18n } from "@/i18n/client";
import { fmt, label } from "@/i18n/fmt";
import type { Locale } from "@/i18n/config";
import { DEFAULT_BUDGET, DISCOVERY_BUDGET_KEY, clampBudget, formatBudget, formatDT } from "@/lib/budget";
import { CATEGORIES, type BrainInput } from "@/lib/brain/engine";
import { encodeBrainInput } from "@/lib/brain/input";
import type { BrainPreview, PreviewOption } from "@/lib/brain/preview";
import { MAX_VIBES, VIBE_OPTIONS, vibesForCategory } from "@/lib/quiz";
import { whatsappUrl } from "@/lib/requests";
import type { QuizPrefill } from "@/lib/search-params";

const STEPS = ["Budget", "When", "Who", "Vibe", "Stay"] as const;
type QuestionStep = (typeof STEPS)[number];
type Step = QuestionStep | "Loading" | "Results";

const unsplash = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1000&q=85`;
const VISUALS: Record<QuestionStep, { image: string; position?: string }> = {
  Budget: { image: "https://framerusercontent.com/images/snHq8305shuNdUjeU5oyWBUIZw.jpg" },
  When: { image: unsplash("photo-1535392432937-a27c36ec07b5") },
  Who: { image: unsplash("photo-1508904635850-d986b19765d0"), position: "50% 80%" },
  Vibe: { image: unsplash("photo-1595495745827-85bcc5c9a028") },
  Stay: { image: unsplash("photo-1586022045497-31fcf76fa6cc"), position: "50% 65%" },
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
  stay: StayType | "";
}

const DEFAULT_ADULTS: Record<GroupType, number> = { solo: 1, couple: 2, honeymoon: 2, friends: 3, family: 2 };
const GROUP_ICON: Record<GroupType, string> = { solo: "Just me", couple: "Couple", honeymoon: "Couple", friends: "Friends", family: "Family" };
const STAY_ICON: Record<StayType, string> = { budget_hotel: "City", good_hotel: "Luxury", apartment: "Food" };

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
    stay: (a.stay || "good_hotel") as StayType,
  };
}

/**
 * "Find my trip": the trip brain's questionnaire (budget, when, who, vibe, stay) and its locked preview of
 * up to 3 trips in 3 countries, costed by the server (src/lib/brain). Choosing a trip opens the checkout.
 */
export function BrainQuiz({ prefill, whatsappNumber }: { prefill: QuizPrefill; whatsappNumber: string }) {
  const { t, locale, href } = useI18n();
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
    stay: "",
  }));
  const [step, setStep] = useState<Step>("Budget");
  const [preview, setPreview] = useState<BrainPreview | null>(null);
  const [failed, setFailed] = useState(false);
  const [, startTransition] = useTransition();
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
  }, [step]);

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
      case "Stay":
        return a.stay !== "";
    }
  };

  const run = () => {
    setStep("Loading");
    setFailed(false);
    const started = Date.now();
    startTransition(async () => {
      let result: BrainPreview | null = null;
      try {
        result = await suggestBrainTrips(toInput(answers), locale);
      } catch {
        // shown below
      }
      await new Promise((r) => setTimeout(r, Math.max(0, 1300 - (Date.now() - started))));
      setPreview(result);
      setFailed(!result || result.status === "need_info");
      setStep("Results");
    });
  };

  const index = STEPS.indexOf(step as QuestionStep);
  const isQuestion = index !== -1;
  const progress = isQuestion ? index + 1 : STEPS.length;
  const goBack = () => setStep(isQuestion ? STEPS[Math.max(0, index - 1)] : "Stay");
  const goNext = () => (index < STEPS.length - 1 ? setStep(STEPS[index + 1]) : run());

  const visualStep: QuestionStep = isQuestion ? (step as QuestionStep) : "Budget";
  const visual = { ...VISUALS[visualStep], ...t.brain.visuals[visualStep] };

  return (
    <section className="@container relative mx-auto min-h-[620px] w-full max-w-[1120px]">
      <div className="mb-3.5 flex items-center justify-between">
        <div className="text-[15px] font-extrabold tabular-nums">{String(progress).padStart(2, "0")}/05</div>
        <div className="flex w-[120px] gap-1.5" aria-hidden>
          {STEPS.map((s, i) => (
            <span key={s} className={`h-1 flex-1 rounded-full transition-colors ${i < progress ? "bg-orange" : "bg-[#D2D8CF]"}`} />
          ))}
        </div>
      </div>

      <div className={`grid min-w-0 items-start gap-7 ${isQuestion ? "grid-cols-[minmax(0,1.6fr)_minmax(220px,.95fr)] @max-[810px]:grid-cols-1 @max-[810px]:gap-4" : ""}`}>
        <main className="min-w-0">
          {step !== "Budget" && step !== "Loading" ? (
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

              {step === "Stay" ? (
                <div className="grid gap-3">
                  {STAY_TYPES.map((s) => (
                    <Choice key={s} active={answers.stay === s} onClick={() => set("stay", s)} icon={<OptionIcon kind="vibe" name={STAY_ICON[s]} />}>
                      <span className="grid gap-0.5">
                        <span>{t.brain.stays[s].title}</span>
                        <span className="text-sm font-semibold opacity-75">{t.brain.stays[s].body}</span>
                      </span>
                    </Choice>
                  ))}
                </div>
              ) : null}

              <button
                type="button"
                disabled={!canContinue(step as QuestionStep)}
                onClick={goNext}
                className="mt-2 inline-flex cursor-pointer items-center gap-2 justify-self-start rounded-full bg-orange px-7 py-[18px] font-black disabled:cursor-not-allowed disabled:bg-[#B9C0B8]"
              >
                {step === "Stay" ? t.brain.find : t.quiz.continue} <ArrowIcon />
              </button>
            </div>
          ) : null}

          {step === "Loading" ? <LoadingStep headingRef={headingRef} /> : null}

          {step === "Results" ? (
            <Results
              preview={failed ? null : preview}
              answers={answers}
              headingRef={headingRef}
              whatsappNumber={whatsappNumber}
              onChange={() => setStep("Budget")}
              onRestart={() => {
                setAnswers((a) => ({ ...a, depart: "", ret: "", month: null, group: "", vibes: [], stay: "", children: 0, childAges: [] }));
                setStep("Budget");
              }}
            />
          ) : null}
        </main>

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

// ---- Results ----------------------------------------------------------------------------------

function Results({
  preview,
  answers,
  headingRef,
  whatsappNumber,
  onChange,
  onRestart,
}: {
  preview: BrainPreview | null;
  answers: Answers;
  headingRef: RefObject<HTMLHeadingElement | null>;
  whatsappNumber: string;
  onChange: () => void;
  onRestart: () => void;
}) {
  const { t, locale } = useI18n();
  const actions = (
    <div className="flex flex-wrap items-center gap-4">
      <button type="button" onClick={onChange} className="cursor-pointer rounded-full border border-ink/15 bg-white/70 px-5 py-3 font-extrabold hover:bg-white">
        {t.brain.changeAnswers}
      </button>
      <button type="button" onClick={onRestart} className="cursor-pointer font-bold text-sea underline">
        {t.brain.startAgain}
      </button>
    </div>
  );

  if (!preview || preview.status === "need_info") {
    return (
      <div className="grid gap-5 pt-4">
        <h2 ref={headingRef} tabIndex={-1} className={headingClass}>
          {t.brain.error}
        </h2>
        {actions}
      </div>
    );
  }

  const travelers = preview.travelers === 1 ? t.brain.oneTraveler : fmt(t.brain.travelersValue, { n: preview.travelers });
  const nights = fmt(t.brain.nightsValue, { n: preview.nights });

  if (preview.status === "no_fit") {
    const c = preview.closest;
    return (
      <div className="grid max-w-[760px] gap-5 pt-2">
        <h2 ref={headingRef} tabIndex={-1} className={headingClass}>
          {t.brain.noFitTitle}
        </h2>
        <div className="grid gap-3 rounded-[24px] bg-white/75 p-6 ring-1 ring-ink/8">
          {c ? (
            <>
              <p className="m-0 text-lg font-bold">
                {fmt(t.brain.noFitBody, { country: c.countryName, places: c.places.join(t.brain.and), missing: formatDT(c.missingTND, locale) })}
              </p>
              {c.fitsWithNights ? <p className="m-0 font-bold text-sea">{fmt(t.brain.noFitNights, { n: c.fitsWithNights })}</p> : null}
            </>
          ) : (
            <p className="m-0 text-lg font-bold">{t.brain.noFitNone}</p>
          )}
          <a href={whatsappUrl(t.whatsapp.hi, whatsappNumber)} className="mt-2 justify-self-start rounded-full bg-orange px-6 py-3.5 font-black hover:brightness-95">
            {t.brain.talk}
          </a>
        </div>
        {actions}
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="grid max-w-[820px] gap-3">
        <h2 ref={headingRef} tabIndex={-1} className={headingClass}>
          {t.brain.resultsTitle}
        </h2>
        <p className="m-0 text-lg font-bold opacity-85">
          {fmt(t.brain.resultsLead, { travelers, nights, budget: formatDT(preview.totalBudgetTND, locale) })}
        </p>
      </div>

      <div className={`grid gap-5 ${preview.options.length === 3 ? "@min-[900px]:grid-cols-3" : preview.options.length === 2 ? "@min-[700px]:grid-cols-2" : "max-w-[460px]"}`}>
        {preview.options.map((o, i) => (
          <OptionCard key={o.country} option={o} answers={answers} totalBudget={preview.totalBudgetTND} nights={preview.nights} travelers={preview.travelers} index={i} />
        ))}
      </div>

      <p className="m-0 text-sm opacity-70">{t.brain.estimated}</p>
      {actions}
    </div>
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

function OptionCard({
  option: o,
  answers,
  totalBudget,
  nights,
  travelers,
  index,
}: {
  option: PreviewOption;
  answers: Answers;
  totalBudget: number;
  nights: number;
  travelers: number;
  index: number;
}) {
  const { t, locale, href } = useI18n();
  const input = toInput(answers);
  const pocket = formatDT(o.pocketPerPersonPerDay, locale);
  const places = o.bases.map((b) => b.place).join(t.brain.and);
  const group = t.brain.groupTrip[(answers.group || "couple") as GroupType];
  const why = o.vibesMatched.length
    ? fmt(t.brain.why, { group, when: whenText(answers, locale), places, matched: o.vibesMatched.map((v) => label(t.options.vibes, v)).join(t.brain.and), pocket })
    : fmt(t.brain.whyNoVibes, { group, when: whenText(answers, locale), places, pocket });

  const checkout = new URLSearchParams({
    mode: "direct",
    brain: encodeBrainInput(input),
    option: o.country,
    desiredDestination: o.countryName,
    budget: String(Math.round(totalBudget / travelers)),
    travelers: String(travelers),
    duration: `${nights + 1} days`,
  });
  if (input.depart) checkout.set("when", input.depart);

  return (
    <article
      style={{ animationDelay: `${index * 90}ms` }}
      className="flex animate-enter flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_10px_30px_-18px_rgba(32,61,53,.35)] ring-1 ring-ink/8 motion-reduce:animate-none"
    >
      <div className="relative h-[150px] bg-linear-to-br from-sea to-ink">
        {o.image ? <Image src={o.image} alt="" fill sizes="(max-width: 900px) 100vw, 380px" className="object-cover" /> : null}
        <div aria-hidden className="absolute inset-0 bg-linear-to-t from-ink/70 to-transparent" />
        <span className="absolute start-4 top-4 rounded-full bg-orange px-3 py-1.5 text-xs font-black">{t.brain.labels[o.label]}</span>
        <h3 className="absolute start-4 bottom-3 m-0 text-[26px] leading-tight font-black text-cream">{o.countryName}</h3>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <ul className="m-0 grid list-none gap-1 p-0 font-extrabold">
          {o.bases.map((b) => (
            <li key={b.place}>{fmt(t.brain.nightsIn, { place: b.place, n: b.nights })}</li>
          ))}
        </ul>
        <p className="m-0 flex items-start gap-2 text-sm font-bold text-sea">
          <span aria-hidden>{o.season === "best" ? "☀" : "⛅"}</span>
          {t.brain.weather[o.season]}
        </p>
        <p className="m-0 text-[15px] leading-snug opacity-85">{why}</p>

        <div className="grid gap-1 rounded-2xl bg-sky/60 p-4">
          <span className="text-xs font-black tracking-[.08em] text-sea uppercase rtl:tracking-normal">{t.brain.total}</span>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="text-[30px] leading-none font-black tracking-[-0.02em] tabular-nums rtl:tracking-normal">≈ {formatDT(o.tripCostTND, locale)}</span>
            <span className="rounded-full bg-white px-2.5 py-1 text-xs font-black">{t.brain.within}</span>
          </div>
          <span className="text-sm font-bold">{fmt(t.brain.pocket, { amount: pocket })}</span>
        </div>

        <details className="group rounded-2xl ring-1 ring-ink/10">
          <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-extrabold">
            {t.brain.split}
            <span aria-hidden className="transition-transform group-open:rotate-180">⌄</span>
          </summary>
          <ul className="m-0 grid list-none gap-2 px-4 pb-4">
            {CATEGORIES.map((c) => (
              <li key={c} className="grid gap-1">
                <span className="flex justify-between gap-3 text-sm">
                  <span className="opacity-80">{t.brain.categories[c]}</span>
                  <span className="font-black tabular-nums">{formatDT(o.budget[c], locale)}</span>
                </span>
                <span aria-hidden className="h-1.5 overflow-hidden rounded-full bg-ink/8">
                  <span className={`block h-full rounded-full ${c === "pocket_money" ? "bg-sea" : "bg-orange"}`} style={{ width: `${Math.min(100, (o.budget[c] / totalBudget) * 100)}%` }} />
                </span>
              </li>
            ))}
          </ul>
        </details>

        {o.adjustments.length ? (
          <p className="m-0 text-xs font-bold opacity-70">{t.brain.adjustments[o.adjustments[o.adjustments.length - 1] as keyof typeof t.brain.adjustments]}</p>
        ) : null}

        <p className="m-0 flex items-start gap-2 text-xs font-bold opacity-75">
          <span aria-hidden>🔒</span>
          {t.brain.locked}
        </p>

        <Link
          href={href(`/trip-request?${checkout}`)}
          className="mt-auto inline-flex items-center justify-center gap-2 rounded-full bg-ink px-5 py-3.5 font-black text-cream transition-colors hover:bg-orange hover:text-ink"
        >
          {t.brain.choose}
          <ArrowIcon size={14} />
        </Link>
      </div>
    </article>
  );
}

// ---- Small pieces ------------------------------------------------------------------------------

const choiceBase =
  "relative min-h-20 min-w-0 cursor-pointer rounded-[20px] border border-ink/16 px-4 py-3.5 text-start font-extrabold transition-all pointer-fine:hover:-translate-y-0.5 pointer-fine:hover:shadow-[0_10px_24px_rgba(32,61,53,.12)] motion-reduce:transition-none motion-reduce:hover:translate-none";

function Choice({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: ReactNode; children: ReactNode }) {
  return (
    <button type="button" aria-pressed={active} onClick={onClick} className={`${choiceBase} ${active ? "border-orange bg-orange" : "bg-white/67"}`}>
      <span className="flex min-w-0 items-center gap-2.5 text-lg @max-[810px]:text-base">
        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-white/67">{icon}</span>
        {children}
      </span>
    </button>
  );
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`cursor-pointer rounded-full border px-4 py-2.5 text-sm font-extrabold transition-colors ${active ? "border-orange bg-orange" : "border-ink/16 bg-white/67 hover:border-ink/35"}`}
    >
      {children}
    </button>
  );
}

function Stepper({ label: text, value, min, max, onChange, display }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void; display?: string }) {
  const btn = "grid size-11 cursor-pointer place-items-center rounded-full border border-ink/16 bg-white text-xl font-black disabled:cursor-default disabled:opacity-35";
  return (
    <div className="grid gap-1.5">
      <span className="font-bold">{text}</span>
      <div className="flex items-center gap-3">
        <button type="button" aria-label={`${text} −`} disabled={value <= min} onClick={() => onChange(value - 1)} className={btn}>
          −
        </button>
        <span aria-live="polite" className="min-w-[3ch] text-center text-xl font-black tabular-nums">
          {display ?? value}
        </span>
        <button type="button" aria-label={`${text} +`} disabled={value >= max} onClick={() => onChange(value + 1)} className={btn}>
          +
        </button>
      </div>
    </div>
  );
}

function DateField({ label: text, value, min, onChange }: { label: string; value: string; min?: string; onChange: (v: string) => void }) {
  return (
    <label className="grid gap-1.5 font-bold">
      {text}
      <input type="date" value={value} min={min || undefined} onChange={(e) => onChange(e.target.value)} className="w-full min-w-0 rounded-xl border border-ink/25 bg-white px-3 py-2.5" />
    </label>
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
