"use client";

import Image from "next/image";
import { useCallback, useEffect, useState, useTransition, type ReactNode } from "react";
import { submitRequest } from "@/app/actions/submit-request";
import { Field, FormError, HONEYPOT_FIELD, Honeypot, inputClass, str, useRequestForm } from "@/components/forms";
import { useI18n } from "@/i18n/client";
import { fmt, label } from "@/i18n/fmt";
import type { Messages } from "@/i18n/messages/en";
import { formatDT } from "@/lib/budget";
import {
  GOVERNORATES,
  METHOD_NAME,
  accountDetails,
  availableOnlineMethods,
  governorateLabel,
  orderTotal,
  type CheckoutConfig,
  type OnlineMethod,
  type PaymentMethod,
} from "@/lib/payments";
import { requestMessage, whatsappUrl, type BookingConfig, type TripRequest } from "@/lib/requests";
import type { TripRequestPrefill } from "@/lib/search-params";
import { cardClass, chipClass } from "./RequestHeader";

/** The destination being ordered, when it came from the catalog. */
export interface CheckoutDestination {
  title: string;
  country: string;
  /** May be empty (a trip-brain country without a photo yet). */
  image: string;
}

/** The trip chosen on "Find my trip", as rebuilt by the checkout page. */
export interface BrainCheckoutTrip {
  /** The encoded answers (src/lib/brain/input.ts) + the chosen country; the server rebuilds the trip from them. */
  pick: string;
  country: string;
  countryName: string;
  image: string;
  /** "Bangkok · 4 nights + Krabi · 6 nights" */
  itinerary: string;
  tripCostTND: number;
}

interface PlacedOrder {
  request: TripRequest;
  /** Missing when the order couldn't be stored: WhatsApp is then the only copy SAFRA gets. */
  reference?: string;
  totalDT: number;
  whatsappNumber: string;
}

/**
 * Trip plan checkout — reached from /trip (destination known) or directly (destination typed in).
 * The visitor describes the trip, then pays on delivery (printed plan, +delivery fee) or online
 * (D17 / Flouci / Wafacash / bank transfer, receipt sent on WhatsApp). Prices come from /admin/settings.
 */
