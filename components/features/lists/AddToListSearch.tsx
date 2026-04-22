"use client";
import { useState, useEffect, useRef } from "react";
import { Search, X, Film, Tv, Plus, Check } from "lucide-react";
import { supabase } from "@/lib/supabase";

const SERIF = "Playfair Display, Georgia, serif";
const SANS = "Inter, system-ui, sans-serif";
const MONO = "JetBrains Mono, Courier New, monospace";

interface Props {
  listId: string;
  existingTmdbIds: number[];
  onAdd: (entry: any) => void;
  onClose: () => void;
}

export default function AddToListSearch({
  listId,
  existingTmdbIds,
  onAdd,
  onClose,
}: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState<number | null>(null);
  const [added, setAdded] = useState<Set<number>>(new Set(existingTmdbIds));
  const inputRef = useRef<HTMLInputElement>(null);
  const timer = useRef<any>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 80);
  }, []);

  useEffect(() => {
    clearTimeout(timer.current);
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    timer.current = setTimeout(async () => {
      setLoading(true);
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data.results?.slice(0, 12) || []);
      setLoading(false);
    }, 250);
    return () => clearTimeout(timer.current);
  }, [query]);

async function add(item: any) {
  if (added.has(item.tmdb_id)) return;

  // ✅ Optimistic update FIRST — UI responds instantly
  setAdded((prev) => new Set([...prev, item.tmdb_id]));
  setAdding(item.tmdb_id);

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    // Rollback on failure
    setAdded((prev) => {
      const n = new Set(prev);
      n.delete(item.tmdb_id);
      return n;
    });
    setAdding(null);
    return;
  }

  const res = await fetch(`/api/lists/${listId}/entries`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      tmdb_id: item.tmdb_id,
      media_type: item.media_type,
    }),
  });
  const data = await res.json();

  if (data.ok) {
    onAdd({ id: data.entry_id, tmdb_id: item.tmdb_id, ...item, position: 999 });
  } else {
    // Rollback if API failed
    setAdded((prev) => {
      const n = new Set(prev);
      n.delete(item.tmdb_id);
      return n;
    });
  }
  setAdding(null);
}

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 800,
          background: "rgba(0,0,0,0.8)",
          backdropFilter: "blur(10px)",
        }}
      />
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
          zIndex: 801,
          width: "min(560px, 94vw)",
          maxHeight: "82vh",
          background: "#111111",
          border: "1px solid #2A2A2A",
          borderRadius: "16px",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 32px 80px rgba(0,0,0,0.9)",
        }}
      >
        {/* Gold top */}
        <div
          style={{
            height: "3px",
            background: "linear-gradient(90deg, #C8A96E, #DFC080, #C8A96E)",
            flexShrink: 0,
          }}
        />

        {/* Search input */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "16px 18px",
            borderBottom: "1px solid #1A1A1A",
            flexShrink: 0,
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
                animation: "spin 0.8s linear infinite",
                flexShrink: 0,
              }}
            />
          ) : (
            <Search size={16} color="#504E4A" style={{ flexShrink: 0 }} />
          )}
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search films and series to add…"
            style={{
              flex: 1,
              background: "none",
              border: "none",
              outline: "none",
              color: "#F0EDE8",
              fontFamily: SANS,
              fontSize: "15px",
            }}
          />
          {query && (
            <button
              onClick={() => {
                setQuery("");
                setResults([]);
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
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#504E4A",
              padding: "2px",
              flexShrink: 0,
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Header */}
        <div style={{ padding: "12px 18px 4px", flexShrink: 0 }}>
          <p style={{ fontFamily: SANS, fontSize: "11px", color: "#504E4A" }}>
            {added.size - existingTmdbIds.length > 0
              ? `${added.size - existingTmdbIds.length} added`
              : "Search films and series — both work!"}
          </p>
        </div>

        {/* Results */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 8px 16px" }}>
          {results.length === 0 && query.length >= 2 && !loading && (
            <div style={{ textAlign: "center", padding: "40px 16px" }}>
              <p
                style={{
                  fontFamily: SERIF,
                  fontSize: "14px",
                  color: "#2A2A2A",
                  fontStyle: "italic",
                }}
              >
                No results for "{query}"
              </p>
            </div>
          )}

          {results.length === 0 && query.length < 2 && (
            <div style={{ textAlign: "center", padding: "40px 16px" }}>
              <p
                style={{ fontFamily: SANS, fontSize: "13px", color: "#504E4A" }}
              >
                Type to search 176,000+ titles
              </p>
              <p
                style={{
                  fontFamily: SANS,
                  fontSize: "11px",
                  color: "#2A2A2A",
                  marginTop: "6px",
                }}
              >
                Films and series both work
              </p>
            </div>
          )}

          {results.map((item) => {
            const isAdded = added.has(item.tmdb_id);
            const isAdding = adding === item.tmdb_id;
            return (
              <div
                key={`${item.media_type}-${item.tmdb_id}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "10px 10px",
                  borderRadius: "8px",
                  marginBottom: "2px",
                  opacity: isAdded ? 0.6 : 1,
                  cursor: isAdded ? "default" : "pointer",
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) =>
                  !isAdded && (e.currentTarget.style.background = "#1A1A1A")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                {/* Poster */}
                <div
                  style={{
                    width: "34px",
                    height: "50px",
                    borderRadius: "3px",
                    overflow: "hidden",
                    background: "#1A1A1A",
                    flexShrink: 0,
                  }}
                >
                  {item.poster_url ? (
                    <img
                      src={item.poster_url}
                      alt={item.title}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
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
                      gap: "7px",
                      marginTop: "2px",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: MONO,
                        fontSize: "10px",
                        color: "#504E4A",
                      }}
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
                        style={{
                          fontFamily: MONO,
                          fontSize: "10px",
                          color: "#C8A96E",
                        }}
                      >
                        ★ {item.tmdb_rating_5}
                      </span>
                    )}
                  </div>
                </div>

                {/* Add button */}
                <button
                  onClick={() => !isAdded && add(item)}
                  disabled={isAdded || isAdding}
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    border: isAdded
                      ? "1px solid rgba(74,158,107,0.3)"
                      : "1px solid #2A2A2A",
                    background: isAdded
                      ? "rgba(74,158,107,0.1)"
                      : "transparent",
                    color: isAdded ? "#4A9E6B" : "#8A8780",
                    cursor: isAdded ? "default" : "pointer",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) =>
                    !isAdded &&
                    (e.currentTarget.style.borderColor =
                      "rgba(200,169,110,0.4)")
                  }
                  onMouseLeave={(e) =>
                    !isAdded && (e.currentTarget.style.borderColor = "#2A2A2A")
                  }
                >
                  {isAdding ? (
                    <div
                      style={{
                        width: "10px",
                        height: "10px",
                        border: "1.5px solid #2A2A2A",
                        borderTopColor: "#C8A96E",
                        borderRadius: "50%",
                        animation: "spin 0.8s linear infinite",
                      }}
                    />
                  ) : isAdded ? (
                    <Check size={12} />
                  ) : (
                    <Plus size={12} />
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "12px 18px",
            borderTop: "1px solid #1A1A1A",
            display: "flex",
            justifyContent: "flex-end",
            flexShrink: 0,
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "8px 22px",
              borderRadius: "8px",
              background: "#C8A96E",
              color: "#0D0D0D",
              fontFamily: SANS,
              fontSize: "13px",
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
            }}
          >
            Done
          </button>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
