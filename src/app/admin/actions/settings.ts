"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/session";

export type SettingsState = { error: string | null };

const settingsSchema = z.object({
  booking_mode: z.enum(["whatsapp", "onsite"], "Choose how requests are handled."),
  // Accept "+216 97 433 003" and store digits only, as WhatsApp links need them.
  whatsapp_number: z
    .string()
    .transform((v) => v.replace(/\D/g, ""))
    .pipe(z.string().regex(/^[1-9]\d{6,14}$/, "WhatsApp number: country code + number, e.g. +216 97 433 003.")),
  plan_price_dt: z.coerce.number("Plan price: a number of DT.").int("Plan price: whole DT only.").min(1, "Plan price must be at least 1 DT.").max(100000),
  delivery_fee_dt: z.coerce.number("Delivery fee: a number of DT.").int("Delivery fee: whole DT only.").min(0).max(1000, "Delivery fee: at most 1,000 DT."),
  // Payment accounts shown at checkout; an empty field hides that method.
  d17_number: z.string().trim().max(40, "D17 number: 40 characters at most."),
  flouci_number: z.string().trim().max(40, "Flouci number: 40 characters at most."),
  wafacash_name: z.string().trim().max(120),
  wafacash_phone: z.string().trim().max(40),
  bank_name: z.string().trim().max(120),
  bank_holder: z.string().trim().max(120),
  bank_rib: z.string().trim().max(40, "RIB: 40 characters at most."),
});

const SETTINGS_FIELDS = Object.keys(settingsSchema.shape) as (keyof typeof settingsSchema.shape)[];

export async function saveSettings(_prev: SettingsState, fd: FormData): Promise<SettingsState> {
  const { supabase } = await requireAdmin();
  const parsed = settingsSchema.safeParse(Object.fromEntries(SETTINGS_FIELDS.map((k) => [k, String(fd.get(k) ?? "")])));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  if ((parsed.data.wafacash_name === "") !== (parsed.data.wafacash_phone === ""))
    return { error: "Wafacash needs both the recipient’s name and phone (or leave both empty to hide it)." };

  const { data, error } = await supabase.from("site_settings").update(parsed.data).eq("id", 1).select("id");
  if (error) {
    console.error("[admin] settings save failed", error);
    return { error: error.code === "23514" ? "One of the values isn’t valid — check the WhatsApp number and prices." : "Couldn’t save — try again." };
  }
  if (!data?.length) return { error: "Your account isn’t allowed to change settings." };

  // Forms, buttons and WhatsApp links on every public page depend on these.
  revalidatePath("/", "layout");
  redirect("/admin/settings?saved=1");
}
