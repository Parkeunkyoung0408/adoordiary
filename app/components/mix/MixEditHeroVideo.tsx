"use client";

import { useEffect, useRef, useState } from "react";

const VIDEO_SRC = "/assets/mix/mix-edit-hero.mp4?v=1";
const POSTER_SRC = "/assets/mix/mix-edit-hero-poster.webp?v=1";

export default function MixEditHeroVideo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: "120px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!shouldLoad) return;
    const video = videoRef.current;
    if (!video) return;

    const play = () => {
      void video.play().catch(() => undefined);
    };

    if (video.readyState >= 2) play();
    else video.addEventListener("loadeddata", play, { once: true });

    return () => {
      video.pause();
    };
  }, [shouldLoad]);

  return (
    <div ref={containerRef} className="w-full max-w-[320px] mx-auto -mt-1">
      <div
        className="relative w-full aspect-square rounded-[24px] overflow-hidden"
        style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(250,248,245,0.96) 100%)" }}
      >
        {!shouldLoad && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={POSTER_SRC}
            alt=""
            aria-hidden
            className="absolute inset-0 w-full h-full object-contain mix-blend-screen pointer-events-none"
            loading="lazy"
            decoding="async"
          />
        )}
        {shouldLoad && (
          <video
            ref={videoRef}
            src={VIDEO_SRC}
            poster={POSTER_SRC}
            muted
            playsInline
            autoPlay
            loop
            preload="metadata"
            className="absolute inset-0 w-full h-full object-contain mix-blend-screen pointer-events-none"
            aria-label="아두르 아트웍 소개 영상"
          />
        )}
      </div>
    </div>
  );
}
