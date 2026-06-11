import { NextResponse } from "next/server";
import staticWords from "@/data/roulette-words.json";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createSupabaseServerClient();

  if (supabase) {
    const { data, error } = await supabase
      .from("roulette_words")
      .select("word")
      .eq("is_active", true)
      .order("id", { ascending: true });

    if (!error && data && data.length > 0) {
      const words = data.map((row) => String(row.word).trim()).filter(Boolean);
      return NextResponse.json(
        { source: "supabase", words },
        { headers: { "Cache-Control": "no-store" } },
      );
    }
  }

  return NextResponse.json(
    { source: "static", words: staticWords },
    { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } },
  );
}
