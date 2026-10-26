import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/session";
import { DEFAULT_DELIVERY_FEE_DT, DEFAULT_PLAN_PRICE_DT } from "@/lib/payments";
import { Notice } from "../../ui";
import { SettingsForm } from "./SettingsForm";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const { supabase } = await requireAdmin();
  const { saved } = await searchParams;
  const { data } = await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle();

  return (
    <div className="grid max-w-[760px] gap-4">
      <h1 className="m-0 text-3xl font-black tracking-[-0.02em]">Settings</h1>
      {saved ? <Notice>Settings saved — the public site uses them now.</Notice> : null}
      <SettingsForm
        bookingMode={data?.booking_mode ?? "whatsapp"}
        whatsappNumber={data?.whatsapp_number ?? "21697433003"}
        checkout={{
          plan_price_dt: data?.plan_price_dt ?? DEFAULT_PLAN_PRICE_DT,
          delivery_fee_dt: data?.delivery_fee_dt ?? DEFAULT_DELIVERY_FEE_DT,
          d17_number: data?.d17_number ?? "",
          flouci_number: data?.flouci_number ?? "",
          wafacash_name: data?.wafacash_name ?? "",
          wafacash_phone: data?.wafacash_phone ?? "",
          bank_name: data?.bank_name ?? "",
          bank_holder: data?.bank_holder ?? "",
          bank_rib: data?.bank_rib ?? "",
        }}
      />
    </div>
  );
}
