import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

// GET /api/follows/list?user_id=xxx&type=followers|following
export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("user_id");
  const type = request.nextUrl.searchParams.get("type") || "followers"; // "followers" | "following"
  const viewerId = await getViewerId(request);

  if (!userId)
    return NextResponse.json({ error: "user_id required" }, { status: 400 });

  const db = getDb();

  let profileIds: string[] = [];

  if (type === "followers") {
    const { data } = await db
      .from("follows")
      .select("follower_id")
      .eq("following_id", userId);
    profileIds = (data || []).map((r) => r.follower_id);
  } else {
    const { data } = await db
      .from("follows")
      .select("following_id")
      .eq("follower_id", userId);
    profileIds = (data || []).map((r) => r.following_id);
  }

  if (!profileIds.length) return NextResponse.json({ users: [] });

  const { data: profiles } = await db
    .from("profiles")
    .select("id, username, display_name, bio, avatar_url")
    .in("id", profileIds);

  // Check which ones the viewer is already following
  let viewerFollowingSet = new Set<string>();
  if (viewerId) {
    const { data: vf } = await db
      .from("follows")
      .select("following_id")
      .eq("follower_id", viewerId)
      .in("following_id", profileIds);
    viewerFollowingSet = new Set((vf || []).map((r) => r.following_id));
  }

  const users = (profiles || []).map((p) => ({
    id: p.id,
    username: p.username,
    display_name: p.display_name,
    bio: p.bio,
    avatar_url: p.avatar_url,
    is_following: viewerFollowingSet.has(p.id),
    is_self: viewerId === p.id,
  }));

  return NextResponse.json({ users });
}
