import { NextRequest, NextResponse } from "next/server";
import { getMovie, getTVShow, POSTER_URL, BACKDROP_URL } from "@/lib/tmdb";
import { createClient } from "@supabase/supabase-js";

// Convert /10 to /5 with FULL decimal precision — no rounding
function toFive(rating: number): number {
  return Math.round((rating / 2) * 100) / 100;
}

// Combined rating: weighted average of TMDB votes + community votes
// Formula: (tmdb_count × tmdb_rating + community_count × community_avg_as_10) / (tmdb_count + community_count)
// Result is returned as /5
function combinedRating(
  tmdbRating10: number, // TMDB rating out of 10
  tmdbVotes: number, // TMDB vote count
  communityRating5: number | null, // our community avg out of 5
  communityVotes: number, // our community vote count
): { rating: number; total_votes: number } {
  if (!communityRating5 || communityVotes === 0) {
    return { rating: toFive(tmdbRating10), total_votes: tmdbVotes };
  }
  const communityRating10 = communityRating5 * 2;
  const totalVotes = tmdbVotes + communityVotes;
  const weightedAvg10 =
    (tmdbRating10 * tmdbVotes + communityRating10 * communityVotes) /
    totalVotes;
  return {
    rating: Math.round((weightedAvg10 / 2) * 100) / 100, // /5 with 2 decimal places
    total_votes: totalVotes,
  };
}

function getDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
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

  if (type === "movie") {
    const movie = await getMovie(tmdbId);
    if (!movie)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const credits = (movie as any).credits;
    const director = credits?.crew?.find((c: any) => c.job === "Director");
    const cast = credits?.cast?.slice(0, 12) || [];

    // Fetch community rating from Supabase
    const db = getDb();
    const { data: titleData } = await db
      .from("titles")
      .select("community_rating, community_votes")
      .eq("tmdb_id", tmdbId)
      .eq("media_type", "movie")
      .maybeSingle();

    const communityRating = titleData?.community_rating ?? null;
    const communityVotes = titleData?.community_votes ?? 0;
    const combined = combinedRating(
      movie.vote_average,
      movie.vote_count,
      communityRating,
      communityVotes,
    );

    return NextResponse.json({
      id: movie.id,
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
      community_rating: communityRating,
      community_votes: communityVotes,
      combined_rating: combined.rating, // the blended /5 rating shown to users
      combined_votes: combined.total_votes, // total vote count (tmdb + community)
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
    });
  }

  if (type === "tv") {
    const show = await getTVShow(tmdbId);
    if (!show)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const credits = (show as any).credits;
    const cast = credits?.cast?.slice(0, 12) || [];

    // Fetch community rating from Supabase
    const db = getDb();
    const { data: titleData } = await db
      .from("titles")
      .select("community_rating, community_votes")
      .eq("tmdb_id", tmdbId)
      .eq("media_type", "tv")
      .maybeSingle();

    const communityRating = titleData?.community_rating ?? null;
    const communityVotes = titleData?.community_votes ?? 0;
    const combined = combinedRating(
      show.vote_average,
      show.vote_count,
      communityRating,
      communityVotes,
    );

    return NextResponse.json({
      id: show.id,
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
      community_rating: communityRating,
      community_votes: communityVotes,
      combined_rating: combined.rating,
      combined_votes: combined.total_votes,
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
    });
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}

// POST — save a user rating, updates community avg which gets blended with TMDB
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> },
) {
  const { type, id } = await params;
  const tmdbId = parseInt(id);
  const mediaType = type === "movie" ? "movie" : "tv";

  const body = await request.json().catch(() => ({}));
  const rating = parseFloat(body.rating);
  if (isNaN(rating) || rating < 0.5 || rating > 5) {
    return NextResponse.json(
      { error: "Rating must be 0.5–5" },
      { status: 400 },
    );
  }

  // Verify auth
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const {
    data: { user },
  } = await anonClient.auth.getUser(authHeader.slice(7));
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();

  // Get title UUID
  const { data: titleRow } = await db
    .from("titles")
    .select("id")
    .eq("tmdb_id", tmdbId)
    .eq("media_type", mediaType)
    .maybeSingle();

  if (!titleRow) {
    // Title not in DB yet — upsert it first then retry
    return NextResponse.json(
      { error: "Title not synced yet. Visit the page again to sync it." },
      { status: 404 },
    );
  }

  // Upsert user rating (trigger auto-recalculates community_rating on titles table)
  const { error } = await db.from("user_ratings").upsert(
    {
      user_id: user.id,
      title_id: titleRow.id,
      rating,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,title_id" },
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Return updated combined rating
  const { data: updatedTitle } = await db
    .from("titles")
    .select("community_rating, community_votes, tmdb_rating, vote_count")
    .eq("id", titleRow.id)
    .single();

  const tmdbRating = updatedTitle?.tmdb_rating ?? 0;
  const tmdbVotes = updatedTitle?.vote_count ?? 0;
  const communityRating = updatedTitle?.community_rating ?? null;
  const communityVotes = updatedTitle?.community_votes ?? 0;
  const combined = combinedRating(
    tmdbRating,
    tmdbVotes,
    communityRating,
    communityVotes,
  );

  return NextResponse.json({
    ok: true,
    combined_rating: combined.rating,
    combined_votes: combined.total_votes,
    community_rating: communityRating,
    community_votes: communityVotes,
  });
}
