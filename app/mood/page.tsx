"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Film, Tv, Loader2, X, RotateCcw, Sliders } from "lucide-react";
import { addToWatchlist } from "@/lib/store";

const SERIF = "Playfair Display, Georgia, serif";
const SANS = "Inter, system-ui, sans-serif";
const MONO = "JetBrains Mono, Courier New, monospace";

// ─── Mood Presets ─────────────────────────────────────────────────────────────

interface MoodFilters {
  tones: string[];
  genres: string[];
  maxRuntime: number | null;
  minRuntime: number | null;
  languages: string[];
  excludeEnglish: boolean;
  decades: string[];
  mediaType: "all" | "movie" | "tv";
  minRating: number;
  sortBy: "mood_score" | "rating" | "popularity" | "year_desc" | "year_asc";
}

const DEFAULT_FILTERS: MoodFilters = {
  tones: [],
  genres: [],
  maxRuntime: null,
  minRuntime: null,
  languages: [],
  excludeEnglish: false,
  decades: [],
  mediaType: "all",
  minRating: 0,
  sortBy: "mood_score",
};

interface MoodPreset {
  id: string;
  label: string;
  emoji: string;
  desc: string;
  filters: Partial<MoodFilters>;
  gradient: string;
}

const MOOD_PRESETS: MoodPreset[] = [
  {
    id: "tense",
    label: "Tense",
    emoji: "⚡",
    desc: "Edge-of-seat without the gore",
    gradient: "linear-gradient(135deg, #1a0a0a, #3a1010)",
    filters: { tones: ["tense", "gripping", "suspenseful"], genres: ["Thriller", "Crime", "Mystery"], maxRuntime: 130, minRating: 3.2 },
  },
  {
    id: "contemplative",
    label: "Contemplative",
    emoji: "🌙",
    desc: "Slow, meditative, stays with you",
    gradient: "linear-gradient(135deg, #0a0a1a, #101030)",
    filters: { tones: ["slow", "meditative", "poetic"], genres: ["Drama"], minRuntime: 90, minRating: 3.5 },
  },
  {
    id: "laugh",
    label: "Lighthearted",
    emoji: "✨",
    desc: "Fun, warm, genuinely funny",
    gradient: "linear-gradient(135deg, #0a1a0a, #103010)",
    filters: { tones: ["funny", "light", "warm"], genres: ["Comedy", "Romance"], maxRuntime: 110, minRating: 3.0 },
  },
  {
    id: "epic",
    label: "Epic",
    emoji: "🏔",
    desc: "Grand, immersive, world-building",
    gradient: "linear-gradient(135deg, #0a0f1a, #102030)",
    filters: { tones: ["epic", "grand", "sweeping"], genres: ["Adventure", "Fantasy", "Action"], minRuntime: 120, minRating: 3.3 },
  },
  {
    id: "foreign",
    label: "World Cinema",
    emoji: "🌍",
    desc: "Non-English, international lens",
    gradient: "linear-gradient(135deg, #1a0a10, #300a20)",
    filters: { excludeEnglish: true, minRating: 3.4 },
  },
  {
    id: "quick",
    label: "Quick Pick",
    emoji: "🎯",
    desc: "Under 90 minutes, straight to it",
    gradient: "linear-gradient(135deg, #0f1a0a, #203010)",
    filters: { maxRuntime: 90, minRating: 3.0 },
  },
  {
    id: "documentary",
    label: "Reality",
    emoji: "📽",
    desc: "True stories, real world",
    gradient: "linear-gradient(135deg, #1a1a0a, #302a10)",
    filters: { genres: ["Documentary"], minRating: 3.3 },
  },
  {
    id: "mindblowing",
    label: "Mind-bending",
    emoji: "🌀",
    desc: "Nonlinear, cerebral, challenges you",
    gradient: "linear-gradient(135deg, #0f0a1a, #201030)",
    filters: { tones: ["cerebral", "complex", "mind-bending"], genres: ["Sci-Fi", "Mystery", "Thriller"], minRating: 3.5 },
  },
];

