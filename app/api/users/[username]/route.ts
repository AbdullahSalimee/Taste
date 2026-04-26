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

async function getViewerId(request: NextRequest): Promise<string | null> {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const {
    data: { user },
  } = await createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  ).auth.getUser(auth.slice(7));
  return user?.id ?? null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> },
) {
  const { username } = await params;
  const viewerId = await getViewerId(request);
  const db = getDb();

  // Fetch profile by username
  const { data: profile, error } = await db
    .from("profiles")
    .select("id, username, display_name, bio, avatar_url, created_at")
    .ilike("username", username)
    .maybeSingle();

  if (error || !profile) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const userId = profile.id;

  // Parallel: follow counts + is_following + logs + recent activity
  const [followersRes, followingRes, isFollowingRes, logsRes, recentLogsRes] =
    await Promise.all([
      db
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", userId),
      db
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", userId),
      viewerId && viewerId !== userId
        ? db
            .from("follows")
            .select("follower_id")
            .eq("follower_id", viewerId)
            .eq("following_id", userId)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      // Summary counts
      db
        .from("logs")
        .select(`id, status, watched_at, titles(media_type)`, {
          count: "exact",
        })
        .eq("user_id", userId)
        .in("status", ["watched", "watching", "dropped"]),
      // Recent logs with title info for activity display
      db
        .from("logs")
        .select(
          `id, status, watched_at, note,
     titles(tmdb_id, media_type, title, poster_path, year)`,
        )
        .eq("user_id", userId)
        .in("status", ["watched", "watching"])
        .order("watched_at", { ascending: false })
        .limit(24),
    ]);

  const allLogs = logsRes.data || [];
  const films = allLogs.filter(
    (l: any) => (l.titles as any)?.media_type === "movie",
  );
  const series = allLogs.filter(
    (l: any) => (l.titles as any)?.media_type === "tv",
  );
  const avgRating = 0; // user_rating lives in user_ratings table, not logs

  // Format recent logs
  const recentActivity = (recentLogsRes.data || []).map((log: any) => {
    const title = log.titles as any;
    return {
      id: log.id,
      status: log.status,
      watched_at: log.watched_at,
      note: log.note,
      user_rating: null,
      media_type: title?.media_type ?? "movie",
      title: title?.title,
      year: title?.year,
      tmdb_id: title?.tmdb_id,
      poster_url: title?.poster_path
        ? `${TMDB_IMG}/w185${title.poster_path}`
        : null,
    };
  });

  return NextResponse.json({
    profile: {
      id: userId,
      username: profile.username,
      display_name: profile.display_name,
      bio: profile.bio,
      avatar_url: profile.avatar_url,
      member_since: profile.created_at,
    },
    stats: {
      total_films: films.length,
      total_series: series.length,
      total_watched: allLogs.filter((l) => l.status === "watched").length,
      avg_rating: avgRating > 0 ? parseFloat(avgRating.toFixed(2)) : null,
    },
    social: {
      followers: followersRes.count ?? 0,
      following: followingRes.count ?? 0,
      is_following: !!isFollowingRes.data,
      is_own_profile: viewerId === userId,
    },
    recent_activity: recentActivity,
  });
}
