/**
 * lib/cinephile-level.ts
 *
 * XP-based cinephile progression system.
 *
 * XP sources:
 *   - Film logged (watched):        10 XP
 *   - Series logged (watched):       8 XP
 *   - Review written:               20 XP
 *   - Rating given:                  5 XP
 *   - Taste twin found:             25 XP
 *   - 7-day streak maintained:      15 XP bonus
 *   - Genre badge unlocked:         30 XP
 *
 * Levels:
 *   0–199    → Casual
 *   200–599  → Enthusiast
 *   600–1499 → Devotee
 *   1500+    → Auteur
 *
 * Prestige: once per "season" (configurable), user can prestige —
 * keeps badges, resets XP to 0 but increments prestige count.
 * Prestige shows as a small Roman numeral beside the level.
 */

import { getLogs } from "./store";

// ── Types ─────────────────────────────────────────────────────────────────────

export type CinephileRank = "Casual" | "Enthusiast" | "Devotee" | "Auteur";

export interface GenreBadge {
  genre: string;
  required: number; // films needed
  earned: boolean;
  progress: number; // 0–1
  color: string;
}

export interface CinephileData {
  xp: number;
  rank: CinephileRank;
  rankIndex: number; // 0–3
  xpForCurrentRank: number; // XP at start of this rank
  xpForNextRank: number | null; // null = max rank
  progressInRank: number; // 0–1 within current rank
  prestige: number; // prestige count (0 = never prestiged)
  badges: GenreBadge[];
  totalFilms: number;
  totalReviews: number;
  totalRated: number;
  twinCount: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────

export const RANK_THRESHOLDS: {
  rank: CinephileRank;
  min: number;
  max: number | null;
}[] = [
  { rank: "Casual", min: 0, max: 199 },
  { rank: "Enthusiast", min: 200, max: 599 },
  { rank: "Devotee", min: 600, max: 1499 },
  { rank: "Auteur", min: 1500, max: null },
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

const GENRE_BADGE_REQUIREMENTS: {
  genre: string;
  required: number;
  color: string;
}[] = [
  { genre: "Drama", required: 20, color: "#5C4A8A" },
  { genre: "Thriller", required: 15, color: "#8A2A2A" },
  { genre: "Documentary", required: 10, color: "#2A5C8A" },
  { genre: "Sci-Fi", required: 10, color: "#2A6A5C" },
  { genre: "Comedy", required: 15, color: "#8A7A2A" },
  { genre: "Horror", required: 10, color: "#6A2A2A" },
  { genre: "Romance", required: 10, color: "#8A2A5C" },
  { genre: "Animation", required: 10, color: "#2A6A8A" },
  { genre: "Action", required: 15, color: "#7A4A2A" },
  { genre: "Crime", required: 10, color: "#5A3A5A" },
  { genre: "History", required: 8, color: "#3A5A4A" },
  { genre: "Mystery", required: 8, color: "#4A3A6A" },
  { genre: "Adventure", required: 10, color: "#3A6A4A" },
  { genre: "Fantasy", required: 10, color: "#6A3A7A" },
  { genre: "War", required: 8, color: "#5A4A3A" },
];

// ── localStorage keys ─────────────────────────────────────────────────────────
const LS_PRESTIGE = "taste_prestige_count";
const LS_PRESTIGE_XP = "taste_prestige_banked_xp"; // XP "banked" from previous prestiges for badge tracking
const LS_REVIEW_COUNT = "taste_review_count";
const LS_TWIN_COUNT = "taste_twin_count";

// ── Helpers ───────────────────────────────────────────────────────────────────

function ls(key: string, fallback: number): number {
  if (typeof window === "undefined") return fallback;
  return parseInt(localStorage.getItem(key) || String(fallback), 10);
}

// ── Core calculation ──────────────────────────────────────────────────────────

export function getCinephileData(): CinephileData {
  const logs = getLogs();
  const prestige = ls(LS_PRESTIGE, 0);

  // Count sources
  const films = logs.filter(
    (l) =>
      (l.type === "film" || l.media_type === "movie") && l.status === "watched",
  );
  const series = logs.filter(
    (l) =>
      (l.type === "series" || l.media_type === "tv") && l.status === "watched",
  );
  const rated = logs.filter((l) => l.user_rating);
  const withNote = logs.filter((l) => l.note && l.note.trim().length > 10);

  // Genre counts
  const genreCounts: Record<string, number> = {};
  for (const log of films) {
    for (const g of log.genres || []) {
      genreCounts[g] = (genreCounts[g] || 0) + 1;
    }
  }

  // Supplementary counts from localStorage (reviews, twins not tracked in logs)
  const reviewCount = ls(LS_REVIEW_COUNT, withNote.length);
  const twinCount = ls(LS_TWIN_COUNT, 0);

  // XP calculation
  const xpFromFilms = films.length * 10;
  const xpFromSeries = series.length * 8;
  const xpFromReviews = reviewCount * 20;
  const xpFromRatings = rated.length * 5;
  const xpFromTwins = twinCount * 25;

  // Genre badge XP
  const badges: GenreBadge[] = GENRE_BADGE_REQUIREMENTS.map(
    ({ genre, required, color }) => {
      const count = genreCounts[genre] || 0;
      const earned = count >= required;
      return {
        genre,
        required,
        earned,
        progress: Math.min(count / required, 1),
        color,
      };
    },
  );
  const earnedBadgeCount = badges.filter((b) => b.earned).length;
  const xpFromBadges = earnedBadgeCount * 30;

  const totalXP =
    xpFromFilms +
    xpFromSeries +
    xpFromReviews +
    xpFromRatings +
    xpFromTwins +
    xpFromBadges;

  // After prestige XP resets to 0 for rank display but badges are kept
  // We store "banked" XP from past lives so we can show cumulative badge progress
  const displayXP = totalXP; // current-life XP drives the rank

  // Determine rank
  let rankIndex = 0;
  for (let i = RANK_THRESHOLDS.length - 1; i >= 0; i--) {
    if (displayXP >= RANK_THRESHOLDS[i].min) {
      rankIndex = i;
      break;
    }
  }
  const rankInfo = RANK_THRESHOLDS[rankIndex];
  const progressInRank =
    rankInfo.max === null
      ? 1
      : (displayXP - rankInfo.min) / (rankInfo.max - rankInfo.min + 1);

  return {
    xp: displayXP,
    rank: rankInfo.rank,
    rankIndex,
    xpForCurrentRank: rankInfo.min,
    xpForNextRank: rankInfo.max !== null ? rankInfo.max + 1 : null,
    progressInRank: Math.min(progressInRank, 1),
    prestige,
    badges,
    totalFilms: films.length,
    totalReviews: reviewCount,
    totalRated: rated.length,
    twinCount,
  };
}

// ── Prestige ──────────────────────────────────────────────────────────────────

/**
 * Prestige: only allowed at Auteur rank.
 * Resets XP-generating log-based progress display,
 * but earned badges remain. Increments prestige count.
 */
export function canPrestige(data: CinephileData): boolean {
  return data.rank === "Auteur";
}

export function doPrestige(): void {
  const current = ls(LS_PRESTIGE, 0);
  localStorage.setItem(LS_PRESTIGE, String(current + 1));
  // Note: actual log data is NOT deleted — prestige is cosmetic.
  // A future implementation could add a prestige-start timestamp
  // and only count logs after that date for rank XP.
}

// ── Public helpers ─────────────────────────────────────────────────────────────

/** Call this when a review is submitted to increment review XP counter */
export function recordReview(): void {
  if (typeof window === "undefined") return;
  const current = ls(LS_REVIEW_COUNT, 0);
  localStorage.setItem(LS_REVIEW_COUNT, String(current + 1));
}

/** Call this when a taste twin is found */
export function recordTwin(): void {
  if (typeof window === "undefined") return;
  const current = ls(LS_TWIN_COUNT, 0);
  localStorage.setItem(LS_TWIN_COUNT, String(current + 1));
}

/** Roman numeral helper for prestige display */
export function toRoman(n: number): string {
  if (n <= 0) return "";
  const vals = [10, 9, 5, 4, 1];
  const syms = ["X", "IX", "V", "IV", "I"];
  let result = "";
  for (let i = 0; i < vals.length; i++) {
    while (n >= vals[i]) {
      result += syms[i];
      n -= vals[i];
    }
  }
  return result;
}

/** Short XP breakdown for tooltip / detailed view */
export function getXPBreakdown(data: CinephileData) {
  return [
    { label: "Films watched", xp: data.totalFilms * 10, icon: "🎬" },
    { label: "Reviews written", xp: data.totalReviews * 20, icon: "✍" },
    { label: "Ratings given", xp: data.totalRated * 5, icon: "★" },
    { label: "Taste twins", xp: data.twinCount * 25, icon: "👥" },
    {
      label: "Genre badges",
      xp: data.badges.filter((b) => b.earned).length * 30,
      icon: "🏅",
    },
  ];
}
    