import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const IMAGE_TYPES = {
  "image/png": {
    prefix: "data:image/png;base64,",
    extension: "png",
  },
  "image/webp": {
    prefix: "data:image/webp;base64,",
    extension: "webp",
  },
} as const;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const BUCKET_NAME = process.env.SUPABASE_VISITOR_CARDS_BUCKET ?? "visitor-cards";

interface VisitorCardRecord {
  card_id: string;
  user_text: string;
  artwork_id: number;
  storage_url: string;
  created_at: string;
}

interface VisitorCardRow {
  id: string;
  user_text: string;
  artwork_id: number;
  storage_path?: string;
  storage_url: string;
  created_at: string;
}

function storagePathFromUrl(storageUrl: string) {
  const marker = `/storage/v1/object/public/${BUCKET_NAME}/`;
  const index = storageUrl.indexOf(marker);
  if (index === -1) return null;
  return storageUrl.slice(index + marker.length);
}

function resolveStoragePath(row: Pick<VisitorCardRow, "storage_path" | "storage_url">) {
  if (row.storage_path) return row.storage_path;
  return storagePathFromUrl(row.storage_url);
}

function isAuthorizedClearRequest(request: Request) {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return false;
  const token = auth.slice(7);
  const allowed = [
    process.env.VISITOR_CARDS_ADMIN_SECRET,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  ].filter(Boolean);
  return allowed.includes(token);
}

async function listAllStoragePaths(
  supabase: NonNullable<ReturnType<typeof createSupabaseServerClient>>
) {
  const paths: string[] = [];

  async function walk(prefix = "") {
    const { data, error } = await supabase.storage.from(BUCKET_NAME).list(prefix, {
      limit: 1000,
      sortBy: { column: "name", order: "asc" },
    });
    if (error) return;

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

function toRecord(row: VisitorCardRow): VisitorCardRecord {
  return {
    card_id: row.id,
    user_text: row.user_text,
    artwork_id: row.artwork_id,
    storage_url: row.storage_url,
    created_at: row.created_at,
  };
}

function parseImageDataUrl(imageDataUrl: string) {
  const imageType = Object.entries(IMAGE_TYPES).find(([, config]) =>
    imageDataUrl.startsWith(config.prefix)
  );
  if (!imageType) return null;

  const [contentType, config] = imageType;
  const base64 = imageDataUrl.slice(config.prefix.length);
  if (!base64 || !/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) return null;

  const buffer = Buffer.from(base64, "base64");
  if (buffer.length === 0 || buffer.length > MAX_IMAGE_BYTES) return null;

  return {
    buffer,
    contentType,
    extension: config.extension,
  };
}

function isValidUserText(value: string) {
  return /^[\p{L}\p{N}]{4}$/u.test(value);
}

function getTodayPath() {
  return new Date().toISOString().slice(0, 10);
}

async function uploadVisitorCardImage(
  supabase: NonNullable<ReturnType<typeof createSupabaseServerClient>>,
  storagePath: string,
  image: NonNullable<ReturnType<typeof parseImageDataUrl>>
) {
  const uploadOptions = {
    contentType: image.contentType,
    cacheControl: "31536000",
    upsert: false,
  };

  const uploadResult = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storagePath, image.buffer, uploadOptions);

  const statusCode = uploadResult.error
    ? "statusCode" in uploadResult.error
      ? uploadResult.error.statusCode
      : undefined
    : undefined;

  if (String(statusCode) !== "404") {
    return uploadResult;
  }

  const { error: bucketError } = await supabase.storage.createBucket(BUCKET_NAME, {
    public: true,
  });

  if (bucketError && !/already exists/i.test(bucketError.message)) {
    return uploadResult;
  }

  return supabase.storage.from(BUCKET_NAME).upload(storagePath, image.buffer, uploadOptions);
}

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

function getSupabaseOrError() {
  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return {
      supabase: null,
      response: jsonError("Supabase is not configured", 503),
    };
  }
  return { supabase, response: null };
}

