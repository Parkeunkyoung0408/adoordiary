"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { Flip } from "gsap/Flip";
import { ChevronDown } from "lucide-react";
import {
  FLIP_BACK_HEIGHT,
  FLIP_BACK_WIDTH,
  flipCardConfigList,
  getTextCardDisplaySize,
  type FlipCardConfig,
} from "./flipCardConfig";
import FlipBrandTitle from "./FlipBrandTitle";
import { playFlipCardExplosionAtElement, setFlipCardExplosionMount } from "./flipCardExplosion";
import FlipPeaceTagline from "./FlipPeaceTagline";

gsap.registerPlugin(Flip);

/** 한 바퀴(360°) 회전에 필요한 스크롤 높이 (뷰포트 배수) */
const WHEEL_SCROLL_CYCLE_VH = 1;

const FLIP_MOVE = { duration: 0.6, ease: "sine.out" as const };
const FLIP_ROTATE = { duration: 0.5, ease: "power2.inOut" as const };
/** 확대 후 앞면 유지 시간(초) — 이후 뒷면으로 뒤집힘 */
const FRONT_FACE_HOLD = 1;
const WHEEL_SIZE_SCALE = 2.2;
const CARD_SIZE_SCALE = 1.1;
const WHEEL_CARD_MAX_WIDTH = Math.round(210 * CARD_SIZE_SCALE);
const WHEEL_CARD_GAP = 18;
const WHEEL_CARD_SHADOW = "0 2px 10px rgba(0,0,0,0.2)";
const CARD_ASPECT = FLIP_BACK_HEIGHT / FLIP_BACK_WIDTH;
/** 확대 카드 세로 앵커 — 1/3 지점에서 약 1/2만큼 더 아래 */
const EXPANDED_CARD_TOP = "50dvh";
const FLIP_CARD_RADIUS_PX = 10;
const TAP_MOVE_THRESHOLD_PX = 12;

function getWheelCardSpan(size: { width: number; height: number }) {
  return Math.max(size.width, size.height * 0.82);
}

function getWheelLayoutRadius(cardSize: { width: number; height: number }, cardCount: number) {
  const angularStep = (2 * Math.PI) / cardCount;
  return (getWheelCardSpan(cardSize) + WHEEL_CARD_GAP) / angularStep;
}

function getWheelDiameter(cardSize: { width: number; height: number }, cardCount: number) {
  return Math.ceil(getWheelLayoutRadius(cardSize, cardCount) * 2);
}

/** 화면 1/3 높이에 고정 — 2배 확대 시에도 카드가 잘 보이게 */
function setExpandedVisualPosition(visual: HTMLElement, expandedSize: { width: number; height: number }) {
  visual.style.width = `${expandedSize.width}px`;
  visual.style.height = `${expandedSize.height}px`;
  gsap.set(visual, {
    position: "fixed",
    left: "50%",
    top: EXPANDED_CARD_TOP,
    xPercent: -50,
    yPercent: -50,
    scale: 1,
    margin: 0,
    right: "auto",
    bottom: "auto",
    zIndex: 200,
    boxShadow: "0 24px 48px rgba(0,0,0,0.65)",
  });
}

function resetWheelVisualStyles(visual: HTMLElement, wheelSize: { width: number; height: number }) {
  visual.style.width = `${wheelSize.width}px`;
  visual.style.height = `${wheelSize.height}px`;
  visual.style.pointerEvents = "none";
  gsap.set(visual, {
    position: "relative",
    left: "auto",
    top: "auto",
    xPercent: 0,
    yPercent: 0,
    scale: 1,
    margin: 0,
    right: "auto",
    bottom: "auto",
    zIndex: "auto",
    boxShadow: WHEEL_CARD_SHADOW,
  });
}

type CardSizes = {
  wheel: { width: number; height: number };
  expanded: { width: number; height: number };
};

