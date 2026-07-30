/**
 * 방명록(visitor_cards) DB 행 + Storage 이미지 일괄 삭제
 *
 * 사용법 (.env.local에 Supabase 키 설정 후):
 *   node scripts/clear-visitor-cards.mjs
 *
 * service role 키가 있으면 Storage 삭제까지 가능합니다.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

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

const url = readEnv("NEXT_PUBLIC_SUPABASE_URL");
const serviceKey = readEnv("SUPABASE_SERVICE_ROLE_KEY");
const anonKey = readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
const key = serviceKey || anonKey;
const bucket = readEnv("SUPABASE_VISITOR_CARDS_BUCKET") || "visitor-cards";

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or Supabase key in .env.local");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function storagePathFromUrl(storageUrl) {
  const marker = `/storage/v1/object/public/${bucket}/`;
  const idx = storageUrl.indexOf(marker);
  if (idx === -1) return null;
  return storageUrl.slice(idx + marker.length);
}

function resolveStoragePath(row) {
  if (row.storage_path) return row.storage_path;
  return storagePathFromUrl(row.storage_url);
}

async function listAllStoragePaths() {
  const paths = [];

  async function walk(prefix = "") {
    const { data, error } = await supabase.storage.from(bucket).list(prefix, {
      limit: 1000,
      sortBy: { column: "name", order: "asc" },
    });
    if (error) {
      console.warn("storage list warning", prefix || "/", error.message);
      return;
    }
    for (const item of data ?? []) {
      const fullPath = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.id) {
        paths.push(fullPath);
      } else {
        await walk(fullPath);
      }
    }
  }

  await walk();
  return paths;
}

async function main() {
  const { data: rows, error: selectError } = await supabase
    .from("visitor_cards")
    .select("id, storage_path, storage_url");

  if (selectError) {
    console.error("visitor_cards select failed:", selectError.message);
    process.exit(1);
  }

  const cards = rows ?? [];
  console.log(`Found ${cards.length} visitor_cards row(s)`);

  const dbPaths = cards
    .map(resolveStoragePath)
    .filter((p) => typeof p === "string" && p.length > 0);

  if (dbPaths.length > 0) {
    const { error: storageError } = await supabase.storage.from(bucket).remove(dbPaths);
    if (storageError) {
      console.warn("storage remove (from DB paths) warning:", storageError.message);
    } else {
      console.log(`Removed ${dbPaths.length} storage file(s) referenced in DB`);
    }
  }

  if (cards.length > 0) {
    const ids = cards.map((row) => row.id);
    const { error: deleteError } = await supabase.from("visitor_cards").delete().in("id", ids);
    if (deleteError) {
      console.error("visitor_cards delete failed:", deleteError.message);
      process.exit(1);
    }
    console.log(`Deleted ${ids.length} visitor_cards row(s)`);
  }

  const orphanPaths = await listAllStoragePaths();
  if (orphanPaths.length > 0) {
    const { error: orphanError } = await supabase.storage.from(bucket).remove(orphanPaths);
    if (orphanError) {
      console.warn("orphan storage remove warning:", orphanError.message);
    } else {
      console.log(`Removed ${orphanPaths.length} orphan storage file(s)`);
    }
  }

  console.log("Done. Guestbook storage cleared.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
