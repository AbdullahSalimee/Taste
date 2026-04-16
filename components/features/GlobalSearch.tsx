"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  Film,
  Tv,
  Clock,
  TrendingUp,
  ArrowRight,
} from "lucide-react";

const SANS = "Inter, system-ui, sans-serif";
const MONO = "JetBrains Mono, Courier New, monospace";
const SERIF = "Playfair Display, Georgia, serif";

const LS_RECENT = "taste_recent_searches";

function getRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(LS_RECENT) || "[]");
  } catch {
    return [];
  }
}
function addRecent(q: string) {
  const list = getRecent()
    .filter((r) => r !== q)
    .slice(0, 7);
  list.unshift(q);
  try {
    localStorage.setItem(LS_RECENT, JSON.stringify(list));
  } catch {}
}

interface SearchResult {
  id: number;
  tmdb_id: number;
  type: "film" | "series";
  media_type: string;
  title: string;
  year: number;
  poster_url: string | null;
  tmdb_rating_5: number;
  overview: string;
}

function ResultRow({
  item,
  selected,
  onClick,
}: {
  item: SearchResult;
  selected: boolean;
  onClick: () => void;
}) {
  const [imgErr, setImgErr] = useState(false);
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "10px 16px",
        cursor: "pointer",
        background: selected ? "rgba(200,169,110,0.08)" : "transparent",
        borderLeft: selected ? "2px solid #C8A96E" : "2px solid transparent",
        transition: "background 0.1s ease",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.background = "rgba(200,169,110,0.06)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.background = selected
          ? "rgba(200,169,110,0.08)"
          : "transparent")
      }
    >
      {/* Poster thumbnail */}
      <div
        style={{
          width: "32px",
          height: "48px",
          borderRadius: "3px",
          overflow: "hidden",
          background: "#1A1A1A",
          flexShrink: 0,
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
            {item.media_type === "tv" ? (
              <Tv size={12} color="#2A2A2A" />
            ) : (
              <Film size={12} color="#2A2A2A" />
            )}
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontFamily: SANS,
            fontSize: "14px",
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
          <span
            style={{
              fontFamily: SANS,
              fontSize: "9px",
              padding: "1px 5px",
              borderRadius: "3px",
              background:
                item.media_type === "tv"
                  ? "rgba(74,158,107,0.12)"
                  : "rgba(92,74,138,0.12)",
              color: item.media_type === "tv" ? "#4A9E6B" : "#9A8AC0",
            }}
          >
            {item.media_type === "tv" ? "TV" : "Film"}
          </span>
          {item.tmdb_rating_5 > 0 && (
            <span
              style={{ fontFamily: MONO, fontSize: "10px", color: "#C8A96E" }}
            >
              ★ {item.tmdb_rating_5}
            </span>
          )}
        </div>
      </div>

      <ArrowRight size={13} color="#2A2A2A" style={{ flexShrink: 0 }} />
    </div>
  );
}

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(0);
  const [recent, setRecent] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Load recent on open
  useEffect(() => {
    if (isOpen) {
      setRecent(getRecent());
      setQuery("");
      setResults([]);
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Search with debounce
  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.results || []);
      setSelected(0);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(timer.current);
    if (!query.trim()) {
      setResults([]);
      return;
    }
    timer.current = setTimeout(() => doSearch(query), 250);
    return () => clearTimeout(timer.current);
  }, [query, doSearch]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelected((s) => Math.min(s + 1, results.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelected((s) => Math.max(s - 1, 0));
      }
      if (e.key === "Enter" && results[selected]) {
        navigate(results[selected]);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, results, selected]);

  function navigate(item: SearchResult) {
    const mt = item.media_type === "tv" ? "tv" : "movie";
    if (query.trim().length >= 2) addRecent(query.trim());
    setRecent(getRecent());
    onClose();
    router.push(`/title/${mt}/${item.tmdb_id}`);
  }

  function searchRecent(q: string) {
    setQuery(q);
    inputRef.current?.focus();
  }

  function goToDiscover() {
    if (query.trim()) {
      addRecent(query.trim());
      onClose();
      router.push(`/discover?q=${encodeURIComponent(query.trim())}`);
    } else {
      onClose();
      router.push("/discover");
    }
  }

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 500,
          background: "rgba(0,0,0,0.7)",
          backdropFilter: "blur(4px)",
          animation: "fadeIn 0.15s ease",
        }}
      />

      {/* Search modal */}
      <div
        style={{
          position: "fixed",
          top: "80px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 501,
          width: "100%",
          maxWidth: "600px",
          margin: "0 16px",
          background: "#141414",
          border: "1px solid #2A2A2A",
          borderRadius: "14px",
          overflow: "hidden",
          boxShadow: "0 24px 80px rgba(0,0,0,0.8)",
          animation: "slideUp 0.2s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        {/* Input row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "14px 16px",
            borderBottom: "1px solid #1A1A1A",
          }}
        >
          {loading ? (
            <div
              style={{
                width: "16px",
                height: "16px",
                border: "2px solid #2A2A2A",
                borderTopColor: "#C8A96E",
                borderRadius: "50%",
                flexShrink: 0,
                animation: "spin 0.8s linear infinite",
              }}
            />
          ) : (
            <Search size={16} color="#504E4A" style={{ flexShrink: 0 }} />
          )}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search movies, shows, anime…"
            style={{
              flex: 1,
              background: "none",
              border: "none",
              outline: "none",
              fontFamily: SANS,
              fontSize: "15px",
              color: "#F0EDE8",
            }}
          />
          {query && (
            <button
              onClick={() => {
                setQuery("");
                setResults([]);
                inputRef.current?.focus();
              }}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#504E4A",
                padding: "2px",
                flexShrink: 0,
              }}
            >
              <X size={14} />
            </button>
          )}
          <kbd
            style={{
              fontFamily: MONO,
              fontSize: "10px",
              color: "#504E4A",
              border: "1px solid #2A2A2A",
              borderRadius: "4px",
              padding: "2px 6px",
              flexShrink: 0,
            }}
          >
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div
          style={{
            maxHeight: "420px",
            overflowY: "auto",
            scrollbarWidth: "none",
          }}
        >
          {/* Search results */}
          {results.length > 0 && (
            <div>
              <p
                style={{
                  fontFamily: SANS,
                  fontSize: "10px",
                  color: "#504E4A",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  padding: "10px 16px 6px",
                }}
              >
                Results
              </p>
              {results.slice(0, 10).map((item, i) => (
                <ResultRow
                  key={`${item.media_type}-${item.tmdb_id}`}
                  item={item}
                  selected={i === selected}
                  onClick={() => navigate(item)}
                />
              ))}
              {/* See all in discover */}
              <div
                onClick={goToDiscover}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 16px",
                  cursor: "pointer",
                  borderTop: "1px solid #1A1A1A",
                  color: "#C8A96E",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(200,169,110,0.06)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <TrendingUp size={13} />
                <span style={{ fontFamily: SANS, fontSize: "13px" }}>
                  See all results for "<strong>{query}</strong>" in Discover
                </span>
                <ArrowRight size={13} style={{ marginLeft: "auto" }} />
              </div>
            </div>
          )}

          {/* No results */}
          {query.trim().length >= 2 && !loading && results.length === 0 && (
            <div style={{ padding: "32px 16px", textAlign: "center" }}>
              <p
                style={{
                  fontFamily: SERIF,
                  fontSize: "16px",
                  color: "#2A2A2A",
                  fontStyle: "italic",
                  marginBottom: "6px",
                }}
              >
                Nothing found for "{query}"
              </p>
              <p
                style={{ fontFamily: SANS, fontSize: "12px", color: "#504E4A" }}
              >
                Try a different spelling or search in{" "}
                <button
                  onClick={goToDiscover}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#C8A96E",
                    cursor: "pointer",
                    fontFamily: SANS,
                    fontSize: "12px",
                    padding: 0,
                  }}
                >
                  Discover
                </button>
              </p>
            </div>
          )}

          {/* Empty state — show recent + shortcuts */}
          {!query && (
            <div>
              {/* Recent searches */}
              {recent.length > 0 && (
                <div>
                  <p
                    style={{
                      fontFamily: SANS,
                      fontSize: "10px",
                      color: "#504E4A",
                      textTransform: "uppercase",
                      letterSpacing: "0.12em",
                      padding: "10px 16px 6px",
                    }}
                  >
                    Recent
                  </p>
                  {recent.map((r) => (
                    <div
                      key={r}
                      onClick={() => searchRecent(r)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "9px 16px",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "#1A1A1A")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                    >
                      <Clock size={12} color="#504E4A" />
                      <span
                        style={{
                          fontFamily: SANS,
                          fontSize: "13px",
                          color: "#8A8780",
                        }}
                      >
                        {r}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Quick links */}
              <div
                style={{
                  borderTop: recent.length > 0 ? "1px solid #1A1A1A" : "none",
                }}
              >
                <p
                  style={{
                    fontFamily: SANS,
                    fontSize: "10px",
                    color: "#504E4A",
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    padding: "10px 16px 6px",
                  }}
                >
                  Quick links
                </p>
                {[
                  {
                    label: "Browse all titles",
                    href: "/discover",
                    icon: TrendingUp,
                  },
                  {
                    label: "Top rated movies",
                    href: "/discover?sort=rating&type=movie",
                    icon: Film,
                  },
                  {
                    label: "Top rated TV shows",
                    href: "/discover?sort=rating&type=tv",
                    icon: Tv,
                  },
                ].map(({ label, href, icon: Icon }) => (
                  <div
                    key={href}
                    onClick={() => {
                      onClose();
                      router.push(href);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "9px 16px",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#1A1A1A")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <Icon size={13} color="#504E4A" />
                    <span
                      style={{
                        fontFamily: SANS,
                        fontSize: "13px",
                        color: "#8A8780",
                      }}
                    >
                      {label}
                    </span>
                    <ArrowRight
                      size={11}
                      color="#2A2A2A"
                      style={{ marginLeft: "auto" }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div
          style={{
            padding: "8px 16px",
            borderTop: "1px solid #1A1A1A",
            display: "flex",
            gap: "16px",
          }}
        >
          {[
            { key: "↑↓", label: "navigate" },
            { key: "↵", label: "open" },
            { key: "ESC", label: "close" },
          ].map(({ key, label }) => (
            <div
              key={key}
              style={{ display: "flex", alignItems: "center", gap: "4px" }}
            >
              <kbd
                style={{
                  fontFamily: MONO,
                  fontSize: "9px",
                  color: "#504E4A",
                  border: "1px solid #2A2A2A",
                  borderRadius: "3px",
                  padding: "1px 4px",
                }}
              >
                {key}
              </kbd>
              <span
                style={{ fontFamily: SANS, fontSize: "10px", color: "#2A2A2A" }}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
