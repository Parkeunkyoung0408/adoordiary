"use client";

import { useEffect, useRef } from "react";

const VIDEO_SRC = "/assets/mix/magnific_iAxcSij3uK.mp4";

export default function MixEditPromoVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const play = () => {
      video.currentTime = 0;
      void video.play().catch(() => undefined);
    };

    const holdLastFrame = () => {
      if (video.duration && !Number.isNaN(video.duration)) {
        video.currentTime = Math.max(0, video.duration - 0.05);
      }
      video.pause();
    };

    video.addEventListener("ended", holdLastFrame);
    if (video.readyState >= 2) play();
    else video.addEventListener("loadeddata", play, { once: true });

    return () => {
      video.removeEventListener("ended", holdLastFrame);
      video.pause();
    };
  }, []);

  return (
    <video
      ref={videoRef}
      src={VIDEO_SRC}
      muted
      playsInline
      autoPlay
      preload="auto"
      className="w-full h-auto block"
      aria-label="아두르 아트웍 소개 영상"
    />
  );
}
