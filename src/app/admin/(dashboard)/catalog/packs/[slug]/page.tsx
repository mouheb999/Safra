import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/session";
import { BackLink } from "../../../../ui";
import { PackForm } from "./PackForm";

type Props = { params: Promise<{ slug: string }> };

export const metadata: Metadata = { title: "Edit pack" };

export default async function PackPage({ params }: Props) {
  const { slug } = await params;
  const { supabase } = await requireAdmin();

  const [{ data: destinations }, pack] = await Promise.all([
    supabase.from("destinations").select("slug, country, title").order("sort_order"),
    slug === "new" ? Promise.resolve(null) : supabase.from("packs").select("*").eq("slug", slug).maybeSingle().then((r) => r.data),
  ]);
  if (slug !== "new" && !pack) notFound();

  return (
    <div className="grid max-w-[900px] gap-4">
      <BackLink href="/admin/catalog">Catalog</BackLink>
      <h1 className="m-0 text-3xl font-black tracking-[-0.02em]">{pack ? pack.title : "New pack"}</h1>
      <PackForm pack={pack} destinations={destinations ?? []} />
    </div>
  );
}
