"use client";

import Link from "next/link";
import { Nav } from "@/components/Nav";
import { useI18n } from "@/i18n/client";

export default function NotFound() {
  const { t, href } = useI18n();
  return (
    <>
      <Nav />
      <main className="mx-auto grid max-w-[640px] gap-4 px-4 py-24 text-center">
        <p className="text-6xl font-black text-orange">404</p>
        <h1 className="text-4xl font-black tracking-[-0.02em]">{t.notFound.title}</h1>
        <p className="text-lg">{t.notFound.body}</p>
        <Link href={href("/")} className="justify-self-center rounded-full bg-orange px-6 py-3 font-extrabold hover:brightness-95">
          {t.notFound.home}
        </Link>
      </main>
    </>
  );
}
