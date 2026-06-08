import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ffmpegPath from "ffmpeg-static";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const src = path.join(root, "0608.mp4");
const outDir = path.join(root, "public", "assets", "mix");
const out = path.join(outDir, "mix-loading-fast.mp4");

fs.mkdirSync(outDir, { recursive: true });

function run(args) {
  const result = spawnSync(ffmpegPath, args, { encoding: "utf8" });
  if (result.status !== 0) {
    console.error(result.stderr);
    process.exit(result.status ?? 1);
  }
  return result.stdout;
}

console.log("Remuxing 0608.mp4 with faststart...");
run(["-y", "-i", src, "-c", "copy", "-movflags", "+faststart", out]);

console.log("Done:", out);
