import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/session";
import { BackLink } from "../../../../ui";
import { BaseForm } from "./BaseForm";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ country?: string }> };

export const metadata: Metadata = { title: "Edit place" };

export default async function BrainPlacePage({ params, searchParams }: Props) {
  const [{ slug }, { country }] = await Promise.all([params, searchParams]);
  const { supabase } = await requireAdmin();
  const [{ data: countries }, base] = await Promise.all([
    supabase.from("brain_countries").select("code, name").order("sort_order"),
    slug === "new" ? Promise.resolve(null) : supabase.from("brain_bases").select("*").eq("slug", slug).maybeSingle().then((r) => r.data),
  ]);
  if (slug !== "new" && !base) notFound();

  return (
    <div className="grid max-w-[900px] gap-4">
      <BackLink href="/admin/brain">Trip brain</BackLink>
      <h1 className="m-0 text-3xl font-black tracking-[-0.02em]">{base ? base.place : "New place"}</h1>
      <BaseForm base={base} countries={countries ?? []} defaultCountry={country} />
    </div>
  );
}
