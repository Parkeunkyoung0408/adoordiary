/* eslint-disable @next/next/no-img-element */

import { FLIP_BRAND_LEFT, FLIP_BRAND_TOP, FLIP_LOGO_SIZE } from "./flipBrandLayout";

type FlipBrandTitleProps = {
  /** 모바일 전용 가로 로고 */
  variant?: "default" | "horizontal";
};

export default function FlipBrandTitle({ variant = "default" }: FlipBrandTitleProps) {
  if (variant === "horizontal") {
    return (
      <div
        className="pointer-events-none fixed left-1/2 z-[60] -translate-x-1/2"
        style={{
          top: "max(20px, calc(env(safe-area-inset-top) + 12px))",
        }}
      >
        <img
          src="/assets/flip/gugak-cheobang-logo-horizontal.png"
          alt="굿약처방"
          width={437}
          height={164}
          decoding="async"
          draggable={false}
          className="block h-auto w-[min(260px,72vw)]"
        />
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
