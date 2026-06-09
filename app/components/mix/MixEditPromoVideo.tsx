"use client";

import { useEffect, useRef, useState } from "react";

const INTRO_SRC = "/assets/mix/magnific_iAxcSij3uK.mp4";
const LOOP_SRC = "/assets/mix/magnific_3Gj0Py1REY.mp4";

function useAutoplay(videoRef: React.RefObject<HTMLVideoElement | null>) {
  useEffect(() => {
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
  }, [videoRef]);
}

function IntroVideo({ onDone }: { onDone: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const doneRef = useRef(false);
  useAutoplay(videoRef);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.loop = false;
    video.removeAttribute("loop");

    const finish = () => {
      if (doneRef.current) return;
      doneRef.current = true;

      if (video.duration && !Number.isNaN(video.duration)) {
        video.currentTime = Math.max(0, video.duration - 0.05);
      }
      video.pause();
      onDone();
    };

    const onEnded = () => finish();
    const onTimeUpdate = () => {
      if (!video.duration || Number.isNaN(video.duration)) return;
      if (video.currentTime >= video.duration - 0.15) finish();
    };

    video.addEventListener("ended", onEnded);
    video.addEventListener("timeupdate", onTimeUpdate);

    return () => {
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("timeupdate", onTimeUpdate);
    };
  }, [onDone]);

  return (
    <video
      ref={videoRef}
      src={INTRO_SRC}
      muted
      playsInline
      preload="auto"
      className="w-full h-auto block"
      aria-label="아두르 아트웍 소개 영상"
    />
  );
}

function LoopVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  useAutoplay(videoRef);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.loop = true;
  }, []);

  return (
    <video
      ref={videoRef}
      src={LOOP_SRC}
      muted
      playsInline
      autoPlay
      loop
      preload="auto"
      className="w-full h-auto block"
      aria-label="아두르 아트웍 소개 영상"
    />
  );
}

export default function MixEditPromoVideo() {
  const [showLoop, setShowLoop] = useState(false);

  return showLoop ? <LoopVideo /> : <IntroVideo onDone={() => setShowLoop(true)} />;
}
