"use client";

// The admin's navigation: links in the top bar on wide screens, an app-style tab bar at the bottom on phones.

import Link from "next/link";
import { usePathname } from "next/navigation";

type Icon = "inbox" | "box" | "spark" | "gear";

const TABS: { href: string; label: string; icon: Icon; match: (path: string) => boolean }[] = [
  { href: "/admin", label: "Requests", icon: "inbox", match: (p) => p === "/admin" || p.startsWith("/admin/requests") },
  { href: "/admin/catalog", label: "Catalog", icon: "box", match: (p) => p.startsWith("/admin/catalog") },
  { href: "/admin/brain", label: "Trip brain", icon: "spark", match: (p) => p.startsWith("/admin/brain") },
  { href: "/admin/settings", label: "Settings", icon: "gear", match: (p) => p.startsWith("/admin/settings") },
];

function TabIcon({ name, size = 20 }: { name: Icon; size?: number }) {
  const paths: Record<Icon, React.ReactNode> = {
    inbox: (
      <>
        <path d="M3.5 13.5 6 5.5a2 2 0 0 1 1.9-1.5h8.2A2 2 0 0 1 18 5.5l2.5 8" />
        <path d="M3.5 13.5V18a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-4.5h-5l-1.5 2.5h-4L8.5 13.5h-5Z" />
      </>
    ),
    box: (
      <>
        <path d="M4 8.5 12 4l8 4.5v7L12 20l-8-4.5v-7Z" />
        <path d="m4 8.5 8 4.5 8-4.5M12 13v7" />
      </>
    ),
    spark: <path d="M12 3.5c.6 3.9 2.6 5.9 6.5 6.5-3.9.6-5.9 2.6-6.5 6.5-.6-3.9-2.6-5.9-6.5-6.5 3.9-.6 5.9-2.6 6.5-6.5ZM18.5 15.5c.3 1.6 1 2.3 2.5 2.5-1.5.2-2.2.9-2.5 2.5-.3-1.6-1-2.3-2.5-2.5 1.5-.2 2.2-.9 2.5-2.5Z" />,
    gear: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
      </>
    ),
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {paths[name]}
    </svg>
  );
}

/** Wide screens: the sections as links in the top bar. */
export function AdminTopNav() {
  const path = usePathname();
  return (
    <nav aria-label="Admin" className="hidden items-center gap-1 md:flex">
      {TABS.map((t) => {
        const active = t.match(path);
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-extrabold transition-colors ${
              active ? "bg-ink text-cream" : "text-ink/70 hover:bg-ink/5 hover:text-ink"
            }`}
          >
            <TabIcon name={t.icon} size={17} />
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Phones: the sections as a tab bar fixed to the bottom of the screen. */
export function AdminTabBar() {
  const path = usePathname();
  return (
    <nav
      aria-label="Admin"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-ink/10 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <div className="mx-auto grid max-w-[520px] grid-cols-4">
        {TABS.map((t) => {
          const active = t.match(path);
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={active ? "page" : undefined}
              className={`relative grid justify-items-center gap-1 px-1 pt-2.5 pb-2 text-[11px] font-extrabold ${active ? "text-ink" : "text-ink/50"}`}
            >
              {active ? <span aria-hidden className="absolute inset-x-6 top-0 h-[3px] rounded-b-full bg-orange" /> : null}
              <span className={`grid h-8 w-12 place-items-center rounded-full ${active ? "bg-orange/20" : ""}`}>
                <TabIcon name={t.icon} size={21} />
              </span>
              {t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
