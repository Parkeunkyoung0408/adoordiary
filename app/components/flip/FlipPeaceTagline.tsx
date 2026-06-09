import {
  FLIP_BRAND_LEFT,
  FLIP_BRAND_TOP,
  FLIP_LOGO_SIZE,
  FLIP_LOGO_TAGLINE_GAP,
  FLIP_TAGLINE_OFFSET_UP,
} from "./flipBrandLayout";

const TAGLINE_TEXT = "네 글자로 경험하는 내적 평화";

export default function FlipPeaceTagline() {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-[60] text-center"
      style={{
        top: `calc(${FLIP_BRAND_TOP} + ${FLIP_LOGO_SIZE}px + ${FLIP_LOGO_TAGLINE_GAP}px - ${FLIP_TAGLINE_OFFSET_UP}px)`,
        paddingLeft: FLIP_BRAND_LEFT,
        paddingRight: FLIP_BRAND_LEFT,
      }}
    >
      <p className="m-0 text-[18px] font-bold leading-snug tracking-[-0.02em] text-white sm:text-[20px]">
        {TAGLINE_TEXT}
      </p>
    </div>
  );
}
