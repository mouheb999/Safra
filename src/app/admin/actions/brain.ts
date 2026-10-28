"use server";

// Trip brain edits from /admin/brain: countries, places (bases) and the thresholds. Writes go through
// the admin's own session, so RLS is the final gate; zod gives readable errors first.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { GROUP_TYPES, STAY_TYPES, type BrainActivity } from "@/data/brain";
import { BRAIN_BASE_FIELDS, BRAIN_COUNTRY_FIELDS, readTranslations } from "@/lib/admin/translations";
import { requireAdmin } from "@/lib/admin/session";
import { IMAGE_HOSTS, isAllowedImageUrl } from "@/lib/images";
import { VIBE_OPTIONS } from "@/lib/quiz";
import type { Json } from "@/lib/supabase/database.types";

export type FormState = { error: string | null };

const get = (fd: FormData, name: string) => String(fd.get(name) ?? "").trim();
const lines = (fd: FormData, name: string) => get(fd, name).split("\n").map((s) => s.trim()).filter(Boolean);
const all = (fd: FormData, name: string) => fd.getAll(name).map(String);

const key = z
  .string()
  .regex(/^[a-z0-9-]{2,40}$/, "Code: 2–40 lowercase letters, numbers or dashes.")
  .refine((s) => s !== "new", "“new” is reserved — pick another one.");
const text = (label: string, max: number) =>
  z.string().min(1, `${label} is required.`).max(max, `${label} is too long (max ${max}).`);
const tnd = (label: string) =>
  z.coerce.number().int(`${label}: whole dinars only.`).min(0, `${label} can’t be negative.`).max(1_000_000, `${label} is too high.`);
const months = z.array(z.coerce.number().int().min(1).max(12));
const sortOrder = z.coerce.number().int().min(0).max(999);

const firstIssue = (error: z.ZodError) => error.issues[0]?.message ?? "Please check the form.";

function dbMessage(error: { code?: string; message: string }): string {
  if (error.code === "23505") return "That code is already used.";
  if (error.code === "23514") return "One of the values is outside what the database allows.";
  if (error.code === "23503") return "Pick a country that exists.";
  if (error.code === "42501") return "Your account isn’t allowed to change the trip brain.";
  console.error("[admin] trip brain save failed", error);
  return "Couldn’t save — try again.";
}

/** The questionnaire reads the brain (re-read every 5 min); refresh it now. */
function refresh() {
  revalidatePath("/", "layout");
  revalidatePath("/admin/brain");
}

// ---- Thresholds --------------------------------------------------------------------------

const settingsSchema = z.object({
  brain_min_pocket_tnd: z.coerce.number().int("Pocket money: whole dinars.").min(0).max(10000, "Pocket money: at most 10,000."),
  brain_card_fee_pct: z.coerce.number().min(0, "Card fee: 0–20%.").max(20, "Card fee: 0–20%."),
  brain_max_flight_share: z.coerce.number().int().min(5, "Flight share: 5–100%.").max(100, "Flight share: 5–100%."),
  brain_activity_every: z.coerce.number().int().min(1, "Activities: every 1–14 days.").max(14, "Activities: every 1–14 days."),
});

export async function saveBrainSettings(_prev: FormState, fd: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const parsed = settingsSchema.safeParse(Object.fromEntries(Object.keys(settingsSchema.shape).map((k) => [k, get(fd, k)])));
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const { data, error } = await supabase.from("site_settings").update(parsed.data).eq("id", 1).select("id");
  if (error) return { error: dbMessage(error) };
  if (!data?.length) return { error: "Your account isn’t allowed to change settings." };
  refresh();
  redirect("/admin/brain?saved=Thresholds");
}

// ---- Countries ---------------------------------------------------------------------------

const countrySchema = z.object({
  name: text("Name", 80),
  airport: z.string().max(40, "Airport is too long (max 40)."),
  flight_tnd: tnd("Flight price").refine((n) => n > 0, "Flight price must be above 0."),
  flight_hours: z.coerce.number().positive("Flight time must be above 0.").max(99, "Flight time: at most 99 hours."),
  visa_tnd: tnd("Visa"),
  internal_move_tnd: tnd("Move between places"),
  insurance_day_tnd: tnd("Insurance"),
  esim_tnd: tnd("eSIM"),
  image_url: z.string().refine((v) => v === "" || isAllowedImageUrl(v), `Photo: upload an image, or use an https link on ${IMAGE_HOSTS.join(" or ")}.`),
  sort_order: sortOrder,
  is_active: z.boolean(),
});

