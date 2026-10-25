"use client";

import { useCallback, useEffect, useState, useTransition, type FormEvent, type ReactNode } from "react";
import { submitRequest } from "@/app/actions/submit-request";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n/fmt";
import type { Messages } from "@/i18n/messages/en";
import {
  requestMessage,
  whatsappUrl,
  type BookingConfig,
  type BookingMode,
  type ConciergeRequest,
  type RequestDraft,
} from "@/lib/requests";

export const inputClass =
  "w-full min-w-0 rounded-xl border border-ink/20 bg-white px-3 py-[11px] text-ink read-only:bg-[#F9F9F9]";

export const primaryButtonClass =
  "justify-self-start rounded-full bg-orange px-[18px] py-3 font-black text-ink hover:brightness-95 cursor-pointer";

export function Field({ label, hint, children }: { label: ReactNode; hint?: ReactNode; children: ReactNode }) {
  return (
    <label className="grid gap-1.5 font-bold">
      {label}
      {children}
      {hint ? <span className="text-xs font-semibold opacity-85">{hint}</span> : null}
    </label>
  );
}

/** Stores "Yes"/"No" whatever the language; only the labels are translated. */
export function YesNoSelect({ name }: { name: string }) {
  const { t } = useI18n();
  return (
    <select name={name} required defaultValue="" className={inputClass}>
      <option value="">{t.forms.select}</option>
      <option value="Yes">{t.forms.yes}</option>
      <option value="No">{t.forms.no}</option>
    </select>
  );
}

