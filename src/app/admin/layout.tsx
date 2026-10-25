// Root layout of the admin dashboard (English only, never indexed).

import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import { nunito } from "../fonts";
import "../globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Admin", template: "%s · SAFRA admin" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={nunito.variable}>
      <body className="min-h-dvh bg-[#F3EEE2] font-sans text-ink antialiased">{children}</body>
    </html>
  );
}
