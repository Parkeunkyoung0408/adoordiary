import { ArtworkConfig } from "./artworkConfig";

const INSTAGRAM_WIDTH = 1080;
const INSTAGRAM_HEIGHT = 1350;

function loadImageFromDataUrl(dataUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image load failed"));
    img.src = dataUrl;
  });
}

function sampleEdgeColor(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const samplePoints = [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1],
    [Math.floor(width / 2), 0],
    [Math.floor(width / 2), height - 1],
  ] as const;

  let r = 0;
  let g = 0;
  let b = 0;

  for (const [x, y] of samplePoints) {
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    r += pixel[0];
    g += pixel[1];
    b += pixel[2];
  }

  const count = samplePoints.length;
  return `rgb(${Math.round(r / count)}, ${Math.round(g / count)}, ${Math.round(b / count)})`;
}

export async function renderMixCardForInstagramFromArtwork(
  previewDataUrl: string,
  config: ArtworkConfig
) {
  const cardImage = await loadImageFromDataUrl(previewDataUrl);
  const cardW = cardImage.naturalWidth || cardImage.width;
  const cardH = cardImage.naturalHeight || cardImage.height;

  const canvas = document.createElement("canvas");
  canvas.width = INSTAGRAM_WIDTH;
  canvas.height = INSTAGRAM_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  let bgColor = config.instagram_bg_color;
  if (!bgColor) {
    const temp = document.createElement("canvas");
    temp.width = cardW;
    temp.height = cardH;
    const tempCtx = temp.getContext("2d");
    if (!tempCtx) throw new Error("Canvas not supported");
    tempCtx.drawImage(cardImage, 0, 0);
    bgColor = sampleEdgeColor(tempCtx, cardW, cardH);
  }

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, INSTAGRAM_WIDTH, INSTAGRAM_HEIGHT);

  const scale = Math.min(INSTAGRAM_WIDTH / cardW, INSTAGRAM_HEIGHT / cardH);
  const drawW = cardW * scale;
  const drawH = cardH * scale;
  const drawX = (INSTAGRAM_WIDTH - drawW) / 2;
  const drawY = (INSTAGRAM_HEIGHT - drawH) / 2;

  ctx.drawImage(cardImage, drawX, drawY, drawW, drawH);

  return canvas.toDataURL("image/png");
}
