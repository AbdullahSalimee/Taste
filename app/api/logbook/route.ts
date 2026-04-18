import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const TMDB_IMG = "https://image.tmdb.org/t/p";

function getDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

// GET /api/logbook — user's watch logs
export async function GET(request: NextRequest) {
  const page = parseInt(request.nextUrl.searchParams.get("page") || "1");
  const status = request.nextUrl.searchParams.get("status");
  const limit = 30;
  const offset = (page - 1) * limit;

  // Get user from Authorization header
  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();

  // Verify token and get user
  const token = authHeader.replace("Bearer ", "");
  const {
    data: { user },
    error: authError,
  } = await db.auth.getUser(token);

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get user's profile to find their ID
const { data: profile } = await db
  .from("profiles")
  .select("id")
  .eq("id", user.id) // ✅ profiles.id IS the auth user id
  .single();
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  // Build query
  let query = db
    .from("logs")
    .select(
      `
      id, status, watched_at, note, rewatch, rewatch_count,
      titles ( tmdb_id, media_type, title, poster_path, year ),
      episodes ( name, season_number, episode_number )
    `,
    )
    .eq("user_id", profile.id)
    .order("watched_at", { ascending: false });

  // Apply status filter if provided
  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data: logs, error } = await query.range(offset, offset + limit - 1);

  if (error) {
    console.error("Logbook fetch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Format logs
  const formatted = (logs || []).map((log: any) => {
    const title = log.titles;
    const episode = log.episodes;

    return {
      id: log.id,
      status: log.status,
      watched_at: log.watched_at,
      note: log.note,
      rewatch: log.rewatch,
      rewatch_count: log.rewatch_count,
      title: title?.title,
      tmdb_id: title?.tmdb_id,
      media_type: title?.media_type,
      year: title?.year,
      poster_url: title?.poster_path
        ? `${TMDB_IMG}/w185${title.poster_path}`
        : null,
      episode_title: episode
        ? `S${episode.season_number}E${episode.episode_number}: ${episode.name}`
        : null,
    };
  });

  return NextResponse.json({
    logs: formatted,
    page,
    has_more: formatted.length === limit,
  });
}
