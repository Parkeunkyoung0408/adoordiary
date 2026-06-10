"use client";

import { useEffect, useRef } from "react";

const VIDEO_SRC = "/assets/mix/mix-loading-fast.mp4?v=8";
const FALLBACK_DURATION_MS = 5000;

type MixLoadingVideoProps = {
  onEnded: () => void;
};

export default function MixLoadingVideo({ onEnded }: MixLoadingVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const onEndedRef = useRef(onEnded);
  const endedRef = useRef(false);

  onEndedRef.current = onEnded;

  const finish = () => {
    if (endedRef.current) return;
    endedRef.current = true;
    onEndedRef.current();
  };

  useEffect(() => {
    const video = videoRef.current;
    let fallbackTimer: ReturnType<typeof setTimeout> | undefined;

    const scheduleFallback = () => {
      const durationMs =
        video && video.duration && !Number.isNaN(video.duration)
          ? video.duration * 1000 + 200
          : FALLBACK_DURATION_MS;
      fallbackTimer = setTimeout(finish, durationMs);
    };

    if (video) {
      const play = () => {
        video.currentTime = 0;
        void video.play().catch(() => undefined);
        scheduleFallback();
      };

      video.addEventListener("ended", finish);
      if (video.readyState >= 2) play();
      else video.addEventListener("loadeddata", play, { once: true });
    } else {
      fallbackTimer = setTimeout(finish, FALLBACK_DURATION_MS);
    }

    return () => {
      if (fallbackTimer) clearTimeout(fallbackTimer);
      video?.removeEventListener("ended", finish);
      video?.pause();
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
      className="w-full max-w-[320px] h-auto block mx-auto"
    />
  );
}
