"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, SlidersHorizontal, X, Film, Tv, Loader2 } from "lucide-react";
import { addToWatchlist } from "@/lib/store";
import { useAuthGate } from "@/components/features/AuthGate";

const SERIF = "Playfair Display, Georgia, serif";
const SANS = "Inter, system-ui, sans-serif";
const MONO = "JetBrains Mono, Courier New, monospace";

const GENRES = [
  "Action",
  "Adventure",
  "Animation",
  "Comedy",
  "Crime",
  "Documentary",
  "Drama",
  "Fantasy",
  "Horror",
  "Mystery",
  "Romance",
  "Sci-Fi",
  "Thriller",
  "War",
  "Western",
  "Family",
  "History",
];
const DECADES = [
  "1920s",
  "1930s",
  "1940s",
  "1950s",
  "1960s",
  "1970s",
  "1980s",
  "1990s",
  "2000s",
  "2010s",
  "2020s",
];
const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "ko", label: "Korean" },
  { code: "ja", label: "Japanese" },
  { code: "fr", label: "French" },
  { code: "es", label: "Spanish" },
  { code: "de", label: "German" },
  { code: "hi", label: "Hindi" },
  { code: "zh", label: "Chinese" },
  { code: "it", label: "Italian" },
  { code: "tr", label: "Turkish" },
  { code: "pt", label: "Portuguese" },
  { code: "ar", label: "Arabic" },
];
const SORT_OPTIONS = [
  { value: "popularity", label: "Most Popular" },
  { value: "rating", label: "Highest Rated" },
  { value: "votes", label: "Most Voted" },
  { value: "year_desc", label: "Newest First" },
  { value: "year_asc", label: "Oldest First" },
  { value: "community", label: "Community Rating" },
];

interface TitleItem {
  id: number;
  tmdb_id: number;
  type: "film" | "series";
  media_type: string;
  title: string;
  year: number;
  overview: string;
  poster_url: string | null;
  tmdb_rating: number;
  tmdb_rating_5: number;
  community_rating: number | null;
  vote_count: number;
  popularity: number;
  original_language: string;
}

function FilterPill({
  label,
  active,
  onClick,
  color,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "5px 12px",
        borderRadius: "20px",
        flexShrink: 0,
        fontFamily: SANS,
        fontSize: "12px",
        cursor: "pointer",
        whiteSpace: "nowrap",
        border: active
          ? `1px solid ${color || "rgba(200,169,110,0.5)"}`
          : "1px solid #2A2A2A",
        background: active
          ? `${color ? color + "22" : "rgba(200,169,110,0.12)"}`
          : "transparent",
        color: active ? color || "#C8A96E" : "#504E4A",
        transition: "all 0.15s ease",
      }}
    >
      {label}
    </button>
  );
}

