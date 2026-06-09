/* eslint-disable @next/next/no-img-element */

import { FLIP_BRAND_LEFT, FLIP_BRAND_TOP, FLIP_LOGO_SIZE } from "./flipBrandLayout";

export default function FlipBrandTitle() {
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
        alt="국악처방"
        width={FLIP_LOGO_SIZE}
        height={FLIP_LOGO_SIZE}
        decoding="async"
        draggable={false}
        className="block h-auto w-[240px] max-w-[40vw]"
      />
    </div>
  );
}
