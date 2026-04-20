import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

const posterUrl = (p: string | null) =>
  p ? `https://image.tmdb.org/t/p/w342${p}` : null;
const backdropUrl = (p: string | null) =>
  p ? `https://image.tmdb.org/t/p/w780${p}` : null;

function formatTitle(r: any) {
  return {
    id: r.tmdb_id,
    tmdb_id: r.tmdb_id,
    db_id: r.id,
    type: r.media_type === "movie" ? "film" : "series",
    media_type: r.media_type,
    title: r.title,
    year: r.year,
    overview: r.overview,
    poster_url: posterUrl(r.poster_path),
    backdrop_url: backdropUrl(r.backdrop_path),
    tmdb_rating: r.tmdb_rating,
    tmdb_rating_5: r.tmdb_rating_5,
    community_rating: r.community_rating,
    vote_count: r.vote_count,
    popularity: r.popularity,
    original_language: r.original_language,
    status: r.status,
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q") || "";
  const mediaType = searchParams.get("type") || "all";
  const genre = searchParams.get("genre") || "";
  const decade = searchParams.get("decade") || "";
  const language = searchParams.get("language") || "";
  const sort = searchParams.get("sort") || "popularity";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(40, parseInt(searchParams.get("limit") || "40"));
  const offset = (page - 1) * limit;

  const db = getDb();

  // ── Columns to select (never select * for speed) ─────────────────────────
  const COLS =
    "id,tmdb_id,media_type,title,year,overview,poster_path,backdrop_path,tmdb_rating,tmdb_rating_5,community_rating,vote_count,popularity,original_language,status";

  // ── Search path ───────────────────────────────────────────────────────────
  if (q.trim().length >= 2) {
    const term = q.trim();

    // Single query — trgm index makes %term% fast at 176k rows
    let sq = db
      .from("titles")
      .select(COLS)
      .ilike("title", `%${term}%`)
      .order("popularity", { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1);

    if (mediaType === "movie") sq = sq.eq("media_type", "movie");
    else if (mediaType === "tv") sq = sq.eq("media_type", "tv");
    if (language) sq = sq.eq("original_language", language);
    if (decade) {
      const startYear = parseInt(decade);
      if (!isNaN(startYear))
        sq = sq.gte("year", startYear).lte("year", startYear + 9);
    }

    const { data, error } = await sq;
    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });

    const results = data || [];
    return NextResponse.json({
      results: results.map(formatTitle),
      total: results.length + offset, // approximate — avoids expensive COUNT
      page,
      has_more: results.length === limit,
    });
  }

  // ── Browse path (no search query) ────────────────────────────────────────
  let query = db
    .from("titles")
    .select(COLS, { count: "exact" })
  

  if (mediaType === "movie") query = query.eq("media_type", "movie");
  else if (mediaType === "tv") query = query.eq("media_type", "tv");
  if (language) query = query.eq("original_language", language);
  if (decade) {
    const startYear = parseInt(decade);
    if (!isNaN(startYear))
      query = query.gte("year", startYear).lte("year", startYear + 9);
  }

  // Genre filter via title_genres join
  if (genre) {
    const genreId = parseInt(genre);
    if (!isNaN(genreId)) {
      const { data: genreTitles } = await db
        .from("title_genres")
        .select("title_id")
        .eq("genre_id", genreId)
        .limit(5000);
      const ids = (genreTitles || []).map((r: any) => r.title_id);
      if (ids.length === 0)
        return NextResponse.json({
          results: [],
          total: 0,
          page,
          has_more: false,
        });
      query = query.in("id", ids);
    }
  }

  switch (sort) {
    case "rating":
      query = query.order("tmdb_rating_5", {
        ascending: false,
        nullsFirst: false,
      });
      break;
    case "year_desc":
      query = query.order("year", { ascending: false, nullsFirst: false });
      break;
    case "year_asc":
      query = query.order("year", { ascending: true, nullsFirst: false });
      break;
    case "votes":
      query = query.order("vote_count", {
        ascending: false,
        nullsFirst: false,
      });
      break;
    case "community":
      query = query
        .not("community_rating", "is", null)
        .order("community_rating", { ascending: false, nullsFirst: false });
      break;
    default:
      query = query.order("popularity", {
        ascending: false,
        nullsFirst: false,
      });
  }

  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    results: (data || []).map(formatTitle),
    total: count || 0,
    page,
    has_more: (count || 0) > offset + limit,
  });
}
