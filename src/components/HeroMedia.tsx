"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/i18n/client";

/**
 * Home hero media: a muted looping video when one is configured (HERO_VIDEO in src/lib/site.ts),
 * otherwise a video placeholder (dimmed poster, play button, "Video coming soon", player bar). The video starts paused for visitors who reduce motion and always
 * has a pause button (anything moving for more than 5 seconds must be stoppable).
 */
export function HeroMedia({ video, poster, alt }: { video: { src: string; type: string } | null; poster: string; alt: string }) {
  const { t } = useI18n();
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (!video || !window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    ref.current?.pause();
    setPlaying(false);
  }, [video]);

  if (!video) return <VideoPlaceholder poster={poster} label={t.home.videoSoon} />;

  const toggle = () => {
    const el = ref.current;
    if (!el) return;
    if (el.paused) void el.play().then(() => setPlaying(true), () => {});
    else {
      el.pause();
      setPlaying(false);
    }
  };

  return (
    <>
      <video
        ref={ref}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster={poster}
        aria-label={alt}
        className="absolute inset-0 size-full object-cover"
      >
        <source src={video.src} type={video.type} />
      </video>
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? t.home.videoPause : t.home.videoPlay}
        className="absolute end-4 bottom-4 grid size-11 cursor-pointer place-items-center rounded-full bg-cream/85 text-ink backdrop-blur transition-colors hover:bg-cream"
      >
        {playing ? (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
            <rect x="3.5" y="2.5" width="3" height="11" rx="1" />
            <rect x="9.5" y="2.5" width="3" height="11" rx="1" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
            <path d="M4.5 2.8v10.4a.8.8 0 0 0 1.2.7l8.3-5.2a.8.8 0 0 0 0-1.4L5.7 2.1a.8.8 0 0 0-1.2.7Z" />
          </svg>
        )}
      </button>
    </>
  );
}

/** Until the video is set: unmistakably a video frame, not a photo. Decorative only (nothing to click). */
function VideoPlaceholder({ poster, label }: { poster: string; label: string }) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-ink">
      <Image src={poster} alt="" fill preload sizes="(max-width: 1024px) 100vw, 560px" className="scale-110 object-cover opacity-70 blur-[5px]" />
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(32,61,53,.15),rgba(32,61,53,.7))]" />

      <div className="absolute inset-0 grid place-items-center">
        <div className="grid justify-items-center gap-4 text-cream">
          <span className="relative grid size-20 place-items-center">
            <span aria-hidden className="absolute inset-0 animate-ripple rounded-full bg-cream/30 motion-reduce:hidden" />
            <span aria-hidden className="absolute inset-0 rounded-full bg-cream/20 ring-1 ring-cream/50 backdrop-blur-md" />
            <svg width="26" height="26" viewBox="0 0 16 16" fill="currentColor" aria-hidden className="relative ml-1">
              <path d="M4.5 2.8v10.4a.8.8 0 0 0 1.2.7l8.3-5.2a.8.8 0 0 0 0-1.4L5.7 2.1a.8.8 0 0 0-1.2.7Z" />
            </svg>
          </span>
          <span className="rounded-full bg-ink/45 px-4 py-1.5 text-xs font-extrabold tracking-[.14em] uppercase backdrop-blur-sm rtl:tracking-normal">
            {label}
          </span>
        </div>
      </div>

      {/* Player bar, kept clear of the rounded corner and the SAFRA stamp. */}
      <div aria-hidden className="absolute inset-x-0 bottom-16 flex items-center gap-3 ps-7 pe-36 text-cream/85 rtl:ps-36 rtl:pe-7" dir="ltr">
        <span className="text-xs font-bold tabular-nums">0:00</span>
        <span className="h-1 flex-1 overflow-hidden rounded-full bg-cream/25">
          <span className="block h-full w-[12%] rounded-full bg-orange" />
        </span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 5 6 9H3v6h3l5 4V5Z" />
          <path d="m22 9-6 6M16 9l6 6" />
        </svg>
      </div>
    </div>
  );
}
