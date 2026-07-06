import {
  ArtworkConfig,
  BASE_FONT_SIZE,
  getArtworkConfig,
  getCanvasSize,
  getCoverCrop,
  getArtworkAssetUrl,
  mapImagePointToCanvas,
  TextAlign,
  TextSlot,
} from "./artworkConfig";

const MIX_ARTWORK_FONT_FAMILY = "Ria, sans-serif";
const MIX_ARTWORK_FONT_WEIGHT = "normal";
const MIX_ARTWORK_FONT_URL =
  "https://cdn.jsdelivr.net/gh/projectnoonnu/2410-1@1.0/RiaSans-ExtraBold.woff2";

let mixArtworkFontReady: Promise<void> | null = null;

async function ensureMixArtworkFont() {
  if (typeof document === "undefined") return;

  if (!mixArtworkFontReady) {
    mixArtworkFontReady = (async () => {
      if (!document.fonts) return;

      const alreadyLoaded = [...document.fonts].some((face) => face.family === "Ria");
      if (alreadyLoaded) return;

      try {
        const face = new FontFace("Ria", `url(${MIX_ARTWORK_FONT_URL})`, {
          weight: "normal",
          style: "normal",
        });
        const loaded = await face.load();
        document.fonts.add(loaded);
      } catch {
        // @font-face in globals.css is the fallback loader.
      }
    })();
  }

  await mixArtworkFontReady;
}

async function waitForFont(fontSize: number) {
  if (typeof document === "undefined" || !document.fonts) return;

  await ensureMixArtworkFont();
  await document.fonts
    .load(`${MIX_ARTWORK_FONT_WEIGHT} ${fontSize}px ${MIX_ARTWORK_FONT_FAMILY}`)
    .catch(() => undefined);
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
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
  fontSize: number,
  stroke?: { color: string; widthPx: number }
) {
  ctx.font = `${MIX_ARTWORK_FONT_WEIGHT} ${fontSize}px ${MIX_ARTWORK_FONT_FAMILY}`;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";

  if (stroke) {
    ctx.lineJoin = "round";
    ctx.miterLimit = 2;
    ctx.lineWidth = stroke.widthPx;
    ctx.strokeStyle = stroke.color;
    ctx.strokeText(segment, textX, textY);
  }

  ctx.fillStyle = color;
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

  ctx.font = `${MIX_ARTWORK_FONT_WEIGHT} ${fontSize}px ${MIX_ARTWORK_FONT_FAMILY}`;
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
  crop: ReturnType<typeof getCoverCrop>,
  canvasW: number,
  canvasH: number
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
    canvasW,
    canvasH
  );

  drawHorizontalText(ctx, segment, x, y, slot.align, color, fontSize);
}

function resolveTextYNorm(config: ArtworkConfig) {
  if (config.text_center_y_px != null) {
    return config.text_center_y_px / config.native_height;
  }
  return config.text_position?.y_norm ?? 0.5;
}

function resolveHorizontalTextPosition(
  config: ArtworkConfig,
  imgW: number,
  imgH: number,
  crop: ReturnType<typeof getCoverCrop>,
  canvasW: number,
  canvasH: number,
  fontSize: number
) {
  const imageToCanvasScale = canvasH / config.native_height;
  const offsetY = (config.text_offset_y ?? 0) * imageToCanvasScale;
  const xNorm = config.text_position?.x_norm ?? 0.5;
  const align = config.text_position?.align ?? "center";

  if (
    config.text_center_y_px == null &&
    config.text_gap_above_anchor_px != null &&
    config.text_anchor_y_norm != null
  ) {
    const gapPx = config.text_gap_above_anchor_px * imageToCanvasScale;
    const anchorTop = mapImagePointToCanvas(
      xNorm,
      config.text_anchor_y_norm,
      imgW,
      imgH,
      crop,
      canvasW,
      canvasH
    );
    return {
      x: anchorTop.x,
      y: anchorTop.y - gapPx - fontSize / 2 + offsetY,
      align,
    };
  }

  const mapped = mapImagePointToCanvas(
    xNorm,
    resolveTextYNorm(config),
    imgW,
    imgH,
    crop,
    canvasW,
    canvasH
  );
  return { x: mapped.x, y: mapped.y + offsetY, align };
}

export async function renderMixCard(artworkId: number, text: string) {
  const config = getArtworkConfig(artworkId);
  if (!config) throw new Error(`Unknown artwork_id: ${artworkId}`);
  const maxFontSize = Math.round(
    BASE_FONT_SIZE *
      Math.max(
        config.font_scale ?? 1,
        ...(config.text_slots?.map((s) => s.font_scale ?? config.font_scale ?? 1) ?? [1])
      )
  );
  await waitForFont(maxFontSize);

  const { width: canvasW, height: canvasH } = getCanvasSize(config);

  const canvas = document.createElement("canvas");
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  const backgroundImage = await loadImage(getArtworkAssetUrl(config.filename));
  const { imgW, imgH, crop } = drawImageCover(ctx, backgroundImage, canvasW, canvasH);

  const layout = config.layout ?? "single";

  if (layout === "split-corners" && config.text_slots) {
    for (const slot of config.text_slots) {
      renderTextSlot(ctx, text, slot, config, imgW, imgH, crop, canvasW, canvasH);
    }
  } else if (layout === "vertical" && config.text_position) {
    const fontSize = Math.round(BASE_FONT_SIZE * (config.font_scale ?? 1));
    const { x, y } = mapImagePointToCanvas(
      config.text_position.x_norm,
      resolveTextYNorm(config),
      imgW,
      imgH,
      crop,
      canvasW,
      canvasH
    );
    drawVerticalText(ctx, text, x, y + (config.text_offset_y ?? 0) * (canvasH / config.native_height), config.text_position.align, config.theme_color, fontSize);
  } else if (config.text_position) {
    const fontSize = Math.round(BASE_FONT_SIZE * (config.font_scale ?? 1));
    const { x, y, align } = resolveHorizontalTextPosition(
      config,
      imgW,
      imgH,
      crop,
      canvasW,
      canvasH,
      fontSize
    );

    const strokeWidthPx =
      config.text_stroke_width_px != null
        ? config.text_stroke_width_px * (canvasH / config.native_height)
        : undefined;
    const stroke =
      config.text_stroke_color && strokeWidthPx
        ? { color: config.text_stroke_color, widthPx: strokeWidthPx }
        : undefined;

    drawHorizontalText(
      ctx,
      text,
      x,
      y,
      align,
      config.theme_color,
      fontSize,
      stroke
    );
  }

  return canvas.toDataURL("image/png");
}
