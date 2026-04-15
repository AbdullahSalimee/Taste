/**
 * /api/sync
 * TMDB → Supabase sync engine.
 *
 * Fetches trending + top-rated + upcoming titles from TMDB and upserts
 * them into the Supabase `titles` table.  Runs in ~30s batches so it
 * won't time out on Vercel/Netlify free tiers.
 *
 * Call via:
 *   GET /api/sync                   → run a standard sync
 *   GET /api/sync?mode=seed         → deep seed (popular/top-rated, many pages)
 *   GET /api/sync?mode=trending     → only trending (fast, daily cron)
 *
 * Protect with:
 *   Authorization: Bearer <SYNC_SECRET>
 * where SYNC_SECRET = process.env.SYNC_SECRET
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

const TMDB_BASE = "https://api.themoviedb.org/3";

function tmdbKey(): string {
  return process.env.TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_API_KEY || "";
}

async function tmdb(endpoint: string, params: Record<string, string> = {}) {
  const key = tmdbKey();
  if (!key) throw new Error("TMDB_API_KEY not set");
  const url = new URL(`${TMDB_BASE}${endpoint}`);
  url.searchParams.set("api_key", key);
  url.searchParams.set("language", "en-US");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString(), { next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`TMDB ${res.status}: ${endpoint}`);
  return res.json();
}

// ── Rate conversion ───────────────────────────────────────────────────────────

function parseDate(s: string | undefined): string | null {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d.toISOString().split("T")[0];
}

// ── Upsert a batch of raw TMDB results ────────────────────────────────────────

async function upsertTitles(
  db: ReturnType<typeof createServiceClient>,
  items: any[],
  mediaType: "movie" | "tv",
): Promise<{ synced: number; errors: number }> {
  let synced = 0;
  let errors = 0;

  // Build upsert rows
  const rows = items.map((r: any) => {
    const isMovie = mediaType === "movie";
    return {
      tmdb_id: r.id,
      media_type: mediaType,
      title: isMovie
        ? r.title || r.original_title || ""
        : r.name || r.original_name || "",
      original_title: isMovie ? r.original_title : r.original_name,
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
  });

  if (rows.length === 0) return { synced: 0, errors: 0 };

  const { error } = await db
    .from("titles")
    .upsert(rows, { onConflict: "tmdb_id,media_type" });

  if (error) {
    console.error("Upsert error:", error.message);
    errors += rows.length;
  } else {
    synced += rows.length;
  }

  return { synced, errors };
}

// ── Deep sync: fetch full details for a title ──────────────────────────────────

async function syncTitleDetails(
  db: ReturnType<typeof createServiceClient>,
  tmdbId: number,
  mediaType: "movie" | "tv",
): Promise<void> {
  try {
    const appendTo =
      mediaType === "movie"
        ? "credits,keywords,belongs_to_collection"
        : "credits";
    const detail = await tmdb(`/${mediaType}/${tmdbId}`, {
      append_to_response: appendTo,
    });

    // Update with full detail
    await db
      .from("titles")
      .update({
        tagline: detail.tagline || null,
        status: detail.status || null,
        runtime:
          mediaType === "movie"
            ? detail.runtime || null
            : detail.episode_run_time?.[0] || null,
        number_of_seasons: detail.number_of_seasons || null,
        number_of_episodes: detail.number_of_episodes || null,
        imdb_id: detail.imdb_id || null,
        last_updated: new Date().toISOString(),
      })
      .eq("tmdb_id", tmdbId)
      .eq("media_type", mediaType);

    // Sync cast/crew
    const credits = detail.credits;
    if (credits) {
      // Get the title UUID
      const { data: titleRow } = await db
        .from("titles")
        .select("id")
        .eq("tmdb_id", tmdbId)
        .eq("media_type", mediaType)
        .maybeSingle();

      if (titleRow) {
        // Upsert people
        const director =
          mediaType === "movie"
            ? credits.crew?.find((c: any) => c.job === "Director")
            : null;
        const cast = credits.cast?.slice(0, 15) || [];

        const people = [
          ...cast.map((c: any) => ({
            id: c.id,
            name: c.name,
            profile_path: c.profile_path || null,
            known_for: "Acting",
          })),
          ...(director
            ? [
                {
                  id: director.id,
                  name: director.name,
                  profile_path: director.profile_path || null,
                  known_for: "Directing",
                },
              ]
            : []),
        ];

        if (people.length) {
          await db.from("people").upsert(people, { onConflict: "id" });
        }

        // Upsert cast records
        const castRows = cast.map((c: any, idx: number) => ({
          title_id: titleRow.id,
          person_id: c.id,
          role: "actor",
          character: c.character || null,
          order_idx: idx,
        }));

        if (castRows.length) {
          // Delete old then insert fresh
          await db.from("title_cast").delete().eq("title_id", titleRow.id);
          await db.from("title_cast").insert(castRows);
        }

        // Sync genres
        if (detail.genres?.length) {
          const genreRows = detail.genres.map((g: any) => ({
            title_id: titleRow.id,
            genre_id: g.id,
          }));
          await db
            .from("title_genres")
            .upsert(genreRows, { onConflict: "title_id,genre_id" });
        }
      }
    }
  } catch (err) {
    console.error(`Error syncing details for ${mediaType}/${tmdbId}:`, err);
  }
}

// ── Sync TV seasons/episodes ───────────────────────────────────────────────────

async function syncTVSeasons(
  db: ReturnType<typeof createServiceClient>,
  tmdbId: number,
  titleId: string,
  seasonCount: number,
): Promise<void> {
  const maxSeasons = Math.min(seasonCount, 8); // Cap to avoid timeout
  for (let s = 1; s <= maxSeasons; s++) {
    try {
      const seasonData = await tmdb(`/tv/${tmdbId}/season/${s}`);

      // Upsert season
      const { data: seasonRow } = await db
        .from("seasons")
        .upsert(
          {
            title_id: titleId,
            season_number: s,
            name: seasonData.name || `Season ${s}`,
            overview: seasonData.overview || null,
            air_date: parseDate(seasonData.air_date),
            episode_count: seasonData.episodes?.length || 0,
            poster_path: seasonData.poster_path || null,
          },
          { onConflict: "title_id,season_number" },
        )
        .select("id")
        .single();

      if (seasonRow && seasonData.episodes?.length) {
        const epRows = seasonData.episodes.map((ep: any) => ({
          season_id: seasonRow.id,
          title_id: titleId,
          episode_number: ep.episode_number,
          season_number: s,
          name: ep.name || null,
          overview: ep.overview || null,
          air_date: parseDate(ep.air_date),
          still_path: ep.still_path || null,
          runtime: ep.runtime || null,
          tmdb_rating: ep.vote_average || 0,
          vote_count: ep.vote_count || 0,
        }));

        await db
          .from("episodes")
          .upsert(epRows, {
            onConflict: "title_id,season_number,episode_number",
          });
      }
    } catch (err) {
      console.error(`Error syncing season ${s} for TV/${tmdbId}:`, err);
    }
  }
}

// ── Main sync function ────────────────────────────────────────────────────────

async function runSync(mode: string): Promise<{
  titles_synced: number;
  titles_updated: number;
  errors: number;
  duration_ms: number;
}> {
  const startMs = Date.now();
  const db = createServiceClient();
  let totalSynced = 0;
  let totalErrors = 0;

  // ── Fetch lists based on mode ────────────────────────────────────────────────
  const pages = mode === "seed" ? 5 : 2;

  const fetches: Array<Promise<any>> = [];

  // Movies
  fetches.push(tmdb("/trending/movie/week"));
  fetches.push(tmdb("/movie/top_rated"));
  if (mode === "seed" || mode === "standard") {
    fetches.push(tmdb("/movie/popular"));
    fetches.push(tmdb("/movie/now_playing"));
    fetches.push(tmdb("/movie/upcoming"));
  }

  // TV
  fetches.push(tmdb("/trending/tv/week"));
  fetches.push(tmdb("/tv/top_rated"));
  if (mode === "seed" || mode === "standard") {
    fetches.push(tmdb("/tv/popular"));
    fetches.push(tmdb("/tv/on_the_air"));
  }

  // For seed mode, also get genre-specific pages
  if (mode === "seed") {
    for (const genreId of [28, 18, 27, 878, 35, 16]) {
      fetches.push(
        tmdb("/discover/movie", {
          with_genres: String(genreId),
          sort_by: "vote_count.desc",
          "vote_count.gte": "500",
          page: "1",
        }),
      );
      fetches.push(
        tmdb("/discover/movie", {
          with_genres: String(genreId),
          sort_by: "vote_count.desc",
          "vote_count.gte": "500",
          page: "2",
        }),
      );
    }
    // Anime (Animation + Sci-Fi & Fantasy TV)
    fetches.push(
      tmdb("/discover/tv", {
        with_genres: "16",
        sort_by: "vote_count.desc",
        page: "1",
      }),
    );
    fetches.push(
      tmdb("/discover/tv", {
        with_genres: "10765",
        sort_by: "vote_count.desc",
        page: "1",
      }),
    );
  }

  const results = await Promise.allSettled(fetches);
  const allMovies: any[] = [];
  const allTV: any[] = [];

  results.forEach((r, i) => {
    if (r.status !== "fulfilled") return;
    const items: any[] = r.value.results || [];
    // Rough heuristic: first 5 batches are movie-like, rest TV; or check for 'title' key
    const isTV = items.some(
      (item: any) => "name" in item && !("title" in item),
    );
    if (isTV) allTV.push(...items);
    else allMovies.push(...items);
  });

  // Deduplicate
  const uniqueMovies = Array.from(
    new Map(allMovies.map((m) => [m.id, m])).values(),
  );
  const uniqueTV = Array.from(new Map(allTV.map((t) => [t.id, t])).values());

  // Upsert in batches of 50
  const BATCH = 50;
  for (let i = 0; i < uniqueMovies.length; i += BATCH) {
    const batch = uniqueMovies.slice(i, i + BATCH);
    const { synced, errors } = await upsertTitles(db, batch, "movie");
    totalSynced += synced;
    totalErrors += errors;
  }
  for (let i = 0; i < uniqueTV.length; i += BATCH) {
    const batch = uniqueTV.slice(i, i + BATCH);
    const { synced, errors } = await upsertTitles(db, batch, "tv");
    totalSynced += synced;
    totalErrors += errors;
  }

  // For seed mode: also sync full details for top titles
  if (mode === "seed") {
    const topMovieIds = uniqueMovies
      .sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0))
      .slice(0, 40)
      .map((m) => m.id);
    const topTVIds = uniqueTV
      .sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0))
      .slice(0, 20)
      .map((t) => t.id);

    for (const id of topMovieIds) {
      await syncTitleDetails(db, id, "movie");
    }
    for (const id of topTVIds) {
      await syncTitleDetails(db, id, "tv");
      // Sync seasons for top TV shows
      const { data: titleRow } = await db
        .from("titles")
        .select("id, number_of_seasons")
        .eq("tmdb_id", id)
        .eq("media_type", "tv")
        .maybeSingle();
      if (titleRow?.number_of_seasons) {
        await syncTVSeasons(db, id, titleRow.id, titleRow.number_of_seasons);
      }
    }
  }

  const duration = Date.now() - startMs;

  // Log the sync run
  await db.from("sync_log").insert({
    titles_synced: totalSynced,
    titles_updated: totalSynced, // upsert counts as both
    errors: totalErrors,
    duration_ms: duration,
    notes: `mode=${mode} movies=${uniqueMovies.length} tv=${uniqueTV.length}`,
  });

  return {
    titles_synced: totalSynced,
    titles_updated: totalSynced,
    errors: totalErrors,
    duration_ms: duration,
  };
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  // Auth check — allow unauthenticated in dev, require secret in prod
  const secret = process.env.SYNC_SECRET;
  if (secret && process.env.NODE_ENV === "production") {
    const auth = request.headers.get("authorization") || "";
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const mode = request.nextUrl.searchParams.get("mode") || "standard";

  try {
    const result = await runSync(mode);
    return NextResponse.json({
      ok: true,
      mode,
      ...result,
      message: `Synced ${result.titles_synced} titles in ${result.duration_ms}ms`,
    });
  } catch (err: any) {
    console.error("Sync error:", err);
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 },
    );
  }
}

// Also export a POST handler so it can be called from a Supabase cron function
export async function POST(request: NextRequest) {
  return GET(request);
}
