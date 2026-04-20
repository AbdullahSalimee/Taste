/**
 * lib/cinephile-level.ts
 *
 * All XP data comes from Supabase — not localStorage.
 * localStorage is used as a cache for genre badge counts (keyed per user)
 * and as a fallback for unauthenticated users.
 *
 * Genre badge counts are computed by:
 *   1. Fetching all movie logs for the user from Supabase
 *   2. Fetching title_genres rows (title_id + genre_id integers) for those titles
 *   3. Mapping genre_id → genre name via the local GENRE_NAMES lookup (no DB join)
 *   4. Caching the result in localStorage under `taste_genre_counts_<userId>`
 *   5. Cache is invalidated and rebuilt whenever a new log event fires
 *
 * XP sources:
 *   Film watched:               10 XP
 *   Series watched/watching:     8 XP
 *   Review written:             20 XP
 *   Rating given:                5 XP
 *   Taste twin:                 25 XP
 *   Genre badge:                30 XP
 *   7-day streak:               15 XP
 *
 * Prestige: Auteur only. Stored in Supabase profiles.prestige_count + prestige_start_at.
 * Badges: lifetime logs (not reset by prestige).
 */

import { supabase } from "./supabase";
import { getLogs } from "./db"; // fallback for unauthed
import { GENRE_NAMES } from "./tmdb"; // integer → string map, e.g. 10752 → "War"

// ── Types ─────────────────────────────────────────────────────────────────────

export type CinephileRank = "Casual" | "Enthusiast" | "Devotee" | "Auteur";

export interface GenreBadge {
  genre: string;
  required: number;
  earned: boolean;
  progress: number; // 0–1
  color: string;
  count: number; // actual count for display
}

export interface CinephileData {
  xp: number;
  rank: CinephileRank;
  rankIndex: number;
  xpForCurrentRank: number;
  xpForNextRank: number | null;
  progressInRank: number;
  prestige: number;
  badges: GenreBadge[];
  totalFilms: number;
  totalSeries: number;
  totalReviews: number;
  totalRated: number;
  twinCount: number;
  // Full genre breakdown — all genres with counts, not just badge genres
  allGenreCounts: Record<string, number>;
}

// ── Constants ─────────────────────────────────────────────────────────────────

export const RANK_THRESHOLDS: {
  rank: CinephileRank;
  min: number;
  max: number | null;
}[] = [
  { rank: "Casual", min: 0, max: 999 },
  { rank: "Enthusiast", min: 1000, max: 1999 },
  { rank: "Devotee", min: 2000, max: 2999 },
  { rank: "Auteur", min: 3000, max: null },
];

export const RANK_COLORS: Record<
  CinephileRank,
  { primary: string; bg: string; border: string }
> = {
  Casual: {
    primary: "#8A8780",
    bg: "rgba(138,135,128,0.1)",
    border: "rgba(138,135,128,0.25)",
  },
  Enthusiast: {
    primary: "#2A7AB8",
    bg: "rgba(42,122,184,0.1)",
    border: "rgba(42,122,184,0.25)",
  },
  Devotee: {
    primary: "#9A6EBF",
    bg: "rgba(154,110,191,0.1)",
    border: "rgba(154,110,191,0.25)",
  },
  Auteur: {
    primary: "#C8A96E",
    bg: "rgba(200,169,110,0.12)",
    border: "rgba(200,169,110,0.3)",
  },
};

export const RANK_DESCRIPTIONS: Record<CinephileRank, string> = {
  Casual: "You're finding your footing. Keep watching.",
  Enthusiast: "Your taste is forming. The obsession is real.",
  Devotee: "Cinema is a language. You're becoming fluent.",
  Auteur: "You don't just watch films. You think in them.",
};

export const GENRE_BADGE_REQUIREMENTS: {
  genre: string;
  required: number;
  color: string;
}[] = [
  { genre: "Drama", required: 50, color: "#5C4A8A" },
  { genre: "Thriller", required: 100, color: "#8A2A2A" },
  { genre: "Documentary", required: 30, color: "#2A5C8A" },
  { genre: "Sci-Fi", required: 100, color: "#2A6A5C" },
  { genre: "Comedy", required: 150, color: "#8A7A2A" },
  { genre: "Horror", required: 100, color: "#6A2A2A" },
  { genre: "Romance", required: 100, color: "#8A2A5C" },
  { genre: "Animation", required: 100, color: "#2A6A8A" },
  { genre: "Action", required: 150, color: "#7A4A2A" },
  { genre: "Crime", required: 100, color: "#5A3A5A" },
  { genre: "History", required: 80, color: "#3A5A4A" },
  { genre: "Mystery", required: 80, color: "#4A3A6A" },
  { genre: "Adventure", required: 100, color: "#3A6A4A" },
  { genre: "Fantasy", required: 100, color: "#6A3A7A" },
  { genre: "War", required: 80, color: "#5A4A3A" },
];

