import {
  ArtworkConfig,
  BASE_FONT_SIZE,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  getCoverCrop,
  mapImagePointToCanvas,
  TextAlign,
  TextSlot,
} from "./artworkConfig";

const FONT_FAMILY = "'Jua', 'Pretendard Variable', Pretendard, sans-serif";

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function waitForFont(fontSize: number) {
  if (typeof document === "undefined" || !document.fonts) return Promise.resolve();
  return document.fonts.load(`bold ${fontSize}px ${FONT_FAMILY}`).catch(() => undefined);
}

function drawImageCover(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  canvasW: number,
  canvasH: number
) {
  const imgW = image.naturalWidth || image.width;
  const imgH = image.naturalHeight || image.height;
  const crop = getCoverCrop(imgW, imgH, canvasW, canvasH);
  ctx.drawImage(image, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, canvasW, canvasH);
  return { imgW, imgH, crop };
}

function drawHorizontalText(
  ctx: CanvasRenderingContext2D,
  segment: string,
  textX: number,
  textY: number,
  align: TextAlign,
  color: string,
  fontSize: number
) {
  ctx.font = `bold ${fontSize}px ${FONT_FAMILY}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.fillText(segment, textX, textY);
}

function drawVerticalText(
  ctx: CanvasRenderingContext2D,
  segment: string,
  textX: number,
  textY: number,
  align: TextAlign,
  color: string,
  fontSize: number
) {
  const lineHeight = fontSize * 1.08;

  ctx.font = `bold ${fontSize}px ${FONT_FAMILY}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";

  segment.split("").forEach((char, index) => {
    const charY = textY + index * lineHeight + fontSize / 2;
    ctx.fillText(char, textX, charY);
  });
}

function renderTextSlot(
  ctx: CanvasRenderingContext2D,
  text: string,
  slot: TextSlot,
  config: ArtworkConfig,
  imgW: number,
  imgH: number,
  crop: ReturnType<typeof getCoverCrop>
) {
  const segment = text.slice(slot.char_start, slot.char_end);
  if (!segment) return;

  const fontScale = slot.font_scale ?? config.font_scale ?? 1;
  const fontSize = Math.round(BASE_FONT_SIZE * fontScale);
  const color = slot.theme_color ?? config.theme_color;

  const { x, y } = mapImagePointToCanvas(
    slot.x_norm,
    slot.y_norm,
    imgW,
    imgH,
    crop,
    CANVAS_WIDTH,
    CANVAS_HEIGHT
  );

  drawHorizontalText(ctx, segment, x, y, slot.align, color, fontSize);
}

export async function renderMixCard(config: ArtworkConfig, text: string) {
  const maxFontSize = Math.round(
    BASE_FONT_SIZE *
      Math.max(
        config.font_scale ?? 1,
        ...(config.text_slots?.map((s) => s.font_scale ?? config.font_scale ?? 1) ?? [1])
      )
  );
  await waitForFont(maxFontSize);

  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  const backgroundImage = await loadImage(`/assets/artworks/${config.filename}`);
  const { imgW, imgH, crop } = drawImageCover(ctx, backgroundImage, CANVAS_WIDTH, CANVAS_HEIGHT);

  const layout = config.layout ?? "single";

  if (layout === "split-corners" && config.text_slots) {
    for (const slot of config.text_slots) {
      renderTextSlot(ctx, text, slot, config, imgW, imgH, crop);
    }
  } else if (layout === "vertical" && config.text_position) {
    const fontSize = Math.round(BASE_FONT_SIZE * (config.font_scale ?? 1));
    const { x, y } = mapImagePointToCanvas(
      config.text_position.x_norm,
      config.text_position.y_norm,
      imgW,
      imgH,
      crop,
      CANVAS_WIDTH,
      CANVAS_HEIGHT
    );
    drawVerticalText(ctx, text, x, y, config.text_position.align, config.theme_color, fontSize);
  } else if (config.text_position) {
    const fontSize = Math.round(BASE_FONT_SIZE * (config.font_scale ?? 1));
    const { x, y } = mapImagePointToCanvas(
      config.text_position.x_norm,
      config.text_position.y_norm,
      imgW,
      imgH,
      crop,
      CANVAS_WIDTH,
      CANVAS_HEIGHT
    );
    drawHorizontalText(ctx, text, x, y, config.text_position.align, config.theme_color, fontSize);
  }

  return canvas.toDataURL("image/png");
}
