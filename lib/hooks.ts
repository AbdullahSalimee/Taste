"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./auth-context";
import {
  getLogs,
  getWatchlist,
  getStats,
  getUserProfile,
  isLogged,
  isOnWatchlist,
} from "@/lib/store";
import type { LogEntry, WatchlistEntry } from "@/lib/store";

// ─── Trending / Discover ──────────────────────────────────────────────────────

export function useTrending(type: "all" | "film" | "tv" = "all") {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/trending?type=${type}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, [type]);

  return { data, loading, error };
}

// ─── Search ───────────────────────────────────────────────────────────────────

export function useSearch(query: string) {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    fetch(`/api/search?q=${encodeURIComponent(query)}`, {
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((d) => {
        setResults(d.results || []);
        setLoading(false);
      })
      .catch((e) => {
        if (e.name !== "AbortError") {
          setResults([]);
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [query]);

  return { results, loading };
}

// ─── Title Detail ─────────────────────────────────────────────────────────────

export function useTitleDetail(type: "movie" | "tv" | null, id: number | null) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!type || !id) return;
    setLoading(true);
    fetch(`/api/title/${type}/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [type, id]);

  return { data, loading };
}

// ─── Heatmap ──────────────────────────────────────────────────────────────────

export function useHeatmap(tmdbId: number | null) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!tmdbId) return;
    setLoading(true);
    fetch(`/api/heatmap/${tmdbId}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [tmdbId]);

  return { data, loading };
}

// ─── Local Store Hooks ────────────────────────────────────────────────────────

export function useLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const refresh = useCallback(() => setLogs(getLogs()), []);

  useEffect(() => {
    refresh();
    window.addEventListener("taste_logs_changed", refresh);
    return () => window.removeEventListener("taste_logs_changed", refresh);
  }, [refresh]);

  return logs;
}

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<WatchlistEntry[]>([]);

  const refresh = useCallback(() => setWatchlist(getWatchlist()), []);

  useEffect(() => {
    refresh();
    window.addEventListener("taste_watchlist_changed", refresh);
    return () => window.removeEventListener("taste_watchlist_changed", refresh);
  }, [refresh]);

  return watchlist;
}

export function useStats() {
  const logs = useLogs();
  return getStats();
}

export function useUserProfile() {
  const [profile, setProfile] = useState(getUserProfile());

  useEffect(() => {
    setProfile(getUserProfile());
  }, []);

  return profile;
}

export function useIsLogged(tmdbId: number | null) {
  const logs = useLogs();
  if (!tmdbId) return null;
  return logs.find((l) => l.tmdb_id === tmdbId) || null;
}

export function useIsOnWatchlist(tmdbId: number | null) {
  const watchlist = useWatchlist();
  if (!tmdbId) return false;
  return watchlist.some((w) => w.tmdb_id === tmdbId);
}

// ─── Auth Hook ────────────────────────────────────────────────────────────────
export function useUser() {
  const { user, loading } = useAuth();
  return { user, loading, isSignedIn: !!user };
}
