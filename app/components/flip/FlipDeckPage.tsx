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

gsap.registerPlugin(Flip);

/** 한 바퀴(360°) 회전에 필요한 스크롤 높이 (뷰포트 배수) */
const WHEEL_SCROLL_CYCLE_VH = 1;

const FLIP_MOVE = { duration: 0.6, ease: "sine.out" as const };
const FLIP_ROTATE = { duration: 0.5, ease: "power2.inOut" as const };
const WHEEL_SIZE_SCALE = 2.2;
const WHEEL_CARD_GAP = 18;
const CARD_ASPECT = FLIP_BACK_HEIGHT / FLIP_BACK_WIDTH;

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

/** 휠 위 레이어 중앙 — 클릭 카드가 휠 앞에 떠 있는 느낌 */
function setExpandedVisualPosition(visual: HTMLElement, expandedSize: { width: number; height: number }) {
  visual.style.width = `${expandedSize.width}px`;
  visual.style.height = `${expandedSize.height}px`;
  gsap.set(visual, {
    position: "absolute",
    left: "50%",
    top: "50%",
    xPercent: -50,
    yPercent: -50,
    scale: 1,
    margin: 0,
    right: "auto",
    bottom: "auto",
    zIndex: 200,
    boxShadow: "0 24px 48px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.08)",
  });
}

function resetWheelVisualStyles(visual: HTMLElement, wheelSize: { width: number; height: number }) {
  visual.style.width = `${wheelSize.width}px`;
  visual.style.height = `${wheelSize.height}px`;
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
    boxShadow: "0 6px 20px rgba(0,0,0,0.45)",
  });
}

type CardSizes = {
  wheel: { width: number; height: number };
  expanded: { width: number; height: number };
};

