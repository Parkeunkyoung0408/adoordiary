import {
  FLIP_BRAND_LEFT,
  FLIP_BRAND_TOP,
  FLIP_LOGO_SIZE,
  FLIP_LOGO_TAGLINE_GAP,
  FLIP_TAGLINE_OFFSET_UP,
} from "./flipBrandLayout";

const TAGLINE_TEXT = "네 글자로 경험하는 내적 평화";
const HINT_TEXT = "카드를 탭하면 처방 문구가 보여요";

type FlipPeaceTaglineProps = {
  /** 모바일 가로 로고 아래에 맞춤 */
  variant?: "default" | "horizontal";
  /** 스크롤 후 숨김 */
  compact?: boolean;
};

export default function FlipPeaceTagline({
  variant = "default",
  compact = false,
}: FlipPeaceTaglineProps) {
  const top =
    variant === "horizontal"
      ? "max(92px, calc(env(safe-area-inset-top) + 84px))"
      : `calc(${FLIP_BRAND_TOP} + ${FLIP_LOGO_SIZE}px + ${FLIP_LOGO_TAGLINE_GAP}px - ${FLIP_TAGLINE_OFFSET_UP}px)`;

  return (
    <div
      className={`pointer-events-none fixed inset-x-0 z-[60] text-center transition-opacity duration-300 ease-out ${
        compact ? "opacity-0" : "opacity-100"
      }`}
      style={{
        top,
        paddingLeft: variant === "horizontal" ? 24 : FLIP_BRAND_LEFT,
        paddingRight: variant === "horizontal" ? 24 : FLIP_BRAND_LEFT,
      }}
      aria-hidden={compact}
    >
      <p
        className={
          variant === "horizontal"
            ? "m-0 text-[15px] font-bold leading-snug tracking-[-0.02em] text-white"
            : "m-0 text-[18px] font-bold leading-snug tracking-[-0.02em] text-white sm:text-[20px]"
        }
      >
        {TAGLINE_TEXT}
      </p>
      <p
        className={
          variant === "horizontal"
            ? "m-0 mt-1.5 text-[12px] leading-relaxed tracking-[-0.01em] text-white/55"
            : "m-0 mt-2 text-[14px] leading-relaxed tracking-[-0.01em] text-white/55 sm:text-[15px]"
        }
      >
        {HINT_TEXT}
      </p>
    </div>
  );
}
