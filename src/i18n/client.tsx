"use client";

// Gives client components the current language and its messages. The [locale] layout passes the
// one dictionary it needs, so browsers never download the other languages.

import { createContext, useContext, type ReactNode } from "react";
import { localizedPath, type Locale } from "./config";
import type { Messages } from "./messages/en";

type I18n = { locale: Locale; t: Messages; href: (path: string) => string };

const I18nContext = createContext<I18n | null>(null);

export function I18nProvider({ locale, messages, children }: { locale: Locale; messages: Messages; children: ReactNode }) {
  return (
    <I18nContext.Provider value={{ locale, t: messages, href: (path) => localizedPath(locale, path) }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18n {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used inside <I18nProvider>");
  return value;
}
