var __dai_window=typeof window!=="undefined"?window:undefined;var __dai_navigator=typeof __dai_window!=="undefined"?navigator:undefined;

// http-url:https://framerusercontent.com/modules/kDhMUjXtCz2zDBpHiuO8/w8zYvDpF0DNbfbJbYaKV/SAFRATripExperience.js
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { startTransition, useEffect, useMemo, useState } from "react";
import { addPropertyControls, ControlType, Link } from "./_framer-runtime.js";
function SAFRATripExperience(props) {
  const { destination, cream, ink, orange, heroImageOverride, font, style } = props;
  const [resolvedDestination, setResolvedDestination] = useState(destination || "thailand");
  const [queryWhen, setQueryWhen] = useState("");
  const [queryTravelers, setQueryTravelers] = useState("");
  const [queryCategory, setQueryCategory] = useState("");
  const [queryDuration, setQueryDuration] = useState("");
  const [queryBudget, setQueryBudget] = useState(null);
  const [queryMatch, setQueryMatch] = useState(null);
  const [queryRange, setQueryRange] = useState(null);
  const resolvedFontFamily = useMemo(() => {
    const possible = font?.fontSelector;
    const selectorFont = typeof possible === "string" ? possible : "";
    const chosen = font?.fontFamily || selectorFont;
    return chosen && chosen.trim().length > 0 ? chosen : `"Nunito", "Avenir Next", "Segoe UI", sans-serif`;
  }, [font]);
  const allDestinations = useMemo(() => ({ thailand: { slug: "thailand", title: "Krabi & the Andaman coast", country: "Thailand", match: "94% MATCH", duration: "7\u20139 days", estimatedTotal: 5850, minBudget: 4200, maxBudget: 7500, description: "A warm tropical escape with dramatic limestone coastlines, soft sea breezes, and easy island-hopping energy.", highlights: ["Turquoise coast", "Island energy", "Tropical flavours"], hero: { src: "https://framerusercontent.com/images/snHq8305shuNdUjeU5oyWBUIZw.jpg", alt: "Krabi coast cliffs" } }, egypt: { slug: "egypt", title: "Cairo & the Nile", country: "Egypt", match: "88% MATCH", duration: "6 days", estimatedTotal: 3e3, minBudget: 2200, maxBudget: 3800, description: "A vivid mix of timeless atmosphere and city rhythm, where golden tones and deep history shape the journey.", highlights: ["Desert landscapes", "Rich heritage", "Warm evenings"], hero: { src: "https://images.unsplash.com/photo-1771325676184-44d8035e3cd1?w=1400&q=85", alt: "Egypt desert and pyramids" } }, turkiye: { slug: "turkiye", title: "Cappadocia & Istanbul", country: "T\xFCrkiye", match: "90% MATCH", duration: "5 days", estimatedTotal: 3800, minBudget: 2800, maxBudget: 4800, description: "An expressive blend of dramatic scenery and city pulse, where layered culture and bold flavor meet every day.", highlights: ["Dramatic landscapes", "Layered culture", "Vibrant food"], hero: { src: "https://images.unsplash.com/photo-1631152282084-b8f1b380ccab?w=1400&q=85", alt: "Istanbul skyline" } } }), []);
  useEffect(() => {
    let nextDestination = destination === "thailand" || destination === "egypt" || destination === "turkiye" ? destination : "thailand";
    let nextWhen = "";
    let nextTravelers = "";
    let nextCategory = "";
    let nextDuration = "";
    let nextBudget = null;
    let nextMatch = null;
    let nextRange = null;
    if (typeof __dai_window !== "undefined") {
      const params = new URLSearchParams(__dai_window.location.search);
      const queryDestination = params.get("destination");
      if (queryDestination === "thailand" || queryDestination === "egypt" || queryDestination === "turkiye") {
        nextDestination = queryDestination;
      }
      const rawWhen = params.get("when") || "";
      nextWhen = rawWhen.slice(0, 100);
      const rawTravelers = params.get("travelers") || "";
      nextTravelers = rawTravelers.slice(0, 50);
      nextCategory = (params.get("category") || "").slice(0, 50);
      nextDuration = (params.get("duration") || "").slice(0, 50);
      const rawBudgetParam = params.get("budget");
      if (rawBudgetParam !== null && rawBudgetParam.trim().length > 0) {
        const rawBudget = Number(rawBudgetParam);
        if (Number.isFinite(rawBudget) && rawBudget > 0)
          nextBudget = Math.round(rawBudget);
      }
      const rawMatchParam = params.get("match");
      if (rawMatchParam !== null && rawMatchParam.trim().length > 0) {
        const rawMatch = Number(rawMatchParam);
        if (Number.isFinite(rawMatch))
          nextMatch = Math.max(0, Math.min(99, Math.round(rawMatch)));
      }
      const rawRangeMin = Number(params.get("rangemin"));
      const rawRangeMax = Number(params.get("rangemax"));
      if (Number.isFinite(rawRangeMin) && Number.isFinite(rawRangeMax) && rawRangeMin > 0 && rawRangeMax >= rawRangeMin) {
        nextRange = { min: Math.round(rawRangeMin), max: Math.round(rawRangeMax) };
      }
    }
    startTransition(() => {
      setResolvedDestination(nextDestination);
      setQueryWhen(nextWhen);
      setQueryTravelers(nextTravelers);
      setQueryCategory(nextCategory);
      setQueryDuration(nextDuration);
      setQueryBudget(nextBudget);
      setQueryMatch(nextMatch);
      setQueryRange(nextRange);
    });
  }, [destination]);
  const current = useMemo(() => allDestinations[resolvedDestination] || allDestinations.thailand, [allDestinations, resolvedDestination]);
  const heroImage = useMemo(() => heroImageOverride?.src ? heroImageOverride : current.hero, [current.hero, heroImageOverride]);
  const suggestedDates = useMemo(() => queryWhen.trim().length > 0 && queryWhen.trim() !== "\u2014" ? queryWhen : "Choose your travel dates", [queryWhen]);
  const totalEstimate = useMemo(() => queryBudget ?? current.estimatedTotal, [current.estimatedTotal, queryBudget]);
  const budgetRangeLabel = useMemo(() => {
    const min = queryRange?.min ?? current.minBudget;
    const max = queryRange?.max ?? current.maxBudget;
    return `${min.toLocaleString("en-US")}\u2013${max.toLocaleString("en-US")} DT`;
  }, [current.maxBudget, current.minBudget, queryRange]);
  const matchLabel = useMemo(() => {
    if (typeof queryMatch === "number")
      return `${queryMatch}% MATCH`;
    return current.match;
  }, [current.match, queryMatch]);
  const requestHref = useMemo(() => {
    const params = new URLSearchParams();
    params.set("destination", resolvedDestination);
    if (suggestedDates && suggestedDates !== "Choose your travel dates")
      params.set("when", suggestedDates);
    if (queryTravelers)
      params.set("travelers", queryTravelers);
    if (queryDuration)
      params.set("duration", queryDuration);
    if (queryCategory)
      params.set("category", queryCategory);
    params.set("budget", String(totalEstimate));
    return `/trip-request?${params.toString()}`;
  }, [queryCategory, queryDuration, queryTravelers, resolvedDestination, suggestedDates, totalEstimate]);
  return /* @__PURE__ */ _jsxs("section", { className: "safra-exp-root", style: { position: "relative", width: "100%", boxSizing: "border-box", background: cream, color: ink, fontFamily: resolvedFontFamily, paddingInline: "clamp(20px, 3vw, 32px)", ...style }, children: [/* @__PURE__ */ _jsx("style", { children: `
                .safra-exp-root { container-type:inline-size; }
                .safra-exp-root :focus-visible { outline:2px solid ${orange}; outline-offset:3px; }
                .safra-exp-wrap { max-width:1120px; margin:0 auto; display:grid; gap:24px; }
                .safra-exp-hero { position:relative; height:580px; border-radius:40px; overflow:hidden; }
                .safra-exp-hero::after { content:""; position:absolute; inset:0; background:linear-gradient(180deg, rgba(0,0,0,.08) 0%, rgba(0,0,0,.52) 72%, rgba(0,0,0,.7) 100%); }
                .safra-exp-hero-content { position:absolute; inset:auto 24px 24px 24px; z-index:2; color:${cream}; display:grid; gap:10px; max-width:900px; }
                .safra-exp-title { font-weight:900; }
                .safra-exp-grid { display:grid; grid-template-columns:minmax(0,1.1fr) minmax(0,.9fr); gap:24px; align-items:start; }
                .safra-exp-main { min-width:0; display:grid; gap:28px; }
                .safra-exp-card { background:#FFFFFFA8; border:1px solid color-mix(in srgb, ${ink} 12%, transparent); border-radius:22px; padding:18px; display:grid; gap:12px; }
                .safra-exp-enter { animation:safraExpIn .45s ease both; }
                @container (max-width: 960px) {
                    .safra-exp-grid { grid-template-columns:1fr; }
                }
                @container (max-width: 810px) {
                    .safra-exp-hero { height:480px; border-radius:28px; }
                    .safra-exp-title { font-size:44px !important; }
                }
                @container (max-width: 500px) {
                    .safra-exp-title { font-size:38px !important; }
                }
                @media (max-width: 809px) {
                    .safra-exp-root { padding-top:152px !important; }
                }
                @media (prefers-reduced-motion: reduce) {
                    .safra-exp-enter { animation:none !important; }
                }
                @keyframes safraExpIn {
                    from { opacity:.01; transform:translateY(10px); }
                    to { opacity:1; transform:translateY(0); }
                }
            ` }), /* @__PURE__ */ _jsxs("div", { className: "safra-exp-wrap", children: [/* @__PURE__ */ _jsxs("header", { className: "safra-exp-hero safra-exp-enter", children: [/* @__PURE__ */ _jsx("img", { src: heroImage.src, srcSet: heroImage.srcSet, alt: "", style: { width: "100%", height: "100%", objectFit: "cover" } }), /* @__PURE__ */ _jsxs("div", { className: "safra-exp-hero-content", children: [/* @__PURE__ */ _jsx("span", { style: { justifySelf: "start", background: orange, color: ink, borderRadius: 999, padding: "7px 12px", fontWeight: 900, fontSize: 12 }, children: matchLabel }), /* @__PURE__ */ _jsx("h1", { className: "safra-exp-title", style: { margin: 0, fontSize: 72, lineHeight: 1.02, letterSpacing: "-0.03em", fontWeight: 900 }, children: current.title }), /* @__PURE__ */ _jsx("p", { style: { margin: 0, fontSize: 24, fontWeight: 700 }, children: current.country }), /* @__PURE__ */ _jsx("p", { style: { margin: 0, fontWeight: 700 }, children: current.description }), /* @__PURE__ */ _jsxs("p", { style: { margin: 0, fontWeight: 700 }, children: [suggestedDates, " \xB7 Recommended duration: ", queryDuration || current.duration] }), /* @__PURE__ */ _jsxs("p", { style: { margin: 0, fontWeight: 900 }, children: ["Estimated total budget range: ", budgetRangeLabel] }), /* @__PURE__ */ _jsx("p", { style: { margin: 0, fontSize: 13, opacity: 0.85 }, children: "Illustrative budget range\u2014not live pricing or availability." })] })] }), /* @__PURE__ */ _jsxs("div", { className: "safra-exp-grid", children: [/* @__PURE__ */ _jsx("div", { className: "safra-exp-main", children: /* @__PURE__ */ _jsxs("section", { className: "safra-exp-card safra-exp-enter", children: [/* @__PURE__ */ _jsx("h2", { style: { margin: 0, fontSize: 36, lineHeight: 1.08, fontWeight: 900 }, children: "Preview highlights" }), /* @__PURE__ */ _jsx("div", { style: { display: "grid", gap: 10 }, children: current.highlights.map((item) => /* @__PURE__ */ _jsx("div", { style: { borderRadius: 14, background: "#FFFFFFCC", border: `1px solid color-mix(in srgb, ${ink} 14%, transparent)`, padding: "10px 12px", fontWeight: 800 }, children: item }, item)) })] }) }), /* @__PURE__ */ _jsx("aside", { children: /* @__PURE__ */ _jsxs("section", { className: "safra-exp-card safra-exp-enter", style: { background: ink, color: cream }, children: [/* @__PURE__ */ _jsx("div", { style: { fontSize: 28, lineHeight: 1 }, "aria-hidden": true, children: "\u{1F512}" }), /* @__PURE__ */ _jsx("h3", { style: { margin: 0, fontSize: 30, lineHeight: 1.1, fontWeight: 900 }, children: "Your complete SAFRA trip plan" }), /* @__PURE__ */ _jsx("p", { style: { margin: 0, opacity: 0.92 }, children: "Unlock your full personalized itinerary, accommodation and transport structure, activity flow, and booking assistance guidance after ordering." }), /* @__PURE__ */ _jsx(Link, { href: requestHref, children: /* @__PURE__ */ _jsx("a", { style: { justifySelf: "start", border: "none", borderRadius: 999, background: orange, color: ink, padding: "12px 16px", fontWeight: 900, cursor: "pointer", textDecoration: "none", display: "inline-flex" }, children: "Get my complete trip plan" }) })] }) })] })] })] });
}
addPropertyControls(SAFRATripExperience, { destination: { type: ControlType.Enum, title: "Destination", options: ["thailand", "egypt", "turkiye"], optionTitles: ["Thailand", "Egypt", "T\xFCrkiye"], defaultValue: "thailand" }, cream: { type: ControlType.Color, title: "Cream", defaultValue: "#F8F4EA" }, ink: { type: ControlType.Color, title: "Ink", defaultValue: "#203D35" }, orange: { type: ControlType.Color, title: "Orange", defaultValue: "#FF8055" }, heroImageOverride: { type: ControlType.ResponsiveImage, title: "Hero Override" }, font: { type: ControlType.Font, title: "Font", defaultValue: { fontSize: 16, variant: "Regular", letterSpacing: "-0.01em", lineHeight: "1.35em" }, controls: "extended", defaultFontType: "sans-serif" } });
var __FramerMetadata__ = { "exports": { "default": { "type": "reactComponent", "name": "SAFRATripExperience", "slots": [], "annotations": { "framerContractVersion": "1", "framerSupportedLayoutHeight": "auto", "framerSupportedLayoutWidth": "any-prefer-fixed" } }, "__FramerMetadata__": { "type": "variable" } } };
export {
  __FramerMetadata__,
  SAFRATripExperience as default
};
