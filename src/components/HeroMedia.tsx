"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/i18n/client";

/**
 * Home hero media: a muted looping video when one is configured (HERO_VIDEO in src/lib/site.ts),
 * otherwise the poster photo. The video starts paused for visitors who reduce motion and always
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

  if (!video) {
    return <Image src={poster} alt={alt} fill preload sizes="(max-width: 1024px) 100vw, 560px" className="object-cover" />;
  }

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
