import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } },
  );
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

// GET — fetch reviews for a list
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ listId: string }> },
) {
  const { listId } = await params;
  const db = getDb();
  const viewerId = await getUserId(request);
  const page = parseInt(request.nextUrl.searchParams.get("page") || "1");
  const limit = 20;
  const offset = (page - 1) * limit;

  const {
    data: reviews,
    error,
    count,
  } = await db
    .from("list_reviews")
    .select("id, body, rating, likes, created_at, user_id", { count: "exact" })
    .eq("list_id", listId)
    .eq("is_hidden", false)
    .order("likes", { ascending: false })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ reviews: [], total: 0 });
  }
  if (!reviews?.length) {
    return NextResponse.json({ reviews: [], total: 0 });
  }

  // Fetch author profiles
  const userIds = [
    ...new Set(reviews.map((r: any) => r.user_id).filter(Boolean)),
  ];
  const authorMap: Record<
    string,
    { username: string; avatar_url: string | null }
  > = {};
  const likedSet = new Set<string>();

  if (userIds.length > 0) {
    const { data: profiles } = await db
      .from("profiles")
      .select("id, username, display_name, avatar_url")
      .in("id", userIds);
    for (const p of profiles || []) {
      authorMap[p.id] = {
        username: p.username || p.display_name || "anonymous",
        avatar_url: p.avatar_url,
      };
    }
  }

  // Which reviews has the viewer liked?
  if (viewerId && reviews.length > 0) {
    const { data: likes } = await db
      .from("list_review_likes")
      .select("review_id")
      .eq("user_id", viewerId)
      .in(
        "review_id",
        reviews.map((r: any) => r.id),
      );
    for (const l of likes || []) likedSet.add(l.review_id);
  }

  return NextResponse.json({
    reviews: reviews.map((r: any) => ({
      id: r.id,
      body: r.body,
      rating: r.rating,
      likes: r.likes,
      created_at: r.created_at,
      author: authorMap[r.user_id]?.username || "anonymous",
      avatar_url: authorMap[r.user_id]?.avatar_url || null,
      is_liked: likedSet.has(r.id),
      is_own: r.user_id === viewerId,
    })),
    total: count || 0,
  });
}

// POST — write or update a review (one per user per list, upsert)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ listId: string }> },
) {
  const { listId } = await params;
  const userId = await getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { text, rating } = body;

  if (!text?.trim() || text.trim().length < 10) {
    return NextResponse.json(
      { error: "Review must be at least 10 characters" },
      { status: 400 },
    );
  }

  const db = getDb();

  const { data, error } = await db
    .from("list_reviews")
    .upsert(
      {
        list_id: listId,
        user_id: userId,
        body: text.trim(),
        rating: rating || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "list_id,user_id" },
    )
    .select("id, body, rating, likes, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: profile } = await db
    .from("profiles")
    .select("username, display_name, avatar_url")
    .eq("id", userId)
    .maybeSingle();

  return NextResponse.json({
    ok: true,
    review: {
      ...data,
      author: profile?.username || profile?.display_name || "anonymous",
      avatar_url: profile?.avatar_url || null,
      is_liked: false,
      is_own: true,
    },
  });
}

// PATCH — like or unlike a review
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ listId: string }> },
) {
  const userId = await getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { review_id, action } = body;
  if (!review_id) {
    return NextResponse.json({ error: "review_id required" }, { status: 400 });
  }

  const db = getDb();

  if (action === "like") {
    await db
      .from("list_review_likes")
      .upsert({ user_id: userId, review_id }, { ignoreDuplicates: true });
    const { data: current } = await db
      .from("list_reviews")
      .select("likes")
      .eq("id", review_id)
      .single();
    await db
      .from("list_reviews")
      .update({ likes: (current?.likes || 0) + 1 })
      .eq("id", review_id);
    return NextResponse.json({ ok: true, liked: true });
  } else {
    await db
      .from("list_review_likes")
      .delete()
      .eq("user_id", userId)
      .eq("review_id", review_id);
    const { data: current } = await db
      .from("list_reviews")
      .select("likes")
      .eq("id", review_id)
      .single();
    await db
      .from("list_reviews")
      .update({ likes: Math.max(0, (current?.likes || 1) - 1) })
      .eq("id", review_id);
    return NextResponse.json({ ok: true, liked: false });
  }
}

// DELETE — delete own review
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ listId: string }> },
) {
  const userId = await getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { review_id } = body;
  if (!review_id) {
    return NextResponse.json({ error: "review_id required" }, { status: 400 });
  }

  const db = getDb();
  await db
    .from("list_reviews")
    .delete()
    .eq("id", review_id)
    .eq("user_id", userId);

  return NextResponse.json({ ok: true });
}
