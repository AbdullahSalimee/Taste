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

async function getUserId(request: NextRequest): Promise<string | null> {
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

// Monday of current week at 00:00:00 UTC
function weekStart(): string {
  const now = new Date();
  const day = now.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() + diff);
  monday.setUTCHours(0, 0, 0, 0);
  return monday.toISOString();
}

// GET /api/social/leaderboard
// Returns:
//   - leaderboard: weekly log counts for you + everyone you follow, ranked
//   - twin_rivalry: head-to-head vs. your top taste twin this week
export async function GET(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const since = weekStart();

  // 1. Get following list
  const { data: follows } = await db
    .from("follows")
    .select("following_id")
    .eq("follower_id", userId);

  const followingIds = (follows || []).map((f) => f.following_id);
  const allIds = [userId, ...followingIds]; // include self

  // 2. Count logs per person this week
  const { data: weeklyLogs } = await db
    .from("logs")
    .select("user_id, id, watched_at")
    .in("user_id", allIds)
    .gte("watched_at", since)
    .in("status", ["watched", "watching"]);

  // Aggregate counts
  const countMap: Record<string, number> = {};
  for (const id of allIds) countMap[id] = 0;
  for (const log of weeklyLogs || []) {
    countMap[log.user_id] = (countMap[log.user_id] || 0) + 1;
  }

  // 3. Fetch profiles
  const { data: profiles } = await db
    .from("profiles")
    .select("id, username, display_name, avatar_url, archetype")
    .in("id", allIds);

  const profileMap = Object.fromEntries((profiles || []).map((p) => [p.id, p]));

  // 4. Build ranked leaderboard
  const leaderboard = allIds
    .map((id) => ({
      user_id: id,
      username:
        profileMap[id]?.username || profileMap[id]?.display_name || "unknown",
      display_name: profileMap[id]?.display_name || null,
      avatar_url: profileMap[id]?.avatar_url || null,
      archetype: profileMap[id]?.archetype || null,
      count: countMap[id] || 0,
      is_self: id === userId,
    }))
    .sort((a, b) => b.count - a.count)
    .map((entry, i) => ({ ...entry, rank: i + 1 }));

  // 5. Taste twin head-to-head
  const { data: twins } = await db
    .from("twins")
    .select("twin_user_id, match_count, match_percentage")
    .eq("user_id", userId)
    .order("match_percentage", { ascending: false })
    .limit(1);

  let twinRivalry = null;
  if (twins?.length) {
    const twinId = twins[0].twin_user_id;
    const twinProfile = profileMap[twinId];
    const myCount = countMap[userId] || 0;
    const twinCount = countMap[twinId] ?? 0; // may be 0 if they're not in follows

    // If twin wasn't in our follows fetch, get their weekly count separately
    let finalTwinCount = twinCount;
    if (!followingIds.includes(twinId)) {
      const { data: twinLogs } = await db
        .from("logs")
        .select("id")
        .eq("user_id", twinId)
        .gte("watched_at", since)
        .in("status", ["watched", "watching"]);
      finalTwinCount = twinLogs?.length || 0;
    }

    // Fetch twin profile if not already in map
    let finalTwinProfile = twinProfile;
    if (!finalTwinProfile) {
      const { data: tp } = await db
        .from("profiles")
        .select("id, username, display_name, avatar_url, archetype")
        .eq("id", twinId)
        .maybeSingle();
      finalTwinProfile = tp;
    }

    twinRivalry = {
      twin_user_id: twinId,
      username:
        finalTwinProfile?.username || finalTwinProfile?.display_name || "twin",
      avatar_url: finalTwinProfile?.avatar_url || null,
      archetype: finalTwinProfile?.archetype || null,
      match_percentage: twins[0].match_percentage,
      match_count: twins[0].match_count,
      my_count: myCount,
      twin_count: finalTwinCount,
      leader:
        myCount > finalTwinCount
          ? "me"
          : myCount < finalTwinCount
            ? "twin"
            : "tie",
    };
  }

  // 6. Most obscure film logged this week (lowest popularity, voted films only)
  // We define "obscure" as lowest tmdb popularity among this week's logs
  const { data: weekFilms } = await db
    .from("logs")
    .select(
      "title_id, titles(tmdb_id, media_type, title, poster_path, popularity, year)",
    )
    .in("user_id", allIds)
    .gte("watched_at", since)
    .eq("status", "watched")
    .not("title_id", "is", null);

  const obscureWinner =
    (weekFilms || [])
      .map((l: any) => ({ ...(l.titles || {}), user_id: l.user_id }))
      .filter((t: any) => t.popularity > 0 && t.popularity < 20)
      .sort((a: any, b: any) => a.popularity - b.popularity)[0] || null;

  const obscure = obscureWinner
    ? {
        title: obscureWinner.title,
        year: obscureWinner.year,
        poster_url: obscureWinner.poster_path
          ? `${TMDB_IMG}/w185${obscureWinner.poster_path}`
          : null,
        popularity: obscureWinner.popularity,
        logged_by: profileMap[obscureWinner.user_id]?.username || "someone",
      }
    : null;

  return NextResponse.json({
    week_start: since,
    leaderboard,
    twin_rivalry: twinRivalry,
    most_obscure: obscure,
  });
}
