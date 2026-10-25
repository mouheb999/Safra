import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/admin/session";
import { signOut } from "../actions/auth";
import { adminSecondaryButton } from "../ui";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (session.status === "signed-out") redirect("/admin/login");

  if (session.status === "not-admin") {
    return (
      <main className="grid min-h-dvh place-items-center px-4">
        <div className="max-w-[420px] rounded-2xl border border-ink/12 bg-white p-6 text-center">
          <h1 className="m-0 text-xl font-black">No admin access</h1>
          <p className="mt-2 text-sm">
            <strong>{session.email}</strong> is signed in but isn’t a SAFRA admin. An admin can grant access in the
            Supabase SQL editor with <code className="rounded bg-ink/5 px-1">select private.add_admin(&apos;{session.email}&apos;)</code>.
          </p>
          <form action={signOut} className="mt-4">
            <button className={adminSecondaryButton}>Sign out</button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-ink/10 bg-cream/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3">
          <Link href="/admin" className="text-lg font-black tracking-[0.06em]">
            SAFRA <span className="text-xs font-extrabold tracking-normal opacity-60">admin</span>
          </Link>
          <nav className="flex gap-4 text-sm font-extrabold">
            <Link href="/admin" className="hover:text-orange">
              Requests
            </Link>
            <Link href="/admin/catalog" className="hover:text-orange">
              Catalog
            </Link>
            <Link href="/admin/settings" className="hover:text-orange">
              Settings
            </Link>
            <Link href="/" target="_blank" className="opacity-70 hover:opacity-100">
              View site ↗
            </Link>
          </nav>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <span className="hidden opacity-70 sm:inline">{session.email}</span>
            <form action={signOut}>
              <button className={adminSecondaryButton}>Sign out</button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1180px] px-4 py-6">{children}</main>
    </>
  );
}
