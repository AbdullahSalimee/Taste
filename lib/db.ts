/**
 * lib/db.ts
 * Unified data layer for Taste.
 *
 * Strategy:
 *   - All reads try Supabase first; fall back to localStorage cache.
 *   - All writes go to Supabase when user is authenticated, plus update localStorage cache.
 *   - Unauthenticated users get a full localStorage experience (nothing is lost on sign-in — we migrate).
 */

import { supabase, posterUrl, backdropUrl } from "./supabase";
import { invalidateGenreCache } from "./cinephile-level";

// ── localStorage keys ─────────────────────────────────────────────────────────
const LS_LOGS = "taste_logs";
const LS_WATCHLIST = "taste_watchlist";
const LS_RATINGS = "taste_ratings";
const LS_USER = "taste_user";

function lsGet<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}
function lsSet(key: string, val: unknown) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {}
}
function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
function emit(event: string) {
  if (typeof window !== "undefined")
    window.dispatchEvent(new CustomEvent(event));
}

// ── Auth helpers ──────────────────────────────────────────────────────────────

export async function getUser() {
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUp(
  email: string,
  password: string,
  username: string,
) {
  const result = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username } },
  });
  return result;
}

export async function signOut() {
  return supabase.auth.signOut();
}

// ── Title lookup ──────────────────────────────────────────────────────────────

/**
 * Get a title record from Supabase by tmdb_id + media_type.
 * Returns null if not found (not yet synced).
 */
export async function getDbTitle(tmdbId: number, mediaType: "movie" | "tv") {
  const { data } = await supabase
    .from("titles")
    .select("*")
    .eq("tmdb_id", tmdbId)
    .eq("media_type", mediaType)
    .maybeSingle();
  return data ?? null;
}

// ── Ratings ───────────────────────────────────────────────────────────────────

/**
 * Get the current user's rating for a title (/5).
 * Falls back to localStorage for unauth users.
 */
export async function getUserRating(tmdbId: number): Promise<number | null> {
  const user = await getUser();
  if (user) {
    const { data } = await supabase
      .from("user_ratings")
      .select("rating")
      .eq("user_id", user.id)
      .eq(
        "title_id",
        (await tmdbToUuid(tmdbId, "movie")) ?? (await tmdbToUuid(tmdbId, "tv")),
      )
      .maybeSingle();
    return data?.rating ?? null;
  }
  // localStorage fallback
  const ratings = lsGet<Record<string, number>>(LS_RATINGS, {});
  return ratings[String(tmdbId)] ?? null;
}

/**
 * Save/update a rating (/5).
 */
