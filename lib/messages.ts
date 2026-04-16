/**
 * lib/messages.ts
 * Instagram-style DM system for sharing logs, reviews, and tags
 */

import { supabase } from "./supabase";
import { getUser } from "./db";
import { createNotification } from "./notifications";

export type MessageContentType =
  | "text" // Regular text message
  | "log_share" // Shared log entry
  | "review_share" // Shared review
  | "title_rec"; // Title recommendation

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  content_type: MessageContentType;
  metadata?: {
    // For log_share
    log_id?: string;
    tmdb_id?: number;
    title?: string;
    poster_url?: string;
    user_rating?: number;
    note?: string;

    // For review_share
    review_id?: string;
    review_body?: string;
    review_rating?: number;

    // For title_rec
    title_id?: string;
    title_name?: string;

    // Tagged users
    tagged_users?: string[];
  };
  read: boolean;
  created_at: string;
  sender?: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
}

export interface Conversation {
  id: string;
  participant_ids: string[];
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
  created_at: string;
  participants?: Array<{
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  }>;
}

/**
 * Get all conversations for current user
 */
export async function getConversations(): Promise<Conversation[]> {
  const user = await getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("conversations")
    .select(
      `
      *,
      conversation_participants!inner(
        user:profiles(id, username, display_name, avatar_url)
      )
    `,
    )
    .contains("participant_ids", [user.id])
    .order("last_message_at", { ascending: false });

  return (data ?? []).map((conv: any) => ({
    ...conv,
    participants: conv.conversation_participants
      .map((p: any) => p.user)
      .filter((u: any) => u.id !== user.id),
  }));
}

/**
 * Get or create a conversation with another user
 */
export async function getOrCreateConversation(
  otherUserId: string,
): Promise<string | null> {
  const user = await getUser();
  if (!user) return null;

  // Check if conversation exists
  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .contains("participant_ids", [user.id, otherUserId])
    .maybeSingle();

  if (existing) return existing.id;

  // Create new conversation
  const { data: newConv } = await supabase
    .from("conversations")
    .insert({
      participant_ids: [user.id, otherUserId],
    })
    .select("id")
    .single();

  if (!newConv) return null;

  // Add participants
  await supabase.from("conversation_participants").insert([
    { conversation_id: newConv.id, user_id: user.id },
    { conversation_id: newConv.id, user_id: otherUserId },
  ]);

  return newConv.id;
}

/**
 * Get messages in a conversation
 */
export async function getMessages(
  conversationId: string,
  limit = 50,
): Promise<Message[]> {
  const { data } = await supabase
    .from("messages")
    .select(
      "*, sender:profiles!messages_sender_id_fkey(username, display_name, avatar_url)",
    )
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).reverse();
}

/**
 * Send a text message
 */
export async function sendTextMessage(
  conversationId: string,
  content: string,
  taggedUsers: string[] = [],
): Promise<Message | null> {
  const user = await getUser();
  if (!user) return null;

  const { data: message } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content,
      content_type: "text",
      metadata: taggedUsers.length > 0 ? { tagged_users: taggedUsers } : null,
    })
    .select()
    .single();

  if (!message) return null;

  // Update conversation
  await supabase
    .from("conversations")
    .update({
      last_message: content.substring(0, 100),
      last_message_at: new Date().toISOString(),
    })
    .eq("id", conversationId);

  // Notify tagged users
  if (taggedUsers.length > 0) {
    const { data: senderProfile } = await supabase
      .from("profiles")
      .select("display_name, username")
      .eq("id", user.id)
      .single();

    for (const taggedId of taggedUsers) {
      await createNotification(
        taggedId,
        "tag_mention",
        "You were tagged in a message",
        `${senderProfile?.display_name} tagged you in a message`,
        `/messages/${conversationId}`,
        { message_id: message.id },
      );
    }
  }

  return message;
}

/**
 * Share a log entry
 */
export async function shareLog(
  conversationId: string,
  logData: {
    log_id: string;
    tmdb_id: number;
    title: string;
    poster_url: string | null;
    user_rating: number | null;
    note: string | null;
  },
): Promise<Message | null> {
  const user = await getUser();
  if (!user) return null;

  const content = `Shared: ${logData.title}`;

  const { data: message } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content,
      content_type: "log_share",
      metadata: logData,
    })
    .select()
    .single();

  if (!message) return null;

  // Update conversation
  await supabase
    .from("conversations")
    .update({
      last_message: content,
      last_message_at: new Date().toISOString(),
    })
    .eq("id", conversationId);

  return message;
}

/**
 * Share a review
 */
export async function shareReview(
  conversationId: string,
  reviewData: {
    review_id: string;
    title: string;
    review_body: string;
    review_rating: number | null;
  },
): Promise<Message | null> {
  const user = await getUser();
  if (!user) return null;

  const content = `Shared review of ${reviewData.title}`;

  const { data: message } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content,
      content_type: "review_share",
      metadata: reviewData,
    })
    .select()
    .single();

  if (!message) return null;

  await supabase
    .from("conversations")
    .update({
      last_message: content,
      last_message_at: new Date().toISOString(),
    })
    .eq("id", conversationId);

  return message;
}

/**
 * Mark messages as read
 */
export async function markMessagesAsRead(
  conversationId: string,
): Promise<void> {
  const user = await getUser();
  if (!user) return;

  await supabase
    .from("messages")
    .update({ read: true })
    .eq("conversation_id", conversationId)
    .neq("sender_id", user.id)
    .eq("read", false);
}

/**
 * Subscribe to new messages in a conversation
 */
export function subscribeToMessages(
  conversationId: string,
  callback: (message: Message) => void,
) {
  const channel = supabase
    .channel(`messages:${conversationId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        callback(payload.new as Message);
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Search users by username
 */
export async function searchUsers(query: string): Promise<any[]> {
  if (!query.trim()) return [];

  const { data } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .ilike("username", `%${query}%`)
    .limit(10);

  return data ?? [];
}