// ── localStorage cache helpers ─────────────────────────────────────────────────

const LS_GENRE_COUNTS_KEY = (userId: string) => `taste_genre_counts_${userId}`;
const LS_GENRE_LOG_COUNT_KEY = (userId: string) =>
  `taste_genre_log_count_${userId}`;

function lsGet<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function lsSet(key: string, val: unknown): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {}
}

/**
 * Invalidate the genre counts cache for a user.
 * Call this after any new log is created so the next getCinephileData()
 * fetches fresh data from Supabase.
 */
export function invalidateGenreCache(userId: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(LS_GENRE_COUNTS_KEY(userId));
    localStorage.removeItem(LS_GENRE_LOG_COUNT_KEY(userId));
  } catch {}
}

// ── Core genre counting — THE FIX ─────────────────────────────────────────────
//
// Old approach (broken): nested PostgREST join `title_genres ( genres ( name ) )`
//   — silently returns null when FK relationship isn't resolved correctly
//
// New approach (reliable):
//   1. Collect title_ids of movie logs with status "watched"
//   2. Fetch title_genres rows for those titles — just (title_id, genre_id) integers
//   3. Map genre_id → name using the local GENRE_NAMES constant (no DB round-trip)
//   4. Cache result in localStorage; return cache on subsequent calls
//   5. Cache is busted by invalidateGenreCache() after each new log

async function fetchGenreCountsFromSupabase(
  userId: string,
  movieTitleIds: string[],
): Promise<Record<string, number>> {
  if (movieTitleIds.length === 0) return {};

  // Fetch in batches of 500 to stay within Supabase URL length limits
  const BATCH = 500;
  const genreCounts: Record<string, number> = {};

  // We also need to know which title_id belongs to which movie log (one per title,
  // since a title can appear multiple times in logs as rewatches — count each log)
  // So we count occurrences of title_id in the logs array first, then multiply.
  // movieTitleIds may contain duplicates (rewatches) — that's intentional.
  const titleIdCount: Record<string, number> = {};
  for (const tid of movieTitleIds) {
    titleIdCount[tid] = (titleIdCount[tid] || 0) + 1;
  }
  const uniqueTitleIds = Object.keys(titleIdCount);

  for (let i = 0; i < uniqueTitleIds.length; i += BATCH) {
    const batch = uniqueTitleIds.slice(i, i + BATCH);

    const { data: tgRows, error } = await supabase
      .from("title_genres")
      .select("title_id, genre_id")
      .in("title_id", batch);

    if (error) {
      console.error("[taste] title_genres fetch error:", error.message);
      continue;
    }

    for (const row of tgRows ?? []) {
      // Map integer genre_id → human name via local constant (no join needed)
      const genreName = GENRE_NAMES[row.genre_id as number];
      if (!genreName) continue;

      // Multiply by how many times this title was logged (for rewatches)
      const logCount = titleIdCount[row.title_id] ?? 1;
      genreCounts[genreName] = (genreCounts[genreName] || 0) + logCount;
    }
  }

  return genreCounts;
}

// ── Rank helpers ──────────────────────────────────────────────────────────────

function xpToRankData(
  xp: number,
  prestige: number,
): Omit<
  CinephileData,
  | "badges"
  | "totalFilms"
  | "totalSeries"
  | "totalReviews"
  | "totalRated"
  | "twinCount"
  | "allGenreCounts"
> {
  let rankIndex = 0;
  for (let i = RANK_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= RANK_THRESHOLDS[i].min) {
      rankIndex = i;
      break;
    }
  }
  const rankInfo = RANK_THRESHOLDS[rankIndex];
  const progressInRank =
    rankInfo.max === null
      ? 1
      : (xp - rankInfo.min) / (rankInfo.max - rankInfo.min + 1);
  return {
    xp,
    rank: rankInfo.rank,
    rankIndex,
    xpForCurrentRank: rankInfo.min,
    xpForNextRank: rankInfo.max !== null ? rankInfo.max + 1 : null,
    progressInRank: Math.min(progressInRank, 1),
    prestige,
  };
}

