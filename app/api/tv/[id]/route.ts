import { NextRequest, NextResponse } from "next/server";
import { getTVShow, getTVSeason } from "@/lib/tmdb";
import { createClient } from "@supabase/supabase-js";

function getDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

// GET /api/tv/[id]/progress — full heatmap data for all seasons
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const tmdbId = parseInt(id);
  if (isNaN(tmdbId))
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const show = await getTVShow(tmdbId);
  if (!show) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const seasonCount = show.number_of_seasons || 1;
  // Fetch all seasons (up to 15 to avoid timeouts)
  const maxSeasons = Math.min(seasonCount, 15);
  const seasonNumbers = Array.from({ length: maxSeasons }, (_, i) => i + 1);

  const seasons = await Promise.all(
    seasonNumbers.map(async (n) => {
      try {
        const data = await getTVSeason(tmdbId, n);
        if (!data) return null;
        return {
          number: n,
          name: (data as any).name || `Season ${n}`,
          air_date: (data as any).air_date,
          episode_count: (data as any).episodes?.length || 0,
          episodes: ((data as any).episodes || []).map((ep: any) => ({
            ep: ep.episode_number,
            title: ep.name,
            rating: ep.vote_average || 0,
            rating_5: Math.round((ep.vote_average / 2) * 2) / 2,
            air_date: ep.air_date,
            overview: ep.overview,
            runtime: ep.runtime,
            still_path: ep.still_path
              ? `https://image.tmdb.org/t/p/w300${ep.still_path}`
              : null,
          })),
        };
      } catch {
        return null;
      }
    }),
  );

  return NextResponse.json({
    tmdb_id: tmdbId,
    title: show.name,
    total_seasons: seasonCount,
    total_episodes: show.number_of_episodes,
    seasons: seasons.filter(Boolean),
  });
}
