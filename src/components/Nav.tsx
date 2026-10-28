"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowIcon, GlobeIcon } from "@/components/icons";
import { useI18n } from "@/i18n/client";
import { splitLocale } from "@/i18n/config";
import { DEFAULT_WHATSAPP_NUMBER, whatsappUrl } from "@/lib/requests";
import { LanguageSwitcher } from "./LanguageSwitcher";

/**
 * Site navigation: logo, "Our packs" and "Visa", and the language flags.
 * Phones: a floating bar (logo, flags, menu button) that slides away while scrolling down and comes
 * back on scroll up; the menu is a full-screen sheet (native <dialog>: focus trap, Escape, scroll lock
 * via globals.css) with the sections, the two ways to start a trip, and WhatsApp.
 * `whatsappNumber` comes from /admin/settings; the 404 page (client-only) uses the default.
 */
export function Nav({ whatsappNumber = DEFAULT_WHATSAPP_NUMBER }: { whatsappNumber?: string }) {
  const { t, href } = useI18n();
  const pathname = usePathname();
  const current = splitLocale(pathname).path;
  const isActive = (path: string) => current === path || current.startsWith(`${path}/`);
  const hidden = useHiddenOnScroll();
  const menuRef = useRef<HTMLDialogElement>(null);

  const links = [
    { path: "/packs", label: t.nav.packs, desc: t.nav.desc.packs, icon: <SuitcaseIcon /> },
    { path: "/visas", label: t.nav.visa, desc: t.nav.desc.visa, icon: <GlobeIcon size={22} strokeWidth={1.8} /> },
  ];

  const closeMenu = useCallback(() => menuRef.current?.close(), []);

  // Close the sheet after navigating, and if the screen grows past the phone layout.
  useEffect(() => closeMenu(), [pathname, closeMenu]);
  useEffect(() => {
    const wide = window.matchMedia("(min-width: 768px)");
    const onChange = () => wide.matches && closeMenu();
    wide.addEventListener("change", onChange);
    return () => wide.removeEventListener("change", onChange);
  }, [closeMenu]);

  return (
    <header
      className={`sticky top-0 z-40 px-3 pt-3 transition-transform duration-300 ease-out focus-within:translate-y-0 motion-reduce:transition-none sm:px-7 sm:pt-5 md:static md:translate-y-0 ${
        hidden ? "-translate-y-[130%]" : ""
      }`}
    >
      <nav
        aria-label={t.nav.menu}
        className="mx-auto flex max-w-[1180px] items-center justify-between gap-3 rounded-[28px] bg-white/85 py-2.5 ps-5 pe-2.5 shadow-[0_6px_24px_rgba(32,61,53,0.08)] backdrop-blur-md md:bg-white/80 md:px-6 md:py-3"
      >
        <Logo href={href("/")} />
        <div className="flex items-center gap-2 md:gap-6">
          <ul className="m-0 hidden list-none items-center gap-6 p-0 text-[15px] font-bold md:flex">
            {links.map((l) => (
              <li key={l.path}>
                <Link
                  href={href(l.path)}
                  aria-current={isActive(l.path) ? "page" : undefined}
                  className="decoration-orange decoration-[3px] underline-offset-[7px] hover:underline aria-[current=page]:underline"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          {/* useSearchParams needs a Suspense boundary on statically rendered pages; the fallback keeps the bar's size. */}
          <Suspense fallback={<div className="h-[46px] w-[122px]" />}>
            <LanguageSwitcher />
          </Suspense>
          <button
            type="button"
            aria-haspopup="dialog"
            aria-label={t.nav.openMenu}
            onClick={() => menuRef.current?.showModal()}
            className="grid size-11 cursor-pointer place-items-center rounded-full border border-ink/12 bg-white text-ink transition-colors hover:border-ink/30 md:hidden"
          >
            <MenuIcon />
          </button>
        </div>
      </nav>

      <dialog
        ref={menuRef}
        aria-label={t.nav.menu}
        className="m-0 h-dvh max-h-none w-full max-w-none animate-fade overflow-y-auto border-0 bg-cream p-0 text-ink backdrop:bg-transparent motion-reduce:animate-none md:hidden"
      >
        <div className="relative flex min-h-full flex-col overflow-hidden px-3 pt-3 pb-[max(20px,env(safe-area-inset-bottom))]">
          <div className="flex items-center justify-between gap-3 rounded-[28px] bg-white/85 py-2.5 ps-5 pe-2.5 shadow-[0_6px_24px_rgba(32,61,53,0.08)]">
            <Logo href={href("/")} onClick={closeMenu} />
            <button
              type="button"
              aria-label={t.nav.closeMenu}
              onClick={closeMenu}
              className="grid size-11 cursor-pointer place-items-center rounded-full bg-ink text-cream transition-opacity hover:opacity-90"
            >
              <CloseIcon />
            </button>
          </div>

          <div className="relative z-10 grid gap-7 px-1 pt-8">
            <section className="grid gap-2.5">
              <Eyebrow>{t.nav.menu}</Eyebrow>
              {links.map((l, i) => {
                const active = isActive(l.path);
                return (
                  <Link
                    key={l.path}
                    href={href(l.path)}
                    onClick={closeMenu}
                    aria-current={active ? "page" : undefined}
                    style={{ animationDelay: `${60 + i * 45}ms` }}
                    className={`flex animate-step items-center gap-3.5 rounded-[22px] border p-3 transition-colors motion-reduce:animate-none ${
                      active ? "border-orange bg-white" : "border-ink/8 bg-white/70 active:bg-white"
                    }`}
                  >
                    <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-sky text-sea">{l.icon}</span>
                    <span className="grid min-w-0 flex-1 gap-0.5">
                      <span className="text-[22px] leading-tight font-black tracking-[-0.01em] rtl:tracking-normal">{l.label}</span>
                      <span className="text-sm font-semibold opacity-70">{l.desc}</span>
                    </span>
                    {active ? (
                      <span aria-hidden className="me-1.5 size-2.5 shrink-0 rounded-full bg-orange ring-4 ring-orange/20" />
                    ) : (
                      <span className="shrink-0 opacity-50">
                        <ArrowIcon size={18} />
                      </span>
                    )}
                  </Link>
                );
              })}
            </section>

            <section className="grid animate-step gap-2.5 [animation-delay:220ms] motion-reduce:animate-none">
              <Link
                href={href("/find-my-trip")}
                onClick={closeMenu}
                className="flex items-center justify-between gap-3 rounded-[22px] bg-orange p-4 ps-5 text-ink hover:brightness-95"
              >
                <span className="grid gap-0.5">
                  <span className="text-xl leading-tight font-black">{t.nav.planTrip}</span>
                  <span className="text-sm font-bold opacity-80">{t.nav.desc.quiz}</span>
                </span>
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-ink text-cream">
                  <ArrowIcon size={18} />
                </span>
              </Link>
              <Link
                href={href("/trip-request?mode=direct")}
                onClick={closeMenu}
                className="rounded-full border border-ink/16 bg-white/70 px-5 py-3.5 text-center font-extrabold hover:bg-white"
              >
                {t.nav.knowWhere}
              </Link>
            </section>


            <a
              href={whatsappUrl(t.whatsapp.hi, whatsappNumber)}
              className="flex animate-step items-center gap-3.5 rounded-[22px] bg-ink p-3 pe-4 text-cream [animation-delay:270ms] motion-reduce:animate-none"
            >
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-cream/10 text-orange">
                <ChatIcon />
              </span>
              <span className="grid min-w-0 flex-1 gap-0.5">
                <span className="font-black">{t.nav.questions}</span>
                <span className="text-sm font-semibold opacity-75">
                  {t.nav.whatsapp} · <span dir="ltr">{formatPhone(whatsappNumber)}</span>
                </span>
              </span>
              <span className="shrink-0 opacity-60">
                <ArrowIcon size={18} />
              </span>
            </a>
          </div>

          {/* Brand flourish: the quiz's dashed flight path, behind the content. */}
          <svg
            aria-hidden
            viewBox="0 0 390 160"
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-40 w-full text-sea/35 rtl:-scale-x-100"
          >
            <path d="M-10 140 Q110 40 220 96 T400 40" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="5 7" />
          </svg>
        </div>
      </dialog>
    </header>
  );
}

function Logo({ href, onClick }: { href: string; onClick?: () => void }) {
  return (
    <Link href={href} onClick={onClick} className="text-[22px] font-black tracking-[0.06em] sm:text-2xl">
      SAFRA
    </Link>
  );
}

/** "21697433003" → "+216 97 433 003" (Tunisian numbers); other countries keep their digits. */
function formatPhone(digits: string): string {
  const tn = digits.match(/^216(\d{2})(\d{3})(\d{3})$/);
  return tn ? `+216 ${tn[1]} ${tn[2]} ${tn[3]}` : `+${digits}`;
}

function Eyebrow({ children }: { children: ReactNode }) {
  return <span className="px-1 text-xs font-black tracking-[.14em] text-sea uppercase rtl:tracking-normal">{children}</span>;
}

/** Phones only (the header is static from md up): hide while scrolling down, show on any scroll up. */
function useHiddenOnScroll(): boolean {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    let last = window.scrollY;
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const y = window.scrollY;
        if (Math.abs(y - last) < 8) return;
        setHidden(y > last && y > 120);
        last = y;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);
  return hidden;
}

function SuitcaseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="7" width="18" height="13" rx="3" />
      <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M3 12.5h18M10 12.5v2M14 12.5v2" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden className="rtl:-scale-x-100">
      <path d="M3 7h14" />
      <path d="M7 13h10" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
      <path d="M4 4l10 10M14 4 4 14" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20 11.5a8 8 0 0 1-11.6 7.1L4 20l1.4-4.2A8 8 0 1 1 20 11.5Z" />
      <path d="M9 10h6M9 13.5h4" />
    </svg>
  );
}
