import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const TMDB_IMG = "https://image.tmdb.org/t/p";

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

// GET /api/lists?user_id=xxx  — fetch lists for a user
// GET /api/lists?discover=true — public lists feed
export async function GET(request: NextRequest) {
  const db = getDb();
  const userId = request.nextUrl.searchParams.get("user_id");
  const discover = request.nextUrl.searchParams.get("discover");
  const viewerId = await getUserId(request);

  let query = db
    .from("lists")
    .select(
      `
      id, title, description, is_ranked, is_public, cover_poster_path,
      tags, like_count, created_at, updated_at,
      profiles!lists_user_id_fkey(id, username, display_name)
    `,
    )
    .order("updated_at", { ascending: false })
    .limit(50);

  if (userId) {
    if (userId === viewerId) {
      query = query.eq("user_id", userId);
    } else {
      query = query.eq("user_id", userId).eq("is_public", true);
    }
  } else if (discover) {
    query = query.eq("is_public", true);
  } else {
    return NextResponse.json({ lists: [] });
  }

  const { data: lists, error } = await query;
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  // For each list, get entry count + first 4 posters
  const listIds = (lists || []).map((l: any) => l.id);
  const { data: entries } = await db
    .from("list_entries")
    .select("list_id, titles(poster_path, media_type)")
    .in("list_id", listIds)
    .order("position", { ascending: true });

  const entryMap: Record<string, any[]> = {};
  for (const e of entries || []) {
    if (!entryMap[e.list_id]) entryMap[e.list_id] = [];
    entryMap[e.list_id].push(e);
  }

  // Check if viewer liked each list
  let likedSet = new Set<string>();
  if (viewerId && listIds.length) {
    const { data: likes } = await db
      .from("list_likes")
      .select("list_id")
      .eq("user_id", viewerId)
      .in("list_id", listIds);
    likedSet = new Set((likes || []).map((l: any) => l.list_id));
  }

  const result = (lists || []).map((list: any) => {
    const entries = entryMap[list.id] || [];
    const posters = entries
      .slice(0, 4)
      .map((e: any) =>
        e.titles?.poster_path
          ? `${TMDB_IMG}/w185${e.titles.poster_path}`
          : null,
      )
      .filter(Boolean);
    return {
      ...list,
      entry_count: entries.length,
      preview_posters: posters,
      is_liked: likedSet.has(list.id),
    };
  });

  return NextResponse.json({ lists: result });
}

// POST /api/lists — create a list
export async function POST(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const {
    title,
    description,
    is_ranked = false,
    is_public = true,
    tags = [],
  } = body;

  if (!title?.trim())
    return NextResponse.json({ error: "Title required" }, { status: 400 });

  const db = getDb();
  const { data, error } = await db
    .from("lists")
    .insert({
      user_id: userId,
      title: title.trim(),
      description,
      is_ranked,
      is_public,
      tags,
    })
    .select("id, title")
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, list: data });
}
