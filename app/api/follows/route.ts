import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

// GET /api/follows?target_id=xxx — check if following + get counts
export async function GET(request: NextRequest) {
  const userId = await getUserId(request);
  const targetId = request.nextUrl.searchParams.get("target_id");
  if (!targetId)
    return NextResponse.json({ error: "target_id required" }, { status: 400 });

  const db = getDb();

  const [followersRes, followingRes, isFollowingRes] = await Promise.all([
    db
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", targetId),
    db
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", targetId),
    userId
      ? db
          .from("follows")
          .select("follower_id")
          .eq("follower_id", userId)
          .eq("following_id", targetId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return NextResponse.json({
    followers: followersRes.count ?? 0,
    following: followingRes.count ?? 0,
    is_following: !!isFollowingRes.data,
  });
}

// POST /api/follows — follow a user
export async function POST(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { target_id } = body;
  if (!target_id || target_id === userId)
    return NextResponse.json({ error: "Invalid target" }, { status: 400 });

  const db = getDb();

  const { error } = await db.from("follows").insert({
    follower_id: userId,
    following_id: target_id,
  });

  if (error && error.code !== "23505")
    // ignore duplicate
    return NextResponse.json({ error: error.message }, { status: 500 });

  // Notify the followed user
  await db.from("notifications").insert({
    user_id: target_id,
    type: "tag_mention",
    title: "New follower",
    body: "Someone started following you.",
    action_url: "/profile",
    metadata: { follower_id: userId },
  });

  return NextResponse.json({ ok: true, following: true });
}

// DELETE /api/follows — unfollow
export async function DELETE(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { target_id } = body;

  const db = getDb();
  await db
    .from("follows")
    .delete()
    .eq("follower_id", userId)
    .eq("following_id", target_id);

  return NextResponse.json({ ok: true, following: false });
}
