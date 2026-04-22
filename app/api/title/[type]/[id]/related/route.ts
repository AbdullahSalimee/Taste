import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMG = "https://image.tmdb.org/t/p";

function getDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

async function tmdbFetch(endpoint: string) {
  const key =
    process.env.TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_API_KEY || "";
  if (!key) return null;
  const url = new URL(`${TMDB_BASE}${endpoint}`);
  url.searchParams.set("api_key", key);
  url.searchParams.set("language", "en-US");
  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
  if (!res.ok) return null;
  return res.json();
}

function formatTitle(r: any, mediaType: "movie" | "tv") {
  const isMovie = mediaType === "movie";
  return {
    id: r.id,
    tmdb_id: r.id,
    type: isMovie ? "film" : "series",
    media_type: mediaType,
    title: isMovie ? r.title : r.name,
    year: isMovie
      ? new Date(r.release_date || "").getFullYear() || 0
      : new Date(r.first_air_date || "").getFullYear() || 0,
    poster_url: r.poster_path ? `${TMDB_IMG}/w300${r.poster_path}` : null,
    tmdb_rating: r.vote_average || 0,
    tmdb_rating_5: Math.round((r.vote_average / 2) * 10) / 10,
    overview: r.overview || "",
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> },
) {
  const { type, id } = await params;
  const tmdbId = parseInt(id);
  const mediaType = type === "movie" ? "movie" : "tv";
  if (isNaN(tmdbId))
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const db = getDb();

  // ── 1. Franchise / Collection ─────────────────────────────────────────────
  let franchiseTitles: any[] = [];
  let franchiseName: string | null = null;

  if (mediaType === "movie") {
    const movieData = await tmdbFetch(`/movie/${tmdbId}`);
    if (movieData?.belongs_to_collection?.id) {
      franchiseName = movieData.belongs_to_collection.name;
      const collectionData = await tmdbFetch(
        `/collection/${movieData.belongs_to_collection.id}`,
      );
      if (collectionData?.parts) {
        franchiseTitles = collectionData.parts
          .filter((p: any) => p.id !== tmdbId && p.poster_path)
          .sort(
            (a: any, b: any) =>
              new Date(a.release_date || "").getTime() -
              new Date(b.release_date || "").getTime(),
          )
          .slice(0, 10)
          .map((p: any) => formatTitle(p, "movie"));
      }
    }
    if (!franchiseTitles.length) {
      const recs = await tmdbFetch(`/movie/${tmdbId}/recommendations`);
      franchiseTitles = (recs?.results || [])
        .slice(0, 8)
        .map((r: any) => formatTitle(r, "movie"));
      franchiseName = "You might also like";
    }
  } else {
    const showData = await tmdbFetch(`/tv/${tmdbId}`);
    franchiseName = showData?.name
      ? `More like ${showData.name}`
      : "Similar shows";
    const similar = await tmdbFetch(`/tv/${tmdbId}/similar`);
    franchiseTitles = (similar?.results || [])
      .slice(0, 8)
      .map((r: any) => formatTitle(r, "tv"));
  }

  // ── 2. Popular lists featuring this title ─────────────────────────────────
  const { data: titleRow } = await db
    .from("titles")
    .select("id")
    .eq("tmdb_id", tmdbId)
    .eq("media_type", mediaType)
    .maybeSingle();

  let popularLists: any[] = [];
  let communityStats = {
    total_logged: 0,
    total_watchlisted: 0,
    total_reviews: 0,
  };
  let recentLoggers: any[] = [];

  if (titleRow?.id) {
    // Lists containing this title
    const { data: listEntries } = await db
      .from("list_entries")
      .select("list_id")
      .eq("title_id", titleRow.id);

    const listIds = [...new Set((listEntries || []).map((e) => e.list_id))];

    if (listIds.length > 0) {
      const { data: lists } = await db
        .from("lists")
        .select(
          `id, title, description, is_ranked, like_count, updated_at, tags,
          profiles!lists_user_id_fkey(username, display_name)`,
        )
        .in("id", listIds)
        .eq("is_public", true)
        .order("like_count", { ascending: false })
        .limit(6);

      if (lists?.length) {
        const { data: allEntries } = await db
          .from("list_entries")
          .select("list_id, titles(poster_path)")
          .in(
            "list_id",
            lists.map((l) => l.id),
          )
          .order("position", { ascending: true });

        const entryMap: Record<string, any[]> = {};
        for (const e of allEntries || []) {
          if (!entryMap[e.list_id]) entryMap[e.list_id] = [];
          entryMap[e.list_id].push(e);
        }

        popularLists = lists.map((list) => {
          const entries = entryMap[list.id] || [];
          return {
            id: list.id,
            title: list.title,
            description: list.description,
            is_ranked: list.is_ranked,
            like_count: list.like_count,
            entry_count: entries.length,
            tags: list.tags,
            preview_posters: entries
              .slice(0, 4)
              .map((e: any) =>
                e.titles?.poster_path
                  ? `${TMDB_IMG}/w185${e.titles.poster_path}`
                  : null,
              )
              .filter(Boolean),
            author:
              (list.profiles as any)?.username ||
              (list.profiles as any)?.display_name ||
              "someone",
          };
        });
      }
    }

    // Community stats
    const [logsRes, watchlistRes, reviewsRes] = await Promise.all([
      db
        .from("logs")
        .select("*", { count: "exact", head: true })
        .eq("title_id", titleRow.id),
      db
        .from("watchlists")
        .select("*", { count: "exact", head: true })
        .eq("title_id", titleRow.id),
      db
        .from("reviews")
        .select("*", { count: "exact", head: true })
        .eq("title_id", titleRow.id)
        .eq("is_hidden", false),
    ]);

    communityStats = {
      total_logged: logsRes.count || 0,
      total_watchlisted: watchlistRes.count || 0,
      total_reviews: reviewsRes.count || 0,
    };

    // Recent loggers
    const { data: recentLogs } = await db
      .from("logs")
      .select(
        "watched_at, status, profiles!logs_user_id_fkey(username, display_name, avatar_url)",
      )
      .eq("title_id", titleRow.id)
      .in("status", ["watched", "watching"])
      .order("watched_at", { ascending: false })
      .limit(12);

    recentLoggers = (recentLogs || [])
      .map((l: any) => ({
        username: l.profiles?.username || l.profiles?.display_name || null,
        avatar_url: l.profiles?.avatar_url || null,
        status: l.status,
        watched_at: l.watched_at,
      }))
      .filter((l) => l.username);
  }

  return NextResponse.json({
    franchise: { name: franchiseName, titles: franchiseTitles },
    popular_lists: popularLists,
    community_stats: communityStats,
    recent_loggers: recentLoggers,
  });
}