// Tone → Genre score boost mapping
const TONE_GENRE_AFFINITY: Record<string, Record<string, number>> = {
  tense:       { Thriller: 10, Crime: 8, Mystery: 8, Horror: 4, Drama: 2 },
  gripping:    { Thriller: 9, Crime: 7, Action: 5, Drama: 4 },
  suspenseful: { Thriller: 10, Mystery: 8, Crime: 6, Horror: 5 },
  slow:        { Drama: 10, Documentary: 6, Romance: 4, History: 5 },
  meditative:  { Drama: 10, Documentary: 7, History: 5 },
  poetic:      { Drama: 9, Romance: 6, Documentary: 4 },
  funny:       { Comedy: 10, Romance: 5, Animation: 4 },
  light:       { Comedy: 9, Romance: 6, Family: 5, Animation: 4 },
  warm:        { Comedy: 7, Romance: 8, Family: 8, Drama: 4 },
  epic:        { Adventure: 10, Fantasy: 9, Action: 7, "Sci-Fi": 6, History: 5 },
  grand:       { Adventure: 9, Fantasy: 8, History: 8, Action: 6 },
  sweeping:    { History: 9, Adventure: 8, Romance: 6, Drama: 5 },
  cerebral:    { "Sci-Fi": 10, Mystery: 8, Thriller: 6, Drama: 5 },
  complex:     { "Sci-Fi": 8, Thriller: 7, Crime: 6, Drama: 6 },
  "mind-bending": { "Sci-Fi": 10, Mystery: 9, Thriller: 7 },
};

// Language display names
const LANG_NAMES: Record<string, string> = {
  ko: "Korean", ja: "Japanese", fr: "French", es: "Spanish",
  de: "German", it: "Italian", zh: "Chinese", hi: "Hindi",
  pt: "Portuguese", ru: "Russian", tr: "Turkish", ar: "Arabic",
};

const GENRE_LIST = [
  "Action","Adventure","Animation","Comedy","Crime","Documentary",
  "Drama","Fantasy","History","Horror","Mystery","Romance","Sci-Fi",
  "Thriller","War","Western","Family",
];

const DECADE_LIST = ["1950s","1960s","1970s","1980s","1990s","2000s","2010s","2020s"];

// ─── Scoring Algorithm ────────────────────────────────────────────────────────

function computeMoodScore(item: any, filters: MoodFilters): number {
  let score = 0;

  // Base: community or TMDB rating (0–50 pts)
  const rating = item.community_rating || item.tmdb_rating_5 || 0;
  score += rating * 10;

  // Popularity signal — log-scaled, capped (0–15 pts)
  const pop = Math.log10(Math.max(item.popularity || 1, 1));
  score += Math.min(pop * 3, 15);

  // Genre affinity based on selected tones (0–40 pts)
  if (filters.tones.length > 0 && item.genres?.length > 0) {
    let affinityScore = 0;
    for (const tone of filters.tones) {
      const affinities = TONE_GENRE_AFFINITY[tone] || {};
      for (const genre of item.genres) {
        affinityScore += affinities[genre] || 0;
      }
    }
    score += Math.min(affinityScore, 40);
  }

  // Exact genre match bonus (0–20 pts)
  if (filters.genres.length > 0 && item.genres?.length > 0) {
    const matchCount = filters.genres.filter((g: string) => item.genres.includes(g)).length;
    score += matchCount * 10;
  }

  // Recency bonus for 2010s+ titles (0–5 pts)
  if (item.year >= 2010) score += 3;
  if (item.year >= 2018) score += 2;

  // Vote count confidence (0–5 pts)
  const voteBonus = Math.min(Math.log10(Math.max(item.vote_count || 1, 1)) * 1.5, 5);
  score += voteBonus;

  return Math.round(score * 10) / 10;
}

function applyHardFilters(item: any, filters: MoodFilters): boolean {
  // Media type
  if (filters.mediaType === "movie" && item.media_type !== "movie") return false;
  if (filters.mediaType === "tv" && item.media_type !== "tv") return false;

  // Min rating
  const rating = item.tmdb_rating_5 || 0;
  if (rating < filters.minRating) return false;

  // Runtime
  if (filters.maxRuntime && item.runtime && item.runtime > filters.maxRuntime) return false;
  if (filters.minRuntime && item.runtime && item.runtime < filters.minRuntime) return false;

  // Language
  if (filters.excludeEnglish && item.original_language === "en") return false;
  if (filters.languages.length > 0 && !filters.languages.includes(item.original_language)) return false;

  // Decade
  if (filters.decades.length > 0) {
    const decade = Math.floor((item.year || 0) / 10) * 10;
    const decadeStr = `${decade}s`;
    if (!filters.decades.includes(decadeStr)) return false;
  }

  // Must have a poster
  if (!item.poster_url) return false;

  // Min vote count for quality signal
  if ((item.vote_count || 0) < 50) return false;

  return true;
}

