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

// GET /api/feed/following — logs + reviews from people you follow
export async function GET(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const page = parseInt(request.nextUrl.searchParams.get("page") || "1");
  const limit = 30;
  const offset = (page - 1) * limit;

  const db = getDb();

  // Get following list
  const { data: follows } = await db
    .from("follows")
    .select("following_id")
    .eq("follower_id", userId);

  const followingIds = (follows || []).map((f) => f.following_id);

  if (!followingIds.length) {
    return NextResponse.json({
      items: [],
      page,
      has_more: false,
      following_count: 0,
    });
  }

  // Fetch recent logs from followed users
  const { data: logs } = await db
    .from("logs")
    .select(
      `
      id, status, watched_at, note, rewatch,
      titles(tmdb_id, media_type, title, poster_path, year),
      profiles!logs_user_id_fkey(id, username, display_name, avatar_url)
    `,
    )
    .in("user_id", followingIds)
    .order("watched_at", { ascending: false })
    .range(offset, offset + limit - 1);

  // Fetch recent reviews from followed users
  const { data: reviews } = await db
    .from("reviews")
    .select(
      `
      id, body, rating, likes, created_at, is_spoiler,
      titles(tmdb_id, media_type, title, poster_path, year),
      profiles!reviews_user_id_fkey(id, username, display_name, avatar_url)
    `,
    )
    .in("user_id", followingIds)
    .eq("is_hidden", false)
    .order("created_at", { ascending: false })
    .range(offset, offset + Math.floor(limit / 2) - 1);

  const items: any[] = [];

  for (const log of logs || []) {
    const title = log.titles as any;
    const profile = log.profiles as any;
    items.push({
      id: `log_${log.id}`,
      item_type: "log",
      author_id: profile?.id,
      author: profile?.username || profile?.display_name || "someone",
      author_display: profile?.display_name || profile?.username,
      avatar_url: profile?.avatar_url || null,
      status: log.status,
      note: log.note,
      rewatch: log.rewatch,
      date: log.watched_at,
      tmdb_id: title?.tmdb_id,
      media_type: title?.media_type,
      title: title?.title,
      year: title?.year,
      poster_url: title?.poster_path
        ? `${TMDB_IMG}/w185${title.poster_path}`
        : null,
    });
  }

  for (const review of reviews || []) {
    const title = review.titles as any;
    const profile = review.profiles as any;
    items.push({
      id: `review_${review.id}`,
      item_type: "review",
      author_id: profile?.id,
      author: profile?.username || profile?.display_name || "someone",
      author_display: profile?.display_name || profile?.username,
      avatar_url: profile?.avatar_url || null,
      body: review.body,
      rating: review.rating,
      likes: review.likes,
      is_spoiler: review.is_spoiler,
      date: review.created_at,
      tmdb_id: title?.tmdb_id,
      media_type: title?.media_type,
      title: title?.title,
      year: title?.year,
      poster_url: title?.poster_path
        ? `${TMDB_IMG}/w185${title.poster_path}`
        : null,
    });
  }

  // Sort merged by date
  items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return NextResponse.json({
    items: items.slice(0, limit),
    page,
    has_more: items.length >= limit,
    following_count: followingIds.length,
  });
}
