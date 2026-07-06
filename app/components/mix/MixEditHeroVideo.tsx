"use client";

import { useEffect, useRef } from "react";

const VIDEO_SRC = "/assets/mix/mix-edit-hero.mp4?v=6";
const POSTER_SRC = "/assets/mix/mix-edit-hero-poster.webp?v=6";

export default function MixEditHeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const play = () => {
      void video.play().catch(() => undefined);
    };

    if (video.readyState >= 2) play();
    else video.addEventListener("canplay", play, { once: true });

    return () => {
      video.pause();
    };
  }, []);

  return (
    <video
      ref={videoRef}
      src={VIDEO_SRC}
      poster={POSTER_SRC}
      muted
      playsInline
      autoPlay
      loop
      preload="auto"
      className="w-full max-w-[150px] h-auto block mx-auto aspect-square object-contain -mt-[10px] pointer-events-none relative z-0"
      aria-label="아두르 아트웍 소개 영상"
    />
  );
}
