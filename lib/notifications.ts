/**
 * lib/notifications.ts
 * Real-time notification system for Taste
 */

import { supabase } from "./supabase";
import { getUser } from "./db";

export type NotificationType =
  | "twin_matched" // Found a taste twin
  | "message" // New DM
  | "review_like" // Someone liked your review
  | "review_reply" // Someone replied to your review
  | "log_like" // Someone liked your log
  | "tag_mention"; // Tagged in a post/comment

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  action_url: string | null;
  read: boolean;
  created_at: string;
  metadata?: Record<string, any>;
}

/**
 * Get all notifications for the current user
 */
export async function getNotifications(limit = 20): Promise<Notification[]> {
  const user = await getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  return data ?? [];
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(): Promise<number> {
  const user = await getUser();
  if (!user) return 0;

  const { count } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("read", false);

  return count ?? 0;
}

/**
 * Mark notification(s) as read
 */
export async function markAsRead(notificationIds: string[]): Promise<void> {
  const user = await getUser();
  if (!user) return;

  await supabase
    .from("notifications")
    .update({ read: true })
    .in("id", notificationIds)
    .eq("user_id", user.id);
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(): Promise<void> {
  const user = await getUser();
  if (!user) return;

  await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", user.id)
    .eq("read", false);
}

/**
 * Subscribe to real-time notification updates
 */
export function subscribeToNotifications(
  callback: (notification: Notification) => void,
) {
  const channel = supabase
    .channel("notifications")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
      },
      (payload) => {
        callback(payload.new as Notification);
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Create a notification (internal use for triggers)
 */
export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  actionUrl?: string,
  metadata?: Record<string, any>,
): Promise<void> {
  await supabase.from("notifications").insert({
    user_id: userId,
    type,
    title,
    body,
    action_url: actionUrl ?? null,
    metadata: metadata ?? null,
  });
}
