import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const TMDB_BASE = "https://api.themoviedb.org/3";

function getDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

async function tmdb(endpoint: string) {
  const key =
    process.env.TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_API_KEY || "";
  const url = new URL(`${TMDB_BASE}${endpoint}`);
  url.searchParams.set("api_key", key);
  url.searchParams.set("language", "en-US");
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error(`TMDB ${res.status}`);
  return res.json();
}

export async function GET(request: NextRequest) {
  const start = Date.now();
  const db = getDb();
  const batchSize = parseInt(
    request.nextUrl.searchParams.get("batch") || "400",
  );

  // Directly fetch only titles that are missing genres — no offset needed
  const { data: missing } = await db.rpc("get_titles_without_genres", {
    limit_count: batchSize,
  });

  if (!missing?.length) {
    return NextResponse.json({
      ok: true,
      done: true,
      message: "All titles have genres",
    });
  }

  let synced = 0;
  let errors = 0;

  for (let i = 0; i < missing.length; i += 40) {
    const batch = missing.slice(i, i + 40);
    await Promise.all(
      batch.map(async (title: any) => {
        try {
          const endpoint =
            title.media_type === "movie"
              ? `/movie/${title.tmdb_id}`
              : `/tv/${title.tmdb_id}`;
          const data = await tmdb(endpoint);
          const genres: { id: number }[] = data.genres || [];
          if (!genres.length) {
            // Insert a placeholder so this title isn't retried forever
            await db
              .from("title_genres")
              .upsert([{ title_id: title.id, genre_id: 0 }], {
                onConflict: "title_id,genre_id",
                ignoreDuplicates: true,
              });
            return;
          }
          await db.from("title_genres").upsert(
            genres.map((g) => ({ title_id: title.id, genre_id: g.id })),
            { onConflict: "title_id,genre_id", ignoreDuplicates: true },
          );
          synced++;
        } catch {
          errors++;
        }
      }),
    );
  }

  return NextResponse.json({
    ok: true,
    processed: missing.length,
    synced,
    errors,
    remaining: missing.length === batchSize ? "more" : 0,
    duration_ms: Date.now() - start,
  });
}
