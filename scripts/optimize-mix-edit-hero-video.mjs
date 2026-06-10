import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ffmpegPath from "ffmpeg-static";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const src = path.join(root, "magnific_l7fmTNJgv9.mp4");
const outDir = path.join(root, "public", "assets", "mix");
const outVideo = path.join(outDir, "mix-edit-hero.mp4");
const outPoster = path.join(outDir, "mix-edit-hero-poster.webp");

fs.mkdirSync(outDir, { recursive: true });

function run(args) {
  const result = spawnSync(ffmpegPath, args, { encoding: "utf8" });
  if (result.status !== 0) {
    console.error(result.stderr);
    process.exit(result.status ?? 1);
  }
}

console.log("Encoding mix-edit-hero.mp4 (320px, faststart)...");
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
  outVideo,
]);

console.log("Extracting poster frame...");
run(["-y", "-i", src, "-frames:v", "1", "-vf", "scale=400:400", "-c:v", "libwebp", "-quality", "82", outPoster]);

const videoSize = fs.statSync(outVideo).size;
const posterSize = fs.statSync(outPoster).size;
console.log(`Done: ${outVideo} (${(videoSize / 1024).toFixed(1)} KB)`);
console.log(`Done: ${outPoster} (${(posterSize / 1024).toFixed(1)} KB)`);
