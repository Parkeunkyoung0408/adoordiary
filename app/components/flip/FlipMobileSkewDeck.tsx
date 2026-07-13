"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  FLIP_BACK_HEIGHT,
  FLIP_BACK_WIDTH,
  flipCardConfigList,
  type FlipCardConfig,
} from "./flipCardConfig";
import FlipBrandTitle from "./FlipBrandTitle";
import FlipPeaceTagline from "./FlipPeaceTagline";

gsap.registerPlugin(ScrollTrigger);

/** 원본 카드 비율 (3119×4615) */
const CARD_ASPECT = FLIP_BACK_HEIGHT / FLIP_BACK_WIDTH;
const FLIP_CARD_RADIUS_PX = 14;
const FLIP_ROTATE = { duration: 0.4, ease: "power2.inOut" as const };
const TAP_MOVE_THRESHOLD_PX = 10;

function getMobileCardWidth(viewportWidth: number) {
  return Math.min(320, Math.round(viewportWidth * 0.82));
}

function MobileCardFace({
  src,
  alt,
  isBack,
}: {
  src: string;
  alt: string;
  isBack?: boolean;
}) {
  return (
    <div
      className="absolute inset-0 overflow-hidden bg-white"
      style={{
        borderRadius: FLIP_CARD_RADIUS_PX,
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
        transform: isBack ? "rotateY(180deg)" : undefined,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        decoding="async"
        draggable={false}
        className={`block h-full w-full pointer-events-none ${isBack ? "object-contain" : "object-cover"}`}
        style={{ borderRadius: FLIP_CARD_RADIUS_PX }}
      />
    </div>
  );
}

function MobileFlipCard({
  card,
  width,
  height,
  isFlipped,
  onSelect,
}: {
  card: FlipCardConfig;
  width: number;
  height: number;
  isFlipped: boolean;
  onSelect: () => void;
}) {
  const innerRef = useRef<HTMLDivElement>(null);
  const gestureRef = useRef({ x: 0, y: 0, moved: false });
  const wasFlippedRef = useRef(isFlipped);

  useEffect(() => {
    const inner = innerRef.current;
    if (!inner) return;

    const nextAngle = isFlipped ? 180 : 0;
    const prevFlipped = wasFlippedRef.current;
    wasFlippedRef.current = isFlipped;

    gsap.killTweensOf(inner);
    gsap.to(inner, {
      rotateY: nextAngle,
      ...FLIP_ROTATE,
      duration: prevFlipped === isFlipped ? 0 : FLIP_ROTATE.duration,
      overwrite: true,
    });
  }, [isFlipped]);

  return (
    <div
      className="skew-card mx-auto shrink-0"
      style={{
        width,
        height,
        transformOrigin: "right center",
      }}
    >
      <button
        type="button"
        className="relative block h-full w-full overflow-visible [-webkit-tap-highlight-color:transparent] focus:outline-none touch-manipulation"
        style={{
          borderRadius: FLIP_CARD_RADIUS_PX,
          boxShadow: "0 12px 36px rgba(0,0,0,0.35)",
          perspective: 1400,
          transformStyle: "preserve-3d",
        }}
        aria-label={isFlipped ? `카드 ${card.id} 앞면 보기` : `카드 ${card.id} 뒷면 보기`}
        onPointerDown={(e) => {
          gestureRef.current = { x: e.clientX, y: e.clientY, moved: false };
        }}
        onPointerMove={(e) => {
          const g = gestureRef.current;
          const dx = e.clientX - g.x;
          const dy = e.clientY - g.y;
          if (dx * dx + dy * dy > TAP_MOVE_THRESHOLD_PX * TAP_MOVE_THRESHOLD_PX) {
            g.moved = true;
          }
        }}
        onPointerUp={(e) => {
          if (e.button !== 0) return;
          if (gestureRef.current.moved) return;
          onSelect();
        }}
      >
        <div
          ref={innerRef}
          className="relative h-full w-full"
          style={{
            borderRadius: FLIP_CARD_RADIUS_PX,
            transformStyle: "preserve-3d",
            transformOrigin: "center center",
          }}
        >
          <MobileCardFace src={card.frontWheelSrc} alt={`카드 ${card.id} 앞면`} />
          {/* 뒷면 WebP를 처음부터 마운트해 탭 직후 흰 화면이 나오지 않게 함 */}
          <MobileCardFace src={card.backWheelSrc} alt={`카드 ${card.id} 뒷면`} isBack />
        </div>
      </button>
    </div>
  );
}

/** 모바일: velocity-skew 세로 스크롤 + 탭 뒤집기 */
export default function FlipMobileSkewDeck() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [order] = useState(() => [...flipCardConfigList]);
  const [flippedId, setFlippedId] = useState<number | null>(null);
  const [cardWidth, setCardWidth] = useState(300);

  const cardHeight = Math.round(cardWidth * CARD_ASPECT);

  useLayoutEffect(() => {
    const update = () => setCardWidth(getMobileCardWidth(window.innerWidth));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const proxy = { skew: 0 };
    const skewSetter = gsap.quickSetter(".skew-card", "skewY", "deg");
    const clamp = gsap.utils.clamp(-18, 18);

    gsap.set(".skew-card", { force3D: true });

    const trigger = ScrollTrigger.create({
      scroller,
      onUpdate: (self) => {
        const skew = clamp(self.getVelocity() / -320);
        if (Math.abs(skew) > Math.abs(proxy.skew)) {
          proxy.skew = skew;
          gsap.to(proxy, {
            skew: 0,
            duration: 0.8,
            ease: "power3",
            overwrite: true,
            onUpdate: () => skewSetter(proxy.skew),
          });
        }
      },
    });

    ScrollTrigger.refresh();

    return () => {
      trigger.kill();
      gsap.killTweensOf(proxy);
    };
  }, [order.length, cardWidth]);

  /** 같은 카드면 닫기, 다른 카드면 기존 닫고 새 카드 뒷면 열기 */
  const handleSelect = useCallback((cardId: number) => {
    setFlippedId((prev) => {
      if (prev === cardId) return null;
      return cardId;
    });
  }, []);

  return (
    <div
      ref={scrollerRef}
      className="relative h-full min-h-0 overflow-y-auto overscroll-contain touch-pan-y [-webkit-overflow-scrolling:touch] text-white bg-[#222222]"
    >
      <FlipBrandTitle variant="horizontal" />
      <FlipPeaceTagline variant="horizontal" />

      <div
        className="flex flex-col items-center px-4"
        style={{
          paddingTop: "max(128px, calc(env(safe-area-inset-top) + 116px))",
          paddingBottom: "max(48px, calc(env(safe-area-inset-bottom) + 32px))",
          gap: "12vh",
        }}
      >
        <p className="m-0 max-w-[280px] text-center text-[12px] leading-relaxed text-white/55">
          스크롤하며 카드를 넘기고, 탭하면 뒷면을 볼 수 있어요
        </p>

        {order.map((card) => (
          <MobileFlipCard
            key={card.id}
            card={card}
            width={cardWidth}
            height={cardHeight}
            isFlipped={flippedId === card.id}
            onSelect={() => handleSelect(card.id)}
          />
        ))}

        <div className="h-[28vh] w-full shrink-0" aria-hidden />
      </div>
    </div>
  );
}