function buildBadges(genreCounts: Record<string, number>): GenreBadge[] {
  return GENRE_BADGE_REQUIREMENTS.map(({ genre, required, color }) => {
    const count = genreCounts[genre] || 0;
    return {
      genre,
      required,
      earned: count >= required,
      progress: Math.min(count / required, 1),
      color,
      count,
    };
  });
}

// ── Streak helper (works on array of ISO date strings) ────────────────────────

function calcStreakFromDates(dates: string[]): number {
  if (!dates.length) return 0;
  const days = new Set(dates.map((d) => d.slice(0, 10)));
  const sorted = [...days].sort().reverse();
  let streak = 0;
  let cur = new Date();
  for (const d of sorted) {
    const diff = Math.round(
      (cur.getTime() - new Date(d).getTime()) / 86_400_000,
    );
    if (diff > 1) break;
    streak++;
    cur = new Date(d);
  }
  return streak;
}

// ── Main: fetch everything from Supabase ──────────────────────────────────────

export async function getCinephileData(): Promise<CinephileData> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ── Unauthenticated fallback (localStorage) ───────────────────────────────
  if (!user) {
    return getCinephileDataLocal();
  }

  const userId = user.id;

  // ── 1. Profile (prestige info) ────────────────────────────────────────────
  const { data: profile } = await supabase
    .from("profiles")
    .select("prestige_count, prestige_start_at")
    .eq("id", userId)
    .maybeSingle();

  const prestige = profile?.prestige_count ?? 0;
  const prestigeStart: string | null = profile?.prestige_start_at ?? null;

  // ── 2. Logs — minimal columns, no joins ──────────────────────────────────
  //   We fetch ALL lifetime logs (for badges + streak) and optionally
  //   a post-prestige subset (for XP rank calculation).
  //   Crucially: NO title join here. We collect title_ids separately.
  const { data: allLogsRaw } = await supabase
    .from("logs")
    .select(
      `
      id,
      title_id,
      status,
      watched_at,
      note,
      titles ( id, media_type )
    `,
    )
    .eq("user_id", userId);

  const lifetimeLogs = allLogsRaw ?? [];

  // XP logs: post-prestige only (or all logs if no prestige)
  const xpLogs = prestigeStart
    ? lifetimeLogs.filter(
        (l: any) => l.watched_at && l.watched_at >= prestigeStart,
      )
    : lifetimeLogs;

  // ── 3. Ratings count ──────────────────────────────────────────────────────
  const { count: totalRated } = await supabase
    .from("user_ratings")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  // ── 4. Reviews count ──────────────────────────────────────────────────────
  const totalReviews = xpLogs.filter(
    (l: any) => l.note && l.note.trim().length >= 10,
  ).length;

  // ── 5. Twins count ────────────────────────────────────────────────────────
  const { count: twinCount } = await supabase
    .from("twins")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  // ── 6. Film / series counts ───────────────────────────────────────────────
  const films = xpLogs.filter(
    (l: any) =>
      (l.titles as any)?.media_type === "movie" && l.status === "watched",
  );
  const series = xpLogs.filter(
    (l: any) =>
      (l.titles as any)?.media_type === "tv" &&
      (l.status === "watched" || l.status === "watching"),
  );

  // ── 7. Genre badge counts via reliable integer lookup ────────────────────
  //
  //  Collect title_ids from LIFETIME movie logs that are "watched".
  //  We include rewatches (duplicate title_ids) so a title watched 3× counts 3×.
  //
  const movieLogTitleIds: string[] = lifetimeLogs
    .filter(
      (l: any) =>
        (l.titles as any)?.media_type === "movie" && l.status === "watched",
    )
    .map((l: any) => l.title_id)
    .filter(Boolean);

  const currentLogCount = movieLogTitleIds.length;

  // Check localStorage cache — only valid if log count matches
  let genreCounts: Record<string, number> = {};
  const cachedLogCount = lsGet<number>(LS_GENRE_LOG_COUNT_KEY(userId), -1);
  const cachedCounts = lsGet<Record<string, number>>(
    LS_GENRE_COUNTS_KEY(userId),
    {},
  );

  if (
    cachedLogCount === currentLogCount &&
    Object.keys(cachedCounts).length > 0
  ) {
    // Cache is valid — use it
    genreCounts = cachedCounts;
  } else {
    // Cache miss or stale — fetch fresh from Supabase
    genreCounts = await fetchGenreCountsFromSupabase(userId, movieLogTitleIds);

    // Persist to localStorage
    lsSet(LS_GENRE_COUNTS_KEY(userId), genreCounts);
    lsSet(LS_GENRE_LOG_COUNT_KEY(userId), currentLogCount);
  }

  const badges = buildBadges(genreCounts);
  const earnedBadgeCount = badges.filter((b) => b.earned).length;

  // ── 8. Streak ─────────────────────────────────────────────────────────────
  const streak = calcStreakFromDates(
    lifetimeLogs.map((l: any) => l.watched_at),
  );
  const streakBonus = streak >= 7 ? 15 : 0;

  // ── 9. XP ─────────────────────────────────────────────────────────────────
  const xp =
    films.length * 10 +
    series.length * 8 +
    totalReviews * 20 +
    (totalRated ?? 0) * 5 +
    (twinCount ?? 0) * 25 +
    earnedBadgeCount * 30 +
    streakBonus;

  return {
    ...xpToRankData(xp, prestige),
    badges,
    totalFilms: films.length,
    totalSeries: series.length,
    totalReviews,
    totalRated: totalRated ?? 0,
    twinCount: twinCount ?? 0,
    allGenreCounts: genreCounts,
  };
}

