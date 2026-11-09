import type { Metadata } from "next";
import Link from "next/link";
import { formatDT } from "@/lib/admin/format";
import { requireAdmin } from "@/lib/admin/session";
import { setActive } from "../../actions/catalog";
import { Card, ItemRow, Notice, PageHeader, adminPrimaryButton } from "../../ui";

export const metadata: Metadata = { title: "Catalog" };

export default async function CatalogPage({ searchParams }: { searchParams: Promise<{ saved?: string; deleted?: string }> }) {
  const { supabase } = await requireAdmin();
  const { saved, deleted } = await searchParams;

  const [{ data: packs }, { data: destinations }, { data: services }] = await Promise.all([
    supabase.from("packs").select("slug, title, country, price_dt, nights, sort_order, is_active").order("price_dt"),
    supabase.from("destinations").select("slug, country, title, min_budget, max_budget, sort_order, is_active").order("sort_order"),
    supabase.from("services").select("slug, name, country, flag, price_dt, sort_order, is_active").order("sort_order").order("name"),
  ]);

  return (
    <div className="grid gap-5">
      <PageHeader title="Catalog" lead="Changes show on the public site right away. Hidden items disappear from the site but keep their history." />
      {saved ? <Notice>Saved: {saved}</Notice> : null}
      {deleted ? <Notice>Pack deleted.</Notice> : null}

      <Card
        title="Our packs"
        actions={
          <Link href="/admin/catalog/packs/new" className={adminPrimaryButton}>
            + New pack
          </Link>
        }
      >
        <CatalogTable
          rows={(packs ?? []).map((p) => ({
            slug: p.slug,
            name: p.title,
            detail: `${p.country} · ${p.nights} nights · ${formatDT(p.price_dt)} per person`,
            active: p.is_active,
            order: p.sort_order,
          }))}
          table="packs"
        />
      </Card>

      <Card
        title="Destinations"
        actions={
          <Link href="/admin/catalog/destinations/new" className={adminPrimaryButton}>
            + New destination
          </Link>
        }
      >
        <CatalogTable
          rows={(destinations ?? []).map((d) => ({
            slug: d.slug,
            name: d.title,
            detail: `${d.country} · ${formatDT(d.min_budget)}–${formatDT(d.max_budget)}`,
            active: d.is_active,
            order: d.sort_order,
          }))}
          table="destinations"
        />
      </Card>


      <Card
        title="Visa services"
        actions={
          <Link href="/admin/catalog/services/new" className={adminPrimaryButton}>
            + New visa service
          </Link>
        }
      >
        <CatalogTable
          rows={(services ?? []).map((v) => ({
            slug: v.slug,
            name: `${v.flag} ${v.name}`.trim(),
            detail: `${v.country} · ${formatDT(v.price_dt)}`,
            active: v.is_active,
            order: v.sort_order,
          }))}
          table="services"
        />
      </Card>
    </div>
  );
}

function CatalogTable({
  rows,
  table,
}: {
  rows: { slug: string; name: string; detail: string; active: boolean; order: number }[];
  table: "destinations" | "services" | "packs";
}) {
  if (rows.length === 0) return <p className="m-0 text-sm text-ink/60">Nothing here yet.</p>;
  return (
    <ul className="m-0 grid list-none gap-0 p-0">
      {rows.map((row) => (
        <ItemRow
          key={row.slug}
          order={row.order}
          name={row.name}
          detail={row.detail}
          active={row.active}
          toggle={setActive.bind(null, table, row.slug, !row.active)}
          href={`/admin/catalog/${table}/${row.slug}`}
        />
      ))}
    </ul>
  );
}