export function TripRequestForm({
  prefill,
  booking,
  checkout,
  destination,
  packTitle,
  brainTrip,
}: {
  prefill: TripRequestPrefill;
  booking: BookingConfig;
  checkout: CheckoutConfig;
  destination?: CheckoutDestination;
  /** Set when the visitor came from "Our packs"; noted on the request. */
  packTitle?: string;
  /** Set when the visitor chose a trip on "Find my trip"; the server stores its full breakdown. */
  brainTrip?: BrainCheckoutTrip;
}) {
  const { t, locale } = useI18n();
  const c = t.checkout;
  const hasSelection = prefill.selectedCountry !== "";
  const askDestination = !brainTrip && (prefill.mode === "direct" || !hasSelection);

  const onlineMethods = availableOnlineMethods(checkout.accounts);
  const [payMode, setPayMode] = useState<"cod" | "online">("cod");
  const [onlineMethod, setOnlineMethod] = useState<OnlineMethod | undefined>(onlineMethods[0]);
  const method: PaymentMethod = payMode === "online" && onlineMethod ? onlineMethod : "cod";
  const total = orderTotal(checkout, method);

  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [placed, setPlaced] = useState<PlacedOrder | null>(null);

  const form = useRequestForm((data) => {
    const typedDestination = askDestination ? str(data, "desiredDestination") : "";
    const request: TripRequest = {
      kind: "trip",
      locale,
      source: brainTrip ? "quiz" : askDestination ? "direct" : "trip",
      // Keep the catalog link only while the destination is still the one picked upstream.
      destinationSlug: !typedDestination || typedDestination === prefill.selectedCountry ? prefill.selectedSlug : "",
      fullName: str(data, "fullName"),
      whatsapp: str(data, "whatsapp"),
      travelers: str(data, "travelers"),
      destination: brainTrip?.countryName ?? ((askDestination ? typedDestination : prefill.desiredDestination) || prefill.selectedCountry),
      category: prefill.category,
      preferredDate: str(data, "preferredDate"),
      durationDays: str(data, "durationDays"),
      budgetDT: str(data, "budgetDT"),
      notes: str(data, "notes"),
      paymentMethod: method,
      governorate: method === "cod" ? str(data, "governorate") : "",
      address: method === "cod" ? str(data, "address") : "",
      ...(brainTrip ? { brain: { pick: brainTrip.pick, country: brainTrip.country }, itinerary: brainTrip.itinerary } : {}),
    };
    setError(null);
    startTransition(async () => {
      // Whatever happens to storage, the visitor gets the payment steps and a WhatsApp copy of the order.
      let order: PlacedOrder = { request, totalDT: total, whatsappNumber: booking.whatsappNumber };
      try {
        const result = await submitRequest(request, str(data, HONEYPOT_FIELD));
        if (result.status === "invalid") {
          setError(result.message);
          return;
        }
        order = { ...order, whatsappNumber: result.booking.whatsappNumber };
        if (result.status === "saved") order = { ...order, reference: result.reference, totalDT: result.order?.totalDT ?? total };
      } catch {
        // Server action unreachable: hand over on WhatsApp.
      }
      setPlaced(order);
    });
  });

  useEffect(() => {
    if (placed) window.scrollTo({ top: 0, behavior: "smooth" });
  }, [placed]);

  const summary = <OrderSummary checkout={checkout} method={method} destination={destination} tripCostTND={brainTrip?.tripCostTND} />;

  return (
    <section className="@container px-[clamp(20px,3vw,32px)]">
      <div className="mx-auto grid max-w-[1120px] gap-[18px]">
        {placed ? (
          <OrderConfirmation order={placed} checkout={checkout} />
        ) : (
          <>
            <header className={cardClass}>
              <span className="justify-self-start rounded-full bg-orange px-3 py-1.5 text-xs font-black">{c.eyebrow}</span>
              <h1 className="m-0 text-5xl leading-[1.05] font-black tracking-[-0.03em] @max-[810px]:text-[34px] rtl:leading-[1.3] rtl:tracking-normal">
                {c.title}
              </h1>
              <p className="m-0 font-bold">{c.intro}</p>
              <div className="flex flex-wrap gap-2">
                {brainTrip ? <div className={chipClass}>{t.brain.chip}</div> : null}
                {packTitle ? <div className={chipClass}>{fmt(t.request.packChip, { value: packTitle })}</div> : null}
                {hasSelection ? <div className={chipClass}>{fmt(t.request.destinationChip, { value: prefill.selectedCountry })}</div> : null}
                {prefill.category ? (
                  <div className={chipClass}>{fmt(t.request.categoryChip, { value: label(t.options.vibes, prefill.category) })}</div>
                ) : null}
              </div>
            </header>

            <div className="grid grid-cols-[minmax(0,1.5fr)_minmax(300px,1fr)] items-start gap-[18px] @max-[880px]:grid-cols-1">
              <form {...form} className="grid min-w-0 gap-[18px]">
                <section className={cardClass}>
                  <StepHeading n={1}>{c.stepTrip}</StepHeading>
                  <p className="m-0 text-xs opacity-80">{t.forms.required}</p>
                  <div className="grid grid-cols-2 gap-3 @max-[560px]:grid-cols-1">
                    {askDestination ? (
                      <Field label={`${t.request.desiredDestination}${hasSelection ? "" : " *"}`}>
                        <input
                          name="desiredDestination"
                          required={!hasSelection}
                          type="text"
                          maxLength={120}
                          defaultValue={prefill.desiredDestination}
                          placeholder={t.request.desiredPlaceholder}
                          className={inputClass}
                        />
                      </Field>
                    ) : null}
                    <Field label={t.forms.travelers}>
                      <input name="travelers" required type="number" min={1} max={99} defaultValue={prefill.travelers} className={inputClass} />
                    </Field>
                    <Field label={t.forms.preferredDate}>
                      <input name="preferredDate" type="date" defaultValue={prefill.preferredDate} className={inputClass} />
                    </Field>
                    <Field label={t.request.durationDays}>
                      <input name="durationDays" type="number" min={1} defaultValue={prefill.durationDays} className={inputClass} />
                    </Field>
                  </div>
                  <Field label={t.request.budget} hint={t.request.budgetHint}>
                    <input name="budgetDT" required type="number" min={1} defaultValue={prefill.budgetDT} placeholder="2900" className={inputClass} />
                  </Field>
                  <Field label={t.forms.notes}>
                    <textarea
                      name="notes"
                      rows={3}
                      maxLength={1500}
                      defaultValue={packTitle ? `${fmt(t.request.packChip, { value: packTitle })}\n` : undefined}
                      placeholder={t.forms.notesPlaceholder}
                      className={`${inputClass} resize-y`}
                    />
                  </Field>
                </section>

                <section className={cardClass}>
                  <StepHeading n={2}>{c.stepDetails}</StepHeading>
                  <div className="grid grid-cols-2 gap-3 @max-[560px]:grid-cols-1">
                    <Field label={t.forms.fullName}>
                      <input name="fullName" required type="text" maxLength={120} autoComplete="name" placeholder={t.forms.fullNamePlaceholder} className={inputClass} />
                    </Field>
                    <Field label={t.forms.whatsapp}>
                      <input name="whatsapp" required type="tel" dir="ltr" maxLength={40} autoComplete="tel" placeholder={t.forms.whatsappPlaceholder} className={`${inputClass} rtl:text-end`} />
                    </Field>
                  </div>
                </section>

                <section className={cardClass}>
                  <StepHeading n={3}>{c.stepPayment}</StepHeading>
                  <div role="radiogroup" aria-label={c.stepPayment} className="grid gap-2.5">
                    <PayOption
                      checked={payMode === "cod"}
                      onSelect={() => setPayMode("cod")}
                      icon={<TruckIcon />}
                      title={c.codTitle}
                      body={c.codBody}
                      tag={fmt(c.codFee, { fee: formatDT(checkout.deliveryFeeDT, locale) })}
                    />
                    {onlineMethods.length > 0 ? (
                      <PayOption
                        checked={payMode === "online"}
                        onSelect={() => setPayMode("online")}
                        icon={<PhoneIcon />}
                        title={c.onlineTitle}
                        body={c.onlineBody}
                        tag={c.onlineFee}
                      />
                    ) : null}
                  </div>

                  {payMode === "cod" ? (
                    <div className="grid animate-fade grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)] gap-3 @max-[560px]:grid-cols-1">
                      <Field label={c.governorate}>
                        <select name="governorate" required defaultValue="" className={inputClass}>
                          <option value="">{t.forms.select}</option>
                          {GOVERNORATES.map((g) => (
                            <option key={g.value} value={g.value}>
                              {governorateLabel(g.value, locale)}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label={c.address}>
                        <input name="address" required type="text" maxLength={300} autoComplete="street-address" placeholder={c.addressPlaceholder} className={inputClass} />
                      </Field>
                    </div>
                  ) : onlineMethod ? (
                    <div className="grid animate-fade gap-3">
                      <div className="font-bold">{c.methodLabel}</div>
                      <div role="radiogroup" aria-label={c.methodLabel} className="grid grid-cols-4 gap-2 @max-[560px]:grid-cols-2">
                        {onlineMethods.map((m) => (
                          <button
                            key={m}
                            type="button"
                            role="radio"
                            aria-checked={onlineMethod === m}
                            onClick={() => setOnlineMethod(m)}
                            className={`cursor-pointer rounded-xl border px-3 py-3 text-center font-black transition-colors ${
                              onlineMethod === m ? "border-orange bg-orange/15" : "border-ink/16 bg-white hover:border-ink/35"
                            }`}
                          >
                            {methodName(m, t)}
                          </button>
                        ))}
                      </div>
                      <AccountPanel method={onlineMethod} checkout={checkout} totalDT={total} />
                      <p className="m-0 text-sm font-bold opacity-80">{c.onlineSteps}</p>
                    </div>
                  ) : null}

                  <Honeypot />
                  <FormError message={error} />
                  <button
                    type="submit"
                    disabled={pending}
                    aria-busy={pending}
                    className="mt-1 w-full cursor-pointer rounded-full bg-orange px-6 py-4 text-lg font-black text-ink hover:brightness-95 disabled:cursor-wait disabled:opacity-70"
                  >
                    {pending ? t.forms.sending : fmt(c.submit, { total: formatDT(total, locale) })}
                  </button>
                  <p className="m-0 text-center text-xs opacity-75">{c.noCardNote}</p>
                </section>
              </form>

              <aside className="sticky top-4 @max-[880px]:static">{summary}</aside>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

/** Brand names stay as they are; "Bank transfer" is translated. */
const methodName = (m: OnlineMethod, t: Messages) => (m === "bank" ? t.checkout.bankTransfer : METHOD_NAME[m]);

function StepHeading({ n, children }: { n: number; children: ReactNode }) {
  return (
    <h2 className="m-0 flex items-center gap-2.5 text-2xl font-black tracking-[-0.01em] rtl:tracking-normal">
      <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-full bg-ink text-base text-cream">
        {n}
      </span>
      {children}
    </h2>
  );
}

function PayOption({
  checked,
  onSelect,
  icon,
  title,
  body,
  tag,
}: {
  checked: boolean;
  onSelect: () => void;
  icon: ReactNode;
  title: string;
  body: string;
  tag: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={onSelect}
      className={`flex w-full cursor-pointer items-start gap-3 rounded-2xl border-2 p-4 text-start transition-colors ${
        checked ? "border-orange bg-orange/10" : "border-ink/12 bg-white hover:border-ink/30"
      }`}
    >
      <span aria-hidden className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2 ${checked ? "border-orange" : "border-ink/30"}`}>
        {checked ? <span className="size-2.5 rounded-full bg-orange" /> : null}
      </span>
      <span className="grid min-w-0 flex-1 gap-1">
        <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <span className="inline-flex items-center gap-2 text-lg font-black">
            {icon}
            {title}
          </span>
          <span className="rounded-full bg-sky px-2.5 py-1 text-xs font-black">{tag}</span>
        </span>
        <span className="text-sm font-semibold opacity-80">{body}</span>
      </span>
    </button>
  );
}

/** Where to send the money for an online method, with copy buttons. */
function AccountPanel({
  method,
  checkout,
  totalDT,
  heading = true,
}: {
  method: OnlineMethod;
  checkout: CheckoutConfig;
  totalDT: number;
  heading?: boolean;
}) {
  const { t, locale } = useI18n();
  const c = t.checkout;
  return (
    <div className="grid gap-2 rounded-2xl bg-sky/70 p-4">
      {heading ? (
        <div className="text-sm font-black tracking-[.04em] text-sea rtl:tracking-normal">
          {fmt(c.payTo, { total: formatDT(totalDT, locale) })} · {methodName(method, t)}
        </div>
      ) : null}
      {accountDetails(method, checkout.accounts).map(([field, value]) => (
        <div key={field} className="flex items-center justify-between gap-3 rounded-xl bg-white/80 px-3 py-2.5">
          <span className="grid min-w-0 gap-0.5">
            <span className="text-xs font-bold opacity-70">{c.fields[field]}</span>
            <span dir="ltr" className={`font-black break-all rtl:text-end ${field === "rib" ? "font-mono text-[15px] tracking-[.04em]" : ""}`}>
              {value}
            </span>
          </span>
          <CopyButton value={value} />
        </div>
      ))}
    </div>
  );
}

function CopyButton({ value }: { value: string }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timeout = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(timeout);
  }, [copied]);
  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      // Clipboard blocked: the value stays visible to copy by hand.
    }
  }, [value]);
  return (
    <button
      type="button"
      onClick={copy}
      className="shrink-0 cursor-pointer rounded-full border border-ink/20 bg-white px-3 py-1.5 text-xs font-black hover:border-ink/45"
    >
      <span aria-live="polite">{copied ? t.checkout.copied : t.checkout.copy}</span>
    </button>
  );
}

function OrderSummary({
  checkout,
  method,
  destination,
  tripCostTND,
}: {
  checkout: CheckoutConfig;
  method: PaymentMethod;
  destination?: CheckoutDestination;
  /** The trip brain's estimate for the trip itself (paid later, not part of this order). */
  tripCostTND?: number;
}) {
  const { t, locale } = useI18n();
  const c = t.checkout;
  const fee = method === "cod" ? checkout.deliveryFeeDT : 0;
  return (
    <div className="grid gap-4 overflow-hidden rounded-3xl bg-ink text-cream">
      {destination?.image ? (
        <div className="relative h-[150px]">
          <Image src={destination.image} alt="" fill sizes="(max-width: 880px) 100vw, 400px" className="object-cover" />
          <div aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,rgba(32,61,53,0)_30%,rgba(32,61,53,.95)_100%)]" />
        </div>
      ) : null}
      <div className={`grid gap-4 px-5 pb-5 ${destination?.image ? "-mt-12 relative" : "pt-5"}`}>
        <div className="grid gap-1">
          <span className="text-xs font-black tracking-[.12em] text-orange rtl:tracking-normal">{c.summaryTitle}</span>
          <span className="text-2xl leading-tight font-black">{destination ? destination.title : c.customDestination}</span>
          {destination ? <span className="font-bold opacity-80">{destination.country}</span> : null}
          {tripCostTND ? (
            <span className="text-sm opacity-80">
              {t.brain.summaryCost} ≈ {formatDT(tripCostTND, locale)}
            </span>
          ) : null}
        </div>

        <dl className="m-0 grid gap-2 border-y border-cream/15 py-4">
          <SummaryRow label={c.planLine} value={formatDT(checkout.planPriceDT, locale)} />
          <SummaryRow label={c.delivery} value={fee ? formatDT(fee, locale) : c.free} />
          <div className="mt-1 flex items-baseline justify-between gap-3">
            <dt className="text-lg font-black">{c.total}</dt>
            <dd className="m-0 text-[32px] leading-none font-black tracking-[-0.02em]">{formatDT(checkout.planPriceDT + fee, locale)}</dd>
          </div>
        </dl>

        <div className="grid gap-2">
          <span className="font-black">{c.includesTitle}</span>
          <ul className="m-0 grid list-none gap-1.5 p-0">
            {c.includes.map((item) => (
              <li key={item} className="flex gap-2 text-sm">
                <span aria-hidden className="font-black text-orange">
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="opacity-85">{label}</dt>
      <dd className="m-0 font-black whitespace-nowrap">{value}</dd>
    </div>
  );
}

/**
 * After ordering: the reference, then either the two payment steps (send the money, send the receipt
 * on WhatsApp) or the cash-on-delivery summary. The WhatsApp message always carries the whole order,
 * so SAFRA gets it even if storing it failed (no reference shown then).
 */
function OrderConfirmation({ order, checkout }: { order: PlacedOrder; checkout: CheckoutConfig }) {
  const { t, locale } = useI18n();
  const c = t.checkout;
  const { request, reference, totalDT } = order;
  const total = formatDT(totalDT, locale);
  const chatHref = whatsappUrl(requestMessage(request, reference, t.whatsapp, totalDT), order.whatsappNumber);
  const online = request.paymentMethod !== "cod" ? request.paymentMethod : null;
  const [before, after = ""] = c.confirmRef.split("{ref}");
  const place = [request.address, governorateLabel(request.governorate, locale)].filter(Boolean).join(", ");
  const stepClass = "m-0 text-xl font-black";

  return (
    <div role="status" className="mx-auto grid w-full max-w-[640px] animate-enter gap-4 rounded-3xl border border-ink/14 bg-white/80 p-6 text-center motion-reduce:animate-none">
      <div aria-hidden className="mx-auto grid size-14 place-items-center rounded-full bg-orange text-2xl font-black">
        ✓
      </div>
      <h1 className="m-0 text-4xl leading-tight font-black tracking-[-0.02em] rtl:tracking-normal">{c.confirmTitle}</h1>
      {reference ? (
        <p className="m-0 text-lg">
          {before}
          <strong className="whitespace-nowrap" dir="ltr">
            {reference}
          </strong>
          {after}
        </p>
      ) : null}

      {online ? (
        <div className="grid gap-4 text-start">
          <div className="grid gap-2">
            <h2 className={stepClass}>{fmt(c.payStep1, { total, method: methodName(online, t) })}</h2>
            <AccountPanel method={online} checkout={checkout} totalDT={totalDT} heading={false} />
            {reference ? <p className="m-0 text-sm font-bold opacity-80">{fmt(c.payNowNote, { ref: reference })}</p> : null}
          </div>
          <div className="grid gap-2">
            <h2 className={stepClass}>{c.payStep2}</h2>
            <a href={chatHref} className="rounded-full bg-orange px-6 py-4 text-center text-lg font-black text-ink hover:brightness-95">
              {c.sendReceipt}
            </a>
            <p className="m-0 text-center text-sm opacity-80">{c.receiptHint}</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-3">
          <p className="m-0 text-lg font-bold">{fmt(c.codConfirm, { place, total })}</p>
          {reference ? (
            <a href={chatHref} className="justify-self-center text-sm font-extrabold underline">
              {c.chat}
            </a>
          ) : (
            <a href={chatHref} className="rounded-full bg-orange px-6 py-4 text-lg font-black text-ink hover:brightness-95">
              {c.sendOrder}
            </a>
          )}
        </div>
      )}
      {reference ? <p className="m-0 text-sm opacity-75">{t.forms.confirmKeep}</p> : null}
    </div>
  );
}

function TruckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 6h11v10H3zM14 9h4l3 3v4h-7" />
      <circle cx="7" cy="17.5" r="1.8" />
      <circle cx="17.5" cy="17.5" r="1.8" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="6" y="2.5" width="12" height="19" rx="2.5" />
      <path d="M10.5 18h3" />
    </svg>
  );
}
