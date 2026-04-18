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

// GET /api/stories — get stories from people you follow + your own
export async function GET(request: NextRequest) {
  const userId = await getUserId(request);
  const db = getDb();

  let authorIds: string[] = [];

  if (userId) {
    // Get people current user follows
    const { data: follows } = await db
      .from("follows")
      .select("following_id")
      .eq("follower_id", userId);
    authorIds = (follows || []).map((f) => f.following_id);
    authorIds.push(userId); // include own stories
  }

  // If not logged in or no follows, show all recent stories (community view)
  const query = db
    .from("stories")
    .select(
      `
      id, type, tmdb_id, media_type, title, poster_path, rating, caption, metadata, created_at, expires_at,
      profiles!stories_user_id_fkey(id, username, display_name, avatar_url)
    `,
    )
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(50);

  if (authorIds.length > 0) {
    query.in("user_id", authorIds);
  }

  const { data: stories, error } = await query;

  if (error) return NextResponse.json({ stories: [] });

  // Group by user — each user gets one "story group" with all their active stories
  const grouped: Record<string, any> = {};
  for (const story of stories || []) {
    const profile = story.profiles as any;
    const uid = profile?.id;
    if (!uid) continue;

    if (!grouped[uid]) {
      grouped[uid] = {
        user_id: uid,
        username: profile.username || profile.display_name,
        display_name: profile.display_name,
        avatar_url: profile.avatar_url,
        stories: [],
        latest_at: story.created_at,
        has_unseen: false,
      };
    }
    grouped[uid].stories.push({
      id: story.id,
      type: story.type,
      tmdb_id: story.tmdb_id,
      media_type: story.media_type,
      title: story.title,
      poster_url: story.poster_path
        ? `${TMDB_IMG}/w300${story.poster_path}`
        : null,
      rating: story.rating,
      caption: story.caption,
      metadata: story.metadata,
      created_at: story.created_at,
      expires_at: story.expires_at,
    });
  }

  // If logged in, check which stories are unseen
  if (userId) {
    const storyIds = (stories || []).map((s) => s.id);
    const { data: views } = await db
      .from("story_views")
      .select("story_id")
      .eq("viewer_id", userId)
      .in("story_id", storyIds);
    const viewedIds = new Set((views || []).map((v) => v.story_id));

    for (const group of Object.values(grouped)) {
      group.has_unseen = group.stories.some((s: any) => !viewedIds.has(s.id));
    }
  }

  const result = Object.values(grouped).sort(
    (a: any, b: any) =>
      new Date(b.latest_at).getTime() - new Date(a.latest_at).getTime(),
  );

  return NextResponse.json({ story_groups: result });
}

// POST /api/stories — create a story
export async function POST(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const {
    type,
    tmdb_id,
    media_type,
    title,
    poster_path,
    rating,
    caption,
    metadata,
  } = body;

  if (!type)
    return NextResponse.json({ error: "type required" }, { status: 400 });

  const db = getDb();

  const { data, error } = await db
    .from("stories")
    .insert({
      user_id: userId,
      type,
      tmdb_id: tmdb_id || null,
      media_type: media_type || null,
      title: title || null,
      poster_path: poster_path || null,
      rating: rating || null,
      caption: caption || null,
      metadata: metadata || null,
    })
    .select("id")
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, story_id: data.id });
}

// PATCH /api/stories — mark stories as viewed
export async function PATCH(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { story_ids } = body;
  if (!story_ids?.length) return NextResponse.json({ ok: true });

  const db = getDb();

  const rows = story_ids.map((id: string) => ({
    story_id: id,
    viewer_id: userId,
  }));
  await db
    .from("story_views")
    .upsert(rows, { onConflict: "story_id,viewer_id" });

  return NextResponse.json({ ok: true });
}
