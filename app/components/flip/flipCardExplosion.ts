import gsap from "gsap";

const DOT_QUANTITY = 48;
const DOT_SIZE_MIN = 6;
const DOT_SIZE_MAX = 16;
const EMITTER_SIZE = 48;
const SPEED = 4.5;
const GRAVITY = 3.5;

let mountRoot: HTMLElement | null = null;
let containerEl: HTMLDivElement | null = null;

/** flip 레이아웃(z-300) 안에 마운트해야 파티클이 보임 */
export function setFlipCardExplosionMount(root: HTMLElement | null) {
  mountRoot = root;
  containerEl = null;
}

function getExplosionContainer() {
  const root = mountRoot ?? document.body;
  if (!containerEl || !root.contains(containerEl)) {
    containerEl = document.createElement("div");
    containerEl.style.cssText =
      "position:absolute;left:0;top:0;width:0;height:0;overflow:visible;pointer-events:none;";
    root.appendChild(containerEl);
  }
  return containerEl;
}

function playCenterFlash(container: HTMLElement) {
  const flash = document.createElement("div");
  flash.style.cssText =
    "position:absolute;width:28px;height:28px;border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,0.95) 0%,rgba(255,240,200,0.55) 35%,transparent 72%);box-shadow:0 0 28px rgba(255,255,255,0.85);";
  container.appendChild(flash);

  gsap
    .timeline({ onComplete: () => flash.remove() })
    .fromTo(
      flash,
      { xPercent: -50, yPercent: -50, scale: 0.15, opacity: 1 },
      { scale: 3.2, opacity: 0.75, duration: 0.06, ease: "power4.out" }
    )
    .to(flash, { scale: 4.8, opacity: 0, duration: 0.22, ease: "power2.in" }, 0.06);
}

/** 폭죽: 순간 폭발 → 관성 감속 → 짧게 유지 → 소멸 */
export function playFlipCardExplosion(x: number, y: number) {
  const container = getExplosionContainer();
  gsap.set(container, { x, y });
  playCenterFlash(container);

  for (let i = 0; i < DOT_QUANTITY; i++) {
    const size = gsap.utils.random(DOT_SIZE_MIN, DOT_SIZE_MAX, 1);
    const dot = document.createElement("div");
    dot.style.cssText =
      "position:absolute;border-radius:50%;background:#ffffff;box-shadow:0 0 12px rgba(255,255,255,0.85);";

    const angle = Math.random() * Math.PI * 2;
    const length = Math.random() * (EMITTER_SIZE / 2 - size / 2);
    const velocity = (120 + Math.random() * 280) * SPEED;
    const gravityPull = 500 * GRAVITY;

    const spread = velocity * gsap.utils.random(0.58, 0.78);
    const endX = Math.cos(angle) * spread;
    const endY =
      Math.sin(angle) * spread * 0.9 -
      Math.abs(Math.cos(angle)) * gsap.utils.random(8, 28) +
      gravityPull * gsap.utils.random(0.034, 0.05);

    const burstPortion = gsap.utils.random(0.86, 0.94);
    const burstX = endX * burstPortion;
    const burstY = endY * burstPortion * 0.68;

    const burstDur = gsap.utils.random(0.04, 0.07);
    const coastDur = gsap.utils.random(0.18, 0.28);
    const hangDur = gsap.utils.random(0.12, 0.22);
    const fadeDur = gsap.utils.random(0.18, 0.28);

    container.appendChild(dot);
    gsap.set(dot, {
      x: startX(angle, length),
      y: startY(angle, length),
      width: size,
      height: size,
      xPercent: -50,
      yPercent: -50,
      scale: 0.1,
      opacity: 0,
      force3D: true,
    });

    gsap
      .timeline({ onComplete: () => dot.remove() })
      // 1) 폭죽처럼 순간 방사 (거리의 86~94%를 0.04~0.07초에)
      .to(
        dot,
        {
          x: burstX,
          y: burstY,
          scale: gsap.utils.random(1.2, 1.45),
          opacity: 1,
          duration: burstDur,
          ease: "power4.out",
        },
        0
      )
      // 2) 관성으로 감속·낙하
      .to(
        dot,
        {
          x: endX,
          y: endY,
          scale: 1,
          duration: coastDur,
          ease: "power3.out",
        },
        burstDur
      )
      // 3) 잠깐 반짝 유지
      .to(dot, { opacity: 1, duration: hangDur }, burstDur + coastDur)
      // 4) 빠르게 소멸
      .to(
        dot,
        {
          opacity: 0,
          scale: gsap.utils.random(0.55, 0.75),
          duration: fadeDur,
          ease: "power3.in",
        },
        burstDur + coastDur + hangDur
      );
  }
}

function startX(angle: number, length: number) {
  return Math.cos(angle) * length;
}

function startY(angle: number, length: number) {
  return Math.sin(angle) * length;
}

export function playFlipCardExplosionAtElement(element: HTMLElement) {
  const bounds = element.getBoundingClientRect();
  playFlipCardExplosion(bounds.left + bounds.width / 2, bounds.top + bounds.height / 2);
}
