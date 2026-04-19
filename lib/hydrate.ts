import { supabase } from "./supabase";
import { GENRE_NAMES } from "./tmdb"; // already has id→name map

const LS_LOGS = "taste_logs";
const LS_WATCHLIST = "taste_watchlist";
const TMDB_IMG = "https://image.tmdb.org/t/p/w185";
let _hydrating = false;

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
function emit(e: string) {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(e));
}
function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export async function hydrateFromSupabase(): Promise<void> {
  if (typeof window === "undefined" || _hydrating) return;
  if (lsGet<any[]>(LS_LOGS, []).length > 0) return;

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return;

  _hydrating = true;
  try {
    const userId = session.user.id;

    // 1. Fetch logs with title info
    const { data: logs } = await supabase
      .from("logs")
      .select(
        `id, status, watched_at, note, rewatch,
        titles ( id, tmdb_id, media_type, title, poster_path, year )`,
      )
      .eq("user_id", userId)
      .order("watched_at", { ascending: false })
      .limit(500);

    if (!logs?.length) return;

    const titleIds = [
      ...new Set(logs.map((l: any) => l.titles?.id).filter(Boolean)),
    ];

    // 2. Fetch genre IDs from title_genres (just integer genre_id — no join needed)
    const { data: tgRows } = await supabase
      .from("title_genres")
      .select("title_id, genre_id")
      .in("title_id", titleIds);

    // Build genre map using GENRE_NAMES lookup (already in codebase, no extra query)
    const genreMap: Record<string, string[]> = {};
    for (const row of tgRows || []) {
      const name = GENRE_NAMES[row.genre_id];
      if (row.title_id && name) {
        if (!genreMap[row.title_id]) genreMap[row.title_id] = [];
        if (!genreMap[row.title_id].includes(name))
          genreMap[row.title_id].push(name);
      }
    }

    // 3. Fetch directors
    const { data: castRows } = await supabase
      .from("title_cast")
      .select("title_id, people ( name )")
      .in("title_id", titleIds)
      .eq("role", "director");

    const directorMap: Record<string, string> = {};
    for (const row of castRows || []) {
      const name = (row.people as any)?.name;
      if (row.title_id && name && !directorMap[row.title_id])
        directorMap[row.title_id] = name;
    }

    // 4. Map to localStorage shape
    const mapped = logs
      .map((log: any) => {
        const t = log.titles;
        if (!t) return null;
        const mediaType: "movie" | "tv" =
          t.media_type === "tv" ? "tv" : "movie";
        return {
          id: log.id || genId(),
          tmdb_id: t.tmdb_id,
          media_type: mediaType,
          type: mediaType === "tv" ? "series" : "film",
          title: t.title,
          poster_url: t.poster_path ? `${TMDB_IMG}${t.poster_path}` : null,
          year: t.year ?? 0,
          tmdb_rating: 0,
          user_rating: null,
          note: log.note ?? null,
          status: log.status,
          watched_at: log.watched_at,
          genres: genreMap[t.id] ?? [],
          director: directorMap[t.id] ?? undefined,
        };
      })
      .filter(Boolean);

    if (mapped.length > 0) {
      lsSet(LS_LOGS, mapped);
      emit("taste_logs_changed");
      console.log(
        `[hydrate] ${mapped.length} logs, sample genres:`,
        mapped[0]?.genres,
      );
    }

    // 5. Watchlist
    if (lsGet<any[]>(LS_WATCHLIST, []).length === 0) {
      const { data: wl } = await supabase
        .from("watchlists")
        .select(
          "id, priority, added_at, titles ( tmdb_id, media_type, title, poster_path, year )",
        )
        .eq("user_id", userId)
        .limit(300);

      const mappedWL = (wl || [])
        .map((w: any) => {
          const t = w.titles;
          if (!t) return null;
          return {
            id: w.id || genId(),
            tmdb_id: t.tmdb_id,
            type: t.media_type === "tv" ? "series" : "film",
            title: t.title,
            poster_url: t.poster_path ? `${TMDB_IMG}${t.poster_path}` : null,
            year: t.year ?? 0,
            tmdb_rating: 0,
            priority: w.priority ?? "normal",
            added_at: w.added_at ?? new Date().toISOString(),
          };
        })
        .filter(Boolean);

      if (mappedWL.length > 0) {
        lsSet(LS_WATCHLIST, mappedWL);
        emit("taste_watchlist_changed");
      }
    }
  } catch (err) {
    console.error("[hydrate] Failed:", err);
  } finally {
    _hydrating = false;
  }
}
