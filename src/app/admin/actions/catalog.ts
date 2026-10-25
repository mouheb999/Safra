"use server";

// Catalog edits from /admin/catalog. Writes go through the admin's own session, so RLS
// ("admins insert/update …") is the final gate; zod gives readable errors first.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/session";
import { DESTINATION_FIELDS, SAFARI_FIELDS, VISA_FIELDS, readTranslations } from "@/lib/admin/translations";
import { IMAGE_HOSTS, isAllowedImageUrl } from "@/lib/images";

export type FormState = { error: string | null };

const DURATION_BANDS = ["Weekend", "5–7 days", "8–12 days", "2+ weeks"] as const;
const TRAVELERS = ["Just me", "Couple", "Friends", "Family"] as const;

// ---- FormData helpers --------------------------------------------------------------------
const get = (fd: FormData, name: string) => String(fd.get(name) ?? "").trim();
const lines = (fd: FormData, name: string) => get(fd, name).split("\n").map((s) => s.trim()).filter(Boolean);
const commaList = (fd: FormData, name: string) => get(fd, name).split(",").map((s) => s.trim()).filter(Boolean);
const all = (fd: FormData, name: string) => fd.getAll(name).map(String);

// ---- Schemas -----------------------------------------------------------------------------
const slug = z
  .string()
  .regex(/^[a-z0-9-]{2,40}$/, "Slug: 2–40 lowercase letters, numbers or dashes.")
  .refine((s) => s !== "new", "“new” is reserved — pick another slug.");
const text = (label: string, max: number) =>
  z.string().min(1, `${label} is required.`).max(max, `${label} is too long (max ${max}).`);
const money = (label: string) => z.coerce.number().int(`${label} must be a whole number.`).positive(`${label} must be above 0.`);
const imageUrl = (label: string) =>
  z.string().refine(isAllowedImageUrl, `${label}: upload an image, or use an https link on ${IMAGE_HOSTS.join(" or ")}.`);
const sortOrder = z.coerce.number().int().min(0).max(999);
const tagList = (label: string) => z.array(z.string().max(30)).max(8, `${label}: at most 8.`);

const destinationSchema = z
  .object({
    country: text("Country", 80),
    title: text("Title", 120),
    description: text("Description", 600),
    highlights: z.array(z.string().max(80)).min(1, "Add at least one highlight.").max(6, "At most 6 highlights."),
    match_default: z.coerce.number().int().min(0).max(99),
    duration: text("Duration", 40),
    estimated_total: money("Estimated total"),
    min_budget: money("Minimum budget"),
    max_budget: money("Maximum budget"),
    hero_image_url: imageUrl("Hero image"),
    hero_image_alt: z.string().max(160),
    card_image_url: imageUrl("Card image"),
    card_image_alt: z.string().max(160),
    teaser_budget: money("Teaser budget"),
    teaser_duration: text("Teaser duration", 40),
    teaser_tags: tagList("Teaser tags"),
    quiz_tags: tagList("Quiz tags"),
    duration_bands: z.array(z.enum(DURATION_BANDS)),
    month_affinity: z.array(z.coerce.number().int().min(1).max(12)),
    traveler_suitability: z.record(z.enum(TRAVELERS), z.coerce.number().min(0).max(1)),
    sort_order: sortOrder,
    is_active: z.boolean(),
  })
  .refine((d) => d.max_budget >= d.min_budget, "Maximum budget must be at least the minimum budget.");

const safariSchema = z.object({
  name: text("Name", 80),
  description: text("Description", 600),
  duration: text("Duration", 40),
  highlights: z.array(z.string().max(80)).min(1, "Add at least one highlight.").max(6, "At most 6 highlights."),
  image_url: imageUrl("Image"),
  image_alt: z.string().max(160),
  sort_order: sortOrder,
  is_active: z.boolean(),
});

const firstIssue = (error: z.ZodError) => error.issues[0]?.message ?? "Please check the form.";

/** Postgres errors → something an editor can act on. */
function dbMessage(error: { code?: string; message: string }): string {
  if (error.code === "23505") return "That slug or name is already used.";
  if (error.code === "23514") return "One of the values is outside what the database allows.";
  if (error.code === "42501") return "Your account isn’t allowed to change the catalog.";
  console.error("[admin] catalog save failed", error);
  return "Couldn’t save — try again.";
}

/** Public pages read the catalog (re-read every 5 min); refresh them now. */
function refreshSite() {
  revalidatePath("/", "layout");
}

// ---- Actions -----------------------------------------------------------------------------