/** Local date as YYYY-MM-DD, computed after mount so server and client markup match. */
export function useTodayISO(): string {
  const [today, setToday] = useState("");
  useEffect(() => {
    const now = new Date();
    setToday(
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`,
    );
  }, []);
  return today;
}

/** Rejects whitespace-only answers in required text fields and malformed WhatsApp numbers. */
function baseChecks(form: HTMLFormElement, t: Messages) {
  for (const el of Array.from(form.elements)) {
    if (!(el instanceof HTMLInputElement) || !el.required) continue;
    if (el.type === "tel") {
      const digits = el.value.replace(/\D/g, "").length;
      el.setCustomValidity(digits >= 6 && digits <= 15 ? "" : t.forms.invalidPhone);
    } else if (el.type === "text") {
      el.setCustomValidity(el.value.trim() ? "" : t.forms.fillField);
    }
  }
}

/**
 * Validates with the browser's own UI, then hands the form data to `onValid`.
 * `extraCheck` returns an error message to block submission (shown via alert, as on the live site).
 */
export function useRequestForm(onValid: (data: FormData) => void, extraCheck?: (data: FormData) => string | null) {
  const { t } = useI18n();
  const onSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const form = event.currentTarget;
      baseChecks(form, t);
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      const data = new FormData(form);
      const problem = extraCheck?.(data);
      if (problem) {
        window.alert(problem);
        return;
      }
      onValid(data);
    },
    [extraCheck, onValid, t],
  );

  // Clear a custom error as soon as the visitor edits the field.
  const onInput = useCallback((event: FormEvent<HTMLFormElement>) => {
    const target = event.target as HTMLInputElement;
    target.setCustomValidity?.("");
  }, []);

  return { onSubmit, onInput, noValidate: true } as const;
}

/**
 * Stores the request (→ SAFRA-1000 reference, with the visitor's language), then hands it over the way /admin/settings says:
 * - 'onsite': show a confirmation with the reference (SAFRA contacts the customer)
 * - 'whatsapp': open the prepared WhatsApp message (in the visitor's language) carrying the reference
 * Edge cases:
 * - invalid input: shows the server's message and stays on the form
 * - storage down / not configured / network error: opens WhatsApp without a reference, so no lead is lost
 * - browser blocks the redirect: exposes the link instead
 */
export function useConciergeSubmit(booking: BookingConfig) {
  const { locale, t } = useI18n();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fallbackHref, setFallbackHref] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);

  const send = useCallback(
    (draft: RequestDraft, honeypot: string) => {
      const request = { ...draft, locale } as ConciergeRequest;
      const message = (reference?: string) => requestMessage(request, reference, t.whatsapp);
      setError(null);
      setFallbackHref(null);
      startTransition(async () => {
        let reference: string | undefined;
        let handOff = { ...booking, mode: "whatsapp" as const };
        try {
          const result = await submitRequest(request, honeypot);
          if (result.status === "invalid") {
            setError(result.message);
            return;
          }
          if (result.status === "saved") {
            reference = result.reference;
            if (result.booking.mode === "onsite") {
              setConfirmation({
                reference,
                whatsapp: request.whatsapp,
                chatHref: whatsappUrl(message(reference), result.booking.whatsappNumber),
              });
              return;
            }
          }
          handOff = { ...result.booking, mode: "whatsapp" };
        } catch {
          // Server action unreachable: still hand off to WhatsApp below.
        }
        const href = whatsappUrl(message(reference), handOff.whatsappNumber);
        try {
          window.location.assign(href);
        } catch {
          setFallbackHref(href);
        }
      });
    },
    [booking, locale, t],
  );

  return { send, pending, error, fallbackHref, confirmation };
}

export interface Confirmation {
  reference: string;
  /** The number the customer gave, shown back to them. */
  whatsapp: string;
  /** Optional: open the same request as a WhatsApp chat. */
  chatHref: string;
}

/** Shown instead of the form once an on-site reservation is stored. */
export function ReservationConfirmation({ confirmation, what }: { confirmation: Confirmation; what: string }) {
  const { t } = useI18n();
  const [before, after = ""] = t.forms.confirmRef.split("{ref}");
  return (
    <div role="status" className="grid gap-3 rounded-3xl border border-ink/14 bg-white/80 p-6 text-center">
      <div aria-hidden className="mx-auto grid size-14 place-items-center rounded-full bg-orange text-2xl font-black">
        ✓
      </div>
      <h2 className="m-0 text-3xl leading-tight font-black tracking-[-0.02em] rtl:tracking-normal">{t.forms.confirmTitle}</h2>
      <p className="m-0 text-lg">
        {before}
        <strong className="whitespace-nowrap" dir="ltr">
          {confirmation.reference}
        </strong>
        {after}
      </p>
      {/* The number is isolated so "+216 …" keeps its order inside Arabic text. */}
      <p className="m-0 font-bold">{fmt(t.forms.confirmContact, { phone: `\u2068${confirmation.whatsapp}\u2069`, what })}</p>
      <p className="m-0 text-sm opacity-75">{t.forms.confirmKeep}</p>
      <a href={confirmation.chatHref} className="justify-self-center text-sm font-extrabold underline">
        {t.forms.confirmChat}
      </a>
    </div>
  );
}

/** Copy that depends on the booking mode. */
export function bookingCopy(mode: BookingMode, t: Messages) {
  return mode === "onsite"
    ? { intro: t.forms.introOnsite, submit: t.forms.submitOnsite }
    : { intro: t.forms.introWhatsapp, submit: t.forms.submitWhatsapp };
}

/** Off-screen field that only bots fill in (read it with HONEYPOT_FIELD). */
export const HONEYPOT_FIELD = "website";
export function Honeypot() {
  return (
    <div aria-hidden className="absolute -start-[9999px] h-px w-px overflow-hidden">
      <label>
        Website
        <input name={HONEYPOT_FIELD} type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
      </label>
    </div>
  );
}

export function SubmitButton({ pending, mode }: { pending: boolean; mode: BookingMode }) {
  const { t } = useI18n();
  return (
    <button type="submit" disabled={pending} aria-busy={pending} className={`${primaryButtonClass} disabled:cursor-wait disabled:opacity-70`}>
      {pending ? t.forms.sending : bookingCopy(mode, t).submit}
    </button>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="m-0 rounded-xl border border-[#C2410C]/30 bg-[#FFF1EC] px-3 py-2.5 font-bold text-[#9A3412]">
      {message}
    </p>
  );
}

export function WhatsAppFallback({ href }: { href: string | null }) {
  const { t } = useI18n();
  if (!href) return null;
  return (
    <div className="grid gap-2.5">
      <p role="alert" className="m-0 font-extrabold">
        {t.forms.fallbackAlert}
      </p>
      <a href={href} className={primaryButtonClass}>
        {t.forms.fallbackLink}
      </a>
    </div>
  );
}

export function str(data: FormData, key: string): string {
  const value = data.get(key);
  return typeof value === "string" ? value.trim() : "";
}