export async function saveRating(
  tmdbId: number,
  mediaType: "movie" | "tv",
  rating: number,
): Promise<void> {
  // Always persist to localStorage immediately (instant feedback)
  const ratings = lsGet<Record<string, number>>(LS_RATINGS, {});
  ratings[String(tmdbId)] = rating;
  lsSet(LS_RATINGS, ratings);

  const user = await getUser();
  if (!user) return;

  const titleId = await tmdbToUuid(tmdbId, mediaType);
  if (!titleId) return;

  await supabase.from("user_ratings").upsert(
    {
      user_id: user.id,
      title_id: titleId,
      rating,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,title_id" },
  );
}

/**
 * Get community rating stats for a title.
 */
export async function getCommunityRating(
  tmdbId: number,
  mediaType: "movie" | "tv",
) {
  const { data } = await supabase
    .from("titles")
    .select("community_rating, community_votes, tmdb_rating_5, vote_count")
    .eq("tmdb_id", tmdbId)
    .eq("media_type", mediaType)
    .maybeSingle();
  return data ?? null;
}

// ── Logs ──────────────────────────────────────────────────────────────────────

export interface LogEntry {
  id: string;
  tmdb_id: number;
  media_type?: "movie" | "tv";
  type: "film" | "series"; // alias
  title: string;
  poster_url: string | null;
  year: number;
  tmdb_rating: number;
  user_rating: number | null;
  note: string | null;
  status: "watched" | "watching" | "dropped" | "on_hold";
  watched_at: string;
  genres?: string[];
  director?: string;
}

export function getLogs(): LogEntry[] {
  return lsGet<LogEntry[]>(LS_LOGS, []);
}

export async function addLog(
  entry: Omit<LogEntry, "id" | "watched_at">,
): Promise<LogEntry> {
  const newEntry: LogEntry = {
    ...entry,
    id: genId(),
    watched_at: new Date().toISOString(),
  };

  

  // localStorage write
  const logs = getLogs();
  logs.unshift(newEntry);
  lsSet(LS_LOGS, logs);
  emit("taste_logs_changed");

  
  // Supabase write
  const user = await getUser();
  if (user) {
    const mt = entry.media_type ?? (entry.type === "series" ? "tv" : "movie");
    const titleId = await tmdbToUuid(entry.tmdb_id, mt);

    if (titleId) {
      await supabase.from("logs").insert({
        user_id: user.id,
        title_id: titleId,
        status: entry.status,
        note: entry.note,
        watched_at: newEntry.watched_at,
      });

      // ── Auto-save genres if missing ──────────────────────────────────────
      // If this title has no genres in title_genres yet, fetch from TMDB and save.
      // This self-heals the 44k titles that are missing genre data.
      const { data: existingGenres } = await supabase
        .from("title_genres")
        .select("title_id")
        .eq("title_id", titleId)
        .limit(1);

     if (!existingGenres?.length) {
       try {
         const tmdbKey = process.env.NEXT_PUBLIC_TMDB_API_KEY || "";
         console.log("[genre-save] tmdbKey:", tmdbKey ? "found" : "MISSING");
         console.log("[genre-save] titleId:", titleId);
         console.log("[genre-save] tmdb_id:", entry.tmdb_id);
         console.log("[genre-save] mt:", mt);

         const endpoint =
           mt === "movie"
             ? `https://api.themoviedb.org/3/movie/${entry.tmdb_id}`
             : `https://api.themoviedb.org/3/tv/${entry.tmdb_id}`;
         const res = await fetch(
           `${endpoint}?api_key=${tmdbKey}&language=en-US`,
         );
         console.log("[genre-save] TMDB response status:", res.status);

         if (res.ok) {
           const data = await res.json();
           console.log("[genre-save] genres found:", data.genres);
           const genres: { id: number }[] = data.genres || [];
           if (genres.length) {
             const { error } = await supabase.from("title_genres").upsert(
               genres.map((g) => ({ title_id: titleId, genre_id: g.id })),
               { onConflict: "title_id,genre_id", ignoreDuplicates: true },
             );
             console.log("[genre-save] upsert error:", error);
           }
         }
       } catch (e) {
         console.log("[genre-save] caught error:", e);
       }
     }
      // ── End genre auto-save ──────────────────────────────────────────────
    }

    // Invalidate genre cache so next getCinephileData() re-fetches fresh counts
    invalidateGenreCache(user.id);

    // Also save rating if provided
    if (entry.user_rating) {
      await saveRating(entry.tmdb_id, mt, entry.user_rating);
    }
  }

  

  return newEntry;
}

export function removeLog(id: string): void {
  const logs = getLogs().filter((l) => l.id !== id);
  lsSet(LS_LOGS, logs);
  emit("taste_logs_changed");
}

export function updateLog(id: string, updates: Partial<LogEntry>): void {
  const logs = getLogs().map((l) => (l.id === id ? { ...l, ...updates } : l));
  lsSet(LS_LOGS, logs);
  emit("taste_logs_changed");
}

export function isLogged(tmdbId: number): LogEntry | undefined {
  return getLogs().find((l) => l.tmdb_id === tmdbId);
}

// ── Watchlist ─────────────────────────────────────────────────────────────────

export interface WatchlistEntry {
  id: string;
  tmdb_id: number;
  type: "film" | "series";
  title: string;
  poster_url: string | null;
  year: number;
  tmdb_rating: number;
  overview?: string;
  genres?: string[];
  priority: "normal" | "high";
  added_at: string;
}

export function getWatchlist(): WatchlistEntry[] {
  return lsGet<WatchlistEntry[]>(LS_WATCHLIST, []);
}

export async function addToWatchlist(
  entry: Omit<WatchlistEntry, "id" | "added_at">,
): Promise<WatchlistEntry> {
  const existing = getWatchlist().find((w) => w.tmdb_id === entry.tmdb_id);
  if (existing) return existing;

  const newEntry: WatchlistEntry = {
    ...entry,
    id: genId(),
    added_at: new Date().toISOString(),
  };
  const list = getWatchlist();
  list.unshift(newEntry);
  lsSet(LS_WATCHLIST, list);
  emit("taste_watchlist_changed");

  const user = await getUser();
  if (user) {
    const mt = entry.type === "series" ? "tv" : "movie";
    const titleId = await tmdbToUuid(entry.tmdb_id, mt);
    if (titleId) {
      await supabase.from("watchlists").upsert(
        {
          user_id: user.id,
          title_id: titleId,
          priority: entry.priority,
        },
        { onConflict: "user_id,title_id" },
      );
    }
  }

  return newEntry;
}

export async function removeFromWatchlist(tmdbId: number): Promise<void> {
  lsSet(
    LS_WATCHLIST,
    getWatchlist().filter((w) => w.tmdb_id !== tmdbId),
  );
  emit("taste_watchlist_changed");

  const user = await getUser();
  if (user) {
    const mt = "movie"; // try both
    const titleId =
      (await tmdbToUuid(tmdbId, mt)) ?? (await tmdbToUuid(tmdbId, "tv"));
    if (titleId) {
      await supabase
        .from("watchlists")
        .delete()
        .eq("user_id", user.id)
        .eq("title_id", titleId);
    }
  }
}

export function isOnWatchlist(tmdbId: number): boolean {
  return getWatchlist().some((w) => w.tmdb_id === tmdbId);
}

// ── Local ratings (sync-safe) ─────────────────────────────────────────────────

export function getRatingLocal(tmdbId: number): number | null {
  return lsGet<Record<string, number>>(LS_RATINGS, {})[String(tmdbId)] ?? null;
}

export function setRatingLocal(tmdbId: number, rating: number): void {
  const r = lsGet<Record<string, number>>(LS_RATINGS, {});
  r[String(tmdbId)] = rating;
  lsSet(LS_RATINGS, r);
}

// backward compat aliases used in old store.ts
export const setRating = setRatingLocal;
export const getRating = getRatingLocal;

// ── Reviews ───────────────────────────────────────────────────────────────────

export async function getReviews(titleId: string) {
  const { data } = await supabase
    .from("reviews")
    .select("*, profiles(username, display_name, avatar_url)")
    .eq("title_id", titleId)
    .eq("is_hidden", false)
    .order("likes", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(50);
  return data ?? [];
}

export async function addReview(
  titleId: string,
  body: string,
  rating: number | null,
  isSpoiler = false,
) {
  const user = await getUser();
  if (!user) throw new Error("Must be signed in to post a review");

  const { data, error } = await supabase
    .from("reviews")
    .insert({
      user_id: user.id,
      title_id: titleId,
      body,
      rating,
      is_spoiler: isSpoiler,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function likeReview(reviewId: string): Promise<boolean> {
  const user = await getUser();
  if (!user) return false;

  // Check if already liked
  const { data: existing } = await supabase
    .from("review_likes")
    .select("review_id")
    .eq("user_id", user.id)
    .eq("review_id", reviewId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("review_likes")
      .delete()
      .eq("user_id", user.id)
      .eq("review_id", reviewId);
    await supabase.rpc("decrement_review_likes", { rid: reviewId });
    return false; // unliked
  } else {
    await supabase
      .from("review_likes")
      .insert({ user_id: user.id, review_id: reviewId });
    await supabase
      .from("reviews")
      .update({
        likes: supabase.rpc("increment", {
          row_id: reviewId,
        }) as unknown as number,
      })
      .eq("id", reviewId);
    return true; // liked
  }
}

// ── Stats ─────────────────────────────────────────────────────────────────────

export function getStats() {
  const logs = getLogs();
  const films = logs.filter(
    (l) =>
      (l.type === "film" || l.media_type === "movie") && l.status === "watched",
  );
  const series = logs.filter(
    (l) => l.type === "series" || l.media_type === "tv",
  );
  const uniqueSeries = new Set(series.map((s) => s.tmdb_id)).size;
  const ratedLogs = logs.filter((l) => l.user_rating);
  const totalRating = ratedLogs.reduce((s, l) => s + (l.user_rating || 0), 0);

  const genreCounts: Record<string, number> = {};
  const directorCounts: Record<string, number> = {};
  for (const log of films) {
    for (const g of log.genres || [])
      genreCounts[g] = (genreCounts[g] || 0) + 1;
    if (log.director)
      directorCounts[log.director] = (directorCounts[log.director] || 0) + 1;
  }

  const topGenres = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({
      name,
      pct: Math.round((count / Math.max(films.length, 1)) * 100),
    }));

  const topDirectors = Object.entries(directorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([n]) => n);

  return {
    total_films: films.length,
    total_series: uniqueSeries,
    total_hours: Math.round(films.length * 1.75),
    total_episodes: series.length,
    top_genres: topGenres,
    top_directors: topDirectors,
    avg_rating:
      ratedLogs.length > 0
        ? Math.round((totalRating / ratedLogs.length) * 10) / 10
        : 0,
  };
}

// ── User Profile ──────────────────────────────────────────────────────────────

export interface UserProfile {
  username: string;
  display_name: string;
  bio: string;
  archetype: string;
  archetype_desc: string;
  streaming_services: string[];
}

export function getUserProfile(): UserProfile {
  if (typeof window === "undefined") return defaultProfile();
  try {
    const stored = localStorage.getItem(LS_USER);
    return stored ? JSON.parse(stored) : defaultProfile();
  } catch {
    return defaultProfile();
  }
}

function defaultProfile(): UserProfile {
  return {
    username: "cinephile",
    display_name: "You",
    bio: "Building my taste one film at a time.",
    archetype: "Cinematic Explorer",
    archetype_desc: "Your taste spans eras and genres with genuine curiosity.",
    streaming_services: ["Netflix", "Max", "Apple TV+"],
  };
}

export function saveUserProfile(profile: Partial<UserProfile>): void {
  const current = getUserProfile();
  lsSet(LS_USER, { ...current, ...profile });
}

// ── Internal helper ───────────────────────────────────────────────────────────

/** Converts TMDB ID → Supabase UUID; returns null if title not yet in DB */
async function tmdbToUuid(
  tmdbId: number,
  mediaType: "movie" | "tv",
): Promise<string | null> {
  const { data } = await supabase
    .from("titles")
    .select("id")
    .eq("tmdb_id", tmdbId)
    .eq("media_type", mediaType)
    .maybeSingle();
  return data?.id ?? null;
}
