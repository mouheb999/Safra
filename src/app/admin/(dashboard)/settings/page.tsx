import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/session";
import { Notice } from "../../ui";
import { SettingsForm } from "./SettingsForm";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const { supabase } = await requireAdmin();
  const { saved } = await searchParams;
  const { data } = await supabase.from("site_settings").select("booking_mode, whatsapp_number").eq("id", 1).maybeSingle();

  return (
    <div className="grid max-w-[760px] gap-4">
      <h1 className="m-0 text-3xl font-black tracking-[-0.02em]">Settings</h1>
      {saved ? <Notice>Settings saved — the public site uses them now.</Notice> : null}
      <SettingsForm bookingMode={data?.booking_mode ?? "whatsapp"} whatsappNumber={data?.whatsapp_number ?? "21697433003"} />
    </div>
  );
}
