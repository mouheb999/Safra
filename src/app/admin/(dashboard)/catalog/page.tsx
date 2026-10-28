import type { Metadata } from "next";
import Link from "next/link";
import { formatDT } from "@/lib/admin/format";
import { requireAdmin } from "@/lib/admin/session";
import { setActive } from "../../actions/catalog";
import { Card, Notice, adminPrimaryButton, adminSecondaryButton } from "../../ui";

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
    <div className="grid gap-4">
      <div>
        <h1 className="m-0 text-3xl font-black tracking-[-0.02em]">Catalog</h1>
        <p className="m-0 mt-1 text-sm opacity-70">
          Changes show on the public site right away. Hidden items disappear from the site but keep their history.
        </p>
      </div>
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
  if (rows.length === 0) return <p className="m-0 text-sm opacity-70">Nothing here yet.</p>;
  return (
    <ul className="m-0 grid list-none gap-0 p-0">
      {rows.map((row) => (
        <li key={row.slug} className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-ink/5 py-2.5 last:border-0">
          <span className="w-6 text-sm font-bold opacity-50" title="Sort order">
            {row.order}
          </span>
          <div className={`min-w-[200px] flex-1 ${row.active ? "" : "opacity-50"}`}>
            <div className="font-extrabold">
              {row.name}
              {row.active ? null : <span className="ml-2 rounded-full bg-ink/10 px-2 py-0.5 text-xs">Hidden</span>}
            </div>
            <div className="text-sm opacity-70">{row.detail}</div>
          </div>
          <form action={setActive.bind(null, table, row.slug, !row.active)}>
            <button className={`${adminSecondaryButton} px-3 py-1`}>{row.active ? "Hide" : "Show"}</button>
          </form>
          <Link href={`/admin/catalog/${table}/${row.slug}`} className={`${adminSecondaryButton} px-3 py-1`}>
            Edit
          </Link>
        </li>
      ))}
    </ul>
  );
}
