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

async function verifyOwner(db: any, listId: string, userId: string) {
  const { data } = await db
    .from("lists")
    .select("user_id")
    .eq("id", listId)
    .single();
  return data?.user_id === userId;
}

// POST — add entry to list
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ listId: string }> },
) {
  const { listId } = await params;
  const userId = await getUserId(request);
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  if (!(await verifyOwner(db, listId, userId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const { tmdb_id, media_type, note } = body;

  // Look up title UUID
  const { data: title } = await db
    .from("titles")
    .select("id")
    .eq("tmdb_id", tmdb_id)
    .eq("media_type", media_type)
    .maybeSingle();

  if (!title)
    return NextResponse.json(
      { error: "Title not found in DB" },
      { status: 404 },
    );

  // Get current max position
  const { data: maxPos } = await db
    .from("list_entries")
    .select("position")
    .eq("list_id", listId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const position = (maxPos?.position ?? -1) + 1;

  const { data, error } = await db
    .from("list_entries")
    .insert({
      list_id: listId,
      title_id: title.id,
      position,
      note: note || null,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505")
      return NextResponse.json({ error: "Already in list" }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Update list updated_at
  await db
    .from("lists")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", listId);

  return NextResponse.json({ ok: true, entry_id: data.id });
}

// DELETE — remove entry
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ listId: string }> },
) {
  const { listId } = await params;
  const userId = await getUserId(request);
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  if (!(await verifyOwner(db, listId, userId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const { entry_id } = body;

  await db
    .from("list_entries")
    .delete()
    .eq("id", entry_id)
    .eq("list_id", listId);
  return NextResponse.json({ ok: true });
}

// PATCH — reorder entries
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ listId: string }> },
) {
  const { listId } = await params;
  const userId = await getUserId(request);
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  if (!(await verifyOwner(db, listId, userId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const { order } = body; // array of { entry_id, position }

  if (!Array.isArray(order))
    return NextResponse.json({ error: "Invalid" }, { status: 400 });

  await Promise.all(
    order.map(({ entry_id, position }: any) =>
      db
        .from("list_entries")
        .update({ position })
        .eq("id", entry_id)
        .eq("list_id", listId),
    ),
  );

  return NextResponse.json({ ok: true });
}
