"use client";

import type { ReactNode } from "react";
import { useI18n } from "@/i18n/client";

export const cardClass = "grid gap-3.5 rounded-3xl border border-ink/14 bg-white/72 p-5";
export const chipClass = "justify-self-start rounded-full border border-ink/16 bg-white px-3 py-1.5 font-extrabold";

/** Page shell: container-query root + centered 900px column. */
export function RequestShell({ children }: { children: ReactNode }) {
  return (
    <section className="@container px-[clamp(20px,3vw,32px)]">
      <div className="mx-auto grid max-w-[900px] gap-[18px]">{children}</div>
    </section>
  );
}

export function RequestHeader({ title, intro, children }: { title: string; intro: string; children?: ReactNode }) {
  const { t } = useI18n();
  return (
    <header className={cardClass}>
      <span className="justify-self-start rounded-full bg-orange px-3 py-1.5 text-xs font-black">{t.request.eyebrow}</span>
      <h1 className="m-0 text-5xl leading-[1.05] font-black tracking-[-0.03em] @max-[810px]:text-[34px] rtl:leading-[1.3] rtl:tracking-normal">
        {title}
      </h1>
      <p className="m-0 font-bold">{intro}</p>
      {children}
    </header>
  );
}
