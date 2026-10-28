"use client";

import { useActionState } from "react";
import { saveSettings, type SettingsState } from "../../actions/settings";
import { Notice, adminInput, adminPrimaryButton } from "../../ui";

const MODES = [
  {
    value: "whatsapp",
    title: "WhatsApp hand-off",
    body: "The request is saved, then the visitor’s WhatsApp opens with a prepared message (with its SAFRA reference). They tap Send.",
  },
  {
    value: "onsite",
    title: "Reservation on the site",
    body: "The request is saved and the visitor sees a confirmation with their reference. No WhatsApp step — SAFRA contacts them. Shown as “Reserved on site” in Requests.",
  },
] as const;

/** Trip plan checkout settings, named like their site_settings columns. */
export interface CheckoutSettings {
  plan_price_dt: number;
  delivery_fee_dt: number;
  d17_number: string;
  flouci_number: string;
  wafacash_name: string;
  wafacash_phone: string;
  bank_name: string;
  bank_holder: string;
  bank_rib: string;
}

export function SettingsForm({
  bookingMode,
  whatsappNumber,
  checkout,
}: {
  bookingMode: string;
  whatsappNumber: string;
  checkout: CheckoutSettings;
}) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(saveSettings, { error: null });

  return (
    <form action={action} className="grid gap-4">
      <fieldset className="grid gap-3 rounded-2xl border border-ink/10 bg-white p-4 sm:p-5">
        <legend className="px-1 text-lg font-black">How visitors send requests</legend>
        {MODES.map((m) => (
          <label
            key={m.value}
            className="flex cursor-pointer gap-3 rounded-xl border border-ink/12 p-3 has-checked:border-orange has-checked:bg-orange/10"
          >
            <input type="radio" name="booking_mode" value={m.value} defaultChecked={bookingMode === m.value} className="mt-1 size-4 accent-orange" />
            <span className="grid gap-0.5">
              <span className="font-extrabold">{m.title}</span>
              <span className="text-sm opacity-75">{m.body}</span>
            </span>
          </label>
        ))}
        <p className="m-0 text-xs opacity-70">
          Applies to visa applications. Trip plan orders always show their confirmation and payment
          steps on the site, then hand over on WhatsApp. If saving ever fails, visitors still get WhatsApp so no request
          is lost.
        </p>
      </fieldset>

      <fieldset className="grid gap-2 rounded-2xl border border-ink/10 bg-white p-4 sm:p-5">
        <legend className="px-1 text-lg font-black">SAFRA’s WhatsApp number</legend>
        <label className="grid max-w-[320px] gap-1.5 text-sm font-bold">
          Number with country code
          <input name="whatsapp_number" type="tel" required defaultValue={`+${whatsappNumber}`} className={adminInput} />
        </label>
        <p className="m-0 text-xs opacity-70">Every “Message on WhatsApp” link and prepared message goes to this number.</p>
      </fieldset>

      <fieldset className="grid gap-4 rounded-2xl border border-ink/10 bg-white p-4 sm:p-5">
        <legend className="px-1 text-lg font-black">Trip plan &amp; payments</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <SettingField label="Trip plan price (DT)" hint="What a complete trip plan costs, whatever the destination.">
            <input name="plan_price_dt" type="number" min={1} max={100000} step={1} required defaultValue={checkout.plan_price_dt} className={adminInput} />
          </SettingField>
          <SettingField label="Delivery fee (DT)" hint="Added for cash on delivery: the order is delivered to the customer’s home, anywhere in Tunisia.">
            <input name="delivery_fee_dt" type="number" min={0} max={1000} step={1} required defaultValue={checkout.delivery_fee_dt} className={adminInput} />
          </SettingField>
        </div>

        <div className="grid gap-1">
          <span className="font-extrabold">Online payment accounts</span>
          <span className="text-sm opacity-75">
            Customers see these after choosing “Pay online”, send the money, then send you the receipt on WhatsApp.
            Leave a method empty to hide it. With all of them empty, only cash on delivery is offered.
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <SettingField label="D17 — phone number">
            <input name="d17_number" type="text" maxLength={40} defaultValue={checkout.d17_number} placeholder="+216 …" className={adminInput} />
          </SettingField>
          <SettingField label="Flouci — phone number">
            <input name="flouci_number" type="text" maxLength={40} defaultValue={checkout.flouci_number} placeholder="+216 …" className={adminInput} />
          </SettingField>
          <SettingField label="Wafacash — recipient’s full name">
            <input name="wafacash_name" type="text" maxLength={120} defaultValue={checkout.wafacash_name} className={adminInput} />
          </SettingField>
          <SettingField label="Wafacash — recipient’s phone">
            <input name="wafacash_phone" type="text" maxLength={40} defaultValue={checkout.wafacash_phone} placeholder="+216 …" className={adminInput} />
          </SettingField>
          <SettingField label="Bank transfer — account holder">
            <input name="bank_holder" type="text" maxLength={120} defaultValue={checkout.bank_holder} className={adminInput} />
          </SettingField>
          <SettingField label="Bank transfer — bank name">
            <input name="bank_name" type="text" maxLength={120} defaultValue={checkout.bank_name} className={adminInput} />
          </SettingField>
          <SettingField label="Bank transfer — RIB" hint="The bank transfer option appears once the RIB is filled in.">
            <input name="bank_rib" type="text" maxLength={40} defaultValue={checkout.bank_rib} className={`${adminInput} font-mono`} />
          </SettingField>
        </div>
      </fieldset>

      {state.error ? <Notice tone="error">{state.error}</Notice> : null}
      <button disabled={pending} className={`${adminPrimaryButton} justify-self-start`}>
        {pending ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}

function SettingField({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="grid content-start gap-1.5 text-sm font-bold">
      {label}
      {children}
      {hint ? <span className="text-xs font-semibold opacity-70">{hint}</span> : null}
    </label>
  );
}
