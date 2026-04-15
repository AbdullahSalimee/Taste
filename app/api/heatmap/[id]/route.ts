import { NextRequest, NextResponse } from "next/server";
import { getTVShow, getTVSeason } from "@/lib/tmdb";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const tmdbId = parseInt(params.id);
  if (isNaN(tmdbId))
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const show = await getTVShow(tmdbId);
  if (!show) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const seasonCount = Math.min(show.number_of_seasons || 1, 5); // cap at 5 seasons for perf
  const seasonNumbers = Array.from({ length: seasonCount }, (_, i) => i + 1);

  const seasons = await Promise.all(
    seasonNumbers.map(async (n) => {
      const data = await getTVSeason(tmdbId, n);
      if (!data) return null;
      return {
        number: n,
        episodes: (data.episodes || []).map((ep: any) => ({
          ep: ep.episode_number,
          title: ep.name,
          rating: ep.vote_average || 0,
          air_date: ep.air_date,
          overview: ep.overview,
        })),
      };
    }),
  );

  return NextResponse.json({
    tmdb_id: tmdbId,
    title: show.name,
    seasons: seasons.filter(Boolean),
  });
}
