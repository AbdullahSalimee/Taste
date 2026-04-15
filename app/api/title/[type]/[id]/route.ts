/**
 * /api/title/[type]/[id]
 *
 * Data priority:
 *   1. Supabase (synced data + community ratings)
 *   2. TMDB live fetch (fallback, also triggers background upsert)
 */

import { NextRequest, NextResponse } from "next/server";
import { getMovie, getTVShow, POSTER_URL, BACKDROP_URL } from "@/lib/tmdb";
import { createServiceClient, posterUrl, backdropUrl } from "@/lib/supabase";

function toFive(rating: number): number {
  return Math.round((rating / 2) * 2) / 2;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> },
) {
  const { type, id } = await params;
  const tmdbId = parseInt(id);

  if (isNaN(tmdbId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const mediaType = type === "movie" ? "movie" : type === "tv" ? "tv" : null;
  if (!mediaType) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  const db = createServiceClient();

  // ── Try Supabase first ──────────────────────────────────────────────────────
  try {
    const { data: dbTitle } = await db
      .from("titles")
      .select(
        `
        *,
        title_genres ( genres ( id, name ) ),
        title_cast (
          role, character, order_idx,
          people ( id, name, profile_path )
        )
      `,
      )
      .eq("tmdb_id", tmdbId)
      .eq("media_type", mediaType)
      .maybeSingle();

    if (dbTitle) {
      const genres = (dbTitle.title_genres || [])
        .map((tg: any) => tg.genres?.name)
        .filter(Boolean);

      const cast = (dbTitle.title_cast || [])
        .filter((tc: any) => tc.role === "actor")
        .sort((a: any, b: any) => a.order_idx - b.order_idx)
        .slice(0, 12)
        .map((tc: any) => ({
          id: tc.people?.id,
          name: tc.people?.name,
          character: tc.character,
          profile_url: tc.people?.profile_path
            ? `https://image.tmdb.org/t/p/w185${tc.people.profile_path}`
            : null,
        }));

      const directorCast = (dbTitle.title_cast || []).find(
        (tc: any) => tc.role === "director",
      );

      return NextResponse.json({
        id: dbTitle.tmdb_id,
        db_id: dbTitle.id,
        tmdb_id: dbTitle.tmdb_id,
        type: mediaType === "movie" ? "film" : "series",
        media_type: mediaType,
        title: dbTitle.title,
        year: dbTitle.year,
        overview: dbTitle.overview,
        tagline: dbTitle.tagline,
        poster_url: posterUrl(dbTitle.poster_path, "w500"),
        backdrop_url: backdropUrl(dbTitle.backdrop_path),
        tmdb_rating: dbTitle.tmdb_rating,
        tmdb_rating_5: dbTitle.tmdb_rating_5,
        community_rating: dbTitle.community_rating,
        community_votes: dbTitle.community_votes,
        vote_count: dbTitle.vote_count,
        runtime: dbTitle.runtime,
        status: dbTitle.status,
        original_language: dbTitle.original_language,
        imdb_id: dbTitle.imdb_id,
        genres,
        director: directorCast?.people?.name || null,
        cast,
        seasons: dbTitle.number_of_seasons,
        episodes: dbTitle.number_of_episodes,
        source: "db",
      });
    }
  } catch {
    // Supabase unavailable — fall through to TMDB
  }

  // ── Fallback: live TMDB fetch ───────────────────────────────────────────────
  if (mediaType === "movie") {
    const movie = await getMovie(tmdbId);
    if (!movie)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const credits = (movie as any).credits;
    const director = credits?.crew?.find((c: any) => c.job === "Director");
    const cast = credits?.cast?.slice(0, 12) || [];

    // Background upsert (fire-and-forget)
    void db.from("titles").upsert(
      {
        tmdb_id: movie.id,
        media_type: "movie",
        title: movie.title,
        original_title: movie.title,
        tagline: movie.tagline || null,
        overview: movie.overview || null,
        original_language: movie.original_language,
        poster_path: movie.poster_path,
        backdrop_path: movie.backdrop_path,
        release_date: movie.release_date || null,
        runtime: movie.runtime || null,
        imdb_id: (movie as any).imdb_id || null,
        tmdb_rating: movie.vote_average,
        vote_count: movie.vote_count,
        popularity: movie.popularity,
        status: movie.status || null,
        synced_at: new Date().toISOString(),
        last_updated: new Date().toISOString(),
      },
      { onConflict: "tmdb_id,media_type" },
    );

    return NextResponse.json({
      id: movie.id,
      db_id: null,
      tmdb_id: movie.id,
      type: "film",
      media_type: "movie",
      title: movie.title,
      year: new Date(movie.release_date || "").getFullYear() || 0,
      overview: movie.overview,
      tagline: movie.tagline,
      poster_url: POSTER_URL(movie.poster_path, "w500"),
      backdrop_url: BACKDROP_URL(movie.backdrop_path),
      tmdb_rating: movie.vote_average,
      tmdb_rating_5: toFive(movie.vote_average),
      community_rating: null,
      community_votes: 0,
      vote_count: movie.vote_count,
      runtime: movie.runtime,
      status: movie.status,
      genres: movie.genres?.map((g: any) => g.name) || [],
      director: director?.name || null,
      cast: cast.map((c: any) => ({
        id: c.id,
        name: c.name,
        character: c.character,
        profile_url: c.profile_path
          ? `https://image.tmdb.org/t/p/w185${c.profile_path}`
          : null,
      })),
      original_language: movie.original_language,
      imdb_id: (movie as any).imdb_id,
      source: "tmdb",
    });
  }

  if (mediaType === "tv") {
    const show = await getTVShow(tmdbId);
    if (!show)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const credits = (show as any).credits;
    const cast = credits?.cast?.slice(0, 12) || [];

    void db.from("titles").upsert(
      {
        tmdb_id: show.id,
        media_type: "tv",
        title: show.name,
        original_title: show.name,
        overview: show.overview || null,
        original_language: show.original_language,
        poster_path: show.poster_path,
        backdrop_path: show.backdrop_path,
        release_date: show.first_air_date || null,
        runtime: show.episode_run_time?.[0] || null,
        number_of_seasons: show.number_of_seasons || null,
        number_of_episodes: show.number_of_episodes || null,
        tmdb_rating: show.vote_average,
        vote_count: show.vote_count,
        popularity: show.popularity,
        status: show.status || null,
        synced_at: new Date().toISOString(),
        last_updated: new Date().toISOString(),
      },
      { onConflict: "tmdb_id,media_type" },
    );

    return NextResponse.json({
      id: show.id,
      db_id: null,
      tmdb_id: show.id,
      type: "series",
      media_type: "tv",
      title: show.name,
      year: new Date(show.first_air_date || "").getFullYear() || 0,
      overview: show.overview,
      poster_url: POSTER_URL(show.poster_path, "w500"),
      backdrop_url: BACKDROP_URL(show.backdrop_path),
      tmdb_rating: show.vote_average,
      tmdb_rating_5: toFive(show.vote_average),
      community_rating: null,
      community_votes: 0,
      vote_count: show.vote_count,
      seasons: show.number_of_seasons,
      episodes: show.number_of_episodes,
      status: show.status,
      genres: show.genres?.map((g: any) => g.name) || [],
      created_by: show.created_by?.map((c: any) => c.name) || [],
      episode_runtime: show.episode_run_time?.[0] || null,
      cast: cast.map((c: any) => ({
        id: c.id,
        name: c.name,
        character: c.character,
        profile_url: c.profile_path
          ? `https://image.tmdb.org/t/p/w185${c.profile_path}`
          : null,
      })),
      original_language: show.original_language,
      source: "tmdb",
    });
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}