function TitleCard({
  item,
  onWatchlist,
}: {
  item: TitleItem;
  onWatchlist: (item: TitleItem) => void;
}) {
  const router = useRouter();
  const [imgErr, setImgErr] = useState(false);
  const [hovered, setHovered] = useState(false);
  const rating = item.community_rating || item.tmdb_rating_5;
  return (
    <div
      className="film-card"
      onClick={() =>
        router.push(
          `/title/${item.media_type === "movie" ? "movie" : "tv"}/${item.tmdb_id}`,
        )
      }
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        cursor: "pointer",
        borderRadius: "6px",
        overflow: "hidden",
        background: "#141414",
        border: "1px solid #1A1A1A",
      }}
    >
      <div
        style={{
          aspectRatio: "2/3",
          overflow: "hidden",
          background: "#1A1A1A",
        }}
      >
        {item.poster_url && !imgErr ? (
          <img
            src={item.poster_url}
            alt={item.title}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
            onError={() => setImgErr(true)}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "12px",
            }}
          >
            {item.media_type === "tv" ? (
              <Tv size={24} color="#2A2A2A" />
            ) : (
              <Film size={24} color="#2A2A2A" />
            )}
            <span
              style={{
                fontFamily: SANS,
                fontSize: "10px",
                color: "#2A2A2A",
                textAlign: "center",
              }}
            >
              {item.title}
            </span>
          </div>
        )}
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          background:
            "linear-gradient(to top, rgba(13,13,13,0.98) 0%, rgba(13,13,13,0.6) 50%, transparent 100%)",
          padding: "32px 10px 10px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            marginBottom: "3px",
          }}
        >
          <span style={{ color: "#C8A96E", fontSize: "10px" }}>★</span>
          <span
            style={{ fontFamily: MONO, fontSize: "10px", color: "#C8A96E" }}
          >
            {rating.toFixed(1)}
          </span>
          {item.community_rating && (
            <span
              style={{
                fontFamily: SANS,
                fontSize: "9px",
                color: "#4A9E6B",
                marginLeft: "2px",
              }}
            >
              ●
            </span>
          )}
        </div>
        <p
          style={{
            fontFamily: SANS,
            fontSize: "11px",
            color: "#F0EDE8",
            fontWeight: 500,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            lineHeight: 1.3,
            marginBottom: "2px",
          }}
        >
          {item.title}
        </p>
        <p style={{ fontFamily: MONO, fontSize: "9px", color: "#504E4A" }}>
          {item.year || "—"}
          {item.media_type === "tv" && (
            <span style={{ marginLeft: "4px", color: "#4A9E6B" }}>TV</span>
          )}
        </p>
      </div>
      {hovered && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onWatchlist(item);
          }}
          style={{
            position: "absolute",
            top: "8px",
            right: "8px",
            width: "28px",
            height: "28px",
            borderRadius: "6px",
            background: "rgba(13,13,13,0.9)",
            border: "1px solid #3A3A3A",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
          title="Add to watchlist"
        >
          <span style={{ color: "#C8A96E", fontSize: "14px", lineHeight: 1 }}>
            +
          </span>
        </button>
      )}
    </div>
  );
}

