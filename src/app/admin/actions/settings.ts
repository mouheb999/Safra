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
});

export async function saveSettings(_prev: SettingsState, fd: FormData): Promise<SettingsState> {
  const { supabase } = await requireAdmin();
  const parsed = settingsSchema.safeParse({ booking_mode: fd.get("booking_mode"), whatsapp_number: String(fd.get("whatsapp_number") ?? "") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the form." };

  const { data, error } = await supabase.from("site_settings").update(parsed.data).eq("id", 1).select("id");
  if (error) {
    console.error("[admin] settings save failed", error);
    return { error: error.code === "23514" ? "That WhatsApp number isn’t valid." : "Couldn’t save — try again." };
  }
  if (!data?.length) return { error: "Your account isn’t allowed to change settings." };

  // Forms, buttons and WhatsApp links on every public page depend on these.
  revalidatePath("/", "layout");
  redirect("/admin/settings?saved=1");
}