function computeCardSizes(devicePixelRatio: number): CardSizes {
  const sharp = getTextCardDisplaySize(devicePixelRatio);
  const wheelWidth = Math.min(210, Math.round(sharp.width * 0.26 * WHEEL_SIZE_SCALE));
  const wheelHeight = Math.round(wheelWidth * CARD_ASPECT);

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
      className="absolute inset-0 overflow-hidden bg-white flex items-center justify-center rounded-xl"
      style={{
        backfaceVisibility: "hidden",
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
        style={
          isBack && displayWidth && displayHeight
            ? { width: displayWidth, height: displayHeight, maxWidth: "100%", maxHeight: "100%" }
            : undefined
        }
        className="block w-full h-full object-contain pointer-events-none"
      />
    </div>
  );
}

export default function FlipDeckPage() {
  const [order, setOrder] = useState<FlipCardConfig[]>(flipCardConfigList);
  const [cardSizes, setCardSizes] = useState<CardSizes>(() => computeCardSizes(2));

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

  const expandedPointerStartY = useRef(0);
  const expandedCloseRef = useRef<{
    visual: HTMLButtonElement;
    onPointerDown: (e: PointerEvent) => void;
    onPointerUp: (e: PointerEvent) => void;
  } | null>(null);
  const putBackRef = useRef<(onComplete?: () => void) => void>(() => {});

  const clearExpandedCardClose = useCallback(() => {
    const binding = expandedCloseRef.current;
    if (!binding) return;
    binding.visual.removeEventListener("pointerdown", binding.onPointerDown);
    binding.visual.removeEventListener("pointerup", binding.onPointerUp);
    binding.visual.style.pointerEvents = "none";
    binding.visual.style.cursor = "";
    expandedCloseRef.current = null;
  }, []);

  const bindExpandedCardClose = useCallback(
    (visual: HTMLButtonElement) => {
      clearExpandedCardClose();

      const onPointerDown = (e: PointerEvent) => {
        expandedPointerStartY.current = e.clientY;
      };
      const onPointerUp = (e: PointerEvent) => {
        if (e.button !== 0) return;
        if (Math.abs(e.clientY - expandedPointerStartY.current) > 12) return;
        if (busyRef.current || activeIdRef.current === null) return;
        e.stopPropagation();
        putBackRef.current();
      };

      visual.addEventListener("pointerdown", onPointerDown);
      visual.addEventListener("pointerup", onPointerUp);
      visual.style.pointerEvents = "auto";
      visual.style.cursor = "pointer";
      expandedCloseRef.current = { visual, onPointerDown, onPointerUp };
    },
    [clearExpandedCardClose]
  );

  const { wheel: wheelSize, expanded: expandedSize } = cardSizes;
  const wheelDiameter = getWheelDiameter(wheelSize, order.length);

  useEffect(() => {
    const updateSize = () => {
      setCardSizes(computeCardSizes(window.devicePixelRatio || 1));
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
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

    const updateWheelRotation = () => {
      const cycle = getCycleHeight();
      const progress = (scrollEl.scrollTop - cycle) / cycle;
      gsap.set(wheel, { rotate: -360 * progress });
    };

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

    initWheelScroll();
    scrollEl.addEventListener("scroll", onScroll, { passive: true });

    const onResize = () => {
      layoutWheelCards();
      initWheelScroll();
    };

    window.addEventListener("resize", onResize);

    return () => {
      scrollEl.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(rafId);
    };
  }, [order, layoutWheelCards, wheelDiameter, wheelSize.height, wheelSize.width]);

  useEffect(() => () => clearExpandedCardClose(), [clearExpandedCardClose]);

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
      clearExpandedCardClose();
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
              busyRef.current = false;
              setWheelInteractive(true);
              layoutWheelCards();
              onComplete?.();
            },
          });
        },
      });
    },
    [clearExpandedCardClose, killCardTweens, layoutWheelCards, setWheelInteractive, wheelSize.height, wheelSize.width]
  );

  putBackRef.current = putBack;

  const openCard = useCallback(
    (cardId: number, slot: HTMLDivElement) => {
      if (busyRef.current) return;

      if (activeIdRef.current === cardId) {
        putBack();
        return;
      }

      if (activeIdRef.current !== null) {
        putBack();
        return;
      }

      const visual = visualRefs.current.get(cardId);
      const inner = innerRefs.current.get(cardId);
      const expandedLayer = expandedLayerRef.current;
      if (!visual || !inner || !expandedLayer) return;

      busyRef.current = true;
      setWheelInteractive(false);
      killCardTweens(cardId);
      activeIdRef.current = cardId;
      activeSlotRef.current = slot;

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
          gsap.to(inner, {
            rotateY: 180,
            ...FLIP_ROTATE,
            overwrite: true,
            onComplete: () => {
              busyRef.current = false;
              bindExpandedCardClose(visual);
            },
          });
        },
      });
    },
    [
      bindExpandedCardClose,
      expandedSize.height,
      expandedSize.width,
      killCardTweens,
      putBack,
      setWheelInteractive,
    ]
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
      className="relative h-full min-h-0 overflow-y-auto overscroll-contain touch-pan-y [-webkit-overflow-scrolling:touch] text-white bg-black"
    >
      <div ref={scrollSpacerRef} className="relative pb-[44dvh]">
        <FlipBrandTitle />

        <div
          className="pointer-events-none fixed left-1/2 z-50 flex flex-col items-center gap-2 -translate-x-1/2"
          style={{ bottom: "max(56px, calc(env(safe-area-inset-bottom) + 48px))" }}
        >
          <p className="text-[13px] font-semibold tracking-[0.22em] text-white uppercase">스크롤</p>
          <ChevronDown className="flip-scroll-arrow w-5 h-5 text-white" />
        </div>

        <div
          ref={expandedLayerRef}
          className="pointer-events-none fixed inset-x-0 z-[60] h-[50dvh] min-h-[300px] overflow-visible relative"
          style={{ bottom: 0, transform: "translateY(30px)" }}
          aria-hidden
        />

        <section
          ref={wheelSectionRef}
          className="pointer-events-none fixed inset-x-0 z-40 h-[44dvh] min-h-[280px] overflow-visible"
          style={{ bottom: 0, transform: "translateY(30px)" }}
        >
          <div className="relative h-full w-full">
            <div
              ref={wheelRef}
              className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center"
              style={{
                top: "-4%",
                width: wheelDiameter,
                height: wheelDiameter,
              }}
            >
            {order.map((card) => (
              <div
                key={card.id}
                data-card-id={card.id}
                ref={(el) => {
                  if (el) slotRefs.current.set(card.id, el);
                }}
                className="wheel-card pointer-events-auto absolute top-0 left-0 cursor-pointer touch-manipulation"
                style={{ width: wheelSize.width, height: wheelSize.height }}
                onPointerUp={(e) => {
                  if (e.button !== 0) return;
                  e.preventDefault();
                  e.stopPropagation();
                  const slot = slotRefs.current.get(card.id);
                  if (slot) openCard(card.id, slot);
                }}
              >
                <button
                  type="button"
                  ref={(el) => {
                    if (el) visualRefs.current.set(card.id, el);
                  }}
                  tabIndex={-1}
                  className="relative block rounded-xl overflow-hidden shadow-[0_6px_20px_rgba(0,0,0,0.45)] [-webkit-tap-highlight-color:transparent] focus:outline-none pointer-events-none"
                  style={{ perspective: 1200 }}
                  aria-label={`카드 ${card.id}`}
                >
                  <div
                    ref={(el) => {
                      if (el) innerRefs.current.set(card.id, el);
                    }}
                    className="relative w-full h-full"
                    style={{ transformStyle: "preserve-3d" }}
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
                    />
                  </div>
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

        <button
          type="button"
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
