import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/session";
import { BackLink } from "../../../../ui";
import { VisaServiceForm } from "./VisaServiceForm";

type Props = { params: Promise<{ slug: string }> };

export const metadata: Metadata = { title: "Edit visa service" };

export default async function VisaServicePage({ params }: Props) {
  const { slug } = await params;
  const { supabase } = await requireAdmin();

  let service = null;
  if (slug !== "new") {
    const { data } = await supabase.from("services").select("*").eq("slug", slug).maybeSingle();
    if (!data) notFound();
    service = data;
  }

  return (
    <div className="grid max-w-[900px] gap-4">
      <BackLink href="/admin/catalog">Catalog</BackLink>
      <h1 className="m-0 text-3xl font-black tracking-[-0.02em]">{service ? `${service.flag} ${service.name}`.trim() : "New visa service"}</h1>
      <VisaServiceForm service={service} />
    </div>
  );
}
