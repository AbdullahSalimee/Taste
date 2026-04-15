import { NextRequest, NextResponse } from "next/server";
import { getMovie, getTVShow, POSTER_URL, BACKDROP_URL } from "@/lib/tmdb";

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

  if (type === "movie") {
    const movie = await getMovie(tmdbId);
    if (!movie)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const credits = (movie as any).credits;
    const director = credits?.crew?.find((c: any) => c.job === "Director");
    const cast = credits?.cast?.slice(0, 12) || [];

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
    });
  }

  if (type === "tv") {
    const show = await getTVShow(tmdbId);
    if (!show)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const credits = (show as any).credits;
    const cast = credits?.cast?.slice(0, 12) || [];

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
    });
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}
