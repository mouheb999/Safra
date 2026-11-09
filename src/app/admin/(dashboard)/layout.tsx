import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/admin/session";
import { signOut } from "../actions/auth";
import { adminSecondaryButton } from "../ui";
import { AdminTabBar, AdminTopNav } from "./AdminNav";

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
      <header className="sticky top-0 z-30 border-b border-ink/8 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1180px] items-center gap-5 px-4">
          <Link href="/admin" className="flex shrink-0 items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-ink text-sm font-black text-cream">S</span>
            <span className="text-[17px] font-black tracking-[0.06em]">SAFRA</span>
            <span className="rounded-md bg-orange/25 px-1.5 py-0.5 text-[11px] font-extrabold">Admin</span>
          </Link>
          <AdminTopNav />
          <div className="ms-auto flex items-center gap-2">
            <span className="hidden max-w-[220px] truncate text-sm opacity-60 lg:inline">{session.email}</span>
            <a
              href="/"
              target="_blank"
              rel="noopener"
              aria-label="View site"
              title="View site"
              className="grid size-9 place-items-center rounded-lg border border-ink/12 bg-white hover:bg-ink/5"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M14 4h6v6M20 4l-9 9M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4" />
              </svg>
            </a>
            <form action={signOut}>
              <button aria-label="Sign out" title="Sign out" className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-ink/12 bg-white px-2.5 text-sm font-extrabold hover:bg-ink/5">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H4" />
                </svg>
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1180px] px-4 pt-5 pb-28 md:pt-7 md:pb-12">{children}</main>
      <AdminTabBar />
    </>
  );
}
