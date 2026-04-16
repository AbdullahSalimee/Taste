import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const TMDB_IMG = "https://image.tmdb.org/t/p";

function getDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

function posterUrl(path: string | null): string | null {
  return path ? `${TMDB_IMG}/w300${path}` : null;
}
function backdropUrl(path: string | null): string | null {
  return path ? `${TMDB_IMG}/w780${path}` : null;
}

// TMDB genre ID → name map
const GENRE_MAP: Record<string, number[]> = {
  Action: [28, 10759],
  Adventure: [12],
  Animation: [16],
  Comedy: [35],
  Crime: [80],
  Documentary: [99],
  Drama: [18],
  Fantasy: [14, 10765],
  Horror: [27],
  Mystery: [9648],
  Romance: [10749],
  "Sci-Fi": [878, 10765],
  Thriller: [53],
  War: [10752, 10768],
  Western: [37],
  Family: [10751],
  Music: [10402],
  History: [36],
  Kids: [10762],
  Reality: [10764],
};

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const q = searchParams.get("q") || "";
  const mediaType = searchParams.get("type") || "all"; // all | movie | tv
  const genre = searchParams.get("genre") || "";
  const decade = searchParams.get("decade") || ""; // e.g. "1990s"
  const language = searchParams.get("language") || ""; // e.g. "en", "ko", "ja"
  const sort = searchParams.get("sort") || "popularity"; // popularity | rating | year | votes
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "40");
  const offset = (page - 1) * limit;

  const db = getDb();

  // ── When searching: use prefix + substring, merge, then apply other filters ──
  if (q.trim().length >= 2) {
    const term = q.trim();

    // Run prefix and substring in parallel
    const [prefixRes, subRes] = await Promise.all([
      (() => {
        let pq = db
          .from("titles")
          .select("*", { count: "exact" })
          .ilike("title", `${term}%`)
          .order("popularity", { ascending: false })
          .limit(200);
        if (mediaType === "movie") pq = pq.eq("media_type", "movie");
        else if (mediaType === "tv") pq = pq.eq("media_type", "tv");
        if (language) pq = pq.eq("original_language", language);
        if (decade) {
          const startYear = parseInt(decade);
          if (!isNaN(startYear))
            pq = pq.gte("year", startYear).lte("year", startYear + 9);
        }
        return pq;
      })(),
      (() => {
        let sq = db
          .from("titles")
          .select("*", { count: "exact" })
          .ilike("title", `%${term}%`)
          .order("popularity", { ascending: false })
          .limit(200);
        if (mediaType === "movie") sq = sq.eq("media_type", "movie");
        else if (mediaType === "tv") sq = sq.eq("media_type", "tv");
        if (language) sq = sq.eq("original_language", language);
        if (decade) {
          const startYear = parseInt(decade);
          if (!isNaN(startYear))
            sq = sq.gte("year", startYear).lte("year", startYear + 9);
        }
        return sq;
      })(),
    ]);

    // Merge deduplicated, prefix first
    const seen = new Set<number>();
    const merged: any[] = [];
    for (const row of [...(prefixRes.data || []), ...(subRes.data || [])]) {
      if (!seen.has(row.tmdb_id)) {
        seen.add(row.tmdb_id);
        merged.push(row);
      }
    }

    // Sort merged results
    merged.sort((a, b) => {
      if (sort === "rating")
        return (b.tmdb_rating_5 || 0) - (a.tmdb_rating_5 || 0);
      if (sort === "year_desc") return (b.year || 0) - (a.year || 0);
      if (sort === "year_asc") return (a.year || 0) - (b.year || 0);
      if (sort === "votes") return (b.vote_count || 0) - (a.vote_count || 0);
      return (b.popularity || 0) - (a.popularity || 0);
    });

    const paginated = merged.slice(offset, offset + limit);

    return NextResponse.json({
      results: paginated.map(formatTitle),
      total: merged.length,
      page,
      has_more: merged.length > offset + limit,
    });
  }

  let query = db.from("titles").select("*", { count: "exact" });

  // ── Media type filter ──────────────────────────────────────────────────────
  if (mediaType === "movie") query = query.eq("media_type", "movie");
  else if (mediaType === "tv") query = query.eq("media_type", "tv");

  // ── Genre filter ──────────────────────────────────────────────────────────
  // (genre filtering via title_genres join coming in a future task)

  // ── Decade filter ──────────────────────────────────────────────────────────
  if (decade) {
    const startYear = parseInt(decade);
    if (!isNaN(startYear)) {
      query = query.gte("year", startYear).lte("year", startYear + 9);
    }
  }

  // ── Language filter ────────────────────────────────────────────────────────
  if (language) {
    query = query.eq("original_language", language);
  }

  // ── Minimum quality threshold (hide junk) ─────────────────────────────────
  if (!q.trim()) {
    query = query.gte("vote_count", 10);
  }

  // ── Sort ───────────────────────────────────────────────────────────────────
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
    default: // popularity
      query = query.order("popularity", {
        ascending: false,
        nullsFirst: false,
      });
  }

  // ── Pagination ─────────────────────────────────────────────────────────────
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    // Fallback: if full-text search fails (e.g. query syntax), try ilike
    if (q.trim().length >= 2) {
      const { data: fallback, count: fCount } = await db
        .from("titles")
        .select("*", { count: "exact" })
        .ilike("title", `%${q.trim()}%`)
        .eq(
          mediaType !== "all" ? "media_type" : "tmdb_id",
          mediaType !== "all" ? mediaType : db.from("titles").select("tmdb_id"),
        )
        .order("popularity", { ascending: false })
        .range(offset, offset + limit - 1);

      return NextResponse.json({
        results: (fallback || []).map(formatTitle),
        total: fCount || 0,
        page,
        has_more: (fCount || 0) > offset + limit,
      });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    results: (data || []).map(formatTitle),
    total: count || 0,
    page,
    has_more: (count || 0) > offset + limit,
  });
}

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
