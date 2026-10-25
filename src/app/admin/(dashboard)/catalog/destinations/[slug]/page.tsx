import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/session";
import { BackLink } from "../../../../ui";
import { DestinationForm } from "./DestinationForm";

type Props = { params: Promise<{ slug: string }> };

export const metadata: Metadata = { title: "Edit destination" };

export default async function DestinationPage({ params }: Props) {
  const { slug } = await params;
  const { supabase } = await requireAdmin();

  let destination = null;
  if (slug !== "new") {
    const { data } = await supabase.from("destinations").select("*").eq("slug", slug).maybeSingle();
    if (!data) notFound();
    destination = data;
  }

  return (
    <div className="grid max-w-[900px] gap-4">
      <BackLink href="/admin/catalog">Catalog</BackLink>
      <h1 className="m-0 text-3xl font-black tracking-[-0.02em]">{destination ? destination.title : "New destination"}</h1>
      <DestinationForm destination={destination} />
    </div>
  );
}
