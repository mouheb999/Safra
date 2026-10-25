import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/session";
import { BackLink } from "../../../../ui";
import { SafariForm } from "./SafariForm";

type Props = { params: Promise<{ slug: string }> };

export const metadata: Metadata = { title: "Edit safari" };

export default async function SafariPage({ params }: Props) {
  const { slug } = await params;
  const { supabase } = await requireAdmin();

  let safari = null;
  if (slug !== "new") {
    const { data } = await supabase.from("safaris").select("*").eq("slug", slug).maybeSingle();
    if (!data) notFound();
    safari = data;
  }

  return (
    <div className="grid max-w-[900px] gap-4">
      <BackLink href="/admin/catalog">Catalog</BackLink>
      <h1 className="m-0 text-3xl font-black tracking-[-0.02em]">{safari ? safari.name : "New safari"}</h1>
      <SafariForm safari={safari} />
    </div>
  );
}
