/**
 * /api/sync — TMDB → Supabase bulk sync
 *
 * Modes:
 *   GET /api/sync?mode=trending     fast daily update (~2s)
 *   GET /api/sync?mode=seed         first-time seed, thousands of titles
 *   GET /api/sync?mode=deep&year=1994&page=1   one decade/year page at a time
 *   GET /api/sync?mode=bulk&from=1900&to=2025  full historical sweep (run multiple times)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const TMDB_BASE = "https://api.themoviedb.org/3";

function getKey() {
  return process.env.TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_API_KEY || "";
}

function getDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

async function tmdb(endpoint: string, params: Record<string, string> = {}) {
  const key = getKey();
  if (!key) throw new Error("TMDB_API_KEY not set");
  const url = new URL(`${TMDB_BASE}${endpoint}`);
  url.searchParams.set("api_key", key);
  url.searchParams.set("language", "en-US");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error(`TMDB ${res.status}: ${endpoint}`);
  return res.json();
}

function parseDate(s: string | undefined): string | null {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d.toISOString().split("T")[0];
}

function toRow(r: any, mediaType: "movie" | "tv") {
  const isMovie = mediaType === "movie";
  return {
    tmdb_id: r.id,
    media_type: mediaType,
    title: isMovie
      ? r.title || r.original_title || ""
      : r.name || r.original_name || "",
    original_title: isMovie ? r.original_title : r.original_name,
    genre_ids: r.genre_ids || [], // ← add this line
    overview: r.overview || null,
    original_language: r.original_language || null,
    poster_path: r.poster_path || null,
    backdrop_path: r.backdrop_path || null,
    release_date: parseDate(isMovie ? r.release_date : r.first_air_date),
    runtime: isMovie ? r.runtime || null : r.episode_run_time?.[0] || null,
    number_of_seasons: isMovie ? null : r.number_of_seasons || null,
    number_of_episodes: isMovie ? null : r.number_of_episodes || null,
    imdb_id: r.imdb_id || null,
    tmdb_rating: r.vote_average || 0,
    vote_count: r.vote_count || 0,
    popularity: r.popularity || 0,
    status: r.status || null,
    tagline: r.tagline || null,
    synced_at: new Date().toISOString(),
    last_updated: new Date().toISOString(),
  };
}


async function syncMissingGenres() {
  const db = getDb();

  // Get title_ids that DO have genres
  const { data: hasGenres } = await db.from("title_genres").select("title_id");

  const coveredIds = new Set((hasGenres || []).map((r: any) => r.title_id));

  // Get all titles
  const { data: allTitles } = await db
    .from("titles")
    .select("id, tmdb_id, media_type");

  const missing = (allTitles || []).filter((t: any) => !coveredIds.has(t.id));

  if (!missing.length) return 0;

  console.log(`Found ${missing.length} titles missing genres`);

  let synced = 0;
  for (let i = 0; i < missing.length; i += 20) {
    const batch = missing.slice(i, i + 20);
    await Promise.all(
      batch.map(async (title: any) => {
        try {
          const endpoint =
            title.media_type === "movie"
              ? `/movie/${title.tmdb_id}`
              : `/tv/${title.tmdb_id}`;
          const data = await tmdb(endpoint);
          const genres: { id: number }[] = data.genres || [];
          if (!genres.length) return;

          const rows = genres.map((g: any) => ({
            title_id: title.id,
            genre_id: g.id,
          }));

          await db.from("title_genres").upsert(rows, {
            onConflict: "title_id,genre_id",
            ignoreDuplicates: true,
          });
          synced++;
        } catch {}
      }),
    );
    await new Promise((r) => setTimeout(r, 300));
  }
  return synced;
}
async function upsertBatch(db: any, rows: any[]) {
  if (!rows.length) return 0;

  // Save genre_ids before stripping them from the title row
  const genreMap: Record<number, number[]> = {};
  for (const row of rows) {
    if (row.genre_ids?.length) {
      genreMap[row.tmdb_id] = row.genre_ids;
    }
    delete row.genre_ids; // titles table doesn't have this column
  }

  const { data, error } = await db
    .from("titles")
    .upsert(rows, { onConflict: "tmdb_id,media_type" })
    .select("id, tmdb_id");

  if (error) {
    console.error("upsert error:", error.message);
    return 0;
  }

  // Insert genre rows for titles that have genre_ids
  if (data?.length) {
    const genreRows: { title_id: string; genre_id: number }[] = [];
    for (const title of data) {
      const genres = genreMap[title.tmdb_id] || [];
      for (const gId of genres) {
        genreRows.push({ title_id: title.id, genre_id: gId });
      }
    }
    if (genreRows.length) {
      await db.from("title_genres").upsert(genreRows, {
        onConflict: "title_id,genre_id",
        ignoreDuplicates: true,
      });
    }
  }

  return rows.length;
}

// Fetch all pages of a discover endpoint up to maxPages
async function fetchDiscover(
  mediaType: "movie" | "tv",
  extraParams: Record<string, string>,
  maxPages = 5,
): Promise<any[]> {
  const endpoint = `/discover/${mediaType}`;
  const all: any[] = [];
  // Get first page to know total_pages
  const first = await tmdb(endpoint, { ...extraParams, page: "1" });
  all.push(...(first.results || []));
  const total = Math.min(first.total_pages || 1, maxPages);
  // Fetch remaining pages in parallel (batches of 5)
  for (let p = 2; p <= total; p += 5) {
    const batch = [];
    for (let i = p; i < p + 5 && i <= total; i++) {
      batch.push(tmdb(endpoint, { ...extraParams, page: String(i) }));
    }
    const results = await Promise.allSettled(batch);
    for (const r of results) {
      if (r.status === "fulfilled") all.push(...(r.value.results || []));
    }
  }
  return all;
}

// ── BULK HISTORICAL SYNC ──────────────────────────────────────────────────────
// Goes year by year, fetching discover pages sorted by vote_count descending
// This gets the most relevant titles for each year efficiently

async function bulkSync(fromYear: number, toYear: number, pagesPerYear = 10) {
  const db = getDb();
  let total = 0;
  const years = [];
  for (let y = fromYear; y <= toYear; y++) years.push(y);

  for (const year of years) {
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    const [movies, tv] = await Promise.allSettled([
      fetchDiscover(
        "movie",
        {
          "primary_release_date.gte": startDate,
          "primary_release_date.lte": endDate,
          sort_by: "vote_count.desc",
          "vote_count.gte": "5",
        },
        pagesPerYear,
      ),
      fetchDiscover(
        "tv",
        {
          "first_air_date.gte": startDate,
          "first_air_date.lte": endDate,
          sort_by: "vote_count.desc",
          "vote_count.gte": "5",
        },
        pagesPerYear,
      ),
    ]);

    const movieRows =
      movies.status === "fulfilled"
        ? movies.value.map((r: any) => toRow(r, "movie"))
        : [];
    const tvRows =
      tv.status === "fulfilled" ? tv.value.map((r: any) => toRow(r, "tv")) : [];

    // Deduplicate
    const uniqueMovies = Array.from(
      new Map(movieRows.map((r: any) => [r.tmdb_id, r])).values(),
    );
    const uniqueTV = Array.from(
      new Map(tvRows.map((r: any) => [r.tmdb_id, r])).values(),
    );

    // Upsert in batches of 100
    for (let i = 0; i < uniqueMovies.length; i += 100) {
      total += await upsertBatch(db, uniqueMovies.slice(i, i + 100));
    }
    for (let i = 0; i < uniqueTV.length; i += 100) {
      total += await upsertBatch(db, uniqueTV.slice(i, i + 100));
    }

    console.log(
      `Year ${year}: +${uniqueMovies.length} movies, +${uniqueTV.length} tv`,
    );
  }

  return total;
}

// ── TRENDING / STANDARD SYNC ──────────────────────────────────────────────────

async function trendingSync() {
  const db = getDb();
  let total = 0;

  const [tm, tt, pm, pt, trm, trt] = await Promise.allSettled([
    tmdb("/trending/movie/week"),
    tmdb("/trending/tv/week"),
    tmdb("/movie/popular"),
    tmdb("/tv/popular"),
    tmdb("/movie/top_rated"),
    tmdb("/tv/top_rated"),
  ]);

  const movies: any[] = [];
  const tv: any[] = [];

  if (tm.status === "fulfilled") movies.push(...(tm.value.results || []));
  if (pm.status === "fulfilled") movies.push(...(pm.value.results || []));
  if (trm.status === "fulfilled") movies.push(...(trm.value.results || []));
  if (tt.status === "fulfilled") tv.push(...(tt.value.results || []));
  if (pt.status === "fulfilled") tv.push(...(pt.value.results || []));
  if (trt.status === "fulfilled") tv.push(...(trt.value.results || []));

  const uniqueMovies = Array.from(
    new Map(movies.map((r) => [r.id, r])).values(),
  );
  const uniqueTV = Array.from(new Map(tv.map((r) => [r.id, r])).values());

  total += await upsertBatch(
    db,
    uniqueMovies.map((r) => toRow(r, "movie")),
  );
  total += await upsertBatch(
    db,
    uniqueTV.map((r) => toRow(r, "tv")),
  );

  return total;
}

// ── SEED (first time, broad coverage) ────────────────────────────────────────

async function seedSync() {
  const db = getDb();
  let total = 0;

  // All genres
  const movieGenres = [
    28, 12, 16, 35, 80, 99, 18, 14, 27, 9648, 878, 53, 10749, 10752, 37, 36,
  ];
  const tvGenres = [10759, 16, 35, 80, 99, 18, 10751, 9648, 10765, 10768];

  const fetches = [
    // Trending & popular
    tmdb("/trending/movie/week"),
    tmdb("/trending/tv/week"),
    tmdb("/movie/popular", { page: "1" }),
    tmdb("/movie/popular", { page: "2" }),
    tmdb("/movie/popular", { page: "3" }),
    tmdb("/tv/popular", { page: "1" }),
    tmdb("/tv/popular", { page: "2" }),
    tmdb("/movie/top_rated", { page: "1" }),
    tmdb("/movie/top_rated", { page: "2" }),
    tmdb("/movie/top_rated", { page: "3" }),
    tmdb("/tv/top_rated", { page: "1" }),
    tmdb("/tv/top_rated", { page: "2" }),
    tmdb("/movie/now_playing"),
    tmdb("/movie/upcoming"),
    tmdb("/tv/on_the_air"),
    // All genres, multiple pages
    ...movieGenres.flatMap((g) => [
      tmdb("/discover/movie", {
        with_genres: String(g),
        sort_by: "vote_count.desc",
        "vote_count.gte": "50",
        page: "1",
      }),
      tmdb("/discover/movie", {
        with_genres: String(g),
        sort_by: "vote_count.desc",
        "vote_count.gte": "50",
        page: "2",
      }),
      tmdb("/discover/movie", {
        with_genres: String(g),
        sort_by: "vote_count.desc",
        "vote_count.gte": "50",
        page: "3",
      }),
    ]),
    ...tvGenres.flatMap((g) => [
      tmdb("/discover/tv", {
        with_genres: String(g),
        sort_by: "vote_count.desc",
        "vote_count.gte": "20",
        page: "1",
      }),
      tmdb("/discover/tv", {
        with_genres: String(g),
        sort_by: "vote_count.desc",
        "vote_count.gte": "20",
        page: "2",
      }),
    ]),
  ];

  const results = await Promise.allSettled(fetches);
  const movies: any[] = [];
  const tvShows: any[] = [];

  for (const r of results) {
    if (r.status !== "fulfilled") continue;
    const items: any[] = r.value.results || [];
    // Detect media type by checking for 'title' vs 'name'
    for (const item of items) {
      if ("title" in item) movies.push(item);
      else if ("name" in item) tvShows.push(item);
    }
  }

  const uniqueMovies = Array.from(
    new Map(movies.map((r) => [r.id, r])).values(),
  );
  const uniqueTV = Array.from(new Map(tvShows.map((r) => [r.id, r])).values());

  for (let i = 0; i < uniqueMovies.length; i += 100) {
    total += await upsertBatch(
      db,
      uniqueMovies.slice(i, i + 100).map((r) => toRow(r, "movie")),
    );
  }
  for (let i = 0; i < uniqueTV.length; i += 100) {
    total += await upsertBatch(
      db,
      uniqueTV.slice(i, i + 100).map((r) => toRow(r, "tv")),
    );
  }

  return total;
}

// ── ROUTE HANDLER ─────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const start = Date.now();
  const mode = request.nextUrl.searchParams.get("mode") || "trending";
  const from = parseInt(request.nextUrl.searchParams.get("from") || "1990");
  const to = parseInt(request.nextUrl.searchParams.get("to") || "2000");
  const pages = parseInt(request.nextUrl.searchParams.get("pages") || "10");

  try {
    let synced = 0;

  if (mode === "bulk") {
    synced = await bulkSync(from, to, pages);
  } else if (mode === "seed") {
    synced = await seedSync();
  } else if (mode === "genres") {
    synced = await syncMissingGenres();
  } else {
    synced = await trendingSync();
  }

    const db = getDb();
    const { count } = await db
      .from("titles")
      .select("*", { count: "exact", head: true });

    return NextResponse.json({
      ok: true,
      mode,
      titles_synced: synced,
      total_in_db: count,
      duration_ms: Date.now() - start,
      message: `Synced ${synced} titles. Total in DB: ${count}`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
