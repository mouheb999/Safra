var __dai_window=typeof window!=="undefined"?window:undefined;var __dai_navigator=typeof __dai_window!=="undefined"?navigator:undefined;

// http-url:https://framerusercontent.com/modules/qOKUWQGWrvHPae6Ae4sC/FUh1RyAbXIMcOz8rwUc7/SAFRATripQuiz.js
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { addPropertyControls, ControlType, Link, RenderTarget } from "./_framer-runtime.js";
var MIN_BUDGET = 1e3;
var MAX_BUDGET = 1e4;
var BUDGET_STEP = 100;
function clampBudget(value) {
  return Math.min(MAX_BUDGET, Math.max(MIN_BUDGET, Math.round(value / BUDGET_STEP) * BUDGET_STEP));
}
function ArrowIcon({ color }) {
  return /* @__PURE__ */ _jsxs("svg", { width: "16", height: "16", viewBox: "0 0 16 16", "aria-hidden": true, children: [/* @__PURE__ */ _jsx("path", { d: "M3 8h9", stroke: color, strokeWidth: "1.8", strokeLinecap: "round" }), /* @__PURE__ */ _jsx("path", { d: "m8.5 3.5 4 4.5-4 4.5", stroke: color, strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" })] });
}
function PlaneIcon({ color = "currentColor", size = 18 }) {
  return /* @__PURE__ */ _jsx("svg", { width: size, height: size, viewBox: "0 0 24 24", "aria-hidden": true, children: /* @__PURE__ */ _jsx("path", { d: "M21.6 3.8a1 1 0 0 0-1-.2l-17 7a1 1 0 0 0 .1 1.9l6.7 1.8 1.8 6.7a1 1 0 0 0 .9.7h.1a1 1 0 0 0 .9-.6l7-17a1 1 0 0 0-.5-1.3Zm-8 14.1-1.2-4.6a1 1 0 0 0-.7-.7L7 11.4l11.2-4.6-4.6 11.1Z", fill: color }) });
}
function OptionIcon({ name, color }) {
  if (name === "This month" || name === "Next month" || name === "Pick dates" || name === "I\u2019m flexible") {
    return /* @__PURE__ */ _jsxs("svg", { width: "24", height: "24", viewBox: "0 0 24 24", "aria-hidden": true, children: [/* @__PURE__ */ _jsx("rect", { x: "3.5", y: "5.5", width: "17", height: "15", rx: "3.2", fill: "none", stroke: color, strokeWidth: "1.8" }), /* @__PURE__ */ _jsx("path", { d: "M3.5 10h17M8 3.8v3.4M16 3.8v3.4", fill: "none", stroke: color, strokeWidth: "1.8", strokeLinecap: "round" })] });
  }
  if (name === "Weekend" || name === "5\u20137 days" || name === "8\u201312 days" || name === "2+ weeks") {
    return /* @__PURE__ */ _jsxs("svg", { width: "24", height: "24", viewBox: "0 0 24 24", "aria-hidden": true, children: [/* @__PURE__ */ _jsx("circle", { cx: "12", cy: "12", r: "8.5", fill: "none", stroke: color, strokeWidth: "1.8" }), /* @__PURE__ */ _jsx("path", { d: "M12 7v5l3.4 2", fill: "none", stroke: color, strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" })] });
  }
  const vibeIcons = { Beach: "M3 14c2-1.8 4.3-2.8 7-2.8 2.7 0 5 1 7 2.8 1.2 1.1 2.4 2.5 3 4M4.5 18.5h15", Nightlife: "M6 14a6 6 0 1 0 8-8 7 7 0 1 1-8 8Z", Adventure: "M4 18 12 4l8 14H4Z", Nature: "M12 20c-4.5-2.5-6.5-6-6.5-9.5 3.8.3 6.2 1.8 6.5 4.6.3-2.8 2.7-4.3 6.5-4.6 0 3.5-2 7-6.5 9.5Z", Food: "M7 4v8m-2-8v8m4-8v8m6-8v6m0 0c2 0 2 3 0 3m0-3v9", City: "M4 20V9l5-3v14M11 20V5l5-2v17M18 20v-9l2-1v10", Culture: "M4 9h16M6 9v9m12-9v9M3 20h18M12 4l8 5H4l8-5Z", Luxury: "M12 4.2l2.5 5.1 5.7.8-4.1 4 .9 5.7-5-2.7-5 2.7.9-5.7-4.1-4 5.7-.8L12 4.2Z" };
  return /* @__PURE__ */ _jsx("svg", { width: "24", height: "24", viewBox: "0 0 24 24", "aria-hidden": true, children: /* @__PURE__ */ _jsx("path", { d: vibeIcons[name] || "M4 12h16", fill: "none", stroke: color, strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" }) });
}
function TravelerIcon({ name, color }) {
  if (name === "Just me") {
    return /* @__PURE__ */ _jsxs("svg", { width: "34", height: "34", viewBox: "0 0 34 34", "aria-hidden": true, children: [/* @__PURE__ */ _jsx("circle", { cx: "17", cy: "10", r: "4", fill: "none", stroke: color, strokeWidth: "2" }), /* @__PURE__ */ _jsx("path", { d: "M8 28c1-5 4-8 9-8s8 3 9 8", fill: "none", stroke: color, strokeWidth: "2", strokeLinecap: "round" })] });
  }
  if (name === "Couple") {
    return /* @__PURE__ */ _jsxs("svg", { width: "34", height: "34", viewBox: "0 0 34 34", "aria-hidden": true, children: [/* @__PURE__ */ _jsx("circle", { cx: "12", cy: "10", r: "3.4", fill: "none", stroke: color, strokeWidth: "2" }), /* @__PURE__ */ _jsx("circle", { cx: "22", cy: "10", r: "3.4", fill: "none", stroke: color, strokeWidth: "2" }), /* @__PURE__ */ _jsx("path", { d: "M5 27c1-4.7 3.5-7 7-7 3 0 4.7 1.8 5 5 .3-3.2 2-5 5-5 3.5 0 6 2.3 7 7", fill: "none", stroke: color, strokeWidth: "2", strokeLinecap: "round" })] });
  }
  if (name === "Friends") {
    return /* @__PURE__ */ _jsxs("svg", { width: "34", height: "34", viewBox: "0 0 34 34", "aria-hidden": true, children: [/* @__PURE__ */ _jsx("circle", { cx: "9", cy: "11", r: "3", fill: "none", stroke: color, strokeWidth: "2" }), /* @__PURE__ */ _jsx("circle", { cx: "17", cy: "9", r: "3.4", fill: "none", stroke: color, strokeWidth: "2" }), /* @__PURE__ */ _jsx("circle", { cx: "25", cy: "11", r: "3", fill: "none", stroke: color, strokeWidth: "2" }), /* @__PURE__ */ _jsx("path", { d: "M4 27c1-4 3-6 6-6 2.5 0 4 1.3 4.8 4.1.8-2.8 2.3-4.1 4.8-4.1 3 0 5 2 6 6", fill: "none", stroke: color, strokeWidth: "2", strokeLinecap: "round" })] });
  }
  return /* @__PURE__ */ _jsxs("svg", { width: "34", height: "34", viewBox: "0 0 34 34", "aria-hidden": true, children: [/* @__PURE__ */ _jsx("circle", { cx: "11", cy: "10.5", r: "3.2", fill: "none", stroke: color, strokeWidth: "2" }), /* @__PURE__ */ _jsx("circle", { cx: "23", cy: "10.5", r: "3.2", fill: "none", stroke: color, strokeWidth: "2" }), /* @__PURE__ */ _jsx("circle", { cx: "17", cy: "16", r: "2.8", fill: "none", stroke: color, strokeWidth: "2" }), /* @__PURE__ */ _jsx("path", { d: "M5 28c.8-4.5 3-6.8 6.5-6.8 2.4 0 3.9 1 5.5 3.4 1.6-2.4 3.1-3.4 5.5-3.4 3.5 0 5.7 2.3 6.5 6.8", fill: "none", stroke: color, strokeWidth: "2", strokeLinecap: "round" })] });
}
function SAFRATripQuiz(props) {
  const { initialBudget, editorPreview = "Budget", backgroundColor, textColor, accentColor, secondaryAccent, softBlue, heroImage = { src: "https://images.unsplash.com/photo-1780168551093-7f3e0137b04f?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=800", alt: "Thailand coastline" }, whenImage = { src: "https://images.unsplash.com/photo-1535392432937-a27c36ec07b5?auto=format&fit=crop&w=1000&q=85", alt: "Sunset palms" }, durationImage = { src: "https://images.unsplash.com/photo-1586022045497-31fcf76fa6cc?auto=format&fit=crop&w=1000&q=85", alt: "Hiking trail" }, travelersImage = { src: "https://images.unsplash.com/photo-1508904635850-d986b19765d0?auto=format&fit=crop&w=1000&q=85", alt: "Friends traveling" }, vibeImage = { src: "https://images.unsplash.com/photo-1595495745827-85bcc5c9a028?auto=format&fit=crop&w=1000&q=85", alt: "Sunrise mountain" }, loadDelay, font, results, style } = props;
  const normalizedInitialBudget = useMemo(() => {
    const source = Number.isFinite(initialBudget) ? initialBudget : 3e3;
    return clampBudget(source);
  }, [initialBudget]);
  const safeLoadDelay = useMemo(() => {
    if (Number.isFinite(loadDelay) && loadDelay > 0)
      return loadDelay;
    return 1600;
  }, [loadDelay]);
  const [answers, setAnswers] = useState({ budget: normalizedInitialBudget, when: "", startDate: "", endDate: "", duration: "", travelers: "", vibes: [] });
  const [step, setStep] = useState("Budget");
  const [loadingTick, setLoadingTick] = useState(0);
  const [resultShuffleSeed, setResultShuffleSeed] = useState(0);
  const [queryCategory, setQueryCategory] = useState("");
  const [activeTrip, setActiveTrip] = useState(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const headingRef = useRef(null);
  const modalRef = useRef(null);
  const openerRef = useRef(null);
  const resolvedFontFamily = useMemo(() => {
    const possible = font?.fontSelector;
    const selectorFont = typeof possible === "string" ? possible : "";
    const chosen = font?.fontFamily || selectorFont;
    return chosen && chosen.trim().length > 0 ? chosen : `"Nunito", "Avenir Next", "Segoe UI", sans-serif`;
  }, [font]);
  const safeResults = useMemo(() => {
    const fallback = [{ country: "Thailand", match: "94% MATCH", budget: "2,900 DT", duration: "7\u20139 days", tags: "Beach \xB7 Nightlife \xB7 Adventure", image: { src: "https://images.unsplash.com/photo-1780168551093-7f3e0137b04f?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=800", alt: "Thailand coast" } }, { country: "Egypt", match: "88% MATCH", budget: "2,200 DT", duration: "6 days", tags: "Culture \xB7 City \xB7 Nature", image: { src: "https://images.unsplash.com/photo-1771325676184-44d8035e3cd1?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=800", alt: "Egypt desert" } }, { country: "T\xFCrkiye", match: "90% MATCH", budget: "2,600 DT", duration: "5 days", tags: "Food \xB7 City \xB7 Luxury", image: { src: "https://images.unsplash.com/photo-1631152282084-b8f1b380ccab?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=800", alt: "Istanbul skyline" } }];
    if (!Array.isArray(results) || results.length === 0)
      return fallback;
    return results.map((item, index) => ({ country: item?.country || fallback[index]?.country || "Destination", match: item?.match || fallback[index]?.match || "90% MATCH", budget: item?.budget || fallback[index]?.budget || "2,500 DT", duration: item?.duration || fallback[index]?.duration || "6 days", tags: item?.tags || fallback[index]?.tags || "Beach \xB7 Culture", image: item?.image?.src ? item.image : fallback[index]?.image || fallback[0].image }));
  }, [results]);
  useEffect(() => {
    if (typeof __dai_window !== "undefined") {
      const media = __dai_window.matchMedia("(prefers-reduced-motion: reduce)");
      startTransition(() => setReducedMotion(media.matches));
      const update = () => startTransition(() => setReducedMotion(media.matches));
      media.addEventListener("change", update);
      return () => media.removeEventListener("change", update);
    }
    startTransition(() => setReducedMotion(false));
    return;
  }, []);
  useEffect(() => {
    startTransition(() => setAnswers((prev) => ({ ...prev, budget: normalizedInitialBudget })));
  }, [normalizedInitialBudget]);
  useEffect(() => {
    if (typeof __dai_window === "undefined")
      return;
    const target = RenderTarget.current();
    if (target === RenderTarget.canvas || target === RenderTarget.export || target === RenderTarget.thumbnail)
      return;
    const params = new URLSearchParams(__dai_window.location.search);
    const rawBudgetParam = params.get("budget");
    const hasBudgetParam = rawBudgetParam !== null && rawBudgetParam.trim().length > 0;
    const parsedBudgetParam = hasBudgetParam ? Number(rawBudgetParam) : NaN;
    let sessionBudget = NaN;
    if (!hasBudgetParam) {
      try {
        sessionBudget = Number(__dai_window.sessionStorage.getItem("safra-discovery-budget"));
      } catch (_error) {
        sessionBudget = NaN;
      }
    }
    const nextBudget = hasBudgetParam && Number.isFinite(parsedBudgetParam) && parsedBudgetParam > 0 ? clampBudget(parsedBudgetParam) : Number.isFinite(sessionBudget) && sessionBudget > 0 ? clampBudget(sessionBudget) : null;
    const category = (params.get("category") || "").toLowerCase();
    startTransition(() => setQueryCategory(category));
    const categoryVibes = category === "safari" ? ["Nature", "Adventure"] : category === "experience" || category === "experiences" ? ["Culture", "Food"] : [];
    if (nextBudget === null && categoryVibes.length === 0)
      return;
    startTransition(() => setAnswers((prev) => ({ ...prev, budget: nextBudget ?? prev.budget, vibes: prev.vibes.length > 0 ? prev.vibes : categoryVibes })));
  }, []);
  const shouldUseEditorPreview = useMemo(() => {
    const target = RenderTarget.current();
    return target === RenderTarget.canvas || target === RenderTarget.export || target === RenderTarget.thumbnail;
  }, []);
  const effectiveStep = useMemo(() => {
    if (!shouldUseEditorPreview)
      return step;
    return editorPreview === "Budget" ? step : editorPreview;
  }, [editorPreview, shouldUseEditorPreview, step]);
  useEffect(() => {
    if (headingRef.current)
      headingRef.current.focus();
  }, [effectiveStep]);
  useEffect(() => {
    if (effectiveStep !== "Loading" || typeof __dai_window === "undefined")
      return;
    const interval = __dai_window.setInterval(() => startTransition(() => setLoadingTick((prev) => prev + 1)), 220);
    const timeout = step === "Loading" && (!shouldUseEditorPreview || editorPreview === "Budget") ? __dai_window.setTimeout(() => {
      startTransition(() => setStep("Results"));
    }, safeLoadDelay) : null;
    return () => {
      __dai_window.clearInterval(interval);
      if (timeout !== null)
        __dai_window.clearTimeout(timeout);
    };
  }, [effectiveStep, step, editorPreview, safeLoadDelay, shouldUseEditorPreview]);
  const closeModal = useCallback(() => {
    startTransition(() => setActiveTrip(null));
    if (typeof __dai_window !== "undefined") {
      __dai_window.setTimeout(() => openerRef.current?.focus(), 0);
    }
  }, []);
  useEffect(() => {
    if (activeTrip === null || !modalRef.current || typeof document === "undefined")
      return;
    const node = modalRef.current;
    const selector = 'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])';
    const focusables = Array.from(node.querySelectorAll(selector)).filter((el) => !el.hasAttribute("disabled"));
    focusables[0]?.focus();
    function onKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeModal();
        return;
      }
      if (event.key !== "Tab" || focusables.length === 0)
        return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [activeTrip, closeModal]);
  const budgetLabel = useMemo(() => answers.budget >= MAX_BUDGET ? "10,000+ DT" : `${answers.budget.toLocaleString("en-US")} DT`, [answers.budget]);
  const budgetPercent = useMemo(() => (answers.budget - MIN_BUDGET) / (MAX_BUDGET - MIN_BUDGET) * 100, [answers.budget]);
  const dots = useMemo(() => ".".repeat(loadingTick % 3 + 1), [loadingTick]);
  const canContinue = useMemo(() => {
    if (effectiveStep === "Budget")
      return true;
    if (effectiveStep === "When") {
      if (answers.when === "")
        return false;
      if (answers.when !== "Pick dates")
        return true;
      if (!answers.startDate || !answers.endDate)
        return false;
      return new Date(answers.endDate).getTime() >= new Date(answers.startDate).getTime();
    }
    if (effectiveStep === "Duration")
      return answers.duration.length > 0;
    if (effectiveStep === "Travelers")
      return answers.travelers.length > 0;
    if (effectiveStep === "Vibe")
      return answers.vibes.length > 0;
    return false;
  }, [answers, effectiveStep]);
  const stepProgress = useMemo(() => {
    const map = { Budget: 1, When: 2, Duration: 3, Travelers: 4, Vibe: 5, Loading: 5, Results: 5 };
    return map[effectiveStep];
  }, [effectiveStep]);
  const goBack = useCallback(() => {
    if (step === "Loading" || step === "Results") {
      startTransition(() => setStep("Vibe"));
      return;
    }
    const order = ["Budget", "When", "Duration", "Travelers", "Vibe"];
    const current = order.indexOf(step);
    if (current > 0)
      startTransition(() => setStep(order[current - 1]));
  }, [step]);
  const goNext = useCallback(() => {
    const order = ["Budget", "When", "Duration", "Travelers", "Vibe"];
    const current = order.indexOf(step);
    if (current < 4) {
      startTransition(() => setStep(order[current + 1]));
      return;
    }
    startTransition(() => setStep("Loading"));
  }, [step]);
  const setSingleValue = useCallback((key, value) => {
    startTransition(() => setAnswers((prev) => ({ ...prev, [key]: value })));
  }, []);
  const onVibeToggle = useCallback((value) => {
    startTransition(() => setAnswers((prev) => {
      const exists = prev.vibes.includes(value);
      if (exists)
        return { ...prev, vibes: prev.vibes.filter((item) => item !== value) };
      if (prev.vibes.length >= 3)
        return prev;
      return { ...prev, vibes: [...prev.vibes, value] };
    }));
  }, []);
  const restart = useCallback(() => {
    startTransition(() => {
      setAnswers({ budget: normalizedInitialBudget, when: "", startDate: "", endDate: "", duration: "", travelers: "", vibes: [] });
      setStep("Budget");
    });
  }, [normalizedInitialBudget]);
  const summary = useMemo(() => ({ when: answers.when === "Pick dates" ? `${answers.startDate || "?"} \u2192 ${answers.endDate || "?"}` : answers.when || "\u2014", duration: answers.duration || "\u2014", travelers: answers.travelers || "\u2014", vibes: answers.vibes.join(", ") || "\u2014" }), [answers]);
  const summaryText = useMemo(() => {
    const hasPlaceholder = [summary.when, summary.duration, summary.travelers, summary.vibes].some((item) => item === "\u2014");
    if (editorPreview !== "Budget" && hasPlaceholder)
      return "Your travel shortlist";
    return `Budget ${budgetLabel} \xB7 ${summary.when} \xB7 ${summary.duration} \xB7 ${summary.travelers} \xB7 ${summary.vibes}`;
  }, [budgetLabel, editorPreview, summary.duration, summary.travelers, summary.vibes, summary.when]);
  const cardBase = useMemo(() => ({ border: `1px solid color-mix(in srgb, ${textColor} 12%, transparent)`, borderRadius: 20, background: "#FFFFFFB5", padding: "14px 16px", color: textColor, fontFamily: "inherit", cursor: "pointer", textAlign: "left", transition: "all .2s ease" }), [textColor]);
  const visualByStep = useMemo(() => {
    if (effectiveStep === "When")
      return { image: whenImage, label: "Chase the golden hour", detail: "Pick the moment your story begins." };
    if (effectiveStep === "Duration")
      return { image: durationImage, label: "Take the scenic route", detail: "From quick escapes to long wandering days." };
    if (effectiveStep === "Travelers")
      return { image: travelersImage, label: "Better stories, together", detail: "Choose your crew and the trip energy shifts." };
    if (effectiveStep === "Vibe")
      return { image: vibeImage, label: "Follow your kind of feeling", detail: "Set the mood and let us shape the escape." };
    return { image: heroImage, label: "Make room for a little magic", detail: "A few choices now, unforgettable memories next." };
  }, [durationImage, effectiveStep, heroImage, travelersImage, vibeImage, whenImage]);
  const imageByCountry = useMemo(() => {
    return safeResults.reduce((acc, item) => {
      acc[item.country] = item.image;
      return acc;
    }, {});
  }, [safeResults]);
  const destinationCatalog = useMemo(() => [{ country: "Egypt", minBudget: 2200, maxBudget: 3800, durationBands: ["Weekend", "5\u20137 days"], tags: ["Culture", "City", "Nature", "Food"], monthAffinity: [10, 11, 12, 1, 2, 3, 4], travelerSuitability: { "Just me": 0.9, Couple: 0.95, Friends: 0.8, Family: 0.75 } }, { country: "T\xFCrkiye", minBudget: 2800, maxBudget: 4800, durationBands: ["5\u20137 days", "8\u201312 days"], tags: ["Culture", "Food", "City", "Luxury", "Adventure"], monthAffinity: [4, 5, 6, 9, 10, 11], travelerSuitability: { "Just me": 0.78, Couple: 0.92, Friends: 0.96, Family: 0.74 } }, { country: "Thailand", minBudget: 4200, maxBudget: 7500, durationBands: ["8\u201312 days", "2+ weeks"], tags: ["Beach", "Nightlife", "Adventure", "Food", "Nature", "Relaxation"], monthAffinity: [11, 12, 1, 2, 3, 4], travelerSuitability: { "Just me": 0.7, Couple: 0.9, Friends: 0.95, Family: 0.85 } }], []);
  const selectedMonth = useMemo(() => {
    if (answers.when === "This month")
      return (/* @__PURE__ */ new Date()).getMonth() + 1;
    if (answers.when === "Next month")
      return ((/* @__PURE__ */ new Date()).getMonth() + 1) % 12 + 1;
    if (answers.when === "Pick dates" && answers.startDate) {
      const parsed = new Date(answers.startDate);
      if (!Number.isNaN(parsed.getTime()))
        return parsed.getMonth() + 1;
    }
    return null;
  }, [answers.startDate, answers.when]);
  const computedResults = useMemo(() => {
    const eligible = destinationCatalog.filter((item) => answers.budget >= item.minBudget);
    const scored = eligible.map((item) => {
      const budgetCenter = (item.minBudget + item.maxBudget) / 2;
      const budgetDistance = Math.abs(answers.budget - budgetCenter);
      const budgetSpread = Math.max(1, (item.maxBudget - item.minBudget) / 2);
      const budgetFitWithinBand = Math.max(0, 35 - budgetDistance / budgetSpread * 35);
      const budgetFit = answers.budget > item.maxBudget ? 26 : budgetFitWithinBand;
      const vibeMatches = item.tags.filter((tag) => answers.vibes.includes(tag)).length;
      const vibeScore = answers.vibes.length > 0 ? vibeMatches / Math.max(1, answers.vibes.length) * 25 : 10;
      const durationScore = answers.duration && item.durationBands.includes(answers.duration) ? 15 : answers.duration ? 4 : 8;
      const travelerScore = answers.travelers ? 12 * (item.travelerSuitability[answers.travelers] ?? 0.45) : 8;
      const seasonScore = selectedMonth && item.monthAffinity.includes(selectedMonth) ? 12 : answers.when && answers.when !== "I\u2019m flexible" ? 4 : 8;
      const score = budgetFit + vibeScore + durationScore + travelerScore + seasonScore;
      const matchPercent = Math.max(0, Math.min(99, Math.round(score)));
      const rangeMax = Math.min(item.maxBudget, answers.budget >= item.minBudget ? answers.budget : item.maxBudget);
      const shownMax = Math.max(item.minBudget, rangeMax);
      const catalogDuration = answers.duration && item.durationBands.includes(answers.duration) ? answers.duration : item.durationBands.includes("5\u20137 days") ? "5\u20137 days" : item.durationBands[0];
      return { country: item.country, match: `${matchPercent}% MATCH`, budget: `${item.minBudget.toLocaleString("en-US")}\u2013${shownMax.toLocaleString("en-US")} DT`, duration: catalogDuration, tags: item.tags.slice(0, 3).join(" \xB7 "), image: imageByCountry[item.country] || safeResults[0]?.image, rangeMin: item.minBudget, rangeMax: shownMax, matchPercent, catalogDuration, score, tie: item.country.length % 7 };
    });
    const ranked = scored.sort((a, b) => b.score === a.score ? b.tie - a.tie : b.score - a.score).slice(0, 3);
    if (ranked.length <= 1)
      return ranked.map(({ score: _score, tie: _tie, ...rest }) => rest);
    const rotation = resultShuffleSeed % ranked.length;
    const rotated = [...ranked.slice(rotation), ...ranked.slice(0, rotation)];
    return rotated.map(({ score: _score, tie: _tie, ...rest }) => rest);
  }, [answers.budget, answers.duration, answers.travelers, answers.vibes, answers.when, destinationCatalog, imageByCountry, resultShuffleSeed, safeResults, selectedMonth]);
  const hasNoEligibleResults = useMemo(() => computedResults.length === 0, [computedResults.length]);
  const resultsToRender = useMemo(() => computedResults.length > 0 ? computedResults : [], [computedResults]);
  const featuredResult = useMemo(() => resultsToRender[0] ?? null, [resultsToRender]);
  const featuredTags = useMemo(() => {
    if (!featuredResult)
      return [];
    return typeof featuredResult.tags === "string" ? featuredResult.tags.split("\xB7").map((tag) => tag.trim()).filter(Boolean) : [];
  }, [featuredResult]);
  const destinationByCountry = useMemo(() => ({ Thailand: "Krabi & the Andaman coast", Egypt: "Cairo & the Nile", "T\xFCrkiye": "Cappadocia & Istanbul" }), []);
  const destinationSlugByCountry = useMemo(() => ({ Thailand: "thailand", Egypt: "egypt", "T\xFCrkiye": "turkiye", Turkey: "turkiye", Turkiye: "turkiye" }), []);
  const reasonText = useMemo(() => {
    const lead = resultsToRender[0]?.country || "your selected destination";
    const hasQuizDetails = answers.when !== "" || answers.duration !== "" || answers.travelers !== "" || answers.vibes.length > 0;
    if (!hasQuizDetails) {
      return "Complete the quiz to see your budget, timing and travel style reflected in this escape brief.";
    }
    const travelerPhrase = answers.travelers === "Just me" ? "a solo escape" : answers.travelers === "Couple" ? "a trip for two" : answers.travelers === "Friends" ? "a friends\u2019 getaway" : answers.travelers === "Family" ? "a family adventure" : "a flexible travel plan";
    const durationText = answers.duration || "flexible duration";
    const vibeText = answers.vibes.length > 0 ? answers.vibes.join(", ") : "different travel moods";
    const whenText = summary.when === "\u2014" ? "flexible timing" : summary.when;
    return `Your brief: ${budgetLabel}, ${durationText}, and ${travelerPhrase}. You\u2019re drawn to ${vibeText}. Timing: ${whenText}. ${lead} is an illustrative escape to explore with that mood in mind.`;
  }, [answers.duration, answers.travelers, answers.vibes, answers.when, budgetLabel, resultsToRender, summary.when]);
  const tripHrefForCountry = useCallback((item) => {
    const params = new URLSearchParams();
    params.set("destination", destinationSlugByCountry[item.country] || "thailand");
    if (summary.when !== "\u2014")
      params.set("when", summary.when);
    if (answers.travelers)
      params.set("travelers", answers.travelers);
    if (item.catalogDuration || answers.duration)
      params.set("duration", item.catalogDuration || answers.duration);
    params.set("budget", String(answers.budget));
    if (typeof item.matchPercent === "number")
      params.set("match", String(item.matchPercent));
    if (typeof item.rangeMin === "number")
      params.set("rangemin", String(item.rangeMin));
    if (typeof item.rangeMax === "number")
      params.set("rangemax", String(item.rangeMax));
    if (queryCategory)
      params.set("category", queryCategory);
    else if (answers.vibes.length > 0)
      params.set("category", answers.vibes[0].toLowerCase());
    return `/trip?${params.toString()}`;
  }, [answers.budget, answers.duration, answers.travelers, answers.vibes, destinationSlugByCountry, queryCategory, summary.when]);
  const renderChoice = (items, selected, key) => /* @__PURE__ */ _jsx("div", { style: { display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 12 }, children: items.map((item) => {
    const active = selected === item;
    return /* @__PURE__ */ _jsxs("button", { type: "button", "aria-pressed": active, onClick: () => setSingleValue(key, item), className: "safra-focus safra-button safra-choice", style: { ...cardBase, background: active ? accentColor : "#FFFFFFA8", color: textColor, borderColor: active ? accentColor : `color-mix(in srgb, ${textColor} 16%, transparent)`, minHeight: 96, minWidth: 0 }, children: [active ? /* @__PURE__ */ _jsx("span", { "aria-hidden": true, style: { position: "absolute", top: 10, right: 10, width: 20, height: 20, borderRadius: "50%", background: "#FFFFFFB5", display: "grid", placeItems: "center", fontWeight: 900, fontSize: 12 }, children: "\u2713" }) : null, key === "travelers" ? /* @__PURE__ */ _jsxs("div", { style: { display: "flex", alignItems: "center", gap: 10, minWidth: 0 }, children: [/* @__PURE__ */ _jsx("span", { style: { flexShrink: 0, display: "inline-flex", width: 36, height: 36, borderRadius: 999, background: "#FFFFFFAA", alignItems: "center", justifyContent: "center" }, children: /* @__PURE__ */ _jsx(TravelerIcon, { name: item, color: textColor }) }), /* @__PURE__ */ _jsx("span", { className: "safra-choice-label", style: { fontSize: 18, fontWeight: 800, whiteSpace: "normal" }, children: item })] }) : /* @__PURE__ */ _jsxs("span", { className: "safra-choice-label", style: { display: "inline-flex", gap: 9, alignItems: "center", fontSize: 18, fontWeight: 800, whiteSpace: "normal", minWidth: 0 }, children: [/* @__PURE__ */ _jsx("span", { style: { flexShrink: 0, display: "inline-flex", width: 36, height: 36, borderRadius: 999, background: "#FFFFFFAA", alignItems: "center", justifyContent: "center" }, children: /* @__PURE__ */ _jsx(OptionIcon, { name: item, color: textColor }) }), item] })] }, item);
  }) });
  return /* @__PURE__ */ _jsxs("section", { className: "safra-root", style: { position: "relative", width: "100%", minHeight: 620, height: "auto", boxSizing: "border-box", background: backgroundColor, color: textColor, fontFamily: resolvedFontFamily, borderRadius: 30, overflow: "visible", maxWidth: 1088, margin: "0 auto", ...style }, children: [/* @__PURE__ */ _jsx("style", { children: `
                .safra-root { container-type:inline-size; }
                .safra-grid { display:grid; grid-template-columns:minmax(0,1.6fr) minmax(220px,.95fr); gap:28px; align-items:start; min-width:0; }
                .safra-main { min-width:0; }
                .safra-quiz-grid { display:grid; gap:24px; }
                .safra-step-enter { animation:safra-step-in .36s ease both; }
                .safra-heading { margin:0; font-weight:900; letter-spacing:-0.03em; line-height:1.03; }
                .safra-heading:focus { outline:none; }
                .safra-focus:focus-visible { outline:2px solid ${secondaryAccent}; outline-offset:3px; }
                .safra-range-focus:focus-within { outline:2px solid ${secondaryAccent}; outline-offset:4px; border-radius:16px; }
                .safra-button { font-family: inherit; }
                .safra-choice { position:relative; min-height:96px !important; }
                .safra-mobile-ribbon { display:none; }
                .safra-results .safra-side { display:none; }
                .safra-results .safra-main { max-width:none !important; grid-column:1 / -1; }
                .safra-results-wrap { display:grid; gap:16px; }
                .safra-results-hero { display:grid; grid-template-columns:minmax(0,1.15fr) minmax(0,.95fr); gap:16px; background:#FFFFFFAB; border-radius:24px; padding:12px; border:1px solid color-mix(in srgb, ${textColor} 12%, transparent); align-items:stretch; }
                .safra-feature-image { width:100%; height:100%; min-height:420px; object-fit:cover; border-radius:80px 24px 100px 28px; }
                .safra-results-note { font-size:13px; opacity:.76; }
                .safra-results-stagger { animation:safra-results-in .45s ease both; }
                .safra-results-stagger-2 { animation-delay:.08s; }
                .safra-results-stagger-3 { animation-delay:.14s; }
                .safra-alt-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; }
                .safra-vibe-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px; }
                @media (hover: hover) and (pointer: fine) {
                    .safra-choice:hover { transform:translateY(-2px); box-shadow:0 10px 24px rgba(32,61,53,.12); }
                }
                @container (max-width: 810px) {
                    .safra-root { padding:24px; }
                    .safra-grid { grid-template-columns:1fr; gap:16px; }
                    .safra-side { display:none !important; }
                    .safra-mobile-ribbon { display:grid; gap:8px; margin-top:12px; }
                    .safra-heading { font-size:38px !important; }
                    .safra-alt-grid { grid-template-columns:1fr; }
                    .safra-results-hero { grid-template-columns:1fr; }
                    .safra-feature-image { min-height:340px; height:340px; }
                    .safra-choice-label { font-size:16px !important; }
                    .safra-choice { min-height:80px !important; }
                }
                @container (max-width: 500px) {
                    .safra-vibe-grid { grid-template-columns:repeat(2,minmax(0,1fr)); }
                    .safra-vibe-label { font-size:14px; }
                    .safra-mobile-ribbon img { height:100px !important; }
                    .safra-feature-image { min-height:260px; height:260px; }
                }
                @container (min-width: 501px) and (max-width: 810px) {
                    .safra-heading { font-size:44px !important; }
                }
                @container (min-width: 811px) and (max-width: 1200px) {
                    .safra-heading { font-size:58px !important; }
                }
                @container (min-width: 1201px) {
                    .safra-heading { font-size:58px !important; }
                }
                @media (prefers-reduced-motion: reduce) {
                    .safra-step-enter { animation:none !important; }
                    .safra-results-stagger { animation:none !important; }
                    .safra-choice { transition:none !important; }
                    .safra-choice:hover { transform:none !important; }
                }
                @keyframes safra-plane {
                    0% { transform: translateX(0px) translateY(0px) rotate(-6deg); }
                    50% { transform: translateX(56px) translateY(-12px) rotate(2deg); }
                    100% { transform: translateX(112px) translateY(0px) rotate(-6deg); }
                }
                @keyframes safra-step-in {
                    from { opacity:0; transform:translateY(8px); }
                    to { opacity:1; transform:translateY(0px); }
                }
                @keyframes safra-results-in {
                    from { opacity:0; transform:translateY(10px); }
                    to { opacity:1; transform:translateY(0px); }
                }
            ` }), activeTrip !== null && safeResults[activeTrip] ? /* @__PURE__ */ _jsx("div", { role: "dialog", "aria-modal": "true", style: { position: "fixed", inset: 0, background: "#00000066", display: "grid", placeItems: "center", zIndex: 20, padding: 18 }, children: /* @__PURE__ */ _jsxs("div", { ref: modalRef, "aria-label": safeResults[activeTrip].country, style: { width: "min(680px, 100%)", maxHeight: "90vh", overflow: "auto", background: backgroundColor, borderRadius: 24, padding: 18, boxSizing: "border-box", boxShadow: "0 16px 40px rgba(0,0,0,.28)" }, children: [/* @__PURE__ */ _jsx("img", { ...safeResults[activeTrip].image, alt: safeResults[activeTrip].image.alt || safeResults[activeTrip].country, style: { width: "100%", height: 260, objectFit: "cover", borderRadius: 16 } }), /* @__PURE__ */ _jsx("h3", { style: { margin: "14px 0 8px", fontSize: 32, fontWeight: 900 }, children: safeResults[activeTrip].country }), /* @__PURE__ */ _jsxs("p", { style: { margin: "0 0 8px", fontSize: 16, fontWeight: 700 }, children: [safeResults[activeTrip].budget, " \xB7 ", safeResults[activeTrip].duration, " \xB7 ", safeResults[activeTrip].match] }), /* @__PURE__ */ _jsx("p", { style: { margin: "0 0 10px", fontSize: 14, opacity: 0.85 }, children: safeResults[activeTrip].tags }), /* @__PURE__ */ _jsx("p", { style: { margin: 0, fontSize: 13, opacity: 0.75 }, children: "Illustrative matches \u2014 not live prices or personalised recommendations." }), /* @__PURE__ */ _jsx("button", { type: "button", onClick: closeModal, className: "safra-focus safra-button", style: { marginTop: 14, border: "none", borderRadius: 999, background: accentColor, color: textColor, padding: "12px 16px", fontWeight: 800, cursor: "pointer" }, children: "Close" })] }) }) : null, /* @__PURE__ */ _jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }, children: [/* @__PURE__ */ _jsxs("div", { style: { fontSize: 15, fontWeight: 800 }, children: [String(stepProgress).padStart(2, "0"), "/05"] }), /* @__PURE__ */ _jsx("div", { style: { display: "flex", gap: 6, width: 120 }, children: [1, 2, 3, 4, 5].map((bar) => /* @__PURE__ */ _jsx("span", { style: { height: 4, borderRadius: 999, background: bar <= stepProgress ? accentColor : "#D2D8CF", flex: 1 } }, bar)) })] }), /* @__PURE__ */ _jsxs("div", { className: `safra-grid${effectiveStep === "Results" ? " safra-results" : ""}`, children: [/* @__PURE__ */ _jsxs("main", { className: "safra-main", style: { width: "100%", maxWidth: 760 }, children: [(!shouldUseEditorPreview || editorPreview === "Budget") && step !== "Budget" ? /* @__PURE__ */ _jsx("button", { type: "button", onClick: goBack, className: "safra-focus safra-button", style: { border: "none", background: "transparent", color: textColor, padding: 0, marginBottom: 10, cursor: "pointer", fontWeight: 800 }, children: "\u2190 Back" }) : null, (effectiveStep === "Budget" || effectiveStep === "When" || effectiveStep === "Duration" || effectiveStep === "Travelers" || effectiveStep === "Vibe") && /* @__PURE__ */ _jsxs("div", { className: "safra-quiz-grid safra-step-enter", style: { animation: reducedMotion ? "none" : void 0 }, children: [/* @__PURE__ */ _jsx("h2", { ref: headingRef, tabIndex: -1, className: "safra-heading", style: { fontSize: 60 }, children: effectiveStep === "Budget" ? "What\u2019s your budget?" : effectiveStep === "When" ? "When are we escaping?" : effectiveStep === "Duration" ? "How long can you disappear?" : effectiveStep === "Travelers" ? "Who\u2019s coming?" : "What are we feeling?" }), (effectiveStep === "Budget" || effectiveStep === "Vibe") && /* @__PURE__ */ _jsx("p", { style: { margin: 0, fontSize: 20, fontWeight: 700, opacity: 0.86 }, children: effectiveStep === "Budget" ? "Give us a number. We\u2019ll do the dreaming." : "Pick up to 3." }), effectiveStep === "Budget" ? /* @__PURE__ */ _jsx("p", { style: { margin: 0, fontSize: 13, fontWeight: 700, opacity: 0.75 }, children: "Budget for one traveler\u2019s complete trip, not a planning fee." }) : null, effectiveStep === "Budget" && /* @__PURE__ */ _jsxs("div", { style: { padding: "4px 2px 0", marginTop: 24 }, children: [/* @__PURE__ */ _jsx("div", { style: { textAlign: "center", fontSize: "clamp(44px, 8cqw, 76px)", fontWeight: 900, lineHeight: 1, letterSpacing: "-0.03em", marginBottom: 16 }, children: budgetLabel }), /* @__PURE__ */ _jsxs("div", { className: "safra-range-focus", style: { position: "relative", paddingTop: 10 }, children: [/* @__PURE__ */ _jsx("div", { style: { height: 10, borderRadius: 999, background: "#E4E9DC" }, children: /* @__PURE__ */ _jsx("div", { style: { width: `${budgetPercent}%`, height: "100%", borderRadius: 999, background: accentColor } }) }), /* @__PURE__ */ _jsx("div", { "aria-hidden": true, style: { position: "absolute", top: 0, left: `calc(${budgetPercent}% - 15px)`, width: 30, height: 30, borderRadius: "50%", background: backgroundColor, border: `3px solid ${accentColor}`, boxSizing: "border-box", pointerEvents: "none" } }), /* @__PURE__ */ _jsx("input", { "aria-label": "Budget amount", type: "range", min: MIN_BUDGET, max: MAX_BUDGET, step: BUDGET_STEP, value: answers.budget, onChange: (e) => setSingleValue("budget", clampBudget(Number(e.target.value))), className: "safra-focus", style: { position: "absolute", left: 0, right: 0, top: 0, width: "100%", height: 30, margin: 0, opacity: 0, cursor: "pointer" } })] }), /* @__PURE__ */ _jsxs("div", { style: { display: "flex", justifyContent: "space-between", marginTop: 12, fontWeight: 700, opacity: 0.88 }, children: [/* @__PURE__ */ _jsx("span", { children: "1,000 DT" }), /* @__PURE__ */ _jsx("span", { children: "10,000+ DT" })] })] }), effectiveStep === "When" && renderChoice(["This month", "Next month", "Pick dates", "I\u2019m flexible"], answers.when, "when"), effectiveStep === "When" && answers.when === "Pick dates" && /* @__PURE__ */ _jsxs("div", { style: { display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 10 }, children: [/* @__PURE__ */ _jsxs("label", { style: { display: "grid", gap: 6, fontWeight: 700 }, children: ["Start date", /* @__PURE__ */ _jsx("input", { type: "date", value: answers.startDate, onChange: (e) => setSingleValue("startDate", e.target.value), style: { borderRadius: 12, border: `1px solid color-mix(in srgb, ${textColor} 25%, transparent)`, padding: "10px 12px", font: "inherit", color: textColor, minWidth: 0, width: "100%", boxSizing: "border-box" } })] }), /* @__PURE__ */ _jsxs("label", { style: { display: "grid", gap: 6, fontWeight: 700 }, children: ["End date", /* @__PURE__ */ _jsx("input", { type: "date", value: answers.endDate, min: answers.startDate || void 0, onChange: (e) => setSingleValue("endDate", e.target.value), style: { borderRadius: 12, border: `1px solid color-mix(in srgb, ${textColor} 25%, transparent)`, padding: "10px 12px", font: "inherit", color: textColor, minWidth: 0, width: "100%", boxSizing: "border-box" } })] })] }), effectiveStep === "Duration" && renderChoice(["Weekend", "5\u20137 days", "8\u201312 days", "2+ weeks"], answers.duration, "duration"), effectiveStep === "Travelers" && renderChoice(["Just me", "Couple", "Friends", "Family"], answers.travelers, "travelers"), effectiveStep === "Vibe" && /* @__PURE__ */ _jsx("div", { className: "safra-vibe-grid", children: ["Beach", "Nightlife", "Adventure", "Nature", "Food", "City", "Culture", "Luxury"].map((item) => {
    const active = answers.vibes.includes(item);
    return /* @__PURE__ */ _jsxs("button", { type: "button", "aria-pressed": active, onClick: () => onVibeToggle(item), className: "safra-focus safra-button safra-choice", style: { ...cardBase, minHeight: 96, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 16, background: active ? accentColor : "#FFFFFFAB", color: textColor, fontWeight: 800 }, children: [/* @__PURE__ */ _jsx("span", { style: { width: 30, height: 30, borderRadius: 999, background: "#FFFFFFAA", display: "inline-flex", alignItems: "center", justifyContent: "center" }, children: /* @__PURE__ */ _jsx(OptionIcon, { name: item, color: textColor }) }), /* @__PURE__ */ _jsx("span", { className: "safra-vibe-label", children: item }), active ? /* @__PURE__ */ _jsx("span", { "aria-hidden": true, style: { position: "absolute", top: 10, right: 10, width: 20, height: 20, borderRadius: "50%", background: "#FFFFFFB5", display: "grid", placeItems: "center", fontWeight: 900, fontSize: 12 }, children: "\u2713" }) : null] }, item);
  }) }), effectiveStep === "Vibe" && /* @__PURE__ */ _jsxs("p", { style: { margin: 0, fontWeight: 700, opacity: 0.86 }, children: [answers.vibes.length, "/3 selected"] }), /* @__PURE__ */ _jsxs("button", { type: "button", disabled: !canContinue || shouldUseEditorPreview && editorPreview !== "Budget", onClick: goNext, className: "safra-focus safra-button", style: { justifySelf: "start", border: "none", borderRadius: 999, background: canContinue ? accentColor : "#B9C0B8", color: textColor, fontWeight: 900, padding: "18px 28px", fontSize: 16, cursor: canContinue ? "pointer" : "not-allowed", display: "inline-flex", alignItems: "center", gap: 8, marginTop: 12 }, children: [effectiveStep === "Vibe" ? "Find my escape" : "Continue", " ", /* @__PURE__ */ _jsx(ArrowIcon, { color: textColor })] }), /* @__PURE__ */ _jsxs("div", { className: "safra-mobile-ribbon", "aria-hidden": true, children: [/* @__PURE__ */ _jsx("img", { src: visualByStep.image.src, srcSet: visualByStep.image.srcSet, alt: "", style: { width: "100%", height: 130, objectFit: "cover", objectPosition: effectiveStep === "Travelers" ? "50% 80%" : effectiveStep === "Duration" ? "50% 65%" : "50% 50%", borderRadius: "42px 24px 52px 22px" } }), /* @__PURE__ */ _jsx("div", { style: { fontSize: 12, fontWeight: 900, color: secondaryAccent, letterSpacing: ".08em" }, children: visualByStep.label })] })] }, effectiveStep), effectiveStep === "Loading" && /* @__PURE__ */ _jsxs("div", { style: { paddingTop: 30 }, children: [/* @__PURE__ */ _jsxs("h2", { ref: headingRef, tabIndex: -1, className: "safra-heading", style: { fontSize: 58 }, children: ["Packing some ideas", dots] }), /* @__PURE__ */ _jsxs("div", { style: { marginTop: 28, height: 90, borderRadius: 18, background: softBlue, position: "relative", overflow: "hidden", border: `1px dashed ${secondaryAccent}80` }, children: [/* @__PURE__ */ _jsx("svg", { viewBox: "0 0 280 90", width: "100%", height: "100%", "aria-hidden": true, children: /* @__PURE__ */ _jsx("path", { d: "M8 66 Q70 18 136 44 T272 34", fill: "none", stroke: secondaryAccent, strokeWidth: "2.4", strokeDasharray: "5 6" }) }), /* @__PURE__ */ _jsx("div", { style: { position: "absolute", left: 12, top: 38, animation: reducedMotion ? void 0 : "safra-plane 1.2s ease-in-out infinite" }, "aria-hidden": true, children: /* @__PURE__ */ _jsx(PlaneIcon, { color: secondaryAccent, size: 24 }) })] })] }), effectiveStep === "Results" && /* @__PURE__ */ _jsxs("div", { className: "safra-results-wrap", children: [/* @__PURE__ */ _jsx("h2", { ref: headingRef, tabIndex: -1, className: "safra-heading", style: { fontSize: 58, maxWidth: 900 }, children: "Pack your bags. We found your escape." }), /* @__PURE__ */ _jsx("p", { style: { margin: 0, fontWeight: 700 }, children: "Based on your budget, dates and travel style, SAFRA thinks these trips fit you best." }), /* @__PURE__ */ _jsx("p", { className: "safra-results-note", style: { margin: 0 }, children: "Illustrative ranges and matches \u2014 not live prices, availability, or personalised guarantees." }), hasNoEligibleResults ? /* @__PURE__ */ _jsx("p", { className: "safra-results-note", style: { margin: 0, fontWeight: 700 }, children: "No close matches within this budget yet. Try increasing your budget or ask SAFRA for a custom escape." }) : null, featuredResult ? /* @__PURE__ */ _jsxs("article", { className: "safra-results-hero safra-results-stagger", children: [/* @__PURE__ */ _jsx("img", { ...featuredResult.image, alt: "", className: "safra-feature-image" }), /* @__PURE__ */ _jsxs("div", { style: { display: "grid", alignContent: "start", gap: 10, padding: 8 }, children: [/* @__PURE__ */ _jsx("span", { style: { justifySelf: "start", background: accentColor, color: textColor, borderRadius: 999, padding: "6px 10px", fontWeight: 900, fontSize: 12 }, children: featuredResult.match }), /* @__PURE__ */ _jsx("h3", { style: { margin: 0, fontSize: 32, fontWeight: 900 }, children: destinationByCountry[featuredResult.country] || featuredResult.country }), /* @__PURE__ */ _jsx("p", { style: { margin: 0, fontWeight: 700, opacity: 0.82 }, children: featuredResult.country }), /* @__PURE__ */ _jsxs("p", { style: { margin: 0, fontWeight: 700 }, children: ["Estimated total budget: ", featuredResult.budget] }), /* @__PURE__ */ _jsxs("p", { style: { margin: 0, fontWeight: 700 }, children: ["Recommended duration: ", featuredResult.duration] }), /* @__PURE__ */ _jsx("div", { style: { display: "flex", flexWrap: "wrap", gap: 8 }, children: featuredTags.map((tag, idx) => /* @__PURE__ */ _jsx("span", { style: { borderRadius: 999, padding: "6px 10px", background: "#FFFFFFD9", fontWeight: 700 }, children: tag }, `${tag}-${idx}`)) }), /* @__PURE__ */ _jsxs("div", { style: { display: "grid", gap: 6, background: "#FFFFFFA8", borderRadius: 14, padding: "10px 12px" }, children: [/* @__PURE__ */ _jsx("div", { style: { fontSize: 12, fontWeight: 900, letterSpacing: ".08em", color: secondaryAccent }, children: "YOUR ESCAPE BRIEF" }), /* @__PURE__ */ _jsx("p", { style: { margin: 0, fontSize: 14, lineHeight: 1.4, fontWeight: 900 }, children: "Why SAFRA picked this for you" }), /* @__PURE__ */ _jsx("p", { style: { margin: 0, fontSize: 14, lineHeight: 1.45 }, children: reasonText })] }), /* @__PURE__ */ _jsx(Link, { href: tripHrefForCountry(featuredResult), children: /* @__PURE__ */ _jsx("a", { className: "safra-focus safra-button", style: { justifySelf: "start", border: "none", color: textColor, background: accentColor, borderRadius: 999, padding: "10px 14px", fontWeight: 800, cursor: "pointer", textDecoration: "none", display: "inline-flex" }, children: "Explore this trip \u2192" }) })] })] }) : null, /* @__PURE__ */ _jsx("div", { className: "safra-alt-grid safra-results-stagger safra-results-stagger-2", children: resultsToRender.slice(1).map((item, index) => /* @__PURE__ */ _jsxs("article", { style: { display: "grid", gridTemplateColumns: "1fr", gap: 10, background: "#FFFFFFAB", border: `1px solid color-mix(in srgb, ${textColor} 12%, transparent)`, borderRadius: 20, padding: 10, minWidth: 0 }, children: [/* @__PURE__ */ _jsx("img", { ...item.image, alt: "", style: { width: "100%", height: 190, objectFit: "cover", borderRadius: 14 } }), /* @__PURE__ */ _jsxs("div", { style: { display: "grid", alignContent: "start", gap: 8, minWidth: 0 }, children: [/* @__PURE__ */ _jsx("span", { style: { justifySelf: "start", background: accentColor, color: textColor, borderRadius: 999, padding: "5px 9px", fontWeight: 900, fontSize: 11 }, children: item.match }), /* @__PURE__ */ _jsx("h3", { style: { margin: 0, fontSize: 22, fontWeight: 900 }, children: destinationByCountry[item.country] || item.country }), /* @__PURE__ */ _jsx("p", { style: { margin: 0, fontWeight: 700, opacity: 0.82 }, children: item.country }), /* @__PURE__ */ _jsxs("p", { style: { margin: 0, fontWeight: 700 }, children: ["Estimated total budget: ", item.budget] }), /* @__PURE__ */ _jsxs("p", { style: { margin: 0, fontWeight: 700 }, children: ["Recommended duration: ", item.duration] }), /* @__PURE__ */ _jsx("p", { style: { margin: 0, opacity: 0.85 }, children: item.tags }), /* @__PURE__ */ _jsx(Link, { href: tripHrefForCountry(item), children: /* @__PURE__ */ _jsx("a", { className: "safra-focus safra-button", style: { justifySelf: "start", border: `1px solid ${accentColor}`, color: textColor, background: "transparent", borderRadius: 999, padding: "10px 14px", fontWeight: 800, cursor: "pointer", textDecoration: "none", display: "inline-flex" }, children: "Explore this trip \u2192" }) })] })] }, `${item.country}-${index}`)) }), /* @__PURE__ */ _jsxs("div", { className: "safra-results-stagger safra-results-stagger-3", style: { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }, children: [/* @__PURE__ */ _jsx("div", { style: { flexBasis: "100%", fontSize: 24, fontWeight: 900, marginTop: 20 }, children: "Not feeling it?" }), /* @__PURE__ */ _jsx("button", { type: "button", onClick: () => startTransition(() => {
    setResultShuffleSeed((prev) => prev + 1);
    setStep("Loading");
  }), className: "safra-focus safra-button", style: { border: "none", color: textColor, borderRadius: 999, padding: "10px 14px", background: accentColor, fontWeight: 800, cursor: "pointer" }, children: "Surprise me again \u2728" }), /* @__PURE__ */ _jsx("button", { type: "button", onClick: () => startTransition(() => setStep("Budget")), className: "safra-focus safra-button", style: { border: "none", background: "transparent", fontWeight: 800, color: textColor, cursor: "pointer", textDecoration: "underline" }, children: "Change my answers" }), /* @__PURE__ */ _jsx("button", { type: "button", onClick: restart, className: "safra-focus safra-button", style: { border: "none", background: "transparent", fontWeight: 700, color: accentColor, cursor: "pointer", textDecoration: "underline" }, children: "Start again" })] })] })] }), /* @__PURE__ */ _jsx("aside", { className: "safra-side", style: { width: "100%", alignSelf: "stretch", position: "relative", display: effectiveStep === "Loading" || effectiveStep === "Results" ? "none" : "block" }, children: /* @__PURE__ */ _jsxs("div", { style: { position: "sticky", top: 10, display: "grid", gap: 8 }, children: [/* @__PURE__ */ _jsx("div", { style: { alignSelf: "start", fontWeight: 900, color: secondaryAccent, fontSize: 12, letterSpacing: ".12em" }, children: visualByStep.label }), /* @__PURE__ */ _jsx("div", { style: { fontSize: 13, fontWeight: 700, color: textColor, opacity: 0.82 }, children: visualByStep.detail }), /* @__PURE__ */ _jsx("svg", { viewBox: "0 0 210 70", width: "100%", height: "50", "aria-hidden": true, children: /* @__PURE__ */ _jsx("path", { d: "M8 50 Q70 6 132 28 T206 16", fill: "none", stroke: secondaryAccent, strokeWidth: "2", strokeDasharray: "4 5" }) }), /* @__PURE__ */ _jsx("img", { src: visualByStep.image.src, srcSet: visualByStep.image.srcSet, alt: "", style: { width: "100%", height: 430, objectFit: "cover", borderRadius: "80px 24px 100px 28px", boxShadow: "0 12px 28px rgba(32,61,53,.18)" } }), /* @__PURE__ */ _jsx("div", { style: { position: "absolute", right: 10, top: 94, background: accentColor, color: textColor, borderRadius: 999, padding: "8px 10px", fontWeight: 800 }, children: /* @__PURE__ */ _jsx(PlaneIcon, { color: textColor, size: 14 }) })] }) })] })] });
}
addPropertyControls(SAFRATripQuiz, { editorPreview: { type: ControlType.Enum, title: "Preview", options: ["Budget", "When", "Duration", "Travelers", "Vibe", "Loading", "Results"], defaultValue: "Budget" }, initialBudget: { type: ControlType.Number, title: "Initial Budget", defaultValue: 3e3, min: MIN_BUDGET, max: MAX_BUDGET, step: BUDGET_STEP }, loadDelay: { type: ControlType.Number, title: "Load Delay", defaultValue: 1600, min: 600, max: 4e3, step: 100 }, backgroundColor: { type: ControlType.Color, title: "Cream", defaultValue: "#F8F4EA" }, textColor: { type: ControlType.Color, title: "Ink", defaultValue: "#203D35" }, accentColor: { type: ControlType.Color, title: "Orange", defaultValue: "#FF8055" }, secondaryAccent: { type: ControlType.Color, title: "Accent 2", defaultValue: "#317DA1" }, softBlue: { type: ControlType.Color, title: "Blue", defaultValue: "#DDEEF5" }, font: { type: ControlType.Font, title: "Font", defaultValue: { fontSize: 18, variant: "Regular", letterSpacing: "-0.01em", lineHeight: "1.3em" }, controls: "extended", defaultFontType: "sans-serif" }, heroImage: { type: ControlType.ResponsiveImage, title: "Hero Image" }, whenImage: { type: ControlType.ResponsiveImage, title: "When Image" }, durationImage: { type: ControlType.ResponsiveImage, title: "Duration Image" }, travelersImage: { type: ControlType.ResponsiveImage, title: "Travelers Image" }, vibeImage: { type: ControlType.ResponsiveImage, title: "Vibe Image" }, results: { type: ControlType.Array, title: "Trips", defaultValue: [{ country: "Thailand", match: "94% MATCH", budget: "2,900 DT", duration: "7\u20139 days", tags: "Beach \xB7 Nightlife \xB7 Adventure", image: { src: "https://images.unsplash.com/photo-1780168551093-7f3e0137b04f?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=800", alt: "Thailand coast" } }, { country: "Egypt", match: "88% MATCH", budget: "2,200 DT", duration: "6 days", tags: "Culture \xB7 City \xB7 Nature", image: { src: "https://images.unsplash.com/photo-1771325676184-44d8035e3cd1?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=800", alt: "Egypt desert" } }, { country: "T\xFCrkiye", match: "90% MATCH", budget: "2,600 DT", duration: "5 days", tags: "Food \xB7 City \xB7 Luxury", image: { src: "https://images.unsplash.com/photo-1631152282084-b8f1b380ccab?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=800", alt: "Istanbul skyline" } }], control: { type: ControlType.Object, controls: { country: { type: ControlType.String, defaultValue: "Thailand" }, match: { type: ControlType.String, defaultValue: "94% MATCH" }, budget: { type: ControlType.String, defaultValue: "2,900 DT" }, duration: { type: ControlType.String, defaultValue: "7\u20139 days" }, tags: { type: ControlType.String, defaultValue: "Beach \xB7 Nightlife \xB7 Adventure" }, image: { type: ControlType.ResponsiveImage } } } } });
var __FramerMetadata__ = { "exports": { "default": { "type": "reactComponent", "name": "SAFRATripQuiz", "slots": [], "annotations": { "framerContractVersion": "1", "framerSupportedLayoutHeight": "auto", "framerSupportedLayoutWidth": "any-prefer-fixed" } }, "__FramerMetadata__": { "type": "variable" } } };
export {
  __FramerMetadata__,
  SAFRATripQuiz as default
};
