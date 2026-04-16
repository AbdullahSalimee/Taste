import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

async function resolveTitleId(
  db: ReturnType<typeof getDb>,
  titleId: string,
  tmdbId: number,
  mediaType: string,
): Promise<string | null> {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(titleId)) return titleId;
  if (!tmdbId) return null;
  const { data } = await db
    .from("titles")
    .select("id")
    .eq("tmdb_id", tmdbId)
    .eq("media_type", mediaType)
    .maybeSingle();
  return data?.id ?? null;
}

// GET — fetch reviews (public, no auth needed)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ titleId: string }> },
) {
  const { titleId } = await params;
  const { searchParams } = request.nextUrl;
  const tmdbId = parseInt(searchParams.get("tmdb_id") || "0");
  const mediaType = searchParams.get("media_type") || "movie";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 20;
  const offset = (page - 1) * limit;

  const db = getDb();
  const dbTitleId = await resolveTitleId(db, titleId, tmdbId, mediaType);

  if (!dbTitleId) {
    return NextResponse.json({ reviews: [], total: 0 });
  }

  // Step 1: fetch reviews using service role (bypasses RLS)
  const {
    data: reviews,
    error,
    count,
  } = await db
    .from("reviews")
    .select("id, body, rating, is_spoiler, likes, created_at, user_id", {
      count: "exact",
    })
    .eq("title_id", dbTitleId)
    .eq("is_hidden", false)
    .order("likes", { ascending: false })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Reviews fetch error:", error.message);
    return NextResponse.json({ reviews: [], total: 0, error: error.message });
  }

  if (!reviews || reviews.length === 0) {
    return NextResponse.json({ reviews: [], total: 0, title_id: dbTitleId });
  }

  // Step 2: fetch author names separately
  const userIds = [
    ...new Set(reviews.map((r: any) => r.user_id).filter(Boolean)),
  ];
  const authorMap: Record<string, string> = {};

  if (userIds.length > 0) {
    const { data: profiles } = await db
      .from("profiles")
      .select("id, username, display_name")
      .in("id", userIds);

    for (const p of profiles || []) {
      authorMap[p.id] = p.username || p.display_name || "anonymous";
    }
  }

  return NextResponse.json({
    reviews: reviews.map((r: any) => ({
      id: r.id,
      body: r.body,
      rating: r.rating,
      is_spoiler: r.is_spoiler,
      likes: r.likes,
      created_at: r.created_at,
      author: authorMap[r.user_id] || "anonymous",
    })),
    total: count || 0,
    title_id: dbTitleId,
  });
}

// POST — submit a review
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ titleId: string }> },
) {
  const { titleId } = await params;
  const body = await request.json().catch(() => ({}));
  const { text, rating, is_spoiler, tmdb_id, media_type, author } = body;

  if (!text?.trim()) {
    return NextResponse.json(
      { error: "Review text is required" },
      { status: 400 },
    );
  }

  const db = getDb();
  const dbTitleId = await resolveTitleId(
    db,
    titleId,
    parseInt(tmdb_id || "0"),
    media_type || "movie",
  );

  if (!dbTitleId) {
    return NextResponse.json(
      { error: "Title not found in database" },
      { status: 404 },
    );
  }

  // Get auth user from Authorization header
  const authHeader = request.headers.get("authorization");
  let userId: string | null = null;
  let authorName = author || "anonymous";

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const anonClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    const {
      data: { user },
    } = await anonClient.auth.getUser(token);
    userId = user?.id || null;

    if (userId) {
      // Get username
      const { data: profile } = await db
        .from("profiles")
        .select("username, display_name")
        .eq("id", userId)
        .maybeSingle();
      authorName = profile?.username || profile?.display_name || authorName;
    }
  }

  if (userId) {
    // Use service role to bypass RLS for insert
    const { data, error } = await db
      .from("reviews")
      .insert({
        user_id: userId,
        title_id: dbTitleId,
        body: text.trim(),
        rating: rating || null,
        is_spoiler: is_spoiler || false,
      })
      .select("id, body, rating, is_spoiler, created_at")
      .single();

    if (error) {
      console.error("Review insert error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      review: { ...data, author: authorName, likes: 0 },
    });
  }

  // Anonymous
  return NextResponse.json({
    ok: true,
    anonymous: true,
    review: {
      id: `local_${Date.now()}`,
      body: text.trim(),
      rating: rating || null,
      is_spoiler: is_spoiler || false,
      likes: 0,
      created_at: new Date().toISOString(),
      author: author || "anonymous",
    },
  });
}

// PATCH — like/unlike
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ titleId: string }> },
) {
  const body = await request.json().catch(() => ({}));
  const { review_id, action } = body;
  if (!review_id)
    return NextResponse.json({ error: "review_id required" }, { status: 400 });

  const db = getDb();
  const { data: current } = await db
    .from("reviews")
    .select("likes")
    .eq("id", review_id)
    .single();
  const newLikes =
    action === "like"
      ? (current?.likes || 0) + 1
      : Math.max((current?.likes || 0) - 1, 0);
  await db.from("reviews").update({ likes: newLikes }).eq("id", review_id);

  return NextResponse.json({ ok: true, likes: newLikes });
}