export async function POST(request: Request) {
  try {
    const { supabase, response } = getSupabaseOrError();
    if (!supabase) return response;

    const body = await request.json();
    const user_text = String(body.user_text ?? "").trim();
    const artwork_id = Number(body.artwork_id);
    const imageDataUrl = String(body.imageDataUrl ?? "");
    const image = parseImageDataUrl(imageDataUrl);

    if (!isValidUserText(user_text)) {
      return jsonError("Invalid user_text", 400);
    }
    if (!Number.isInteger(artwork_id) || artwork_id < 1 || artwork_id > 20) {
      return jsonError("Invalid artwork_id", 400);
    }
    if (!image) {
      return jsonError("Invalid image", 400);
    }

    const storagePath = `${getTodayPath()}/${crypto.randomUUID()}.${image.extension}`;
    const { error: uploadError } = await uploadVisitorCardImage(supabase, storagePath, image);

    if (uploadError) {
      console.error("visitor-cards upload error", uploadError);
      return jsonError("Image upload failed", 500);
    }

    const { data: publicUrlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(storagePath);
    const { data, error: insertError } = await supabase
      .from("visitor_cards")
      .insert({
        user_text,
        artwork_id,
        storage_path: storagePath,
        storage_url: publicUrlData.publicUrl,
      })
      .select("id,user_text,artwork_id,storage_url,created_at")
      .single<VisitorCardRow>();

    if (insertError || !data) {
      console.error("visitor-cards insert error", insertError);
      await supabase.storage.from(BUCKET_NAME).remove([storagePath]);
      return jsonError("Card save failed", 500);
    }

    return NextResponse.json({ ok: true, card: toRecord(data) });
  } catch (error) {
    console.error("visitor-cards POST error", error);
    return jsonError("Internal error", 500);
  }
}

export async function DELETE(request: Request) {
  try {
    if (!isAuthorizedClearRequest(request)) {
      return jsonError("Unauthorized", 401);
    }

    const { supabase, response } = getSupabaseOrError();
    if (!supabase) return response;

    const { data: rows, error: selectError } = await supabase
      .from("visitor_cards")
      .select("id, storage_path, storage_url")
      .returns<Pick<VisitorCardRow, "id" | "storage_path" | "storage_url">[]>();

    if (selectError) {
      console.error("visitor-cards DELETE select error", selectError);
      return jsonError("Card list failed", 500);
    }

    const cards = rows ?? [];
    const storagePaths = cards
      .map(resolveStoragePath)
      .filter((path): path is string => typeof path === "string" && path.length > 0);

    let removedStorageCount = 0;
    if (storagePaths.length > 0) {
      const { error: storageError } = await supabase.storage.from(BUCKET_NAME).remove(storagePaths);
      if (storageError) {
        console.error("visitor-cards DELETE storage error", storageError);
        return jsonError("Storage delete failed", 500);
      }
      removedStorageCount = storagePaths.length;
    }

    if (cards.length > 0) {
      const ids = cards.map((card) => card.id);
      const { error: deleteError } = await supabase.from("visitor_cards").delete().in("id", ids);
      if (deleteError) {
        console.error("visitor-cards DELETE rows error", deleteError);
        return jsonError("Card delete failed", 500);
      }
    }

    const orphanPaths = await listAllStoragePaths(supabase);
    let removedOrphanCount = 0;
    if (orphanPaths.length > 0) {
      const { error: orphanError } = await supabase.storage.from(BUCKET_NAME).remove(orphanPaths);
      if (orphanError) {
        console.error("visitor-cards DELETE orphan storage error", orphanError);
        return jsonError("Orphan storage delete failed", 500);
      }
      removedOrphanCount = orphanPaths.length;
    }

    return NextResponse.json({
      ok: true,
      deleted_rows: cards.length,
      removed_storage_files: removedStorageCount,
      removed_orphan_files: removedOrphanCount,
    });
  } catch (error) {
    console.error("visitor-cards DELETE error", error);
    return jsonError("Internal error", 500);
  }
}

export async function GET() {
  try {
    const { supabase, response } = getSupabaseOrError();
    if (!supabase) return response;

    const { data, error } = await supabase
      .from("visitor_cards")
      .select("id,user_text,artwork_id,storage_url,created_at")
      .order("created_at", { ascending: false })
      .limit(200)
      .returns<VisitorCardRow[]>();

    if (error) {
      console.error("visitor-cards GET error", error);
      return jsonError("Card list failed", 500);
    }

    return NextResponse.json({ cards: (data ?? []).map(toRecord) });
  } catch (error) {
    console.error("visitor-cards GET error", error);
    return jsonError("Internal error", 500);
  }
}
