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

/** 텍스트 뒷면 원본 (PDF 7x 추출, 모든 카드 동일) */
export const FLIP_BACK_WIDTH = 1171;
export const FLIP_BACK_HEIGHT = 1766;
export const FLIP_CARD_ASPECT = FLIP_BACK_WIDTH / FLIP_BACK_HEIGHT;

/** 확대 시 텍스트 카드 최대 너비 (CSS px) */
export const FLIP_TEXT_DISPLAY_MAX_WIDTH = 340;

/** 레티나에서도 선명: 표시 CSS px × DPR ≤ 원본 픽셀 */
export function getTextCardDisplaySize(devicePixelRatio = 1) {
  const dpr = Math.max(devicePixelRatio, 1);
  const sharpMax = Math.floor(FLIP_BACK_WIDTH / dpr);
  const width = Math.min(FLIP_TEXT_DISPLAY_MAX_WIDTH, sharpMax);
  const height = Math.round(width * (FLIP_BACK_HEIGHT / FLIP_BACK_WIDTH));
  return { width, height };
}

const CARD_DIMENSIONS: Array<[number, number]> = [
  [3050, 4601],
  [1545, 2331],
  [1534, 2313],
  [2249, 3392],
  [1424, 2148],
  [1613, 2432],
  [3257, 4913],
  [1705, 2572],
  [1436, 2166],
  [1903, 2870],
  [2052, 3094],
  [2028, 3059],
  [2135, 3221],
  [2140, 3228],
  [1320, 1991],
  [1696, 2558],
];

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