// ── Unauthenticated fallback (localStorage) ───────────────────────────────────

function getCinephileDataLocal(): CinephileData {
  const logs = getLogs();

  const films = logs.filter(
    (l) =>
      (l.type === "film" || l.media_type === "movie") && l.status === "watched",
  );
  const series = logs.filter(
    (l) =>
      (l.type === "series" || l.media_type === "tv") &&
      (l.status === "watched" || l.status === "watching"),
  );
  const reviews = logs.filter((l) => l.note && l.note.trim().length >= 10);

  const ratingsMap: Record<string, number> = (() => {
    try {
      return JSON.parse(localStorage.getItem("taste_ratings") || "{}");
    } catch {
      return {};
    }
  })();
  const ratedIds = new Set([
    ...logs.filter((l) => l.user_rating).map((l) => String(l.tmdb_id)),
    ...Object.keys(ratingsMap),
  ]);

  // Genre counting for local (unauthenticated) logs — uses string genres on log object
  const genreCounts: Record<string, number> = {};
  for (const log of films) {
    for (const g of log.genres || []) {
      genreCounts[g] = (genreCounts[g] || 0) + 1;
    }
  }

  const badges = buildBadges(genreCounts);
  const earnedBadgeCount = badges.filter((b) => b.earned).length;

  const streak = calcStreakFromDates(logs.map((l) => l.watched_at));
  const streakBonus = streak >= 7 ? 15 : 0;

  const xp =
    films.length * 10 +
    series.length * 8 +
    reviews.length * 20 +
    ratedIds.size * 5 +
    earnedBadgeCount * 30 +
    streakBonus;

  return {
    ...xpToRankData(xp, 0),
    badges,
    totalFilms: films.length,
    totalSeries: series.length,
    totalReviews: reviews.length,
    totalRated: ratedIds.size,
    twinCount: 0,
    allGenreCounts: genreCounts,
  };
}

// ── Prestige ──────────────────────────────────────────────────────────────────

export function canPrestige(data: CinephileData): boolean {
  return data.rank === "Auteur";
}

export async function doPrestige(): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("prestige_count")
    .eq("id", user.id)
    .maybeSingle();

  await supabase
    .from("profiles")
    .update({
      prestige_count: (profile?.prestige_count ?? 0) + 1,
      prestige_start_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  // Bust the genre cache on prestige too
  invalidateGenreCache(user.id);
}

// ── XP breakdown (for UI tooltip) ─────────────────────────────────────────────

export function getXPBreakdown(data: CinephileData): {
  label: string;
  xp: number;
}[] {
  const earnedBadgeCount = data.badges.filter((b) => b.earned).length;
  return [
    { label: "Films watched", xp: data.totalFilms * 10 },
    { label: "Series watched", xp: data.totalSeries * 8 },
    { label: "Reviews written", xp: data.totalReviews * 20 },
    { label: "Titles rated", xp: data.totalRated * 5 },
    { label: "Taste twins", xp: data.twinCount * 25 },
    { label: "Genre badges", xp: earnedBadgeCount * 30 },
  ].filter((row) => row.xp > 0);
}

// ── Roman numeral helper (for prestige display) ───────────────────────────────

export function toRoman(n: number): string {
  if (n <= 0) return "";
  const vals = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
  const syms = [
    "M",
    "CM",
    "D",
    "CD",
    "C",
    "XC",
    "L",
    "XL",
    "X",
    "IX",
    "V",
    "IV",
    "I",
  ];
  let result = "";
  for (let i = 0; i < vals.length; i++) {
    while (n >= vals[i]) {
      result += syms[i];
      n -= vals[i];
    }
  }
  return result;
}
