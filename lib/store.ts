"use client";

// Client-side data store using localStorage
// In production this would use Supabase

export interface LogEntry {
  id: string;
  tmdb_id: number;
  type: "film" | "series";
  title: string;
  poster_url: string | null;
  year: number;
  tmdb_rating: number;
  user_rating: number | null;
  note: string | null;
  status: "watched" | "watching" | "dropped" | "on_hold";
  episode_id?: number;
  season?: number;
  episode?: number;
  watched_at: string;
  genres?: string[];
  director?: string;
}

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

const LOGS_KEY = "taste_logs";
const WATCHLIST_KEY = "taste_watchlist";
const USER_KEY = "taste_user";
const RATINGS_KEY = "taste_ratings";

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ─── Logs ─────────────────────────────────────────────────────────────────────

export function getLogs(): LogEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(LOGS_KEY) || "[]");
  } catch {
    return [];
  }
}

export function addLog(entry: Omit<LogEntry, "id" | "watched_at">): LogEntry {
  const logs = getLogs();
  const newEntry: LogEntry = {
    ...entry,
    id: generateId(),
    watched_at: new Date().toISOString(),
  };
  logs.unshift(newEntry);
  localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
  window.dispatchEvent(new CustomEvent("taste_logs_changed"));
  return newEntry;
}

export function removeLog(id: string): void {
  const logs = getLogs().filter((l) => l.id !== id);
  localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
  window.dispatchEvent(new CustomEvent("taste_logs_changed"));
}

export function updateLog(id: string, updates: Partial<LogEntry>): void {
  const logs = getLogs().map((l) => (l.id === id ? { ...l, ...updates } : l));
  localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
  window.dispatchEvent(new CustomEvent("taste_logs_changed"));
}

export function isLogged(tmdbId: number): LogEntry | undefined {
  return getLogs().find((l) => l.tmdb_id === tmdbId);
}

// ─── Watchlist ────────────────────────────────────────────────────────────────

export function getWatchlist(): WatchlistEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(WATCHLIST_KEY) || "[]");
  } catch {
    return [];
  }
}

export function addToWatchlist(
  entry: Omit<WatchlistEntry, "id" | "added_at">,
): WatchlistEntry {
  const watchlist = getWatchlist();
  const existing = watchlist.find((w) => w.tmdb_id === entry.tmdb_id);
  if (existing) return existing;

  const newEntry: WatchlistEntry = {
    ...entry,
    id: generateId(),
    added_at: new Date().toISOString(),
  };
  watchlist.unshift(newEntry);
  localStorage.setItem(WATCHLIST_KEY, JSON.stringify(watchlist));
  window.dispatchEvent(new CustomEvent("taste_watchlist_changed"));
  return newEntry;
}

export function removeFromWatchlist(tmdbId: number): void {
  const watchlist = getWatchlist().filter((w) => w.tmdb_id !== tmdbId);
  localStorage.setItem(WATCHLIST_KEY, JSON.stringify(watchlist));
  window.dispatchEvent(new CustomEvent("taste_watchlist_changed"));
}

export function isOnWatchlist(tmdbId: number): boolean {
  return getWatchlist().some((w) => w.tmdb_id === tmdbId);
}

// ─── Ratings ──────────────────────────────────────────────────────────────────

export function getRatings(): Record<number, number> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(RATINGS_KEY) || "{}");
  } catch {
    return {};
  }
}

export function setRating(tmdbId: number, rating: number): void {
  const ratings = getRatings();
  ratings[tmdbId] = rating;
  localStorage.setItem(RATINGS_KEY, JSON.stringify(ratings));
}

export function getRating(tmdbId: number): number | null {
  return getRatings()[tmdbId] ?? null;
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export function getStats() {
  const logs = getLogs();
  const films = logs.filter((l) => l.type === "film" && l.status === "watched");
  const series = logs.filter((l) => l.type === "series");
  const uniqueSeries = new Set(series.map((s) => s.tmdb_id)).size;

  const genreCounts: Record<string, number> = {};
  const directorCounts: Record<string, number> = {};
  const ratedLogs = logs.filter((l) => l.user_rating);
  const totalRating = ratedLogs.reduce((s, l) => s + (l.user_rating || 0), 0);

  for (const log of films) {
    for (const g of log.genres || []) {
      genreCounts[g] = (genreCounts[g] || 0) + 1;
    }
    if (log.director) {
      directorCounts[log.director] = (directorCounts[log.director] || 0) + 1;
    }
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
    .map(([name]) => name);

  return {
    total_films: films.length,
    total_series: uniqueSeries,
    total_hours: Math.round(films.length * 1.75), // avg 105 min
    total_episodes: series.length,
    top_genres: topGenres,
    top_directors: topDirectors,
    avg_rating: ratedLogs.length > 0 ? totalRating / ratedLogs.length : 0,
  };
}

// ─── User Profile ─────────────────────────────────────────────────────────────

export interface UserProfile {
  username: string;
  display_name: string;
  bio: string;
  archetype: string;
  archetype_desc: string;
  streaming_services: string[];
}

export function getUserProfile(): UserProfile {
  if (typeof window === "undefined") {
    return defaultProfile();
  }
  try {
    const stored = localStorage.getItem(USER_KEY);
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
  const updated = { ...current, ...profile };
  localStorage.setItem(USER_KEY, JSON.stringify(updated));
}
