var __dai_window=typeof window!=="undefined"?window:undefined;var __dai_navigator=typeof __dai_window!=="undefined"?navigator:undefined;

// http-url:https://framerusercontent.com/modules/3Z1DjfEoMo3wFPAKk8NQ/0D9UkAfmDiAX1ynWp9Ug/BudgetSlider.js
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useState, startTransition } from "react";
import { addPropertyControls, ControlType } from "./_framer-runtime.js";
var MIN_BUDGET = 1e3;
var MAX_BUDGET = 1e4;
var STEP = 100;
function clampBudget(value) {
  return Math.min(MAX_BUDGET, Math.max(MIN_BUDGET, Math.round(value / STEP) * STEP));
}
function BudgetSlider(props) {
  const { initialBudget, accentColor, textColor, trackColor, font, style } = props;
  const [budget, setBudget] = useState(() => clampBudget(initialBudget));
  const [isFocused, setIsFocused] = useState(false);
  useEffect(() => {
    const next = clampBudget(initialBudget);
    startTransition(() => setBudget(next));
  }, [initialBudget]);
  const percent = useMemo(() => {
    return (budget - MIN_BUDGET) / (MAX_BUDGET - MIN_BUDGET) * 100;
  }, [budget]);
  const formattedAmount = useMemo(() => {
    if (budget >= MAX_BUDGET)
      return "10,000+ DT";
    return `${budget.toLocaleString("en-US")} DT`;
  }, [budget]);
  const onSliderChange = useCallback((event) => {
    const nextValue = clampBudget(Number(event.target.value));
    startTransition(() => setBudget(nextValue));
    if (typeof __dai_window !== "undefined") {
      try {
        __dai_window.sessionStorage.setItem("safra-discovery-budget", String(nextValue));
      } catch (_error) {
        return;
      }
    }
  }, []);
  const onSliderFocus = useCallback(() => {
    startTransition(() => setIsFocused(true));
  }, []);
  const onSliderBlur = useCallback(() => {
    startTransition(() => setIsFocused(false));
  }, []);
  return /* @__PURE__ */ _jsxs("div", { style: { position: "relative", width: "100%", height: 170, display: "flex", flexDirection: "column", justifyContent: "center", gap: 16, boxSizing: "border-box", ...style }, children: [/* @__PURE__ */ _jsx("div", { style: { width: "100%", textAlign: "center", color: textColor, fontFamily: font?.fontFamily || "Nunito, sans-serif", fontSize: font?.fontSize || 56, fontWeight: font?.fontWeight || 900, fontStyle: font?.fontStyle, letterSpacing: font?.letterSpacing || "-0.02em", lineHeight: font?.lineHeight || "1em" }, children: formattedAmount }), /* @__PURE__ */ _jsxs("div", { style: { position: "relative", width: "100%", padding: "10px 4px 0", borderRadius: 16, outline: isFocused ? `2px solid ${accentColor}` : "2px solid transparent", outlineOffset: 4, transition: "outline-color 0.2s ease" }, children: [/* @__PURE__ */ _jsx("div", { "aria-hidden": true, style: { width: "100%", height: 10, borderRadius: 999, background: trackColor, position: "relative" }, children: /* @__PURE__ */ _jsx("div", { style: { width: `${percent}%`, height: "100%", borderRadius: 999, background: accentColor } }) }), /* @__PURE__ */ _jsx("div", { "aria-hidden": true, style: { position: "absolute", top: 0, left: `calc(${percent}% - 15px)`, width: 30, height: 30, borderRadius: "50%", background: "#F8F4EA", border: `3px solid ${accentColor}`, boxSizing: "border-box", boxShadow: "0 2px 6px rgba(0,0,0,0.18)", pointerEvents: "none" } }), /* @__PURE__ */ _jsx("input", { type: "range", min: MIN_BUDGET, max: MAX_BUDGET, step: STEP, value: budget, onChange: onSliderChange, onFocus: onSliderFocus, onBlur: onSliderBlur, "aria-label": "Budget amount", style: { position: "absolute", left: 0, right: 0, top: 5, width: "100%", height: 30, margin: 0, opacity: 0, cursor: "pointer", accentColor } })] }), /* @__PURE__ */ _jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", color: textColor, fontFamily: font?.fontFamily || "Nunito, sans-serif", fontSize: 14, fontWeight: 700, lineHeight: "1em", opacity: 0.9, padding: "0 2px", boxSizing: "border-box" }, children: [/* @__PURE__ */ _jsx("span", { children: "1,000 DT" }), /* @__PURE__ */ _jsx("span", { children: "10,000+ DT" })] })] });
}
addPropertyControls(BudgetSlider, { initialBudget: { type: ControlType.Number, title: "Initial Budget", defaultValue: 3e3, min: MIN_BUDGET, max: MAX_BUDGET, step: STEP }, accentColor: { type: ControlType.Color, title: "Accent", defaultValue: "#FF8055" }, textColor: { type: ControlType.Color, title: "Text", defaultValue: "#203D35" }, trackColor: { type: ControlType.Color, title: "Track", defaultValue: "#E4E9DC" }, font: { type: ControlType.Font, title: "Font", defaultValue: { fontSize: 56, variant: "Black", letterSpacing: "-0.02em", lineHeight: "1em", textAlign: "center" }, controls: "extended", defaultFontType: "sans-serif" } });
var __FramerMetadata__ = { "exports": { "default": { "type": "reactComponent", "name": "BudgetSlider", "slots": [], "annotations": { "framerSupportedLayoutHeight": "fixed", "framerContractVersion": "1", "framerSupportedLayoutWidth": "any-prefer-fixed" } }, "__FramerMetadata__": { "type": "variable" } } };
export {
  __FramerMetadata__,
  BudgetSlider as default
};
