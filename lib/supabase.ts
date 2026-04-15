import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client-side Supabase client (uses anon key, respects RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Server-side client using service role (bypasses RLS — only use in API routes)
export function createServiceClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    // Fall back to anon client if no service key (read-only operations still work)
    return createClient(supabaseUrl, supabaseAnonKey);
  }
  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });
}

// ── Types matching our schema ──────────────────────────────────────────────

export type MediaType = "movie" | "tv";

export interface DbTitle {
  id: string;
  tmdb_id: number;
  media_type: MediaType;
  title: string;
  original_title: string | null;
  tagline: string | null;
  overview: string | null;
  original_language: string | null;
  status: string | null;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string | null;
  year: number | null;
  runtime: number | null;
  number_of_seasons: number | null;
  number_of_episodes: number | null;
  imdb_id: string | null;
  tmdb_rating: number;
  tmdb_rating_5: number;
  vote_count: number;
  popularity: number;
  community_rating: number | null;
  community_votes: number;
  synced_at: string;
}

export interface DbEpisode {
  id: string;
  season_id: string;
  title_id: string;
  episode_number: number;
  season_number: number;
  name: string | null;
  overview: string | null;
  air_date: string | null;
  still_path: string | null;
  runtime: number | null;
  tmdb_rating: number;
  tmdb_rating_5: number;
  vote_count: number;
}

export interface DbReview {
  id: string;
  user_id: string;
  title_id: string;
  body: string;
  rating: number | null;
  is_spoiler: boolean;
  likes: number;
  created_at: string;
  profiles?: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
}

export interface DbUserRating {
  id: string;
  user_id: string;
  title_id: string;
  rating: number;
  rated_at: string;
}

// ── Poster/backdrop URL helpers ────────────────────────────────────────────

const TMDB_IMG = "https://image.tmdb.org/t/p";

export function posterUrl(path: string | null, size = "w500"): string | null {
  return path ? `${TMDB_IMG}/${size}${path}` : null;
}

export function backdropUrl(
  path: string | null,
  size = "w1280",
): string | null {
  return path ? `${TMDB_IMG}/${size}${path}` : null;
}
