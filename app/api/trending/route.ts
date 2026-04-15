import { NextRequest, NextResponse } from "next/server";
import {
  getTrendingMovies,
  getTrendingTV,
  getTopRatedMovies,
  getTopRatedTV,
  POSTER_URL,
} from "@/lib/tmdb";

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get("type") || "all";

  const [trendingMovies, trendingTV, topMovies, topTV] = await Promise.all([
    type !== "tv" ? getTrendingMovies("week") : Promise.resolve(null),
    type !== "film" ? getTrendingTV("week") : Promise.resolve(null),
    type !== "tv" ? getTopRatedMovies() : Promise.resolve(null),
    type !== "film" ? getTopRatedTV() : Promise.resolve(null),
  ]);

  const formatMovie = (r: any) => ({
    id: r.id,
    tmdb_id: r.id,
    type: "film",
    title: r.title,
    year: new Date(r.release_date || "").getFullYear() || 0,
    poster_url: POSTER_URL(r.poster_path, "w300"),
    backdrop_url: r.backdrop_path
      ? `https://image.tmdb.org/t/p/w780${r.backdrop_path}`
      : null,
    tmdb_rating: r.vote_average,
    overview: r.overview,
    popularity: r.popularity,
  });

  const formatTV = (r: any) => ({
    id: r.id,
    tmdb_id: r.id,
    type: "series",
    title: r.name,
    year: new Date(r.first_air_date || "").getFullYear() || 0,
    poster_url: POSTER_URL(r.poster_path, "w300"),
    backdrop_url: r.backdrop_path
      ? `https://image.tmdb.org/t/p/w780${r.backdrop_path}`
      : null,
    tmdb_rating: r.vote_average,
    overview: r.overview,
    popularity: r.popularity,
  });

  return NextResponse.json({
    trending_movies: (trendingMovies?.results || [])
      .slice(0, 12)
      .map(formatMovie),
    trending_tv: (trendingTV?.results || []).slice(0, 12).map(formatTV),
    top_movies: (topMovies?.results || []).slice(0, 12).map(formatMovie),
    top_tv: (topTV?.results || []).slice(0, 12).map(formatTV),
  });
}