function computeCardSizes(devicePixelRatio: number): CardSizes {
  const sharp = getTextCardDisplaySize(devicePixelRatio);
  const wheelWidth = Math.min(
    WHEEL_CARD_MAX_WIDTH,
    Math.round(sharp.width * 0.26 * WHEEL_SIZE_SCALE * CARD_SIZE_SCALE)
  );
  const wheelHeight = Math.ceil(wheelWidth * CARD_ASPECT);

  return {
    wheel: { width: wheelWidth, height: wheelHeight },
    expanded: { width: wheelWidth * 2, height: wheelHeight * 2 },
  };
}

function shuffleCards(list: FlipCardConfig[]): FlipCardConfig[] {
  const next = [...list];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function CardImageFace({
  src,
  alt,
  width,
  height,
  variant,
  displayWidth,
  displayHeight,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  variant: "front" | "back";
  displayWidth?: number;
  displayHeight?: number;
}) {
  const isBack = variant === "back";

  return (
    <div
      className={`absolute inset-0 overflow-hidden flex items-center justify-center ${isBack ? "bg-white" : "bg-transparent"}`}
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
        width={width}
        height={height}
        decoding="async"
        draggable={false}
        style={{
          borderRadius: FLIP_CARD_RADIUS_PX,
          ...(isBack && displayWidth && displayHeight
            ? { width: displayWidth, height: displayHeight, maxWidth: "100%", maxHeight: "100%" }
            : {}),
        }}
        className={`block w-full h-full pointer-events-none ${isBack ? "object-contain" : "object-cover"}`}
      />
    </div>
  );
}

export default function FlipDeckPage() {
  const [order, setOrder] = useState<FlipCardConfig[]>(flipCardConfigList);
  const [cardSizes, setCardSizes] = useState<CardSizes>(() => computeCardSizes(2));
  const [devicePixelRatio, setDevicePixelRatio] = useState(2);
  const [activeCardId, setActiveCardId] = useState<number | null>(null);
  const [isDismissBackdropActive, setIsDismissBackdropActive] = useState(false);

  const explosionLayerRef = useRef<HTMLDivElement>(null);
  const expandedLayerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollSpacerRef = useRef<HTMLDivElement>(null);
  const wheelRef = useRef<HTMLDivElement>(null);
  const slotRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const visualRefs = useRef<Map<number, HTMLButtonElement>>(new Map());
  const innerRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const activeIdRef = useRef<number | null>(null);
  const activeSlotRef = useRef<HTMLDivElement | null>(null);
  const busyRef = useRef(false);
  const wheelSectionRef = useRef<HTMLElement | null>(null);
  const syncWheelRotationRef = useRef<(() => void) | null>(null);
  const scrollGestureRef = useRef({ pointerId: -1, x: 0, y: 0, moved: false });
  const expandedFaceBackRef = useRef(false);

  const killCardTweens = useCallback((cardId: number) => {
    const inner = innerRefs.current.get(cardId);
    const visual = visualRefs.current.get(cardId);
    if (inner) gsap.killTweensOf(inner);
    if (visual) gsap.killTweensOf(visual);
  }, []);

  const setWheelInteractive = useCallback((enabled: boolean) => {
    wheelSectionRef.current?.querySelectorAll<HTMLElement>(".wheel-card").forEach((card) => {
      card.style.pointerEvents = enabled ? "auto" : "none";
    });
  }, []);

  const { wheel: wheelSize, expanded: expandedSize } = cardSizes;
  const wheelDiameter = getWheelDiameter(wheelSize, order.length);
  const wheelBackFaceDisplaySize = getTextCardDisplaySize(devicePixelRatio, wheelSize.width);
  const expandedBackFaceDisplaySize = getTextCardDisplaySize(devicePixelRatio, expandedSize.width);

  useEffect(() => {
    const updateSize = () => {
      const dpr = window.devicePixelRatio || 1;
      setDevicePixelRatio(dpr);
      setCardSizes(computeCardSizes(dpr));
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  useLayoutEffect(() => {
    setFlipCardExplosionMount(explosionLayerRef.current);
    return () => setFlipCardExplosionMount(null);
  }, []);

  useLayoutEffect(() => {
    const expandedLayer = expandedLayerRef.current;
    visualRefs.current.forEach((visual, id) => {
      if (expandedLayer?.contains(visual) && activeIdRef.current === id) {
        setExpandedVisualPosition(visual, cardSizes.expanded);
        return;
      }
      visual.style.width = `${cardSizes.wheel.width}px`;
      visual.style.height = `${cardSizes.wheel.height}px`;
    });
  }, [cardSizes]);

  const layoutWheelCards = useCallback(() => {
    const wheel = wheelRef.current;
    if (!wheel) return;

    const cards = gsap.utils.toArray<HTMLElement>(".wheel-card", wheel);
    const total = cards.length;
    if (total === 0) return;

    const center = wheel.offsetWidth / 2;
    const slice = (2 * Math.PI) / total;
    const radius = getWheelLayoutRadius(wheelSize, total);

    cards.forEach((item, i) => {
      const cardId = Number(item.dataset.cardId);
      if (activeIdRef.current === cardId) return;

      const angle = i * slice;
      const x = center + radius * Math.sin(angle);
      const y = center - radius * Math.cos(angle);

      gsap.set(item, {
        rotation: `${angle}rad`,
        xPercent: -50,
        yPercent: -50,
        x,
        y,
        zIndex: i,
      });
    });
  }, [wheelSize.height, wheelSize.width]);

  useLayoutEffect(() => {
    const wheel = wheelRef.current;
    const scrollEl = scrollRef.current;
    const spacer = scrollSpacerRef.current;
    if (!wheel || !scrollEl || !spacer) return;

    layoutWheelCards();

    const getCycleHeight = () =>
      Math.max(Math.round(window.innerHeight * WHEEL_SCROLL_CYCLE_VH), 360);

    let rafId = 0;
    let loopId = 0;

    const updateWheelRotation = () => {
      const cycle = getCycleHeight();
      const progress = (scrollEl.scrollTop - cycle) / cycle;
      gsap.set(wheel, { rotate: -360 * progress, transformOrigin: "50% 50%" });
    };

    syncWheelRotationRef.current = updateWheelRotation;

    const normalizeScrollLoop = () => {
      const cycle = getCycleHeight();
      spacer.style.minHeight = `${cycle * 3}px`;

      if (scrollEl.scrollTop >= cycle * 2) {
        scrollEl.scrollTop -= cycle;
      } else if (scrollEl.scrollTop < cycle) {
        scrollEl.scrollTop += cycle;
      }
    };

    const onScroll = () => {
      normalizeScrollLoop();
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateWheelRotation);
    };

    const initWheelScroll = () => {
      const cycle = getCycleHeight();
      spacer.style.minHeight = `${cycle * 3}px`;
      if (scrollEl.scrollTop < cycle * 0.5 || scrollEl.scrollTop > cycle * 2.5) {
        scrollEl.scrollTop = cycle;
      }
      updateWheelRotation();
    };

    const wheelLoop = () => {
      updateWheelRotation();
      loopId = requestAnimationFrame(wheelLoop);
    };

    initWheelScroll();
    scrollEl.addEventListener("scroll", onScroll, { passive: true });
    loopId = requestAnimationFrame(wheelLoop);

    const onResize = () => {
      layoutWheelCards();
      initWheelScroll();
    };

    window.addEventListener("resize", onResize);

    return () => {
      scrollEl.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(rafId);
      cancelAnimationFrame(loopId);
      syncWheelRotationRef.current = null;
    };
  }, [order, layoutWheelCards, wheelDiameter, wheelSize.height, wheelSize.width]);

  useEffect(() => {
    gsap.to(".flip-scroll-arrow", {
      y: 5,
      ease: "power1.inOut",
      repeat: -1,
      yoyo: true,
    });
  }, []);

  const putBack = useCallback(
    (onComplete?: () => void) => {
      const cardId = activeIdRef.current;
      const slot = activeSlotRef.current;
      const visual = cardId !== null ? visualRefs.current.get(cardId) : null;
      const inner = cardId !== null ? innerRefs.current.get(cardId) : null;
      const expandedLayer = expandedLayerRef.current;

      if (!cardId || !slot || !visual || !inner || !expandedLayer) {
        onComplete?.();
        return;
      }

      busyRef.current = true;
      setWheelInteractive(false);
      killCardTweens(cardId);

      gsap.to(inner, {
        rotateY: 0,
        ...FLIP_ROTATE,
        overwrite: true,
        onComplete: () => {
          const state = Flip.getState(visual);
          slot.appendChild(visual);
          resetWheelVisualStyles(visual, wheelSize);

          Flip.from(state, {
            ...FLIP_MOVE,
            absolute: true,
            scale: true,
            overwrite: true,
            onComplete: () => {
              resetWheelVisualStyles(visual, wheelSize);
              activeIdRef.current = null;
              activeSlotRef.current = null;
              setActiveCardId(null);
              layoutWheelCards();
              syncWheelRotationRef.current?.();

              if (onComplete) {
                onComplete();
                return;
              }

              busyRef.current = false;
              setWheelInteractive(true);
              setIsDismissBackdropActive(false);
              expandedFaceBackRef.current = false;
            },
          });
        },
      });
    },
    [killCardTweens, layoutWheelCards, setWheelInteractive, wheelSize.height, wheelSize.width]
  );

  const toggleExpandedFace = useCallback(
    (cardId: number) => {
      const inner = innerRefs.current.get(cardId);
      if (!inner || activeIdRef.current !== cardId) return;

      busyRef.current = true;
      killCardTweens(cardId);

      const nextIsBack = !expandedFaceBackRef.current;
      expandedFaceBackRef.current = nextIsBack;

      gsap.to(inner, {
        rotateY: nextIsBack ? 180 : 0,
        ...FLIP_ROTATE,
        overwrite: true,
        onComplete: () => {
          busyRef.current = false;
        },
      });
    },
    [killCardTweens]
  );

  const openCardDirect = useCallback(
    (cardId: number, slot: HTMLDivElement) => {
      const visual = visualRefs.current.get(cardId);
      const inner = innerRefs.current.get(cardId);
      const expandedLayer = expandedLayerRef.current;
      if (!visual || !inner || !expandedLayer) return;

      busyRef.current = true;
      setWheelInteractive(false);
      killCardTweens(cardId);
      activeIdRef.current = cardId;
      activeSlotRef.current = slot;
      setActiveCardId(cardId);
      expandedFaceBackRef.current = false;

      playFlipCardExplosionAtElement(visual);

      gsap.set(inner, { rotateY: 0 });
      gsap.set(visual, { zIndex: 200 });

      const state = Flip.getState(visual);
      expandedLayer.appendChild(visual);
      setExpandedVisualPosition(visual, expandedSize);

      Flip.from(state, {
        ...FLIP_MOVE,
        absolute: true,
        scale: true,
        overwrite: true,
        onComplete: () => {
          setExpandedVisualPosition(visual, expandedSize);
          visual.style.pointerEvents = "auto";
          setIsDismissBackdropActive(true);
          setWheelInteractive(true);
          busyRef.current = false;
          syncWheelRotationRef.current?.();

          gsap.to(inner, {
            rotateY: 180,
            ...FLIP_ROTATE,
            delay: FRONT_FACE_HOLD,
            overwrite: true,
            onComplete: () => {
              expandedFaceBackRef.current = true;
            },
          });
        },
      });
    },
    [expandedSize.height, expandedSize.width, killCardTweens, setWheelInteractive]
  );

  const handleDismissBackdrop = useCallback(() => {
    if (busyRef.current || activeIdRef.current === null) return;
    putBack();
  }, [putBack]);

  const openCard = useCallback(
    (cardId: number, slot: HTMLDivElement) => {
      if (busyRef.current) return;

      if (activeIdRef.current === cardId) {
        toggleExpandedFace(cardId);
        return;
      }

      if (activeIdRef.current !== null) {
        putBack(() => openCardDirect(cardId, slot));
        return;
      }

      openCardDirect(cardId, slot);
    },
    [openCardDirect, putBack, toggleExpandedFace]
  );

  const handleScrollPointerDownCapture = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    scrollGestureRef.current = {
      pointerId: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      moved: false,
    };
  }, []);

  const handleScrollPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const gesture = scrollGestureRef.current;
    if (e.pointerId !== gesture.pointerId) return;

    const dx = e.clientX - gesture.x;
    const dy = e.clientY - gesture.y;
    if (dx * dx + dy * dy > TAP_MOVE_THRESHOLD_PX * TAP_MOVE_THRESHOLD_PX) {
      gesture.moved = true;
    }
  }, []);

  const handleScrollPointerUpCapture = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (busyRef.current || activeIdRef.current === null) return;
      if (e.button !== 0) return;
      if (scrollGestureRef.current.moved) return;

      const target = e.target as HTMLElement;
      const activeVisual = visualRefs.current.get(activeIdRef.current);
      if (activeVisual?.contains(target)) return;
      if (target.closest(".wheel-card")) return;
      if (target.closest("[data-flip-no-dismiss]")) return;

      handleDismissBackdrop();
    },
    [handleDismissBackdrop]
  );

  const handleExpandedVisualPointerUp = useCallback(
    (cardId: number) => (e: React.PointerEvent<HTMLButtonElement>) => {
      if (activeIdRef.current !== cardId) return;
      if (e.button !== 0) return;
      if (scrollGestureRef.current.moved) return;
      if (busyRef.current) return;

      toggleExpandedFace(cardId);
    },
    [toggleExpandedFace]
  );

  const handleWheelCardPointerUp = useCallback(
    (cardId: number) => (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      if (scrollGestureRef.current.moved) return;
      if (busyRef.current) return;

      const slot = slotRefs.current.get(cardId);
      if (slot) openCard(cardId, slot);
    },
    [openCard]
  );

  const handleShuffle = useCallback(() => {
    if (activeIdRef.current !== null || busyRef.current) return;

    const elements = order
      .map((card) => visualRefs.current.get(card.id))
      .filter((el): el is HTMLButtonElement => Boolean(el));

    const state = Flip.getState(elements);
    setOrder(shuffleCards(flipCardConfigList));

    requestAnimationFrame(() => {
      Flip.from(state, { ...FLIP_MOVE, absolute: true, scale: true, onComplete: layoutWheelCards });
    });
  }, [layoutWheelCards, order]);

  return (
    <div
      ref={scrollRef}
      className="relative h-full min-h-0 overflow-y-auto overscroll-contain touch-pan-y [-webkit-overflow-scrolling:touch] text-white bg-[#222222]"
      onPointerDownCapture={handleScrollPointerDownCapture}
      onPointerMove={handleScrollPointerMove}
      onPointerUpCapture={handleScrollPointerUpCapture}
    >
      <div ref={scrollSpacerRef} className="relative pb-[44dvh]">
        <FlipBrandTitle />
        <FlipPeaceTagline />

        <div
          className="pointer-events-none fixed left-1/2 z-50 flex flex-col items-center gap-2 -translate-x-1/2"
          style={{ bottom: "max(56px, calc(env(safe-area-inset-bottom) + 48px))" }}
        >
          <p className="text-[13px] font-semibold tracking-[0.22em] text-white uppercase">스크롤</p>
          <ChevronDown className="flip-scroll-arrow w-5 h-5 text-white" />
        </div>

        {isDismissBackdropActive ? (
          <div
            aria-hidden
            className="pointer-events-none fixed inset-0 z-[55] bg-transparent"
          />
        ) : null}

        <div
          ref={explosionLayerRef}
          className="pointer-events-none fixed inset-0 overflow-visible z-[210]"
          aria-hidden
        />

        <div
          ref={expandedLayerRef}
          className="pointer-events-none fixed inset-0 overflow-visible"
          style={{ zIndex: isDismissBackdropActive ? 70 : 60 }}
          aria-hidden
        />

        <section
          ref={wheelSectionRef}
          className="pointer-events-none fixed inset-x-0 h-[44dvh] min-h-[280px] overflow-visible"
          style={{
            bottom: 0,
            transform: "translateY(30px)",
            zIndex: isDismissBackdropActive ? 65 : 40,
          }}
        >
          <div className="relative h-full w-full">
            <div
              className="absolute left-1/2 -translate-x-1/2"
              style={{
                top: "-4%",
                width: wheelDiameter,
                height: wheelDiameter,
              }}
            >
              <div
                ref={wheelRef}
                className="absolute inset-0 flex items-center justify-center"
              >
            {order.map((card) => (
              <div
                key={card.id}
                data-card-id={card.id}
                ref={(el) => {
                  if (el) slotRefs.current.set(card.id, el);
                }}
                className="wheel-card pointer-events-auto absolute top-0 left-0 cursor-pointer [touch-action:pan-y]"
                style={{ width: wheelSize.width, height: wheelSize.height }}
                onPointerUp={handleWheelCardPointerUp(card.id)}
              >
                <button
                  type="button"
                  ref={(el) => {
                    if (el) visualRefs.current.set(card.id, el);
                  }}
                  tabIndex={-1}
                  className="relative block overflow-visible [-webkit-tap-highlight-color:transparent] focus:outline-none pointer-events-none"
                  style={{
                    borderRadius: FLIP_CARD_RADIUS_PX,
                    boxShadow: WHEEL_CARD_SHADOW,
                    perspective: 1400,
                    transformStyle: "preserve-3d",
                  }}
                  aria-label={`카드 ${card.id}`}
                  onPointerUp={handleExpandedVisualPointerUp(card.id)}
                >
                  <div
                    ref={(el) => {
                      if (el) innerRefs.current.set(card.id, el);
                    }}
                    className="relative w-full h-full"
                    style={{
                      borderRadius: FLIP_CARD_RADIUS_PX,
                      transformStyle: "preserve-3d",
                      transformOrigin: "center center",
                    }}
                  >
                    <CardImageFace
                      src={card.frontSrc}
                      alt={`카드 ${card.id} 앞면`}
                      width={card.frontWidth}
                      height={card.frontHeight}
                      variant="front"
                    />
                    <CardImageFace
                      src={card.backSrc}
                      alt={`카드 ${card.id} 뒷면`}
                      width={card.backWidth}
                      height={card.backHeight}
                      variant="back"
                      displayWidth={
                        activeCardId === card.id
                          ? expandedBackFaceDisplaySize.width
                          : wheelBackFaceDisplaySize.width
                      }
                      displayHeight={
                        activeCardId === card.id
                          ? expandedBackFaceDisplaySize.height
                          : wheelBackFaceDisplaySize.height
                      }
                    />
                  </div>
                </button>
              </div>
            ))}
              </div>
            </div>
        </div>
      </section>

        <button
          type="button"
          data-flip-no-dismiss
          onClick={handleShuffle}
          className="fixed right-4 z-50 h-9 px-3 rounded-full border border-white/30 bg-white/10 text-white font-bold text-[11px] active:scale-95 transition-transform touch-manipulation backdrop-blur-sm"
          style={{ bottom: "max(12px, env(safe-area-inset-bottom))" }}
        >
          셔플
        </button>
      </div>
    </div>
  );
}