/** `originalCode` is null when creating. */
export async function saveBrainCountry(originalCode: string | null, _prev: FormState, fd: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const parsed = countrySchema.safeParse({
    name: get(fd, "name"),
    airport: get(fd, "airport"),
    flight_tnd: get(fd, "flight_tnd"),
    flight_hours: get(fd, "flight_hours"),
    visa_tnd: get(fd, "visa_tnd") || "0",
    internal_move_tnd: get(fd, "internal_move_tnd") || "0",
    insurance_day_tnd: get(fd, "insurance_day_tnd") || "0",
    esim_tnd: get(fd, "esim_tnd") || "0",
    image_url: get(fd, "image_url"),
    sort_order: get(fd, "sort_order") || "0",
    is_active: fd.get("is_active") === "on",
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const { translations, error: translationError } = readTranslations(fd, BRAIN_COUNTRY_FIELDS);
  if (translationError !== null) return { error: translationError };
  const row = { ...parsed.data, translations };

  if (originalCode === null) {
    const code = key.safeParse(get(fd, "code"));
    if (!code.success) return { error: firstIssue(code.error) };
    const { error } = await supabase.from("brain_countries").insert({ code: code.data, ...row });
    if (error) return { error: dbMessage(error) };
  } else {
    const { data, error } = await supabase.from("brain_countries").update(row).eq("code", originalCode).select("code");
    if (error) return { error: dbMessage(error) };
    if (!data?.length) return { error: "That country no longer exists." };
  }
  refresh();
  redirect(`/admin/brain?saved=${encodeURIComponent(parsed.data.name)}`);
}

// ---- Places (bases) ----------------------------------------------------------------------

const ACTIVITY_HELP = "Activities: one per line, “Name | price | vibes | book or walk-in | kids or adults”.";

/** "Four Islands tour | 120 | Beach, Nature | book | kids" → an activity, or an error message. */
function parseActivity(line: string, n: number): BrainActivity | string {
  const [name = "", price = "", vibes = "", booking = "book", kids = "kids"] = line.split("|").map((s) => s.trim());
  const priceTND = Number(price);
  if (!name || name.length > 120) return `Activity ${n}: give it a name (max 120). ${ACTIVITY_HELP}`;
  if (!Number.isInteger(priceTND) || priceTND < 0) return `Activity ${n} (${name}): the price must be whole dinars.`;
  const vibeList = vibes.split(",").map((v) => v.trim()).filter(Boolean);
  const unknown = vibeList.find((v) => !(VIBE_OPTIONS as readonly string[]).includes(v));
  if (unknown) return `Activity ${n} (${name}): “${unknown}” isn’t a vibe. Use ${VIBE_OPTIONS.join(", ")}.`;
  const b = booking.toLowerCase();
  const k = kids.toLowerCase();
  if (b !== "book" && b !== "walk-in") return `Activity ${n} (${name}): write “book” or “walk-in”.`;
  if (k !== "kids" && k !== "adults") return `Activity ${n} (${name}): write “kids” or “adults”.`;
  return { name, priceTND, vibes: vibeList, booking: b === "book", kidFriendly: k === "kids" };
}

const fitValue = z.coerce.number().min(0, "Group fit: 0 to 1.").max(1, "Group fit: 0 to 1.");

const baseSchema = z
  .object({
    country_code: key,
    place: text("Place", 80),
    strengths: z.array(z.enum(VIBE_OPTIONS)).min(1, "Pick at least one strength."),
    best_months: months,
    ok_months: months,
    stay_areas: z.array(z.string().max(80, "Stay area: max 80 characters.")).min(1, "Add at least one area to stay in.").max(10, "At most 10 stay areas."),
    min_nights: z.coerce.number().int().min(1, "Min nights: 1–30.").max(30, "Min nights: 1–30."),
    family_ok: z.boolean(),
    group_fit: z.object(Object.fromEntries(GROUP_TYPES.map((g) => [g, fitValue])) as Record<(typeof GROUP_TYPES)[number], typeof fitValue>),
    stay_tnd: z.object(Object.fromEntries(STAY_TYPES.map((s) => [s, tnd("Stay price")])) as Record<(typeof STAY_TYPES)[number], ReturnType<typeof tnd>>),
    food_budget_tnd: tnd("Food (budget)"),
    food_mid_tnd: tnd("Food (mid)"),
    transport_day_tnd: tnd("Local transport"),
    transfer_tnd: tnd("Airport transfer"),
    sort_order: sortOrder,
    is_active: z.boolean(),
  })
  .refine((b) => b.best_months.length > 0, "Pick at least one best month.")
  .refine((b) => !b.best_months.some((m) => b.ok_months.includes(m)), "A month can be “best” or “okay”, not both.");

export async function saveBrainBase(originalSlug: string | null, _prev: FormState, fd: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const parsed = baseSchema.safeParse({
    country_code: get(fd, "country_code"),
    place: get(fd, "place"),
    strengths: all(fd, "strengths"),
    best_months: all(fd, "best_months"),
    ok_months: all(fd, "ok_months"),
    stay_areas: lines(fd, "stay_areas"),
    min_nights: get(fd, "min_nights"),
    family_ok: fd.get("family_ok") === "on",
    group_fit: Object.fromEntries(GROUP_TYPES.map((g) => [g, get(fd, `fit:${g}`) || "0"])),
    stay_tnd: Object.fromEntries(STAY_TYPES.map((s) => [s, get(fd, `stay:${s}`)])),
    food_budget_tnd: get(fd, "food_budget_tnd"),
    food_mid_tnd: get(fd, "food_mid_tnd"),
    transport_day_tnd: get(fd, "transport_day_tnd") || "0",
    transfer_tnd: get(fd, "transfer_tnd") || "0",
    sort_order: get(fd, "sort_order") || "0",
    is_active: fd.get("is_active") === "on",
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const activityLines = lines(fd, "activities");
  if (activityLines.length > 12) return { error: "At most 12 activities per place." };
  const activities: BrainActivity[] = [];
  for (const [i, line] of activityLines.entries()) {
    const a = parseActivity(line, i + 1);
    if (typeof a === "string") return { error: a };
    activities.push(a);
  }
  const { translations, error: translationError } = readTranslations(fd, BRAIN_BASE_FIELDS);
  if (translationError !== null) return { error: translationError };
  const row = { ...parsed.data, activities: activities as unknown as Json, translations };

  if (originalSlug === null) {
    const slug = key.safeParse(get(fd, "slug"));
    if (!slug.success) return { error: firstIssue(slug.error) };
    const { error } = await supabase.from("brain_bases").insert({ slug: slug.data, ...row });
    if (error) return { error: dbMessage(error) };
  } else {
    const { data, error } = await supabase.from("brain_bases").update(row).eq("slug", originalSlug).select("slug");
    if (error) return { error: dbMessage(error) };
    if (!data?.length) return { error: "That place no longer exists." };
  }
  refresh();
  redirect(`/admin/brain?saved=${encodeURIComponent(parsed.data.place)}`);
}

export async function deleteBrainBase(slug: string) {
  const { supabase } = await requireAdmin();
  if (!key.safeParse(slug).success) return;
  const { error } = await supabase.from("brain_bases").delete().eq("slug", slug);
  if (error) throw new Error(dbMessage(error));
  refresh();
  redirect("/admin/brain?deleted=1");
}

/** Hidden countries and places are never suggested. */
export async function setBrainActive(table: "brain_countries" | "brain_bases", id: string, active: boolean) {
  const { supabase } = await requireAdmin();
  if (!key.safeParse(id).success) return;
  const { error } =
    table === "brain_countries"
      ? await supabase.from("brain_countries").update({ is_active: active }).eq("code", id)
      : await supabase.from("brain_bases").update({ is_active: active }).eq("slug", id);
  if (error) throw new Error(dbMessage(error));
  refresh();
}
