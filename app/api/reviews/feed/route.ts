import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const TMDB_IMG = "https://image.tmdb.org/t/p";

function getDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

async function getUserId(request: NextRequest): Promise<string | null> {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const { data: { user } } = await createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  ).auth.getUser(auth.slice(7));
  return user?.id ?? null;
}

// GET /api/reviews/feed — reviews from people you follow + community
export async function GET(request: NextRequest) {
  const db = getDb();
  const userId = await getUserId(request);
  const page = parseInt(request.nextUrl.searchParams.get("page") || "1");
  const type = request.nextUrl.searchParams.get("type") || "community"; // "following" | "community"
  const limit = 20;
  const offset = (page - 1) * limit;

  let authorIds: string[] | null = null;

  if (type === "following" && userId) {
    const { data: follows } = await db
      .from("follows")
      .select("following_id")
      .eq("follower_id", userId);
    authorIds = (follows || []).map(f => f.following_id);
    if (!authorIds.length) {
      return NextResponse.json({ reviews: [], page, has_more: false, following_count: 0 });
    }
  }

  let query = db
    .from("reviews")
    .select(`
      id, body, rating, is_spoiler, likes, created_at, user_id,
      titles(tmdb_id, media_type, title, poster_path, year, overview)
    `, { count: "exact" })
    .eq("is_hidden", false)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (authorIds) {
    query = query.in("user_id", authorIds);
  }

  const { data: reviews, error, count } = await query;

  if (error) return NextResponse.json({ reviews: [], page, has_more: false });

  // Get author profiles
  const userIds = [...new Set((reviews || []).map((r: any) => r.user_id).filter(Boolean))];
  const authorMap: Record<string, any> = {};
  if (userIds.length) {
    const { data: profiles } = await db
      .from("profiles")
      .select("id, username, display_name, avatar_url")
      .in("id", userIds);
    for (const p of profiles || []) authorMap[p.id] = p;
  }

  // Get which reviews current user liked
  const likedSet = new Set<string>();
  if (userId && reviews?.length) {
    const { data: likes } = await db
      .from("review_likes")
      .select("review_id")
      .eq("user_id", userId)
      .in("review_id", reviews.map((r: any) => r.id));
    for (const l of likes || []) likedSet.add(l.review_id);
  }

  const formatted = (reviews || []).map((r: any) => {
    const t = r.titles;
    const a = authorMap[r.user_id] || {};
    return {
      id: r.id,
      body: r.body,
      rating: r.rating,
      is_spoiler: r.is_spoiler,
      likes: r.likes,
      created_at: r.created_at,
      is_liked: likedSet.has(r.id),
      is_own: r.user_id === userId,
      author: a.username || a.display_name || "anonymous",
      author_display: a.display_name || a.username,
      avatar_url: a.avatar_url || null,
      author_id: r.user_id,
      tmdb_id: t?.tmdb_id,
      media_type: t?.media_type,
      title: t?.title,
      year: t?.year,
      poster_url: t?.poster_path ? `${TMDB_IMG}/w185${t.poster_path}` : null,
    };
  });

  return NextResponse.json({
    reviews: formatted,
    page,
    has_more: (count || 0) > offset + limit,
    total: count || 0,
  });
}