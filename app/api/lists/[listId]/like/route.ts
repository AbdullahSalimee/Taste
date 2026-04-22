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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ listId: string }> },
) {
  const { listId } = await params;
  const userId = await getUserId(request);
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const { data: existing } = await db
    .from("list_likes")
    .select("user_id")
    .eq("user_id", userId)
    .eq("list_id", listId)
    .maybeSingle();

  if (existing) {
    // Unlike
    await db
      .from("list_likes")
      .delete()
      .eq("user_id", userId)
      .eq("list_id", listId);
    await db
      .from("lists")
      .update({ like_count: db.rpc("greatest", {}) })
      .eq("id", listId);
    // Use raw decrement
    await db.rpc("decrement_list_likes", { p_list_id: listId }).catch(() => {
      db.from("lists")
        .select("like_count")
        .eq("id", listId)
        .single()
        .then(({ data }: any) => {
          db.from("lists")
            .update({ like_count: Math.max(0, (data?.like_count || 1) - 1) })
            .eq("id", listId);
        });
    });
    return NextResponse.json({ ok: true, liked: false });
  } else {
    // Like
    await db.from("list_likes").insert({ user_id: userId, list_id: listId });
    const { data: current } = await db
      .from("lists")
      .select("like_count")
      .eq("id", listId)
      .single();
    await db
      .from("lists")
      .update({ like_count: (current?.like_count || 0) + 1 })
      .eq("id", listId);
    return NextResponse.json({ ok: true, liked: true });
  }
}
