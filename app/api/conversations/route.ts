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

// GET — list all conversations for the current user
export async function GET(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();

  const { data: participations } = await db
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", userId);

  if (!participations?.length) return NextResponse.json({ conversations: [] });

  const convIds = participations.map((p) => p.conversation_id);

  const { data: conversations } = await db
    .from("conversations")
    .select("id, last_message, last_message_at, created_at")
    .in("id", convIds)
    .order("last_message_at", { ascending: false, nullsFirst: false });

  if (!conversations?.length) return NextResponse.json({ conversations: [] });

  const { data: allParticipants } = await db
    .from("conversation_participants")
    .select("conversation_id, user_id")
    .in("conversation_id", convIds);

  const otherUserIds = [
    ...new Set(
      (allParticipants || [])
        .filter((p) => p.user_id !== userId)
        .map((p) => p.user_id),
    ),
  ];

  const { data: profiles } = await db
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .in("id", otherUserIds);

  const profileMap = Object.fromEntries((profiles || []).map((p) => [p.id, p]));

  // Count unread messages per conversation
  const { data: unreadCounts } = await db
    .from("messages")
    .select("conversation_id, id")
    .in("conversation_id", convIds)
    .neq("sender_id", userId)
    .eq("read", false);

  const unreadMap: Record<string, number> = {};
  for (const msg of unreadCounts || []) {
    unreadMap[msg.conversation_id] = (unreadMap[msg.conversation_id] || 0) + 1;
  }

  const result = conversations.map((conv) => {
    const otherIds = (allParticipants || [])
      .filter((p) => p.conversation_id === conv.id && p.user_id !== userId)
      .map((p) => p.user_id);
    const others = otherIds.map((id) => profileMap[id]).filter(Boolean);

    return {
      id: conv.id,
      last_message: conv.last_message,
      last_message_at: conv.last_message_at,
      unread_count: unreadMap[conv.id] || 0,
      others,
    };
  });

  return NextResponse.json({ conversations: result });
}

// POST — create or find a conversation with another user
export async function POST(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { other_user_id } = body;
  if (!other_user_id)
    return NextResponse.json(
      { error: "other_user_id required" },
      { status: 400 },
    );

  const db = getDb();

  const { data: myConvs } = await db
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", userId);

  const { data: theirConvs } = await db
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", other_user_id);

  const myIds = new Set((myConvs || []).map((c) => c.conversation_id));
  const existing = (theirConvs || []).find((c) => myIds.has(c.conversation_id));

  if (existing) {
    return NextResponse.json({
      conversation_id: existing.conversation_id,
      existing: true,
    });
  }

  const { data: conv, error } = await db
    .from("conversations")
    .insert({ participant_ids: [userId, other_user_id] })
    .select("id")
    .single();

  if (error || !conv)
    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 },
    );

  await db.from("conversation_participants").insert([
    { conversation_id: conv.id, user_id: userId },
    { conversation_id: conv.id, user_id: other_user_id },
  ]);

  return NextResponse.json({ conversation_id: conv.id, existing: false });
}
