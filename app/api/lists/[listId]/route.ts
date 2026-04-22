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

// GET /api/lists/[listId] — full list with entries
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ listId: string }> },
) {
  const { listId } = await params;
  const db = getDb();
  const viewerId = await getUserId(request);

  const { data: list, error } = await db
    .from("lists")
    .select(
      `
      id, title, description, is_ranked, is_public, cover_poster_path,
      tags, like_count, created_at, updated_at, user_id,
      profiles!lists_user_id_fkey(id, username, display_name)
    `,
    )
    .eq("id", listId)
    .single();

  if (error || !list)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!list.is_public && list.user_id !== viewerId) {
    return NextResponse.json({ error: "Private list" }, { status: 403 });
  }

  const { data: entries } = await db
    .from("list_entries")
    .select(
      `
      id, position, note, added_at,
      titles(id, tmdb_id, media_type, title, year, poster_path, tmdb_rating_5, overview)
    `,
    )
    .eq("list_id", listId)
    .order("position", { ascending: true });

  let isLiked = false;
  if (viewerId) {
    const { data: like } = await db
      .from("list_likes")
      .select("user_id")
      .eq("user_id", viewerId)
      .eq("list_id", listId)
      .maybeSingle();
    isLiked = !!like;
  }

  const formattedEntries = (entries || []).map((e: any) => ({
    id: e.id,
    position: e.position,
    note: e.note,
    added_at: e.added_at,
    title_id: e.titles?.id,
    tmdb_id: e.titles?.tmdb_id,
    media_type: e.titles?.media_type,
    title: e.titles?.title,
    year: e.titles?.year,
    poster_url: e.titles?.poster_path
      ? `${TMDB_IMG}/w342${e.titles.poster_path}`
      : null,
    tmdb_rating_5: e.titles?.tmdb_rating_5,
    overview: e.titles?.overview,
  }));

  return NextResponse.json({
    list: { ...list, is_owner: list.user_id === viewerId, is_liked: isLiked },
    entries: formattedEntries,
  });
}

// PATCH /api/lists/[listId] — update list metadata
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ listId: string }> },
) {
  const { listId } = await params;
  const userId = await getUserId(request);
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { title, description, is_ranked, is_public, tags } = body;

  const db = getDb();
  const { error } = await db
    .from("lists")
    .update({
      title,
      description,
      is_ranked,
      is_public,
      tags,
      updated_at: new Date().toISOString(),
    })
    .eq("id", listId)
    .eq("user_id", userId);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// DELETE /api/lists/[listId] — delete list
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ listId: string }> },
) {
  const { listId } = await params;
  const userId = await getUserId(request);
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  await db.from("lists").delete().eq("id", listId).eq("user_id", userId);
  return NextResponse.json({ ok: true });
}
