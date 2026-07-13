/* eslint-disable @next/next/no-img-element */

import { FLIP_BRAND_LEFT, FLIP_BRAND_TOP, FLIP_LOGO_SIZE } from "./flipBrandLayout";

type FlipBrandTitleProps = {
  /** 모바일 전용 가로 로고 */
  variant?: "default" | "horizontal";
  /** 스크롤 후 컴팩트 탑바 */
  compact?: boolean;
  /** 로고 클릭 (상단 이동 등) */
  onLogoClick?: () => void;
};

export default function FlipBrandTitle({
  variant = "default",
  compact = false,
  onLogoClick,
}: FlipBrandTitleProps) {
  if (variant === "horizontal") {
    const clickable = Boolean(onLogoClick);

    return (
      <div
        className={`fixed left-1/2 z-[60] -translate-x-1/2 transition-[top,transform] duration-300 ease-out ${
          clickable ? "pointer-events-auto" : "pointer-events-none"
        }`}
        style={{
          top: compact
            ? "max(10px, calc(env(safe-area-inset-top) + 8px))"
            : "max(20px, calc(env(safe-area-inset-top) + 12px))",
        }}
      >
        {clickable ? (
          <button
            type="button"
            onClick={onLogoClick}
            aria-label="맨 위로"
            className="block border-0 bg-transparent p-0 [-webkit-tap-highlight-color:transparent] focus:outline-none"
          >
            <img
              src="/assets/flip/gugak-cheobang-logo-horizontal.png"
              alt="굿약처방"
              width={437}
              height={164}
              decoding="async"
              draggable={false}
              className={`block h-auto transition-[width] duration-300 ease-out ${
                compact ? "w-[min(168px,46vw)]" : "w-[min(260px,72vw)]"
              }`}
            />
          </button>
        ) : (
          <img
            src="/assets/flip/gugak-cheobang-logo-horizontal.png"
            alt="굿약처방"
            width={437}
            height={164}
            decoding="async"
            draggable={false}
            className="block h-auto w-[min(260px,72vw)]"
          />
        )}
      </div>
    );
  }

  return (
    <div
      className="pointer-events-none fixed z-[60]"
      style={{
        left: FLIP_BRAND_LEFT,
        top: FLIP_BRAND_TOP,
      }}
    >
      <img
        src="/assets/flip/gugak-cheobang-logo.png"
        alt="굿약처방"
        width={FLIP_LOGO_SIZE}
        height={FLIP_LOGO_SIZE}
        decoding="async"
        draggable={false}
        className="block h-auto w-[240px] max-w-[40vw]"
      />
    </div>
  );
}