function sortResults(items: any[], filters: MoodFilters, allFilters: MoodFilters): any[] {
  return [...items].sort((a, b) => {
    switch (filters.sortBy) {
      case "rating":
        return (b.community_rating || b.tmdb_rating_5 || 0) - (a.community_rating || a.tmdb_rating_5 || 0);
      case "popularity":
        return (b.popularity || 0) - (a.popularity || 0);
      case "year_desc":
        return (b.year || 0) - (a.year || 0);
      case "year_asc":
        return (a.year || 0) - (b.year || 0);
      default: // mood_score
        return (b._moodScore || 0) - (a._moodScore || 0);
    }
  });
}

// ─── Title Card ───────────────────────────────────────────────────────────────

function TitleCard({ item, onSave, rank }: { item: any; onSave: (item: any) => void; rank: number }) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [hovered, setHovered] = useState(false);
  const mt = item.media_type === "tv" ? "tv" : "movie";
  const rating = item.community_rating || item.tmdb_rating_5 || 0;
  const score = item._moodScore;

  return (
    <div
      style={{
        position: "relative",
        cursor: "pointer",
        borderRadius: "8px",
        overflow: "hidden",
        background: "#0A0A0A",
        border: `1px solid ${hovered ? "rgba(200,169,110,0.25)" : "#181818"}`,
        transition: "transform 0.22s cubic-bezier(.34,1.36,.64,1), box-shadow 0.22s ease, border-color 0.15s",
        transform: hovered ? "translateY(-5px) scale(1.01)" : "none",
        boxShadow: hovered ? "0 20px 50px rgba(0,0,0,0.7), 0 0 0 1px rgba(200,169,110,0.1)" : "0 2px 12px rgba(0,0,0,0.4)",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => router.push(`/title/${mt}/${item.tmdb_id}`)}
    >
      {/* Poster */}
      <div style={{ aspectRatio: "2/3", overflow: "hidden", background: "#111", position: "relative" }}>
        <img
          src={item.poster_url}
          alt={item.title}
          style={{
            width: "100%", height: "100%", objectFit: "cover",
            transition: "transform 0.4s ease",
            transform: hovered ? "scale(1.06)" : "scale(1)",
          }}
        />

        {/* Mood score bar — thin strip at bottom of poster */}
        {score !== undefined && (
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            height: "3px", background: "rgba(0,0,0,0.5)",
          }}>
            <div style={{
              height: "100%",
              width: `${Math.min((score / 120) * 100, 100)}%`,
              background: score > 80 ? "#C8A96E" : score > 50 ? "rgba(200,169,110,0.6)" : "rgba(200,169,110,0.3)",
              transition: "width 0.6s ease",
            }} />
          </div>
        )}

        {/* Gradient overlay */}
        <div style={{
          position: "absolute", inset: 0,
          background: hovered
            ? "linear-gradient(to top, rgba(10,10,10,1) 0%, rgba(10,10,10,0.5) 45%, transparent 75%)"
            : "linear-gradient(to top, rgba(10,10,10,0.95) 0%, rgba(10,10,10,0.3) 40%, transparent 65%)",
          transition: "background 0.25s ease",
        }} />

        {/* Save button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!saved) {
              onSave(item);
              setSaved(true);
            }
          }}
          style={{
            position: "absolute", top: "8px", right: "8px",
            width: "26px", height: "26px", borderRadius: "6px",
            background: saved ? "rgba(74,158,107,0.9)" : "rgba(10,10,10,0.85)",
            border: `1px solid ${saved ? "#4A9E6B" : "rgba(255,255,255,0.1)"}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", transition: "all 0.15s",
            opacity: hovered ? 1 : 0,
          }}
        >
          <span style={{ fontSize: "12px", lineHeight: 1, color: saved ? "#fff" : "#C8A96E" }}>
            {saved ? "✓" : "+"}
          </span>
        </button>

        {/* Language badge */}
        {item.original_language && item.original_language !== "en" && (
          <div style={{
            position: "absolute", top: "8px", left: "8px",
            padding: "2px 6px", borderRadius: "4px",
            background: "rgba(10,10,10,0.85)", border: "1px solid rgba(74,158,107,0.4)",
            fontFamily: MONO, fontSize: "8px", color: "#4A9E6B",
            textTransform: "uppercase", letterSpacing: "0.06em",
          }}>
            {item.original_language}
          </div>
        )}

        {/* Bottom info */}
        <div style={{ position: "absolute", bottom: "8px", left: "8px", right: "8px" }}>
          <p style={{
            fontFamily: SANS, fontSize: "11px", fontWeight: 600,
            color: "#F0EDE8", lineHeight: 1.3, marginBottom: "3px",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {item.title}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontFamily: MONO, fontSize: "9px", color: "#8A8780" }}>{item.year}</span>
            {rating > 0 && (
              <span style={{ fontFamily: MONO, fontSize: "9px", color: "#C8A96E" }}>★ {rating.toFixed(1)}</span>
            )}
            {item.runtime && (
              <span style={{ fontFamily: MONO, fontSize: "9px", color: "#504E4A" }}>{item.runtime}min</span>
            )}
            {item.media_type === "tv" && (
              <span style={{ fontFamily: SANS, fontSize: "8px", color: "#4A9E6B", background: "rgba(74,158,107,0.12)", padding: "1px 4px", borderRadius: "3px" }}>TV</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Filter Pill ──────────────────────────────────────────────────────────────

function Pill({ label, active, onClick, color = "#C8A96E" }: {
  label: string; active: boolean; onClick: () => void; color?: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "5px 13px", borderRadius: "20px", flexShrink: 0,
        fontFamily: SANS, fontSize: "12px", cursor: "pointer",
        whiteSpace: "nowrap",
        border: active ? `1px solid ${color}55` : "1px solid #222",
        background: active ? `${color}15` : "transparent",
        color: active ? color : "#504E4A",
        transition: "all 0.15s ease",
      }}
    >
      {label}
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MoodPage() {
  const [filters, setFilters] = useState<MoodFilters>(DEFAULT_FILTERS);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [rawResults, setRawResults] = useState<any[]>([]);
  const [displayResults, setDisplayResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [page, setPage] = useState(1);
  const PER_PAGE = 24;
  const router = useRouter();

  // Fetch from our Supabase-backed discover API
  const fetchTitles = useCallback(async (f: MoodFilters) => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("limit", "200");
    params.set("page", "1");

    if (f.mediaType !== "all") params.set("type", f.mediaType);
    if (f.genres.length === 1) params.set("genre", f.genres[0]);
    if (f.decades.length === 1) params.set("decade", f.decades[0].replace("s", ""));
    if (f.languages.length === 1) params.set("language", f.languages[0]);
    if (f.minRating > 0) params.set("min_rating", f.minRating.toString());
    params.set("sort", "popularity");

    try {
      const res = await fetch(`/api/discover?${params}`);
      const data = await res.json();
      setRawResults(data.results || []);
      setFetched(true);
    } catch {
      setRawResults([]);
    }
    setLoading(false);
  }, []);

  // Apply algorithmic filtering + scoring whenever filters or rawResults change
  useEffect(() => {
    if (!fetched && rawResults.length === 0) return;

    const scored = rawResults
      .filter(item => applyHardFilters(item, filters))
      .map(item => ({
        ...item,
        _moodScore: computeMoodScore(item, filters),
      }));

    const sorted = sortResults(scored, filters, filters);
    setDisplayResults(sorted);
    setPage(1);
  }, [rawResults, filters, fetched]);

  // Initial load
  useEffect(() => {
    fetchTitles(filters);
  }, []);

  function applyPreset(preset: MoodPreset) {
    if (activePreset === preset.id) {
      setActivePreset(null);
      const reset = { ...DEFAULT_FILTERS };
      setFilters(reset);
      fetchTitles(reset);
    } else {
      setActivePreset(preset.id);
      const next = { ...DEFAULT_FILTERS, ...preset.filters } as MoodFilters;
      setFilters(next);
      fetchTitles(next);
    }
  }

  function toggleFilter<K extends keyof MoodFilters>(key: K, value: any) {
    setFilters(prev => {
      const arr = (prev[key] as any[]);
      const exists = arr.includes(value);
      return { ...prev, [key]: exists ? arr.filter((v: any) => v !== value) : [...arr, value] };
    });
  }

  function setScalar<K extends keyof MoodFilters>(key: K, value: any) {
    setFilters(prev => ({ ...prev, [key]: value }));
  }

  function resetAll() {
    setFilters(DEFAULT_FILTERS);
    setActivePreset(null);
    fetchTitles(DEFAULT_FILTERS);
  }

  const visibleResults = displayResults.slice(0, page * PER_PAGE);
  const hasMore = visibleResults.length < displayResults.length;
  const activeFilterCount = [
    filters.tones.length,
    filters.genres.length,
    filters.languages.length,
    filters.decades.length,
    filters.excludeEnglish ? 1 : 0,
    filters.maxRuntime ? 1 : 0,
    filters.minRuntime ? 1 : 0,
    filters.minRating > 0 ? 1 : 0,
    filters.mediaType !== "all" ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "28px 20px 80px" }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{
          fontFamily: SERIF, fontSize: "clamp(28px, 5vw, 48px)",
          fontWeight: 700, color: "#F0EDE8", fontStyle: "italic",
          lineHeight: 1.05, marginBottom: "6px",
        }}>
          What are you in the mood for?
        </h1>
        <p style={{ fontFamily: SANS, fontSize: "13px", color: "#504E4A" }}>
          {displayResults.length > 0
            ? `${displayResults.length.toLocaleString()} titles matched — scored by tone, genre, and quality`
            : "Pick a mood or build your own filter"}
        </p>
      </div>

      {/* ── Mood Preset Cards ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
        gap: "8px",
        marginBottom: "24px",
      }}>
        {MOOD_PRESETS.map(preset => {
          const isActive = activePreset === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset)}
              style={{
                padding: "14px 12px",
                borderRadius: "10px",
                background: isActive ? preset.gradient : "#0F0F0F",
                border: isActive ? "1px solid rgba(200,169,110,0.4)" : "1px solid #1A1A1A",
                cursor: "pointer", textAlign: "left",
                transition: "all 0.2s ease",
                transform: isActive ? "scale(1.02)" : "scale(1)",
                boxShadow: isActive ? "0 8px 24px rgba(0,0,0,0.5)" : "none",
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.borderColor = "#2A2A2A";
                  (e.currentTarget as HTMLElement).style.background = "#141414";
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.borderColor = "#1A1A1A";
                  (e.currentTarget as HTMLElement).style.background = "#0F0F0F";
                }
              }}
            >
              <div style={{ fontSize: "20px", marginBottom: "6px" }}>{preset.emoji}</div>
              <p style={{ fontFamily: SERIF, fontSize: "13px", fontWeight: 700, color: "#F0EDE8", fontStyle: "italic", marginBottom: "3px" }}>
                {preset.label}
              </p>
              <p style={{ fontFamily: SANS, fontSize: "10px", color: "#8A8780", lineHeight: 1.4 }}>
                {preset.desc}
              </p>
            </button>
          );
        })}
      </div>

      {/* ── Filter Controls ── */}
      <div style={{
        background: "#0D0D0D", border: "1px solid #1A1A1A",
        borderRadius: "12px", marginBottom: "24px", overflow: "hidden",
      }}>
        {/* Filter header bar */}
        <div style={{
          display: "flex", alignItems: "center", gap: "12px",
          padding: "12px 16px", borderBottom: showFilters ? "1px solid #1A1A1A" : "none",
        }}>
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              display: "flex", alignItems: "center", gap: "7px",
              padding: "6px 12px", borderRadius: "8px", cursor: "pointer",
              border: showFilters ? "1px solid rgba(200,169,110,0.4)" : "1px solid #2A2A2A",
              background: showFilters ? "rgba(200,169,110,0.08)" : "transparent",
              color: showFilters ? "#C8A96E" : "#8A8780",
              fontFamily: SANS, fontSize: "12px",
              transition: "all 0.15s",
            }}
          >
            <Sliders size={13} /> Fine-tune
            {activeFilterCount > 0 && (
              <span style={{
                background: "#C8A96E", color: "#0D0D0D", borderRadius: "50%",
                width: "16px", height: "16px", display: "inline-flex",
                alignItems: "center", justifyContent: "center",
                fontFamily: MONO, fontSize: "9px", fontWeight: 700,
              }}>
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Sort */}
          <div style={{ display: "flex", gap: "6px", marginLeft: "auto", flexWrap: "wrap" }}>
            {[
              { value: "mood_score", label: "Best match" },
              { value: "rating", label: "Rating" },
              { value: "popularity", label: "Popular" },
              { value: "year_desc", label: "Newest" },
            ].map(opt => (
              <button key={opt.value} onClick={() => setScalar("sortBy", opt.value)}
                style={{
                  padding: "4px 10px", borderRadius: "6px", cursor: "pointer",
                  fontFamily: SANS, fontSize: "11px",
                  border: filters.sortBy === opt.value ? "1px solid rgba(200,169,110,0.4)" : "1px solid #1A1A1A",
                  background: filters.sortBy === opt.value ? "rgba(200,169,110,0.1)" : "transparent",
                  color: filters.sortBy === opt.value ? "#C8A96E" : "#504E4A",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {activeFilterCount > 0 && (
            <button onClick={resetAll} style={{
              display: "flex", alignItems: "center", gap: "4px",
              background: "none", border: "none", cursor: "pointer",
              color: "#504E4A", fontFamily: SANS, fontSize: "11px",
            }}>
              <RotateCcw size={11} /> Reset
            </button>
          )}
        </div>

        {/* Expandable filter panel */}
        {showFilters && (
          <div style={{ padding: "16px" }}>
            {/* Tone */}
            <div style={{ marginBottom: "16px" }}>
              <p style={{ fontFamily: SANS, fontSize: "10px", color: "#504E4A", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "8px" }}>
                Tone
              </p>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {Object.keys(TONE_GENRE_AFFINITY).map(tone => (
                  <Pill key={tone} label={tone} active={filters.tones.includes(tone)}
                    onClick={() => toggleFilter("tones", tone)} color="#C8A96E" />
                ))}
              </div>
            </div>

            {/* Genre */}
            <div style={{ marginBottom: "16px" }}>
              <p style={{ fontFamily: SANS, fontSize: "10px", color: "#504E4A", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "8px" }}>
                Genre
              </p>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {GENRE_LIST.map(g => (
                  <Pill key={g} label={g} active={filters.genres.includes(g)}
                    onClick={() => toggleFilter("genres", g)} color="#9A8AC0" />
                ))}
              </div>
            </div>

            {/* Media type + Runtime row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
              <div>
                <p style={{ fontFamily: SANS, fontSize: "10px", color: "#504E4A", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "8px" }}>
                  Type
                </p>
                <div style={{ display: "flex", gap: "6px" }}>
                  {[["all","All"],["movie","Movies"],["tv","TV"]].map(([v, l]) => (
                    <Pill key={v} label={l} active={filters.mediaType === v}
                      onClick={() => setScalar("mediaType", v)} color="#4A9E6B" />
                  ))}
                </div>
              </div>
              <div>
                <p style={{ fontFamily: SANS, fontSize: "10px", color: "#504E4A", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "8px" }}>
                  Runtime
                </p>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {[["Under 90min", null, 90], ["90–120min", 90, 120], ["Over 120min", 120, null]].map(([label, min, max]) => {
                    const active = filters.minRuntime === min && filters.maxRuntime === max;
                    return (
                      <Pill key={label as string} label={label as string} active={active}
                        onClick={() => {
                          if (active) { setScalar("minRuntime", null); setScalar("maxRuntime", null); }
                          else { setScalar("minRuntime", min); setScalar("maxRuntime", max); }
                        }} color="#2A6A8A" />
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Decade */}
            <div style={{ marginBottom: "16px" }}>
              <p style={{ fontFamily: SANS, fontSize: "10px", color: "#504E4A", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "8px" }}>
                Decade
              </p>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {DECADE_LIST.map(d => (
                  <Pill key={d} label={d} active={filters.decades.includes(d)}
                    onClick={() => toggleFilter("decades", d)} color="#2A5C8A" />
                ))}
              </div>
            </div>

            {/* Language */}
            <div style={{ marginBottom: "16px" }}>
              <p style={{ fontFamily: SANS, fontSize: "10px", color: "#504E4A", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "8px" }}>
                Language
              </p>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                <Pill label="Non-English" active={filters.excludeEnglish}
                  onClick={() => setScalar("excludeEnglish", !filters.excludeEnglish)} color="#4A9E6B" />
                {Object.entries(LANG_NAMES).map(([code, name]) => (
                  <Pill key={code} label={name} active={filters.languages.includes(code)}
                    onClick={() => toggleFilter("languages", code)} color="#4A9E6B" />
                ))}
              </div>
            </div>

            {/* Min rating */}
            <div>
              <p style={{ fontFamily: SANS, fontSize: "10px", color: "#504E4A", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "8px" }}>
                Minimum rating
              </p>
              <div style={{ display: "flex", gap: "6px" }}>
                {[[0, "Any"],[3.0,"3.0+"],[3.5,"3.5+"],[4.0,"4.0+"],[4.5,"4.5+"]].map(([v, l]) => (
                  <Pill key={v} label={l as string} active={filters.minRating === v}
                    onClick={() => setScalar("minRating", v)} color="#C87C2A" />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Results ── */}
      {loading ? (
        <div>
          {/* Skeleton shimmer */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
            gap: "10px",
          }}>
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} style={{
                aspectRatio: "2/3", borderRadius: "8px",
                background: "linear-gradient(90deg, #0F0F0F 25%, #141414 50%, #0F0F0F 75%)",
                backgroundSize: "200% 100%",
                animation: `skeleton-loading 1.5s ease-in-out ${i * 30}ms infinite`,
              }} />
            ))}
          </div>
        </div>
      ) : displayResults.length === 0 && fetched ? (
        <div style={{ textAlign: "center", padding: "80px 0" }}>
          <p style={{ fontFamily: SERIF, fontSize: "22px", color: "#2A2A2A", fontStyle: "italic", marginBottom: "8px" }}>
            Nothing matched those filters.
          </p>
          <p style={{ fontFamily: SANS, fontSize: "13px", color: "#504E4A", marginBottom: "20px" }}>
            Try loosening the runtime, rating, or language constraints.
          </p>
          <button onClick={resetAll} style={{
            padding: "9px 22px", borderRadius: "8px", background: "transparent",
            border: "1px solid #2A2A2A", color: "#8A8780",
            fontFamily: SANS, fontSize: "13px", cursor: "pointer",
          }}>
            Reset filters
          </button>
        </div>
      ) : (
        <>
          {/* Score legend when using mood scoring */}
          {filters.sortBy === "mood_score" && (filters.tones.length > 0 || filters.genres.length > 0 || activePreset) && (
            <div style={{
              display: "flex", alignItems: "center", gap: "12px",
              marginBottom: "16px", padding: "8px 12px",
              background: "rgba(200,169,110,0.04)", border: "1px solid rgba(200,169,110,0.1)",
              borderRadius: "8px",
            }}>
              <span style={{ fontFamily: SANS, fontSize: "11px", color: "#504E4A" }}>Match score</span>
              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                {[["#C8A96E","Strong"],["rgba(200,169,110,0.5)","Good"],["rgba(200,169,110,0.25)","Partial"]].map(([c, l]) => (
                  <div key={l} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <div style={{ width: "20px", height: "3px", background: c as string, borderRadius: "2px" }} />
                    <span style={{ fontFamily: SANS, fontSize: "10px", color: "#504E4A" }}>{l}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
            gap: "10px",
            marginBottom: "24px",
          }}>
            {visibleResults.map((item, i) => (
              <TitleCard
                key={`${item.media_type}-${item.tmdb_id}`}
                item={item}
                rank={i + 1}
                onSave={(item) => addToWatchlist({
                  tmdb_id: item.tmdb_id,
                  type: item.type || "film",
                  title: item.title,
                  poster_url: item.poster_url,
                  year: item.year,
                  tmdb_rating: item.tmdb_rating,
                  overview: item.overview,
                  genres: item.genres || [],
                  priority: "normal",
                })}
              />
            ))}
          </div>

          {hasMore && (
            <div style={{ textAlign: "center" }}>
              <button
                onClick={() => setPage(p => p + 1)}
                style={{
                  padding: "10px 28px", borderRadius: "8px",
                  background: "transparent", border: "1px solid #2A2A2A",
                  color: "#8A8780", fontFamily: SANS, fontSize: "13px",
                  cursor: "pointer", transition: "all 0.15s",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(200,169,110,0.3)";
                  (e.currentTarget as HTMLElement).style.color = "#C8A96E";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = "#2A2A2A";
                  (e.currentTarget as HTMLElement).style.color = "#8A8780";
                }}
              >
                Show more ({displayResults.length - visibleResults.length} remaining)
              </button>
            </div>
          )}
        </>
      )}

      <style>{`
        @keyframes skeleton-loading {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}