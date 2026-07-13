"use client";

import { useEffect, useState } from "react";
import FlipDeckPage from "./FlipDeckPage";
import FlipMobileSkewDeck from "./FlipMobileSkewDeck";

const MOBILE_MQ = "(max-width: 768px)";

export default function FlipExperience() {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  if (isMobile === null) {
    return <div className="h-full w-full bg-[#222222]" />;
  }

  return isMobile ? <FlipMobileSkewDeck /> : <FlipDeckPage />;
}
