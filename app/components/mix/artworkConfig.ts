export type TextAlign = "left" | "center" | "right";
export type TextLayout = "single" | "vertical" | "split-corners";

export interface TextPosition {
  x_norm: number;
  y_norm: number;
  align: TextAlign;
}

export interface TextSlot {
  x_norm: number;
  y_norm: number;
  align: TextAlign;
  char_start: number;
  char_end: number;
  theme_color?: string;
  font_scale?: number;
}

export interface ArtworkConfig {
  artwork_id: number;
  filename: string;
  reference_page: string;
  native_width: number;
  native_height: number;
  theme_color: string;
  layout?: TextLayout;
  text_position?: TextPosition;
  text_slots?: TextSlot[];
  font_scale?: number;
}

export const CANVAS_WIDTH = 2160;
export const CANVAS_HEIGHT = 3840;
export const BASE_FONT_SIZE = 480;

/** Page_05(몹시겁시) 참고 — 상단 중앙 통일 위치 */
const MIX_TEXT_POSITION: TextPosition = { x_norm: 0.5, y_norm: 0.175, align: "center" };

/** Page_01(다드루와) 참고 — 1번 하단 중앙 */
const ARTWORK_01_TEXT_POSITION: TextPosition = { x_norm: 0.5, y_norm: 0.86, align: "center" };

/** Page_25(과분화분) 참고 — 13번 하단 중앙 */
const ARTWORK_13_TEXT_POSITION: TextPosition = { x_norm: 0.5, y_norm: 0.85, align: "center" };

export const artworkConfigList: ArtworkConfig[] = [
  {
    artwork_id: 1,
    filename: "artwork_01.jpg",
    reference_page: "Page_01",
    native_width: 3050,
    native_height: 4601,
    theme_color: "#FACC15",
    text_position: ARTWORK_01_TEXT_POSITION,
  },
  {
    artwork_id: 2,
    filename: "artwork_02.jpg",
    reference_page: "Page_03",
    native_width: 1545,
    native_height: 2331,
    theme_color: "#175138",
    text_position: MIX_TEXT_POSITION,
  },
  {
    artwork_id: 3,
    filename: "artwork_03.jpg",
    reference_page: "Page_05",
    native_width: 1534,
    native_height: 2313,
    theme_color: "#EF4444",
    text_position: MIX_TEXT_POSITION,
  },
  {
    artwork_id: 4,
    filename: "artwork_04.jpg",
    reference_page: "Page_07",
    native_width: 2249,
    native_height: 3392,
    theme_color: "#FFC107",
    text_position: MIX_TEXT_POSITION,
  },
  {
    artwork_id: 5,
    filename: "artwork_05.jpg",
    reference_page: "Page_09",
    native_width: 1424,
    native_height: 2148,
    theme_color: "#22C55E",
    text_position: MIX_TEXT_POSITION,
  },
  {
    artwork_id: 6,
    filename: "artwork_06.jpg",
    reference_page: "Page_11",
    native_width: 1613,
    native_height: 2432,
    theme_color: "#FF4500",
    text_position: MIX_TEXT_POSITION,
  },
  {
    artwork_id: 7,
    filename: "artwork_07.jpg",
    reference_page: "Page_13",
    native_width: 3257,
    native_height: 4913,
    theme_color: "#5D3A2C",
    text_position: MIX_TEXT_POSITION,
  },
  {
    artwork_id: 8,
    filename: "artwork_08.jpg",
    reference_page: "Page_15",
    native_width: 1705,
    native_height: 2572,
    theme_color: "#66B35C",
    text_position: MIX_TEXT_POSITION,
  },
  {
    artwork_id: 9,
    filename: "artwork_09.jpg",
    reference_page: "Page_17",
    native_width: 1436,
    native_height: 2166,
    theme_color: "#2DD4BF",
    text_position: MIX_TEXT_POSITION,
  },
  {
    artwork_id: 10,
    filename: "artwork_10.jpg",
    reference_page: "Page_19",
    native_width: 1903,
    native_height: 2870,
    theme_color: "#FFFFFF",
    text_position: MIX_TEXT_POSITION,
  },
  {
    artwork_id: 11,
    filename: "artwork_11.jpg",
    reference_page: "Page_21",
    native_width: 2052,
    native_height: 3094,
    theme_color: "#EF4444",
    text_position: MIX_TEXT_POSITION,
  },
  {
    artwork_id: 12,
    filename: "artwork_12.jpg",
    reference_page: "Page_23",
    native_width: 2028,
    native_height: 3059,
    theme_color: "#FFFFFF",
    text_position: MIX_TEXT_POSITION,
  },
  {
    artwork_id: 13,
    filename: "artwork_13.jpg",
    reference_page: "Page_25",
    native_width: 2135,
    native_height: 3221,
    theme_color: "#FFFFFF",
    text_position: ARTWORK_13_TEXT_POSITION,
  },
  {
    artwork_id: 14,
    filename: "artwork_14.jpg",
    reference_page: "Page_27",
    native_width: 2140,
    native_height: 3228,
    theme_color: "#22C55E",
    text_position: MIX_TEXT_POSITION,
  },
  {
    artwork_id: 15,
    filename: "artwork_15.jpg",
    reference_page: "Page_29",
    native_width: 1320,
    native_height: 1991,
    theme_color: "#EC4899",
    text_position: MIX_TEXT_POSITION,
  },
  {
    artwork_id: 16,
    filename: "artwork_16.jpg",
    reference_page: "Page_31",
    native_width: 1696,
    native_height: 2558,
    theme_color: "#FACC15",
    text_position: MIX_TEXT_POSITION,
  },
];

export function getArtworkConfig(id: number) {
  return artworkConfigList.find((item) => item.artwork_id === id);
}

export interface CoverCrop {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

export function getCoverCrop(imgW: number, imgH: number, canvasW: number, canvasH: number): CoverCrop {
  const imageRatio = imgW / imgH;
  const canvasRatio = canvasW / canvasH;

  if (imageRatio > canvasRatio) {
    const sh = imgH;
    const sw = imgH * canvasRatio;
    return { sx: (imgW - sw) / 2, sy: 0, sw, sh };
  }

  const sw = imgW;
  const sh = imgW / canvasRatio;
  return { sx: 0, sy: (imgH - sh) / 2, sw, sh };
}

export function mapImagePointToCanvas(
  xNorm: number,
  yNorm: number,
  imgW: number,
  imgH: number,
  crop: CoverCrop,
  canvasW: number,
  canvasH: number
) {
  const imageX = xNorm * imgW;
  const imageY = yNorm * imgH;
  return {
    x: ((imageX - crop.sx) / crop.sw) * canvasW,
    y: ((imageY - crop.sy) / crop.sh) * canvasH,
  };
}