/** `originalSlug` is null when creating. */
export async function saveDestination(originalSlug: string | null, _prev: FormState, fd: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const parsed = destinationSchema.safeParse({
    country: get(fd, "country"),
    title: get(fd, "title"),
    description: get(fd, "description"),
    highlights: lines(fd, "highlights"),
    match_default: get(fd, "match_default"),
    duration: get(fd, "duration"),
    estimated_total: get(fd, "estimated_total"),
    min_budget: get(fd, "min_budget"),
    max_budget: get(fd, "max_budget"),
    hero_image_url: get(fd, "hero_image_url"),
    hero_image_alt: get(fd, "hero_image_alt"),
    card_image_url: get(fd, "card_image_url"),
    card_image_alt: get(fd, "card_image_alt"),
    teaser_budget: get(fd, "teaser_budget"),
    teaser_duration: get(fd, "teaser_duration"),
    teaser_tags: commaList(fd, "teaser_tags"),
    quiz_tags: commaList(fd, "quiz_tags"),
    duration_bands: all(fd, "duration_bands"),
    month_affinity: all(fd, "month_affinity"),
    traveler_suitability: Object.fromEntries(TRAVELERS.map((t) => [t, get(fd, `suitability:${t}`) || "0"])),
    sort_order: get(fd, "sort_order") || "0",
    is_active: fd.get("is_active") === "on",
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const { translations, error: translationError } = readTranslations(fd, DESTINATION_FIELDS);
  if (translationError !== null) return { error: translationError };
  const row = { ...parsed.data, translations };

  if (originalSlug === null) {
    const newSlug = slug.safeParse(get(fd, "slug"));
    if (!newSlug.success) return { error: firstIssue(newSlug.error) };
    const { error } = await supabase.from("destinations").insert({ slug: newSlug.data, ...row });
    if (error) return { error: dbMessage(error) };
  } else {
    const { data, error } = await supabase.from("destinations").update(row).eq("slug", originalSlug).select("slug");
    if (error) return { error: dbMessage(error) };
    if (!data?.length) return { error: "That destination no longer exists." };
  }
  refreshSite();
  redirect(`/admin/catalog?saved=${encodeURIComponent(parsed.data.title)}`);
}

export async function saveSafari(originalSlug: string | null, _prev: FormState, fd: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const parsed = safariSchema.safeParse({
    name: get(fd, "name"),
    description: get(fd, "description"),
    duration: get(fd, "duration"),
    highlights: lines(fd, "highlights"),
    image_url: get(fd, "image_url"),
    image_alt: get(fd, "image_alt"),
    sort_order: get(fd, "sort_order") || "0",
    is_active: fd.get("is_active") === "on",
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const { translations, error: translationError } = readTranslations(fd, SAFARI_FIELDS);
  if (translationError !== null) return { error: translationError };
  const row = { ...parsed.data, translations };

  if (originalSlug === null) {
    const newSlug = slug.safeParse(get(fd, "slug"));
    if (!newSlug.success) return { error: firstIssue(newSlug.error) };
    const { error } = await supabase.from("safaris").insert({ slug: newSlug.data, ...row });
    if (error) return { error: dbMessage(error) };
  } else {
    const { data, error } = await supabase.from("safaris").update(row).eq("slug", originalSlug).select("slug");
    if (error) return { error: dbMessage(error) };
    if (!data?.length) return { error: "That safari no longer exists." };
  }
  refreshSite();
  redirect(`/admin/catalog?saved=${encodeURIComponent(parsed.data.name)}`);
}

const visaServiceSchema = z.object({
  name: text("Name", 120),
  country: text("Country", 80),
  flag: z.string().max(16, "Flag: one emoji, e.g. 🇹🇭"),
  price_dt: z.coerce.number().int("Price: whole dinars only.").min(0, "Price can’t be negative.").max(100000),
  description: z.string().max(600),
  includes: z.array(z.string().max(120)).max(10, "At most 10 included items."),
  documents: z.array(z.string().max(120)).max(15, "At most 15 documents."),
  sort_order: sortOrder,
  is_active: z.boolean(),
});

/** Requests already received keep the price they were made at (stored on visa_applications). */
export async function saveVisaService(originalSlug: string | null, _prev: FormState, fd: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const parsed = visaServiceSchema.safeParse({
    name: get(fd, "name"),
    country: get(fd, "country"),
    flag: get(fd, "flag"),
    price_dt: get(fd, "price_dt"),
    description: get(fd, "description"),
    includes: lines(fd, "includes"),
    documents: lines(fd, "documents"),
    sort_order: get(fd, "sort_order") || "0",
    is_active: fd.get("is_active") === "on",
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const { translations, error: translationError } = readTranslations(fd, VISA_FIELDS);
  if (translationError !== null) return { error: translationError };
  const row = { ...parsed.data, translations };

  if (originalSlug === null) {
    const newSlug = slug.safeParse(get(fd, "slug"));
    if (!newSlug.success) return { error: firstIssue(newSlug.error) };
    const { error } = await supabase.from("services").insert({ slug: newSlug.data, ...row });
    if (error) return { error: dbMessage(error) };
  } else {
    const { data, error } = await supabase.from("services").update(row).eq("slug", originalSlug).select("slug");
    if (error) return { error: dbMessage(error) };
    if (!data?.length) return { error: "That visa service no longer exists." };
  }
  refreshSite();
  redirect(`/admin/catalog?saved=${encodeURIComponent(parsed.data.name)}`);
}

/** Show/hide a catalog item on the public site. */
export async function setActive(table: "destinations" | "safaris" | "services", slugValue: string, active: boolean) {
  const { supabase } = await requireAdmin();
  if (!slug.safeParse(slugValue).success) return;
  const { error } = await supabase.from(table).update({ is_active: active }).eq("slug", slugValue);
  if (error) throw new Error(dbMessage(error));
  refreshSite();
  revalidatePath("/admin/catalog");
}
