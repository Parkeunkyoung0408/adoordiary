import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ffmpegPath from "ffmpeg-static";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const src = path.join(root, "magnific_1b5a3c_74FCIkAJAL.mp4");
const outDir = path.join(root, "public", "assets", "mix");
const out = path.join(outDir, "mix-loading-fast.mp4");

fs.mkdirSync(outDir, { recursive: true });

function run(args) {
  const result = spawnSync(ffmpegPath, args, { encoding: "utf8" });
  if (result.status !== 0) {
    console.error(result.stderr);
    process.exit(result.status ?? 1);
  }
}

console.log("Encoding mix-loading-fast.mp4 from magnific_1b5a3c_74FCIkAJAL.mp4...");
run([
  "-y",
  "-i",
  src,
  "-vf",
  "scale=400:400:flags=lanczos",
  "-c:v",
  "libx264",
  "-preset",
  "slow",
  "-crf",
  "24",
  "-pix_fmt",
  "yuv420p",
  "-an",
  "-movflags",
  "+faststart",
  out,
]);

const videoSize = fs.statSync(out).size;
console.log(`Done: ${out} (${(videoSize / 1024).toFixed(1)} KB)`);
