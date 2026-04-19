import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
// ── FIX 2: REMOVED import of recordTwin — it uses localStorage (window),
// which doesn't exist on the server. XP is now awarded on the client side
// in app/twins/page.tsx after the POST response comes back. ──

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

// GET — fetch current user's twins
export async function GET(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();

  const { data: twins } = await db
    .from("twins")
    .select("id, match_count, match_percentage, matched_at, twin_user_id")
    .eq("user_id", userId)
    .order("match_percentage", { ascending: false })
    .limit(20);

  if (!twins?.length) return NextResponse.json({ twins: [] });

  // Get profiles of twin users
  const twinIds = twins.map((t) => t.twin_user_id);
  const { data: profiles } = await db
    .from("profiles")
    .select("id, username, display_name, total_films, total_series, archetype")
    .in("id", twinIds);

  const profileMap = Object.fromEntries((profiles || []).map((p) => [p.id, p]));

  return NextResponse.json({
    twins: twins
      .map((t) => ({
        id: t.id,
        match_count: t.match_count,
        match_percentage: t.match_percentage,
        matched_at: t.matched_at,
        user: profileMap[t.twin_user_id] || null,
      }))
      .filter((t) => t.user),
  });
}

// POST — run twin matching algorithm for current user
export async function POST(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();

  // Get current user's watched title IDs
  const { data: myLogs } = await db
    .from("logs")
    .select("title_id")
    .eq("user_id", userId)
    .eq("status", "watched");

  if (!myLogs?.length) {
    return NextResponse.json({
      message: "Log at least 5 films to find twins",
      twins_found: 0,
    });
  }

  const myTitleIds = new Set(myLogs.map((l) => l.title_id));

  // Get all other users who have logs
  const { data: otherLogs } = await db
    .from("logs")
    .select("user_id, title_id")
    .eq("status", "watched")
    .neq("user_id", userId);

  if (!otherLogs?.length) {
    return NextResponse.json({
      message: "No other users to match with yet",
      twins_found: 0,
    });
  }

  // Group by user
  const userTitleMap: Record<string, Set<string>> = {};
  for (const log of otherLogs) {
    if (!userTitleMap[log.user_id]) userTitleMap[log.user_id] = new Set();
    userTitleMap[log.user_id].add(log.title_id);
  }

  // Calculate overlap for each user
  const matches: Array<{ userId: string; count: number; pct: number }> = [];

  for (const [otherId, theirTitles] of Object.entries(userTitleMap)) {
    let overlap = 0;
    for (const titleId of theirTitles) {
      if (myTitleIds.has(titleId)) overlap++;
    }

    if (overlap >= 5) {
      // minimum 5 matching films to be a twin
      const total = new Set([...myTitleIds, ...theirTitles]).size;
      const pct = Math.round((overlap / total) * 100);
      matches.push({ userId: otherId, count: overlap, pct });
    }
  }

  // Sort by overlap count descending
  matches.sort((a, b) => b.count - a.count);
  const topMatches = matches.slice(0, 10);

  // Clear old twins for this user
  await db.from("twins").delete().eq("user_id", userId);

  if (!topMatches.length) {
    return NextResponse.json({
      message: "No twins found yet. Keep logging!",
      twins_found: 0,
    });
  }

  // Insert new twins
  const twinRows = topMatches.map((m) => ({
    user_id: userId,
    twin_user_id: m.userId,
    match_count: m.count,
    match_percentage: m.pct,
  }));

  await db.from("twins").insert(twinRows);

  // ── FIX 2: recordTwin() REMOVED from here — window is undefined on the server.
  // The client (app/twins/page.tsx runMatch function) calls recordTwin() instead.

  // Send notifications to newly matched twins
  const { data: myProfile } = await db
    .from("profiles")
    .select("username, display_name")
    .eq("id", userId)
    .maybeSingle();

  const myName = myProfile?.username || myProfile?.display_name || "Someone";

  for (const match of topMatches.slice(0, 3)) {
    await db.from("notifications").insert({
      user_id: match.userId,
      type: "twin_matched",
      title: "You found a Taste Twin! 👯",
      body: `${myName} has ${match.count} films in common with you (${match.pct}% match).`,
      action_url: "/twins",
      metadata: {
        user_id: userId,
        match_count: match.count,
        match_percentage: match.pct,
      },
    });
  }

  return NextResponse.json({
    twins_found: topMatches.length,
    message: `Found ${topMatches.length} taste twin${topMatches.length !== 1 ? "s" : ""}!`,
  });
}
