# Vercel에 Supabase 환경 변수 등록
#
# 사용법 (.env.local 에 키를 넣은 뒤):
#   node scripts/push-supabase-env-to-vercel.mjs
#
# 또는 직접:
#   vercel env add NEXT_PUBLIC_SUPABASE_URL production
#   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const envPath = path.join(root, ".env.local");

function readEnv(name) {
  if (!fs.existsSync(envPath)) return process.env[name] ?? "";
  const line = fs
    .readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .find((row) => row.startsWith(`${name}=`));
  if (!line) return process.env[name] ?? "";
  return line.slice(name.length + 1).trim().replace(/^["']|["']$/g, "");
}

function addEnv(name, value) {
  console.log(`Adding ${name} to Vercel (production, preview, development)...`);
  for (const target of ["production", "preview", "development"]) {
    const result = spawnSync(
      "vercel",
      ["env", "add", name, target, "--force"],
      { input: value, encoding: "utf8" },
    );
    if (result.status !== 0) {
      console.error(result.stderr || result.stdout);
      process.exit(result.status ?? 1);
    }
  }
}

const url = readEnv("NEXT_PUBLIC_SUPABASE_URL");
const key = readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local");
  process.exit(1);
}

addEnv("NEXT_PUBLIC_SUPABASE_URL", url);
addEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", key);
console.log("Done. Run: vercel deploy --prod");
