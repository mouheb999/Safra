import type { Locale } from "@/i18n/config";

export const MIN_BUDGET = 1000;
export const MAX_BUDGET = 10000;
export const BUDGET_STEP = 100;
export const DEFAULT_BUDGET = 3000;

/** sessionStorage key: the home page slider hands its value to the quiz. */
export const DISCOVERY_BUDGET_KEY = "safra-discovery-budget";

export function clampBudget(value: number): number {
  return Math.min(MAX_BUDGET, Math.max(MIN_BUDGET, Math.round(value / BUDGET_STEP) * BUDGET_STEP));
}

// Western digits in every language (as on Tunisian price tags); grouping follows the language.
const NUMBER_FORMAT: Record<Locale, Intl.NumberFormat> = {
  en: new Intl.NumberFormat("en-US"),
  fr: new Intl.NumberFormat("fr-FR"),
  ar: new Intl.NumberFormat("ar-TN-u-nu-latn"),
};
const CURRENCY: Record<Locale, string> = { en: "DT", fr: "DT", ar: "د.ت" };

export const formatNumber = (value: number, locale: Locale = "en") => NUMBER_FORMAT[locale].format(value);

export function formatDT(value: number, locale: Locale = "en"): string {
  return `${formatNumber(value, locale)} ${CURRENCY[locale]}`;
}

/** Slider label: the top of the range reads "10,000+ DT". */
export function formatBudget(value: number, locale: Locale = "en"): string {
  return value >= MAX_BUDGET ? `${formatNumber(MAX_BUDGET, locale)}+ ${CURRENCY[locale]}` : formatDT(value, locale);
}

export function formatRange(min: number, max: number, locale: Locale = "en"): string {
  return `${formatNumber(min, locale)}–${formatNumber(max, locale)} ${CURRENCY[locale]}`;
}

export function budgetPercent(value: number): number {
  return ((value - MIN_BUDGET) / (MAX_BUDGET - MIN_BUDGET)) * 100;
}
