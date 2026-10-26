// Trip plan checkout: payment methods, delivery governorates and what the checkout needs to know.
// Pure (no React, no server code) so the checkout, the server action and the admin share it.
// Prices are set in /admin/settings; public.submit_request() charges from there, never from the browser.

import type { Locale } from "@/i18n/config";

/** 'cod': printed plan delivered, paid in cash. The others: the customer sends the money, then the receipt on WhatsApp. */
export const PAYMENT_METHODS = ["cod", "d17", "flouci", "wafacash", "bank"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export type OnlineMethod = Exclude<PaymentMethod, "cod">;
export const ONLINE_METHODS = ["d17", "flouci", "wafacash", "bank"] as const satisfies OnlineMethod[];

export const isPaymentMethod = (value: unknown): value is PaymentMethod =>
  typeof value === "string" && (PAYMENT_METHODS as readonly string[]).includes(value);

/** Brand names, the same in every language. */
export const METHOD_NAME: Record<PaymentMethod, string> = {
  cod: "Cash on delivery",
  d17: "D17",
  flouci: "Flouci",
  wafacash: "Wafacash",
  bank: "Bank transfer",
};

/** Where customers send the money (site_settings); an empty value hides that method. */
export interface PaymentAccounts {
  d17Number: string;
  flouciNumber: string;
  wafacashName: string;
  wafacashPhone: string;
  bankName: string;
  bankHolder: string;
  bankRib: string;
}

export const EMPTY_ACCOUNTS: PaymentAccounts = {
  d17Number: "",
  flouciNumber: "",
  wafacashName: "",
  wafacashPhone: "",
  bankName: "",
  bankHolder: "",
  bankRib: "",
};

/** What the checkout shows: the price, the delivery fee and the accounts it can offer. */
export interface CheckoutConfig {
  planPriceDT: number;
  deliveryFeeDT: number;
  accounts: PaymentAccounts;
}

export const DEFAULT_PLAN_PRICE_DT = 79;
export const DEFAULT_DELIVERY_FEE_DT = 7;

/** Same rule as submit_request(): a method is offered only once its account details are filled in. */
export function isMethodAvailable(method: PaymentMethod, a: PaymentAccounts): boolean {
  switch (method) {
    case "cod":
      return true;
    case "d17":
      return a.d17Number.trim() !== "";
    case "flouci":
      return a.flouciNumber.trim() !== "";
    case "wafacash":
      return a.wafacashName.trim() !== "" && a.wafacashPhone.trim() !== "";
    case "bank":
      return a.bankRib.trim() !== "";
  }
}

export const availableOnlineMethods = (a: PaymentAccounts): OnlineMethod[] =>
  ONLINE_METHODS.filter((m) => isMethodAvailable(m, a));

export const orderTotal = (config: CheckoutConfig, method: PaymentMethod) =>
  config.planPriceDT + (method === "cod" ? config.deliveryFeeDT : 0);

/** Account details to show for a method, as [label key, value] pairs (labels live in t.checkout.fields). */
export type AccountField = "phone" | "recipient" | "bank" | "holder" | "rib";
export function accountDetails(method: OnlineMethod, a: PaymentAccounts): [AccountField, string][] {
  const rows: [AccountField, string][] =
    method === "d17"
      ? [["phone", a.d17Number]]
      : method === "flouci"
        ? [["phone", a.flouciNumber]]
        : method === "wafacash"
          ? [
              ["recipient", a.wafacashName],
              ["phone", a.wafacashPhone],
            ]
          : [
              ["holder", a.bankHolder],
              ["bank", a.bankName],
              ["rib", a.bankRib],
            ];
  return rows.filter(([, value]) => value.trim() !== "");
}

/** The 24 governorates. The value (stored, and shown in the admin) is the French name. */
export const GOVERNORATES: { value: string; ar: string }[] = [
  { value: "Ariana", ar: "أريانة" },
  { value: "Béja", ar: "باجة" },
  { value: "Ben Arous", ar: "بن عروس" },
  { value: "Bizerte", ar: "بنزرت" },
  { value: "Gabès", ar: "قابس" },
  { value: "Gafsa", ar: "قفصة" },
  { value: "Jendouba", ar: "جندوبة" },
  { value: "Kairouan", ar: "القيروان" },
  { value: "Kasserine", ar: "القصرين" },
  { value: "Kébili", ar: "قبلي" },
  { value: "Le Kef", ar: "الكاف" },
  { value: "Mahdia", ar: "المهدية" },
  { value: "La Manouba", ar: "منوبة" },
  { value: "Médenine", ar: "مدنين" },
  { value: "Monastir", ar: "المنستير" },
  { value: "Nabeul", ar: "نابل" },
  { value: "Sfax", ar: "صفاقس" },
  { value: "Sidi Bouzid", ar: "سيدي بوزيد" },
  { value: "Siliana", ar: "سليانة" },
  { value: "Sousse", ar: "سوسة" },
  { value: "Tataouine", ar: "تطاوين" },
  { value: "Tozeur", ar: "توزر" },
  { value: "Tunis", ar: "تونس" },
  { value: "Zaghouan", ar: "زغوان" },
];

export const isGovernorate = (value: string) => GOVERNORATES.some((g) => g.value === value);

export const governorateLabel = (value: string, locale: Locale) =>
  locale === "ar" ? (GOVERNORATES.find((g) => g.value === value)?.ar ?? value) : value;
