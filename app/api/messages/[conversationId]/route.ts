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

// GET /api/messages/[conversationId] — load messages
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  const { conversationId } = await params;
  const userId = await getUserId(request);
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();

  // Verify user is a participant
  const { data: participant } = await db
    .from("conversation_participants")
    .select("conversation_id")
    .eq("conversation_id", conversationId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!participant)
    return NextResponse.json({ error: "Not a participant" }, { status: 403 });

  const { data: messages } = await db
    .from("messages")
    .select("id, content, content_type, metadata, read, created_at, sender_id")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(100);

  // Get sender profiles
  const senderIds = [...new Set((messages || []).map((m) => m.sender_id))];
  const { data: profiles } = await db
    .from("profiles")
    .select("id, username, display_name")
    .in("id", senderIds);

  const profileMap = Object.fromEntries((profiles || []).map((p) => [p.id, p]));

  // Mark messages from others as read
  await db
    .from("messages")
    .update({ read: true })
    .eq("conversation_id", conversationId)
    .neq("sender_id", userId);

  return NextResponse.json({
    messages: (messages || []).map((m) => ({
      id: m.id,
      content: m.content,
      content_type: m.content_type,
      metadata: m.metadata,
      read: m.read,
      created_at: m.created_at,
      sender_id: m.sender_id,
      is_mine: m.sender_id === userId,
      sender_name:
        profileMap[m.sender_id]?.username ||
        profileMap[m.sender_id]?.display_name ||
        "unknown",
    })),
  });
}

// POST /api/messages/[conversationId] — send a message
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  const { conversationId } = await params;
  const userId = await getUserId(request);
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { content, content_type = "text", metadata } = body;

  if (!content?.trim())
    return NextResponse.json({ error: "Content required" }, { status: 400 });

  const db = getDb();

  // Verify participant
  const { data: participant } = await db
    .from("conversation_participants")
    .select("conversation_id")
    .eq("conversation_id", conversationId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!participant)
    return NextResponse.json({ error: "Not a participant" }, { status: 403 });

  // Insert message
  const { data: message, error } = await db
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: userId,
      content: content.trim(),
      content_type,
      metadata: metadata || null,
    })
    .select("id, content, content_type, metadata, created_at")
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  // Update conversation last_message
  await db
    .from("conversations")
    .update({
      last_message:
        content_type === "text"
          ? content.trim().slice(0, 100)
          : `Shared a ${content_type}`,
      last_message_at: new Date().toISOString(),
    })
    .eq("id", conversationId);

  // Create notification for the other participant
  const { data: others } = await db
    .from("conversation_participants")
    .select("user_id")
    .eq("conversation_id", conversationId)
    .neq("user_id", userId);

  const { data: senderProfile } = await db
    .from("profiles")
    .select("username, display_name")
    .eq("id", userId)
    .maybeSingle();

  const senderName =
    senderProfile?.username || senderProfile?.display_name || "Someone";

  for (const other of others || []) {
    await db.from("notifications").insert({
      user_id: other.user_id,
      type: "message",
      title: `New message from ${senderName}`,
      body:
        content_type === "text"
          ? content.trim().slice(0, 80)
          : `Shared a ${content_type}`,
      action_url: `/messages/${conversationId}`,
      metadata: { conversation_id: conversationId, sender_id: userId },
    });
  }

  return NextResponse.json({
    ok: true,
    message: { ...message, is_mine: true, sender_id: userId },
  });
}
