// TMDB API Client
const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

export const POSTER_URL = (
  path: string | null,
  size: "w185" | "w300" | "w500" | "original" = "w300",
) => (path ? `${TMDB_IMAGE_BASE}/${size}${path}` : null);

export const BACKDROP_URL = (
  path: string | null,
  size: "w780" | "w1280" | "original" = "w1280",
) => (path ? `${TMDB_IMAGE_BASE}/${size}${path}` : null);

function getKey() {
  return process.env.TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_API_KEY || "";
}

async function tmdbFetch(
  endpoint: string,
  params: Record<string, string> = {},
) {
  const key = getKey();
  if (!key) {
    console.warn("TMDB_API_KEY not set");
    return null;
  }
  const url = new URL(`${TMDB_BASE}${endpoint}`);
  url.searchParams.set("api_key", key);
  url.searchParams.set("language", "en-US");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
  if (!res.ok) {
    console.error(`TMDB error ${res.status} for ${endpoint}`);
    return null;
  }
  return res.json();
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TMDBMovie {
  id: number;
  title: string;
  overview: string;
  release_date: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count: number;
  genre_ids?: number[];
  genres?: { id: number; name: string }[];
  runtime?: number;
  status?: string;
  tagline?: string;
  imdb_id?: string;
  popularity: number;
  original_language: string;
}

export interface TMDBTVShow {
  id: number;
  name: string;
  overview: string;
  first_air_date: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count: number;
  genre_ids?: number[];
  genres?: { id: number; name: string }[];
  number_of_seasons?: number;
  number_of_episodes?: number;
  status?: string;
  episode_run_time?: number[];
  popularity: number;
  original_language: string;
  created_by?: { name: string }[];
}

export interface TMDBEpisode {
  id: number;
  name: string;
  overview: string;
  episode_number: number;
  season_number: number;
  air_date: string;
  vote_average: number;
  vote_count: number;
  still_path: string | null;
  runtime: number | null;
}

export interface TMDBSeason {
  id: number;
  season_number: number;
  name: string;
  overview: string;
  episode_count: number;
  air_date: string;
  poster_path: string | null;
  episodes?: TMDBEpisode[];
}

export interface TMDBSearchResult {
  page: number;
  results: (TMDBMovie | TMDBTVShow)[];
  total_results: number;
  total_pages: number;
}

export interface TMDBCredit {
  id: number;
  name: string;
  job?: string;
  department?: string;
  character?: string;
  profile_path: string | null;
}

// ─── Search ───────────────────────────────────────────────────────────────────

export async function searchMulti(query: string, page = 1) {
  return tmdbFetch("/search/multi", { query, page: String(page) });
}

export async function searchMovies(query: string, page = 1) {
  return tmdbFetch("/search/movie", { query, page: String(page) });
}

export async function searchTV(query: string, page = 1) {
  return tmdbFetch("/search/tv", { query, page: String(page) });
}

// ─── Movies ───────────────────────────────────────────────────────────────────

export async function getMovie(id: number): Promise<TMDBMovie | null> {
  return tmdbFetch(`/movie/${id}`, { append_to_response: "credits,keywords" });
}

export async function getMovieCredits(id: number) {
  return tmdbFetch(`/movie/${id}/credits`);
}

export async function getTrendingMovies(timeWindow: "day" | "week" = "week") {
  return tmdbFetch(`/trending/movie/${timeWindow}`);
}

export async function getPopularMovies(page = 1) {
  return tmdbFetch("/movie/popular", { page: String(page) });
}

export async function getTopRatedMovies(page = 1) {
  return tmdbFetch("/movie/top_rated", { page: String(page) });
}

export async function getMoviesByGenre(genreId: number, page = 1) {
  return tmdbFetch("/discover/movie", {
    with_genres: String(genreId),
    sort_by: "vote_average.desc",
    "vote_count.gte": "100",
    page: String(page),
  });
}

export async function getSimilarMovies(id: number) {
  return tmdbFetch(`/movie/${id}/similar`);
}

export async function getMovieRecommendations(id: number) {
  return tmdbFetch(`/movie/${id}/recommendations`);
}

export async function getNowPlayingMovies() {
  return tmdbFetch("/movie/now_playing");
}

export async function getUpcomingMovies() {
  return tmdbFetch("/movie/upcoming");
}

// ─── TV Shows ─────────────────────────────────────────────────────────────────

export async function getTVShow(id: number): Promise<TMDBTVShow | null> {
  return tmdbFetch(`/tv/${id}`, { append_to_response: "credits,keywords" });
}

export async function getTVCredits(id: number) {
  return tmdbFetch(`/tv/${id}/credits`);
}

export async function getTVSeason(
  showId: number,
  seasonNumber: number,
): Promise<{ episodes: TMDBEpisode[] } | null> {
  return tmdbFetch(`/tv/${showId}/season/${seasonNumber}`);
}

export async function getTrendingTV(timeWindow: "day" | "week" = "week") {
  return tmdbFetch(`/trending/tv/${timeWindow}`);
}

export async function getPopularTV(page = 1) {
  return tmdbFetch("/tv/popular", { page: String(page) });
}

export async function getTopRatedTV(page = 1) {
  return tmdbFetch("/tv/top_rated", { page: String(page) });
}

export async function getOnAirTV() {
  return tmdbFetch("/tv/on_the_air");
}

export async function getAiringTodayTV() {
  return tmdbFetch("/tv/airing_today");
}

// ─── Genres ───────────────────────────────────────────────────────────────────

export async function getMovieGenres() {
  return tmdbFetch("/genre/movie/list");
}

export async function getTVGenres() {
  return tmdbFetch("/genre/tv/list");
}

// ─── People ───────────────────────────────────────────────────────────────────

export async function getPerson(id: number) {
  return tmdbFetch(`/person/${id}`, {
    append_to_response: "movie_credits,tv_credits",
  });
}

export async function getPersonMovieCredits(id: number) {
  return tmdbFetch(`/person/${id}/movie_credits`);
}

// ─── Discover ─────────────────────────────────────────────────────────────────

export async function discoverMovies(params: Record<string, string>) {
  return tmdbFetch("/discover/movie", params);
}

export async function discoverTV(params: Record<string, string>) {
  return tmdbFetch("/discover/tv", params);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export const GENRE_NAMES: Record<number, string> = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Sci-Fi",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
  // TV genres
  10759: "Action & Adventure",
  10762: "Kids",
  10763: "News",
  10764: "Reality",
  10765: "Sci-Fi & Fantasy",
  10766: "Soap",
  10767: "Talk",
  10768: "War & Politics",
};

export function formatRuntime(minutes: number): string {
  if (!minutes) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function getYear(dateString: string): number {
  if (!dateString) return 0;
  return new Date(dateString).getFullYear();
}

export function formatRating(rating: number): string {
  return rating.toFixed(1);
}

// ─── Curated IDs for the platform ────────────────────────────────────────────
// These are TMDB IDs for well-known films used as defaults / seeds

export const SEED_FILM_IDS = [
  424, // Schindler's List
  637, // In the Mood for Love
  289, // Stalker (1979)
  314, // Mulholland Drive
  496243, // Parasite
  129, // Spirited Away
  238, // The Godfather
  372058, // Your Name
  27205, // Inception
  264644, // Room
  378, // Alien
  155, // The Dark Knight
  13, // Forrest Gump
  680, // Pulp Fiction
  597, // Titanic
  598, // City of God
];

export const SEED_TV_IDS = [
  1396, // Breaking Bad
  60735, // The Flash (Twin Peaks proxy)
  66732, // Stranger Things
  1418, // The Big Bang Theory
  87108, // Chernobyl
  67195, // Dark
  85937, // Severance
  94997, // House of the Dragon
  71712, // The Good Doctor
  46952, // Barry
];
