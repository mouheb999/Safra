// Default social preview (WhatsApp, Facebook, X…) for pages without their own image.

import { ImageResponse } from "next/og";
import en from "@/i18n/messages/en";
import { SITE_NAME } from "@/lib/site";

const SITE_TAGLINE = en.meta.tagline;

export const alt = `${SITE_NAME} — ${SITE_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#F8F4EA",
          color: "#203D35",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 40, fontWeight: 900, letterSpacing: 6 }}>{SITE_NAME}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 120, fontWeight: 900, lineHeight: 1, letterSpacing: -4 }}>Where to next?</div>
          <div style={{ fontSize: 44 }}>{SITE_TAGLINE}</div>
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          {["Trips", "Safaris", "Visas"].map((t) => (
            <div key={t} style={{ background: "#FF8055", borderRadius: 999, padding: "12px 28px", fontSize: 30, fontWeight: 800 }}>
              {t}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
