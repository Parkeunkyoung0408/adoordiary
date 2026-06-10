"use client";

import { useEffect, useRef } from "react";

const VIDEO_SRC = "/assets/mix/mix-edit-hero.mp4?v=3";
const POSTER_SRC = "/assets/mix/mix-edit-hero-poster.webp?v=3";

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
    <div className="w-full max-w-[300px] mx-auto">
      <div className="relative aspect-square rounded-[24px] overflow-hidden bg-black shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
        <video
          ref={videoRef}
          src={VIDEO_SRC}
          poster={POSTER_SRC}
          muted
          playsInline
          autoPlay
          loop
          preload="auto"
          className="absolute inset-0 w-full h-full object-contain block"
          aria-label="아두르 아트웍 소개 영상"
        />
      </div>
    </div>
  );
}
