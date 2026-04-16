import { NextRequest, NextResponse } from "next/server";
import { searchMulti, POSTER_URL } from "@/lib/tmdb";
import { createClient } from "@supabase/supabase-js";

const TMDB_IMG = "https://image.tmdb.org/t/p";

function getDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

function formatRow(r: any) {
  return {
    id: r.tmdb_id,
    tmdb_id: r.tmdb_id,
    type: r.media_type === "movie" ? "film" : "series",
    media_type: r.media_type,
    title: r.title,
    year: r.year,
    poster_url: r.poster_path ? `${TMDB_IMG}/w185${r.poster_path}` : null,
    tmdb_rating: r.tmdb_rating,
    tmdb_rating_5: r.tmdb_rating_5,
    overview: r.overview,
    popularity: r.popularity,
  };
}

function formatTmdb(r: any) {
  const isMovie = r.media_type === "movie";
  return {
    id: r.id,
    tmdb_id: r.id,
    type: isMovie ? "film" : "series",
    media_type: r.media_type,
    title: isMovie ? r.title : r.name,
    year:
      new Date(isMovie ? r.release_date : r.first_air_date).getFullYear() || 0,
    poster_url: POSTER_URL(r.poster_path, "w185"),
    tmdb_rating: r.vote_average,
    tmdb_rating_5: Math.round((r.vote_average / 2) * 2) / 2,
    overview: r.overview,
    popularity: r.popularity,
  };
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") || "";
  const type = request.nextUrl.searchParams.get("type") || "all";

  if (q.length < 2) return NextResponse.json({ results: [] });

  const db = getDb();
  const dbResults: any[] = [];

  try {
    // Strategy 1: prefix match — catches "daredevi" → "daredevil"
    const prefixQuery = db
      .from("titles")
      .select(
        "tmdb_id, media_type, title, year, poster_path, tmdb_rating, tmdb_rating_5, overview, popularity",
      )
      .ilike("title", `${q}%`)
      .order("popularity", { ascending: false })
      .limit(20);

    // Strategy 2: substring match — catches middle-of-title matches
    const substringQuery = db
      .from("titles")
      .select(
        "tmdb_id, media_type, title, year, poster_path, tmdb_rating, tmdb_rating_5, overview, popularity",
      )
      .ilike("title", `%${q}%`)
      .order("popularity", { ascending: false })
      .limit(20);

    const [prefixRes, substringRes] = await Promise.all([
      prefixQuery,
      substringQuery,
    ]);

    // Merge and deduplicate, prefix results first
    const seen = new Set<number>();
    for (const row of [
      ...(prefixRes.data || []),
      ...(substringRes.data || []),
    ]) {
      if (!seen.has(row.tmdb_id)) {
        seen.add(row.tmdb_id);
        // Apply type filter
        if (type === "movie" && row.media_type !== "movie") continue;
        if (type === "tv" && row.media_type !== "tv") continue;
        dbResults.push(row);
      }
    }
  } catch (err) {
    console.error("Supabase search error:", err);
  }

  // Always also hit TMDB for live results (catches titles not in our DB)
  let tmdbResults: any[] = [];
  try {
    const data = await searchMulti(q);
    if (data?.results) {
      tmdbResults = data.results
        .filter((r: any) => r.media_type === "movie" || r.media_type === "tv")
        .filter((r: any) => {
          if (type === "movie") return r.media_type === "movie";
          if (type === "tv") return r.media_type === "tv";
          return true;
        });
    }
  } catch (err) {
    console.error("TMDB search error:", err);
  }

  // Merge: DB results first, then TMDB results that aren't already in DB
  const dbIds = new Set(dbResults.map((r) => r.tmdb_id));
  const tmdbOnly = tmdbResults.filter((r: any) => !dbIds.has(r.id));

  const merged = [
    ...dbResults.map(formatRow),
    ...tmdbOnly.map(formatTmdb),
  ].slice(0, 30);

  return NextResponse.json({ results: merged });
}
