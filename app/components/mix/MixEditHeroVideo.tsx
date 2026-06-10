"use client";

import { useEffect, useRef } from "react";

const VIDEO_SRC = "/assets/mix/mix-edit-hero.mp4?v=2";
const POSTER_SRC = "/assets/mix/mix-edit-hero-poster.webp?v=2";

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
    <div className="w-full max-w-[280px] mx-auto py-1">
      {/* Safari: mix-blend-mode는 video가 아닌 wrapper에 적용 */}
      <div className="relative aspect-square mix-blend-screen [transform:translateZ(0)]">
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
