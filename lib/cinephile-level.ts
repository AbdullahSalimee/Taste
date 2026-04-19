/**
 * lib/cinephile-level.ts
 *
 * All XP data comes from Supabase — not localStorage.
 * localStorage is only used as a fallback for unauthenticated users.
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

// ── Types ─────────────────────────────────────────────────────────────────────

export type CinephileRank = "Casual" | "Enthusiast" | "Devotee" | "Auteur";

export interface GenreBadge {
  genre: string;
  required: number;
  earned: boolean;
  progress: number; // 0–1
  color: string;
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
}

// ── Constants ─────────────────────────────────────────────────────────────────

export const RANK_THRESHOLDS: { rank: CinephileRank; min: number; max: number | null }[] = [
  { rank: "Casual",     min: 0,    max: 199  },
  { rank: "Enthusiast", min: 200,  max: 599  },
  { rank: "Devotee",    min: 600,  max: 1499 },
  { rank: "Auteur",     min: 1500, max: null },
];

export const RANK_COLORS: Record<CinephileRank, { primary: string; bg: string; border: string }> = {
  Casual:     { primary: "#8A8780", bg: "rgba(138,135,128,0.1)",  border: "rgba(138,135,128,0.25)" },
  Enthusiast: { primary: "#2A7AB8", bg: "rgba(42,122,184,0.1)",   border: "rgba(42,122,184,0.25)"  },
  Devotee:    { primary: "#9A6EBF", bg: "rgba(154,110,191,0.1)",  border: "rgba(154,110,191,0.25)" },
  Auteur:     { primary: "#C8A96E", bg: "rgba(200,169,110,0.12)", border: "rgba(200,169,110,0.3)"  },
};

export const RANK_DESCRIPTIONS: Record<CinephileRank, string> = {
  Casual:     "You're finding your footing. Keep watching.",
  Enthusiast: "Your taste is forming. The obsession is real.",
  Devotee:    "Cinema is a language. You're becoming fluent.",
  Auteur:     "You don't just watch films. You think in them.",
};

export const GENRE_BADGE_REQUIREMENTS: { genre: string; required: number; color: string }[] = [
  { genre: "Drama",       required: 20, color: "#5C4A8A" },
  { genre: "Thriller",    required: 15, color: "#8A2A2A" },
  { genre: "Documentary", required: 10, color: "#2A5C8A" },
  { genre: "Sci-Fi",      required: 10, color: "#2A6A5C" },
  { genre: "Comedy",      required: 15, color: "#8A7A2A" },
  { genre: "Horror",      required: 10, color: "#6A2A2A" },
  { genre: "Romance",     required: 10, color: "#8A2A5C" },
  { genre: "Animation",   required: 10, color: "#2A6A8A" },
  { genre: "Action",      required: 15, color: "#7A4A2A" },
  { genre: "Crime",       required: 10, color: "#5A3A5A" },
  { genre: "History",     required: 8,  color: "#3A5A4A" },
  { genre: "Mystery",     required: 8,  color: "#4A3A6A" },
  { genre: "Adventure",   required: 10, color: "#3A6A4A" },
  { genre: "Fantasy",     required: 10, color: "#6A3A7A" },
  { genre: "War",         required: 8,  color: "#5A4A3A" },
];

// ── Rank helpers ──────────────────────────────────────────────────────────────

function xpToRankData(xp: number, prestige: number): Omit<CinephileData, "badges" | "totalFilms" | "totalSeries" | "totalReviews" | "totalRated" | "twinCount"> {
  let rankIndex = 0;
  for (let i = RANK_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= RANK_THRESHOLDS[i].min) { rankIndex = i; break; }
  }
  const rankInfo = RANK_THRESHOLDS[rankIndex];
  const progressInRank = rankInfo.max === null
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

// ── Streak helper (works on array of ISO date strings) ────────────────────────

function calcStreakFromDates(dates: string[]): number {
  if (!dates.length) return 0;
  const days = new Set(dates.map((d) => d.slice(0, 10)));
  const sorted = [...days].sort().reverse();
  let streak = 0;
  let cur = new Date();
  for (const d of sorted) {
    const diff = Math.round((cur.getTime() - new Date(d).getTime()) / 86400000);
    if (diff > 1) break;
    streak++;
    cur = new Date(d);
  }
  return streak;
}

// ── Main: fetch everything from Supabase ──────────────────────────────────────

export async function getCinephileData(): Promise<CinephileData> {
  const { data: { user } } = await supabase.auth.getUser();

  // ── Unauthenticated fallback (localStorage) ───────────────────────────────
  if (!user) {
    return getCinephileDataLocal();
  }

  const userId = user.id;

  // 1. Profile (prestige info)
  const { data: profile } = await supabase
    .from("profiles")
    .select("prestige_count, prestige_start_at")
    .eq("id", userId)
    .maybeSingle();

  const prestige = profile?.prestige_count ?? 0;
  const prestigeStart: string | null = profile?.prestige_start_at ?? null;

  // 2. Logs — joined with titles and genres
  //    We need: status, watched_at, media_type, and genres for badge counts
  const logsQuery = supabase
    .from("logs")
    .select(`
      id,
      status,
      watched_at,
      note,
      titles (
        id,
        media_type,
        title_genres ( genres ( name ) )
      )
    `)
    .eq("user_id", userId);

  // For rank XP: only count logs after prestige_start_at
  const rankLogsQuery = prestigeStart
    ? logsQuery.gte("watched_at", prestigeStart)
    : logsQuery;

  const [{ data: allLogs }, { data: rankLogs }] = await Promise.all([
    logsQuery,                                    // lifetime — for badges + streak
    prestigeStart ? rankLogsQuery : Promise.resolve({ data: null }),
  ]);

  const lifetimeLogs = allLogs ?? [];
  const xpLogs = prestigeStart ? (rankLogs ?? []) : lifetimeLogs;

  // 3. Ratings count
  const { count: totalRated } = await supabase
    .from("user_ratings")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  // 4. Reviews count (logs with note length >= 10)
  const totalReviews = xpLogs.filter(
    (l: any) => l.note && l.note.trim().length >= 10,
  ).length;

  // 5. Twins count
  const { count: twinCount } = await supabase
    .from("twins")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  // 6. Derive film / series counts from xpLogs
  const films = xpLogs.filter(
    (l: any) => l.titles?.media_type === "movie" && l.status === "watched",
  );
  const series = xpLogs.filter(
    (l: any) =>
      l.titles?.media_type === "tv" &&
      (l.status === "watched" || l.status === "watching"),
  );

  // 7. Genre badge counts — use LIFETIME logs (not reset by prestige)
  const genreCounts: Record<string, number> = {};
  for (const log of lifetimeLogs) {
    if ((log as any).titles?.media_type !== "movie") continue;
    if ((log as any).status !== "watched") continue;
    for (const tg of (log as any).titles?.title_genres ?? []) {
      const name: string = tg.genres?.name;
      if (name) genreCounts[name] = (genreCounts[name] || 0) + 1;
    }
  }

  const badges: GenreBadge[] = GENRE_BADGE_REQUIREMENTS.map(({ genre, required, color }) => {
    const count = genreCounts[genre] || 0;
    return { genre, required, earned: count >= required, progress: Math.min(count / required, 1), color };
  });
  const earnedBadgeCount = badges.filter((b) => b.earned).length;

  // 8. Streak from lifetime logs
  const streak = calcStreakFromDates(lifetimeLogs.map((l: any) => l.watched_at));
  const streakBonus = streak >= 7 ? 15 : 0;

  // 9. XP
  const xp =
    films.length       * 10 +
    series.length      *  8 +
    totalReviews       * 20 +
    (totalRated ?? 0)  *  5 +
    (twinCount ?? 0)   * 25 +
    earnedBadgeCount   * 30 +
    streakBonus;

  return {
    ...xpToRankData(xp, prestige),
    badges,
    totalFilms: films.length,
    totalSeries: series.length,
    totalReviews,
    totalRated: totalRated ?? 0,
    twinCount: twinCount ?? 0,
  };
}

// ── Unauthenticated fallback (localStorage) ───────────────────────────────────

function getCinephileDataLocal(): CinephileData {
  const logs = getLogs();

  const films   = logs.filter((l) => (l.type === "film"   || l.media_type === "movie") && l.status === "watched");
  const series  = logs.filter((l) => (l.type === "series" || l.media_type === "tv")    && (l.status === "watched" || l.status === "watching"));
  const reviews = logs.filter((l) => l.note && l.note.trim().length >= 10);

  const ratingsMap: Record<string, number> = (() => {
    try { return JSON.parse(localStorage.getItem("taste_ratings") || "{}"); } catch { return {}; }
  })();
  const ratedIds = new Set([
    ...logs.filter((l) => l.user_rating).map((l) => String(l.tmdb_id)),
    ...Object.keys(ratingsMap),
  ]);

  const genreCounts: Record<string, number> = {};
  for (const log of films) {
    for (const g of log.genres || []) genreCounts[g] = (genreCounts[g] || 0) + 1;
  }

  const badges: GenreBadge[] = GENRE_BADGE_REQUIREMENTS.map(({ genre, required, color }) => {
    const count = genreCounts[genre] || 0;
    return { genre, required, earned: count >= required, progress: Math.min(count / required, 1), color };
  });
  const earnedBadgeCount = badges.filter((b) => b.earned).length;

  const streak = calcStreakFromDates(logs.map((l) => l.watched_at));
  const streakBonus = streak >= 7 ? 15 : 0;

  const xp =
    films.length         * 10 +
    series.length        *  8 +
    reviews.length       * 20 +
    ratedIds.size        *  5 +
    earnedBadgeCount     * 30 +
    streakBonus;

  return {
    ...xpToRankData(xp, 0),
    badges,
    totalFilms: films.length,
    totalSeries: series.length,
    totalReviews: reviews.length,
    totalRated: ratedIds.size,
    twinCount: 0,
  };
}

// ── Prestige ──────────────────────────────────────────────────────────────────

export function canPrestige(data: CinephileData): boolean {
  return data.rank === "Auteur";
}

export async function doPrestige(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
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
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** @deprecated No-op */
export function recordReview(): void {}
/** @deprecated No-op */
export function recordTwin(): void {}

export function toRoman(n: number): string {
  if (n <= 0) return "";
  const vals = [10, 9, 5, 4, 1];
  const syms = ["X", "IX", "V", "IV", "I"];
  let result = "";
  for (let i = 0; i < vals.length; i++) {
    while (n >= vals[i]) { result += syms[i]; n -= vals[i]; }
  }
  return result;
}

export function getXPBreakdown(data: CinephileData) {
  return [
    { label: "Films watched",   xp: data.totalFilms   * 10, icon: "🎬" },
    { label: "Series tracked",  xp: data.totalSeries  *  8, icon: "📺" },
    { label: "Reviews written", xp: data.totalReviews * 20, icon: "✍"  },
    { label: "Ratings given",   xp: data.totalRated   *  5, icon: "★"  },
    { label: "Taste twins",     xp: data.twinCount    * 25, icon: "👥" },
    { label: "Genre badges",    xp: data.badges.filter((b) => b.earned).length * 30, icon: "🏅" },
  ];
}