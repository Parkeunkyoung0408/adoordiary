import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const source = path.join(root, "4word.ini");
const out = path.join(root, "supabase", "roulette_words.seed.sql");

const lines = fs.readFileSync(source, "utf8").split(/\r?\n/);
const words = [];

for (const line of lines) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("###")) continue;
  if ([...trimmed].length === 4) words.push(trimmed);
}

const uniqueWords = [...new Set(words)];

const values = uniqueWords
  .map((word) => `  ('${word.replace(/'/g, "''")}')`)
  .join(",\n");

const sql = `-- Auto-generated from 4word.ini (${uniqueWords.length} words)
INSERT INTO public.roulette_words (word)
VALUES
${values}
ON CONFLICT (word) DO NOTHING;
`;

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, sql, "utf8");
console.log(`Wrote ${uniqueWords.length} words to ${out}`);
