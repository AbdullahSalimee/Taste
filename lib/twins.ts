/**
 * lib/twins.ts
 * Taste Twin matching system - connects users with similar watch history
 */

import { supabase } from "./supabase";
import { getUser } from "./db";
import { createNotification } from "./notifications";
export interface TwinMatch {
  user_id: string;
  twin_user_id: string;
  match_count: number; // Number of matching watched titles
  match_percentage: number; // % of overlap
  matched_at: string;
  profiles?: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
}

/**
 * Find potential twins for the current user
 * A twin is someone who has watched 5+ of the same titles
 */
export async function findTwins(): Promise<TwinMatch[]> {
  const user = await getUser();
  if (!user) return [];

  // Get user's watched titles
  const { data: myLogs } = await supabase
    .from("logs")
    .select("title_id")
    .eq("user_id", user.id)
    .eq("status", "watched");

  if (!myLogs || myLogs.length < 5) return []; // Need at least 5 watched

  const myTitleIds = myLogs.map((l) => l.title_id);

  // Find other users who watched the same titles
  const { data: matches } = await supabase.rpc("find_taste_twins", {
    p_user_id: user.id,
    p_title_ids: myTitleIds,
    p_min_matches: 5,
  });

  return matches ?? [];
}

/**
 * Get existing twin connections
 */
export async function getMyTwins(): Promise<TwinMatch[]> {
  const user = await getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("twins")
    .select(
      "*, profiles!twins_twin_user_id_fkey(username, display_name, avatar_url)",
    )
    .eq("user_id", user.id)
    .order("match_count", { ascending: false });

  return data ?? [];
}

/**
 * Check and save new twin matches
 * Returns newly discovered twins
 */
export async function checkForNewTwins(): Promise<TwinMatch[]> {
  const user = await getUser();
  if (!user) return [];

  const potentialTwins = await findTwins();
  const existingTwins = await getMyTwins();
  const existingIds = new Set(existingTwins.map((t) => t.twin_user_id));

  const newTwins: TwinMatch[] = [];

  // Inside the for loop, after both inserts and notifications
  for (const twin of potentialTwins) {
    if (!existingIds.has(twin.twin_user_id)) {
      // Save the twin match
      await supabase.from("twins").insert({
        user_id: user.id,
        twin_user_id: twin.twin_user_id,
        match_count: twin.match_count,
        match_percentage: twin.match_percentage,
      });

      // Create reciprocal twin match
      await supabase.from("twins").insert({
        user_id: twin.twin_user_id,
        twin_user_id: user.id,
        match_count: twin.match_count,
        match_percentage: twin.match_percentage,
      });

      // === ADD THIS LINE ===
      recordTwin(); // Grants +25 XP for finding a new Taste Twin

      // Get current user's profile for notification
      const { data: myProfile } = await supabase
        .from("profiles")
        .select("username, display_name")
        .eq("id", user.id)
        .single();

      // ... rest of the notification code stays the same

      // Notify the twin
      await createNotification(
        twin.twin_user_id,
        "twin_matched",
        "🎬 You found a Taste Twin!",
        `${myProfile?.display_name || "Someone"} has watched ${twin.match_count} of the same titles as you`,
        `/profile/${myProfile?.username}`,
        { twin_user_id: user.id, match_count: twin.match_count },
      );

      // Notify current user
      await createNotification(
        user.id,
        "twin_matched",
        "🎬 You found a Taste Twin!",
        `You and ${twin.profiles?.display_name || "someone"} have watched ${twin.match_count} titles in common`,
        `/profile/${twin.profiles?.username}`,
        { twin_user_id: twin.twin_user_id, match_count: twin.match_count },
      );

      newTwins.push(twin);
    }
  }

  return newTwins;
}

/**
 * Get shared watched titles between user and twin
 */
export async function getSharedTitles(
  twinUserId: string,
  limit = 10,
): Promise<any[]> {
  const user = await getUser();
  if (!user) return [];

  const { data } = await supabase.rpc("get_shared_titles", {
    p_user_id: user.id,
    p_twin_user_id: twinUserId,
    p_limit: limit,
  });

  return data ?? [];
}