function TitleRow({ item }: { item: TitleItem }) {
  const router = useRouter();
  const [imgErr, setImgErr] = useState(false);
  const rating = item.community_rating || item.tmdb_rating_5;
  return (
    <div
      onClick={() =>
        router.push(
          `/title/${item.media_type === "movie" ? "movie" : "tv"}/${item.tmdb_id}`,
        )
      }
      style={{
        display: "flex",
        gap: "12px",
        padding: "10px 12px",
        background: "#0F0F0F",
        border: "1px solid #1A1A1A",
        borderRadius: "8px",
        cursor: "pointer",
        alignItems: "center",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#2A2A2A")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#1A1A1A")}
    >
      <div
        style={{
          width: "36px",
          height: "54px",
          borderRadius: "3px",
          overflow: "hidden",
          flexShrink: 0,
          background: "#1A1A1A",
        }}
      >
        {item.poster_url && !imgErr ? (
          <img
            src={item.poster_url}
            alt={item.title}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={() => setImgErr(true)}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Film size={12} color="#2A2A2A" />
          </div>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontFamily: SANS,
            fontSize: "13px",
            color: "#F0EDE8",
            fontWeight: 500,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {item.title}
        </p>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginTop: "2px",
          }}
        >
          <span
            style={{ fontFamily: MONO, fontSize: "10px", color: "#504E4A" }}
          >
            {item.year || "—"}
          </span>
          {item.media_type === "tv" && (
            <span
              style={{
                fontFamily: SANS,
                fontSize: "9px",
                color: "#4A9E6B",
                background: "rgba(74,158,107,0.1)",
                padding: "1px 5px",
                borderRadius: "3px",
              }}
            >
              TV
            </span>
          )}
          <span
            style={{ fontFamily: MONO, fontSize: "10px", color: "#C8A96E" }}
          >
            ★ {rating.toFixed(1)}
          </span>
          {item.community_rating && (
            <span
              style={{ fontFamily: SANS, fontSize: "9px", color: "#4A9E6B" }}
            >
              community
            </span>
          )}
        </div>
      </div>
      {item.overview && (
        <p
          style={{
            fontFamily: SANS,
            fontSize: "11px",
            color: "#504E4A",
            maxWidth: "300px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            display: "none",
          }}
          className="row-overview"
        >
          {item.overview}
        </p>
      )}
    </div>
  );
}

export default function DiscoverPage() {
  const { requireAuth, gate } = useAuthGate();
  const [query, setQuery] = useState("");
  const [mediaType, setMediaType] = useState("all");
  const [genre, setGenre] = useState("");
  const [decade, setDecade] = useState("");
  const [language, setLanguage] = useState("");
  const [sort, setSort] = useState("popularity");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [items, setItems] = useState<TitleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const loaderRef = useRef<HTMLDivElement>(null);

  function buildUrl(p = 1) {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (mediaType !== "all") params.set("type", mediaType);
    if (genre) params.set("genre", genre);
    if (decade) params.set("decade", decade.replace("s", ""));
    if (language) params.set("language", language);
    params.set("sort", sort);
    params.set("page", String(p));
    params.set("limit", "40");
    return `/api/discover?${params.toString()}`;
  }

  const fetchTitles = useCallback(
    async (p: number, append: boolean) => {
      if (p === 1) setLoading(true);
      else setLoadingMore(true);
      try {
        const res = await fetch(buildUrl(p));
        const data = await res.json();
        const results: TitleItem[] = data.results || [];
        if (append) setItems((prev) => [...prev, ...results]);
        else setItems(results);
        setTotal(data.total || 0);
        setHasMore(data.has_more || false);
        setPage(p);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [query, mediaType, genre, decade, language, sort],
  );

  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(
      () => fetchTitles(1, false),
      query ? 350 : 0,
    );
    return () => clearTimeout(searchTimer.current);
  }, [query, mediaType, genre, decade, language, sort]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading)
          fetchTitles(page + 1, true);
      },
      { threshold: 0.1 },
    );
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, page, fetchTitles]);

  function handleWatchlist(item: TitleItem) {
    if (!requireAuth("watchlist")) return;
    void addToWatchlist({
      tmdb_id: item.tmdb_id,
      type: item.type,
      title: item.title,
      poster_url: item.poster_url,
      year: item.year,
      tmdb_rating: item.tmdb_rating,
      overview: item.overview,
      genres: [],
      priority: "normal",
    });
  }

  function clearFilters() {
    setGenre("");
    setDecade("");
    setLanguage("");
    setMediaType("all");
    setSort("popularity");
    setQuery("");
  }
  const activeFiltersCount = [
    genre,
    decade,
    language,
    mediaType !== "all" ? mediaType : "",
  ].filter(Boolean).length;

  return (
    <div
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "24px 20px 80px",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "20px" }}>
        <h1
          style={{
            fontFamily: SERIF,
            fontSize: "26px",
            fontWeight: 700,
            color: "#F0EDE8",
            fontStyle: "italic",
            marginBottom: "4px",
          }}
        >
          Discover
        </h1>
        <p style={{ fontFamily: SANS, fontSize: "12px", color: "#504E4A" }}>
          {total > 0
            ? `${total.toLocaleString()} titles`
            : "Search and explore"}
          {" · "}
          <span style={{ color: "#4A9E6B" }}>●</span> green dot = community
          rated
        </p>
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: "16px" }}>
        <Search
          size={15}
          color="#504E4A"
          style={{
            position: "absolute",
            left: "14px",
            top: "50%",
            transform: "translateY(-50%)",
            pointerEvents: "none",
          }}
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search 176,000+ movies, shows, anime…"
          style={{
            width: "100%",
            padding: "12px 40px",
            background: "#141414",
            border: "1px solid #2A2A2A",
            borderRadius: "10px",
            color: "#F0EDE8",
            fontFamily: SANS,
            fontSize: "14px",
            outline: "none",
          }}
          onFocus={(e) =>
            (e.target.style.borderColor = "rgba(200,169,110,0.4)")
          }
          onBlur={(e) => (e.target.style.borderColor = "#2A2A2A")}
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            style={{
              position: "absolute",
              right: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#504E4A",
            }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Type tabs + controls */}
      <div
        style={{
          display: "flex",
          gap: "6px",
          marginBottom: "12px",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        {[
          { value: "all", label: "All" },
          { value: "movie", label: "Movies" },
          { value: "tv", label: "TV & Anime" },
        ].map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setMediaType(value)}
            style={{
              padding: "7px 14px",
              borderRadius: "8px",
              fontFamily: SANS,
              fontSize: "13px",
              cursor: "pointer",
              border:
                mediaType === value
                  ? "1px solid rgba(200,169,110,0.4)"
                  : "1px solid #2A2A2A",
              background:
                mediaType === value ? "rgba(200,169,110,0.1)" : "transparent",
              color: mediaType === value ? "#C8A96E" : "#504E4A",
            }}
          >
            {label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <div
          style={{
            display: "flex",
            border: "1px solid #2A2A2A",
            borderRadius: "6px",
            overflow: "hidden",
          }}
        >
          {(["grid", "list"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setViewMode(v)}
              style={{
                padding: "6px 10px",
                background: viewMode === v ? "#1A1A1A" : "transparent",
                border: "none",
                cursor: "pointer",
                color: viewMode === v ? "#F0EDE8" : "#504E4A",
                fontFamily: SANS,
                fontSize: "13px",
              }}
            >
              {v === "grid" ? "⊞" : "☰"}
            </button>
          ))}
        </div>
        <button
          onClick={() => setFiltersOpen(!filtersOpen)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "7px 12px",
            borderRadius: "8px",
            cursor: "pointer",
            border:
              filtersOpen || activeFiltersCount > 0
                ? "1px solid rgba(200,169,110,0.4)"
                : "1px solid #2A2A2A",
            background:
              filtersOpen || activeFiltersCount > 0
                ? "rgba(200,169,110,0.1)"
                : "transparent",
            color:
              filtersOpen || activeFiltersCount > 0 ? "#C8A96E" : "#504E4A",
            fontFamily: SANS,
            fontSize: "12px",
          }}
        >
          <SlidersHorizontal size={13} /> Filters
          {activeFiltersCount > 0 && (
            <span
              style={{
                background: "#C8A96E",
                color: "#0D0D0D",
                borderRadius: "50%",
                width: "16px",
                height: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "9px",
                fontWeight: 700,
              }}
            >
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      {/* Filter panel */}
      {filtersOpen && (
        <div
          style={{
            background: "#141414",
            border: "1px solid #2A2A2A",
            borderRadius: "12px",
            padding: "16px",
            marginBottom: "16px",
          }}
        >
          <div style={{ marginBottom: "16px" }}>
            <p
              style={{
                fontFamily: SANS,
                fontSize: "10px",
                color: "#504E4A",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                marginBottom: "8px",
              }}
            >
              Sort by
            </p>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {SORT_OPTIONS.map((o) => (
                <FilterPill
                  key={o.value}
                  label={o.label}
                  active={sort === o.value}
                  onClick={() => setSort(o.value)}
                />
              ))}
            </div>
          </div>
          <div style={{ marginBottom: "16px" }}>
            <p
              style={{
                fontFamily: SANS,
                fontSize: "10px",
                color: "#504E4A",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                marginBottom: "8px",
              }}
            >
              Genre
            </p>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {GENRES.map((g) => (
                <FilterPill
                  key={g}
                  label={g}
                  active={genre === g}
                  onClick={() => setGenre(genre === g ? "" : g)}
                  color="#5C4A8A"
                />
              ))}
            </div>
          </div>
          <div style={{ marginBottom: "16px" }}>
            <p
              style={{
                fontFamily: SANS,
                fontSize: "10px",
                color: "#504E4A",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                marginBottom: "8px",
              }}
            >
              Decade
            </p>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {DECADES.map((d) => (
                <FilterPill
                  key={d}
                  label={d}
                  active={decade === d}
                  onClick={() => setDecade(decade === d ? "" : d)}
                  color="#2A5C8A"
                />
              ))}
            </div>
          </div>
          <div style={{ marginBottom: "12px" }}>
            <p
              style={{
                fontFamily: SANS,
                fontSize: "10px",
                color: "#504E4A",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                marginBottom: "8px",
              }}
            >
              Language
            </p>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {LANGUAGES.map((l) => (
                <FilterPill
                  key={l.code}
                  label={l.label}
                  active={language === l.code}
                  onClick={() => setLanguage(language === l.code ? "" : l.code)}
                  color="#2A6A5C"
                />
              ))}
            </div>
          </div>
          {activeFiltersCount > 0 && (
            <button
              onClick={clearFilters}
              style={{
                fontFamily: SANS,
                fontSize: "12px",
                color: "#C87C2A",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
              }}
            >
              ✕ Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Active filter chips */}
      {activeFiltersCount > 0 && !filtersOpen && (
        <div
          style={{
            display: "flex",
            gap: "6px",
            flexWrap: "wrap",
            marginBottom: "12px",
          }}
        >
          {genre && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "3px 8px 3px 10px",
                borderRadius: "20px",
                background: "rgba(92,74,138,0.15)",
                border: "1px solid rgba(92,74,138,0.3)",
              }}
            >
              <span
                style={{ fontFamily: SANS, fontSize: "11px", color: "#9A8AC0" }}
              >
                {genre}
              </span>
              <button
                onClick={() => setGenre("")}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#9A8AC0",
                  padding: "0 0 0 2px",
                }}
              >
                <X size={10} />
              </button>
            </div>
          )}
          {decade && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "3px 8px 3px 10px",
                borderRadius: "20px",
                background: "rgba(42,92,138,0.15)",
                border: "1px solid rgba(42,92,138,0.3)",
              }}
            >
              <span
                style={{ fontFamily: SANS, fontSize: "11px", color: "#6A9AC0" }}
              >
                {decade}
              </span>
              <button
                onClick={() => setDecade("")}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#6A9AC0",
                  padding: "0 0 0 2px",
                }}
              >
                <X size={10} />
              </button>
            </div>
          )}
          {language && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "3px 8px 3px 10px",
                borderRadius: "20px",
                background: "rgba(42,106,92,0.15)",
                border: "1px solid rgba(42,106,92,0.3)",
              }}
            >
              <span
                style={{ fontFamily: SANS, fontSize: "11px", color: "#6AC0A8" }}
              >
                {LANGUAGES.find((l) => l.code === language)?.label}
              </span>
              <button
                onClick={() => setLanguage("")}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#6AC0A8",
                  padding: "0 0 0 2px",
                }}
              >
                <X size={10} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              viewMode === "grid"
                ? "repeat(auto-fill, minmax(130px, 1fr))"
                : "1fr",
            gap: viewMode === "grid" ? "12px" : "8px",
          }}
        >
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={i}
              className="skeleton"
              style={{
                borderRadius: "6px",
                aspectRatio: viewMode === "grid" ? "2/3" : undefined,
                height: viewMode === "list" ? "74px" : undefined,
              }}
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 0" }}>
          <p
            style={{
              fontFamily: SERIF,
              fontSize: "20px",
              color: "#2A2A2A",
              fontStyle: "italic",
            }}
          >
            Nothing found.
          </p>
          <p
            style={{
              fontFamily: SANS,
              fontSize: "13px",
              color: "#504E4A",
              marginTop: "8px",
            }}
          >
            Try different filters or a broader search term.
          </p>
          {activeFiltersCount > 0 && (
            <button
              onClick={clearFilters}
              style={{
                marginTop: "16px",
                padding: "8px 20px",
                borderRadius: "8px",
                background: "transparent",
                border: "1px solid #2A2A2A",
                color: "#8A8780",
                fontFamily: SANS,
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <>
          {viewMode === "grid" ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
                gap: "12px",
              }}
            >
              {items.map((item) => (
                <TitleCard
                  key={`${item.media_type}-${item.tmdb_id}`}
                  item={item}
                  onWatchlist={handleWatchlist}
                />
              ))}
            </div>
          ) : (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "6px" }}
            >
              {items.map((item) => (
                <TitleRow
                  key={`${item.media_type}-${item.tmdb_id}`}
                  item={item}
                />
              ))}
            </div>
          )}
          <div
            ref={loaderRef}
            style={{
              height: "60px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginTop: "16px",
            }}
          >
            {loadingMore && (
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <Loader2
                  size={16}
                  color="#504E4A"
                  style={{ animation: "spin 1s linear infinite" }}
                />
                <span
                  style={{
                    fontFamily: SANS,
                    fontSize: "12px",
                    color: "#504E4A",
                  }}
                >
                  Loading more…
                </span>
              </div>
            )}
            {!hasMore && items.length > 0 && (
              <p
                style={{ fontFamily: SANS, fontSize: "11px", color: "#2A2A2A" }}
              >
                All {total.toLocaleString()} results shown
              </p>
            )}
          </div>
        </>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @media (min-width: 900px) { .row-overview { display: block !important; } }
        @media (max-width: 480px) { div[style*="minmax(130px"] { grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)) !important; } }
      `}</style>
      {gate}
    </div>
  );
}
