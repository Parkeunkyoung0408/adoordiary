export interface FlipCardConfig {
  id: number;
  frontPage: number;
  backPage: number;
  frontSrc: string;
  backSrc: string;
  frontWidth: number;
  frontHeight: number;
  frontAspect: number;
  backWidth: number;
  backHeight: number;
}

/** 텍스트 뒷면 원본 (postcard PDF 11x 추출, 모든 카드 동일) */
export const FLIP_BACK_WIDTH = 3119;
export const FLIP_BACK_HEIGHT = 4615;
export const FLIP_CARD_ASPECT = FLIP_BACK_WIDTH / FLIP_BACK_HEIGHT;

/** 확대 카드 기준 텍스트 뒷면 표시 최대 너비 (CSS px) */
export const FLIP_TEXT_DISPLAY_MAX_WIDTH = 480;

/** 레티나에서도 선명: 표시 CSS px × DPR ≤ 원본 픽셀 */
export function getTextCardDisplaySize(devicePixelRatio = 1, containerCssWidth?: number) {
  const dpr = Math.max(devicePixelRatio, 1);
  const sharpMax = Math.floor(FLIP_BACK_WIDTH / dpr);
  const cap = containerCssWidth ?? FLIP_TEXT_DISPLAY_MAX_WIDTH;
  const width = Math.min(Math.round(cap), sharpMax);
  const height = Math.round(width * (FLIP_BACK_HEIGHT / FLIP_BACK_WIDTH));
  return { width, height };
}

/** 260609_postcard PDF 11배 추출 (수정 폴더) */
const CARD_FRONT_WIDTH = 3119;
const CARD_FRONT_HEIGHT = 4615;
const CARD_DIMENSIONS: Array<[number, number]> = Array.from({ length: 16 }, () => [
  CARD_FRONT_WIDTH,
  CARD_FRONT_HEIGHT,
]);

export const flipCardConfigList: FlipCardConfig[] = CARD_DIMENSIONS.map(([frontWidth, frontHeight], index) => {
  const id = index + 1;
  const pad = String(id).padStart(2, "0");

  return {
    id,
    frontPage: id * 2 - 1,
    backPage: id * 2,
    frontSrc: `/assets/flip/cards/card_${pad}_front.jpg`,
    backSrc: `/assets/flip/cards/card_${pad}_back.jpg`,
    frontWidth,
    frontHeight,
    frontAspect: frontWidth / frontHeight,
    backWidth: FLIP_BACK_WIDTH,
    backHeight: FLIP_BACK_HEIGHT,
  };
});
