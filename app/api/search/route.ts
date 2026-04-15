import { NextRequest, NextResponse } from "next/server";
import { searchMulti, POSTER_URL } from "@/lib/tmdb";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") || "";
  if (q.length < 2) return NextResponse.json({ results: [] });

  const data = await searchMulti(q);
  if (!data) return NextResponse.json({ results: [] });

  const results = (data.results || [])
    .filter((r: any) => r.media_type === "movie" || r.media_type === "tv")
    .slice(0, 8)
    .map((r: any) => {
      const isMovie = r.media_type === "movie";
      return {
        id: r.id,
        tmdb_id: r.id,
        type: isMovie ? "film" : "series",
        media_type: r.media_type,
        title: isMovie ? r.title : r.name,
        year:
          new Date(isMovie ? r.release_date : r.first_air_date).getFullYear() ||
          0,
        poster_url: POSTER_URL(r.poster_path, "w185"),
        tmdb_rating: r.vote_average,
        overview: r.overview,
      };
    });

  return NextResponse.json({ results });
}
