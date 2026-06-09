"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";

const BRAND_TEXT = "ADOORGYUMDANG";
const BRAND_ANIM_DELAY = 0;
const BRAND_CHAR_STAGGER = 0.012;
const BRAND_CHAR_DURATION = 0.03;
const BRAND_HANDLE_BLINK = 0.45;
const BRAND_HANDLE_BLINK_COUNT = 10;
const BRAND_HANDLE_FADE_OUT = 0.45;

export default function FlipBrandTitle() {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);
  const handleRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const text = textRef.current;
    const handle = handleRef.current;
    if (!container || !text || !handle) return;

    const chars = text.querySelectorAll<HTMLElement>(".flip-brand-char");

    const ctx = gsap.context(() => {
      gsap.set(chars, { autoAlpha: 0 });
      gsap.set(handle, { autoAlpha: 0, x: 0 });

      const blinkHalf = BRAND_HANDLE_BLINK / 2;
      const tl = gsap.timeline({ delay: BRAND_ANIM_DELAY });

      tl.to(
        chars,
        {
          autoAlpha: 1,
          duration: BRAND_CHAR_DURATION,
          ease: "power2.out",
          stagger: BRAND_CHAR_STAGGER,
        },
        0
      );

      tl.set(handle, { autoAlpha: 1, x: 0 }, 0);
      tl.fromTo(
        handle,
        blinkHalf,
        { autoAlpha: 0 },
        {
          autoAlpha: 1,
          repeat: BRAND_HANDLE_BLINK_COUNT * 2 - 1,
          yoyo: true,
          ease: "power1.inOut",
        },
        ">"
      );

      tl.to(handle, {
        autoAlpha: 0,
        duration: BRAND_HANDLE_FADE_OUT,
        ease: "power2.in",
      });
    }, container);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed z-[60]"
      style={{
        left: 100,
        top: "max(100px, calc(env(safe-area-inset-top) + 100px))",
      }}
    >
      <p
        ref={textRef}
        className="relative m-0 text-[16px] font-bold uppercase tracking-[0.2em] text-white"
      >
        {BRAND_TEXT.split("").map((char, index) => (
          <span key={`${char}-${index}`} className="flip-brand-char inline-block">
            {char === " " ? "\u00A0" : char}
          </span>
        ))}
        <span
          ref={handleRef}
          className="absolute left-0 top-0 mt-px h-5 w-[10px] bg-[#ffe500]"
          aria-hidden
        />
      </p>
    </div>
  );
}
