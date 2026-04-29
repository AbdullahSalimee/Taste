import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMG = "https://image.tmdb.org/t/p";

function getDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

async function tmdbFetch(endpoint: string) {
  const key = process.env.TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_API_KEY || "";
  if (!key) return null;
  const url = new URL(`${TMDB_BASE}${endpoint}`);
  url.searchParams.set("api_key", key);
  url.searchParams.set("language", "en-US");
  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
  if (!res.ok) return null;
  return res.json();
}

async function getUserId(request: NextRequest): Promise<string | null> {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const { data: { user } } = await createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  ).auth.getUser(auth.slice(7));
  return user?.id ?? null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const personId = parseInt(id);
  if (isNaN(personId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const userId = await getUserId(request);
  const db = getDb();

  // Fetch person details + combined credits
  const [person, movieCredits, tvCredits] = await Promise.all([
    tmdbFetch(`/person/${personId}`),
    tmdbFetch(`/person/${personId}/movie_credits`),
    tmdbFetch(`/person/${personId}/tv_credits`),
  ]);

  if (!person) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Process movie credits (cast + crew/director)
  const movieCast = (movieCredits?.cast || [])
    .filter((m: any) => m.poster_path && m.vote_count > 10)
    .sort((a: any, b: any) => b.popularity - a.popularity)
    .slice(0, 40)
    .map((m: any) => ({
      id: m.id,
      tmdb_id: m.id,
      media_type: "movie",
      type: "film",
      title: m.title,
      year: m.release_date ? new Date(m.release_date).getFullYear() : 0,
      poster_url: m.poster_path ? `${TMDB_IMG}/w185${m.poster_path}` : null,
      tmdb_rating: m.vote_average || 0,
      tmdb_rating_5: Math.round((m.vote_average / 2) * 10) / 10,
      character: m.character || null,
      role: "actor",
      popularity: m.popularity,
    }));

  const movieDirected = (movieCredits?.crew || [])
    .filter((m: any) => m.job === "Director" && m.poster_path)
    .sort((a: any, b: any) => b.popularity - a.popularity)
    .map((m: any) => ({
      id: m.id,
      tmdb_id: m.id,
      media_type: "movie",
      type: "film",
      title: m.title,
      year: m.release_date ? new Date(m.release_date).getFullYear() : 0,
      poster_url: m.poster_path ? `${TMDB_IMG}/w185${m.poster_path}` : null,
      tmdb_rating: m.vote_average || 0,
      tmdb_rating_5: Math.round((m.vote_average / 2) * 10) / 10,
      role: "director",
      popularity: m.popularity,
    }));

  const tvCast = (tvCredits?.cast || [])
    .filter((m: any) => m.poster_path && m.vote_count > 5)
    .sort((a: any, b: any) => b.popularity - a.popularity)
    .slice(0, 20)
    .map((m: any) => ({
      id: m.id,
      tmdb_id: m.id,
      media_type: "tv",
      type: "series",
      title: m.name,
      year: m.first_air_date ? new Date(m.first_air_date).getFullYear() : 0,
      poster_url: m.poster_path ? `${TMDB_IMG}/w185${m.poster_path}` : null,
      tmdb_rating: m.vote_average || 0,
      tmdb_rating_5: Math.round((m.vote_average / 2) * 10) / 10,
      character: m.character || null,
      role: "actor",
      popularity: m.popularity,
    }));

  // If user is authenticated, compute personal stats
  let userStats = null;
  if (userId) {
    // Get all TMDB IDs from this person's filmography
    const allTmdbIds = [
      ...movieCast.map((m: any) => m.tmdb_id),
      ...movieDirected.map((m: any) => m.tmdb_id),
      ...tvCast.map((m: any) => m.tmdb_id),
    ];
    const uniqueIds = [...new Set(allTmdbIds)];

    // Find which titles user has logged
    const { data: titleRows } = await db
      .from("titles")
      .select("id, tmdb_id, media_type")
      .in("tmdb_id", uniqueIds);

    const titleIdMap: Record<string, string> = {};
    for (const t of titleRows || []) {
      titleIdMap[`${t.tmdb_id}-${t.media_type}`] = t.id;
    }

    const titleUUIDs = Object.values(titleIdMap);

    if (titleUUIDs.length > 0) {
      const [logsRes, ratingsRes] = await Promise.all([
        db.from("logs")
          .select("title_id, status, watched_at")
          .eq("user_id", userId)
          .in("title_id", titleUUIDs),
        db.from("user_ratings")
          .select("title_id, rating")
          .eq("user_id", userId)
          .in("title_id", titleUUIDs),
      ]);

      const watchedTitleIds = new Set((logsRes.data || [])
        .filter((l: any) => l.status === "watched")
        .map((l: any) => l.title_id));

      const ratingMap: Record<string, number> = {};
      for (const r of ratingsRes.data || []) {
        ratingMap[r.title_id] = r.rating;
      }

      const watchedCount = watchedTitleIds.size;
      const ratings = Object.values(ratingMap);
      const avgRating = ratings.length > 0
        ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
        : null;

      // Build watched set by tmdb_id for frontend overlay
      const watchedTmdbIds = new Set<number>();
      const userRatingByTmdbId: Record<number, number> = {};

      for (const t of titleRows || []) {
        if (watchedTitleIds.has(t.id)) watchedTmdbIds.add(t.tmdb_id);
        if (ratingMap[t.id]) userRatingByTmdbId[t.tmdb_id] = ratingMap[t.id];
      }

      userStats = {
        watched_count: watchedCount,
        total_titles: uniqueIds.length,
        avg_rating: avgRating,
        watched_tmdb_ids: Array.from(watchedTmdbIds),
        ratings_by_tmdb_id: userRatingByTmdbId,
      };
    }
  }

  return NextResponse.json({
    person: {
      id: person.id,
      name: person.name,
      biography: person.biography,
      birthday: person.birthday,
      deathday: person.deathday,
      place_of_birth: person.place_of_birth,
      profile_url: person.profile_path ? `${TMDB_IMG}/w300${person.profile_path}` : null,
      known_for_department: person.known_for_department,
      popularity: person.popularity,
    },
    movie_cast: movieCast,
    movie_directed: movieDirected,
    tv_cast: tvCast,
    user_stats: userStats,
  });
}