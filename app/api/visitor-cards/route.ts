import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "visitor_cards.json");

interface VisitorCardRecord {
  card_id: string;
  user_text: string;
  artwork_id: number;
  storage_url: string | null;
  created_at: string;
}

async function ensureDataFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, "[]", "utf-8");
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const user_text = String(body.user_text ?? "").trim();
    const artwork_id = Number(body.artwork_id);
    const imageDataUrl = String(body.imageDataUrl ?? "");

    if (!/^[a-zA-Z0-9가-힣ㄱ-ㅎㅏ-ㅣ]{4}$/.test(user_text)) {
      return NextResponse.json({ error: "Invalid user_text" }, { status: 400 });
    }
    if (!Number.isInteger(artwork_id) || artwork_id < 1 || artwork_id > 16) {
      return NextResponse.json({ error: "Invalid artwork_id" }, { status: 400 });
    }
    if (!imageDataUrl.startsWith("data:image/png;base64,")) {
      return NextResponse.json({ error: "Invalid image" }, { status: 400 });
    }

    await ensureDataFile();

    let storage_url: string | null = null;
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "visitor-cards");
    await fs.mkdir(uploadsDir, { recursive: true });

    const filename = `${Date.now()}_${user_text}_${artwork_id}.png`;
    const filePath = path.join(uploadsDir, filename);
    const base64 = imageDataUrl.replace(/^data:image\/png;base64,/, "");
    await fs.writeFile(filePath, Buffer.from(base64, "base64"));
    storage_url = `/uploads/visitor-cards/${filename}`;

    const record: VisitorCardRecord = {
      card_id: crypto.randomUUID(),
      user_text,
      artwork_id,
      storage_url,
      created_at: new Date().toISOString(),
    };

    const raw = await fs.readFile(DATA_FILE, "utf-8");
    const list: VisitorCardRecord[] = JSON.parse(raw);
    list.unshift(record);
    await fs.writeFile(DATA_FILE, JSON.stringify(list, null, 2), "utf-8");

    return NextResponse.json({ ok: true, card: record });
  } catch (error) {
    console.error("visitor-cards POST error", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    await ensureDataFile();
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    const list = JSON.parse(raw);
    return NextResponse.json({ cards: list });
  } catch {
    return NextResponse.json({ cards: [] });
  }
}
