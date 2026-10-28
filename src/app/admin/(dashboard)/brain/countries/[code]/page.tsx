import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/session";
import { BackLink } from "../../../../ui";
import { CountryForm } from "./CountryForm";

type Props = { params: Promise<{ code: string }> };

export const metadata: Metadata = { title: "Edit country" };

export default async function BrainCountryPage({ params }: Props) {
  const { code } = await params;
  const { supabase } = await requireAdmin();
  const country = code === "new" ? null : (await supabase.from("brain_countries").select("*").eq("code", code).maybeSingle()).data;
  if (code !== "new" && !country) notFound();

  return (
    <div className="grid max-w-[900px] gap-4">
      <BackLink href="/admin/brain">Trip brain</BackLink>
      <h1 className="m-0 text-3xl font-black tracking-[-0.02em]">{country ? country.name : "New country"}</h1>
      <CountryForm country={country} />
    </div>
  );
}
