/**
 * 플립 휠용 앞면 WebP 썸네일 생성
 * - 입력: public/assets/flip/cards/card_XX_front.jpg
 * - 출력: public/assets/flip/cards/wheel/card_XX_front.webp
 *
 * 휠 표시폭 ~230px × DPR2 ≈ 460 → 480px 폭으로 생성
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const CARDS_DIR = path.join(ROOT, "public", "assets", "flip", "cards");
const WHEEL_DIR = path.join(CARDS_DIR, "wheel");

const WHEEL_WIDTH = 480;
const WEBP_QUALITY = 78;
const CARD_COUNT = 16;

async function fileSizeMb(filePath) {
  const stat = await fs.stat(filePath);
  return (stat.size / (1024 * 1024)).toFixed(2);
}

async function main() {
  await fs.mkdir(WHEEL_DIR, { recursive: true });

  let srcTotal = 0;
  let outTotal = 0;

  for (let id = 1; id <= CARD_COUNT; id += 1) {
    const pad = String(id).padStart(2, "0");
    const src = path.join(CARDS_DIR, `card_${pad}_front.jpg`);
    const out = path.join(WHEEL_DIR, `card_${pad}_front.webp`);

    await fs.access(src);
    const srcStat = await fs.stat(src);
    srcTotal += srcStat.size;

    await sharp(src)
      .rotate()
      .resize({
        width: WHEEL_WIDTH,
        withoutEnlargement: true,
        fit: "inside",
      })
      .webp({ quality: WEBP_QUALITY, effort: 4 })
      .toFile(out);

    const outStat = await fs.stat(out);
    outTotal += outStat.size;
    console.log(
      `card_${pad}_front: ${(srcStat.size / 1024 / 1024).toFixed(2)}MB → ${(outStat.size / 1024).toFixed(0)}KB`
    );
  }

  console.log(
    `\nDone. Fronts ${CARD_COUNT}: ${(srcTotal / 1024 / 1024).toFixed(1)}MB → ${(outTotal / 1024 / 1024).toFixed(2)}MB wheel WebP`
  );
  console.log(`Output: ${WHEEL_DIR}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
