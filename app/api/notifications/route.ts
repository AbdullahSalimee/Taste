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

// GET — fetch notifications for current user
export async function GET(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();

  const { data: notifications } = await db
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  const unreadCount = (notifications || []).filter((n) => !n.read).length;

  return NextResponse.json({
    notifications: notifications || [],
    unread_count: unreadCount,
  });
}

// PATCH — mark notifications as read
export async function PATCH(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { notification_id, mark_all } = body;

  const db = getDb();

  if (mark_all) {
    await db
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false);
  } else if (notification_id) {
    await db
      .from("notifications")
      .update({ read: true })
      .eq("id", notification_id)
      .eq("user_id", userId);
  }

  return NextResponse.json({ ok: true });
}
