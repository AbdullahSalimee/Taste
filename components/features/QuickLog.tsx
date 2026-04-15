"use client";
import { useState, useEffect, useRef } from "react";
import { X, Search, Check } from "lucide-react";
import { useSearch } from "@/lib/hooks";
import { addLog, addToWatchlist } from "@/lib/store";

const SANS = "Inter, system-ui, sans-serif";
const MONO = "JetBrains Mono, Courier New, monospace";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onLog?: (item: any, rating: number | null, note: string) => void;
}

function StarPicker({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (v: number) => void;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const display = hover ?? value ?? 0;
  return (
    <div
      style={{ display: "flex", alignItems: "center", gap: "3px" }}
      onMouseLeave={() => setHover(null)}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const full = display >= star;
        const half = !full && display >= star - 0.5;
        return (
          <div
            key={star}
            style={{
              width: "24px",
              height: "24px",
              position: "relative",
              cursor: "pointer",
            }}
            onMouseMove={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              setHover(e.clientX - r.left < r.width / 2 ? star - 0.5 : star);
            }}
            onClick={() => onChange(hover ?? star)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24">
              <path
                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                fill="#2A2A2A"
              />
            </svg>
            {(full || half) && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  overflow: "hidden",
                  width: half ? "50%" : "100%",
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24">
                  <path
                    d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                    fill="#C8A96E"
                  />
                </svg>
              </div>
            )}
          </div>
        );
      })}
      {value && (
        <span
          style={{
            fontFamily: MONO,
            fontSize: "11px",
            color: "#8A8780",
            marginLeft: "4px",
          }}
        >
          {value.toFixed(1)}
        </span>
      )}
    </div>
  );
}

export function QuickLog({ isOpen, onClose, onLog }: Props) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<any | null>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [logged, setLogged] = useState(false);
  const [addedToWatchlist, setAddedToWatchlist] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { results, loading } = useSearch(query);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery("");
      setSelected(null);
      setRating(null);
      setNote("");
      setLogged(false);
      setAddedToWatchlist(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  if (!isOpen) return null;

  const handleLog = () => {
    if (!selected) return;
    addLog({
      tmdb_id: selected.tmdb_id || selected.id,
      type: selected.type === "series" ? "series" : "film",
      title: selected.title,
      poster_url: selected.poster_url,
      year: selected.year,
      tmdb_rating: selected.tmdb_rating,
      user_rating: rating,
      note: note || null,
      status: "watched",
      genres: selected.genres || [],
      director: selected.director || null,
    });
    setLogged(true);
    onLog?.(selected, rating, note);
    setTimeout(() => onClose(), 1400);
  };

  const handleAddWatchlist = () => {
    if (!selected) return;
    addToWatchlist({
      tmdb_id: selected.tmdb_id || selected.id,
      type: selected.type === "series" ? "series" : "film",
      title: selected.title,
      poster_url: selected.poster_url,
      year: selected.year,
      tmdb_rating: selected.tmdb_rating,
      overview: selected.overview,
      genres: selected.genres || [],
      priority: "normal",
    });
    setAddedToWatchlist(true);
    setTimeout(() => onClose(), 1000);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9000,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(13,13,13,0.7)",
          backdropFilter: "blur(12px)",
        }}
      />
      <div
        className="log-sheet"
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "480px",
          background: "#141414",
          borderTop: "1px solid #2A2A2A",
          borderRadius: "16px 16px 0 0",
          boxShadow: "0 -24px 80px rgba(0,0,0,0.7)",
          zIndex: 1,
          overflow: "hidden",
        }}
      >
        {/* Handle */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            paddingTop: "12px",
            paddingBottom: "4px",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "4px",
              borderRadius: "2px",
              background: "#2A2A2A",
            }}
          />
        </div>

        <div style={{ padding: "16px 20px 32px" }}>
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "20px",
            }}
          >
            <h3
              style={{
                fontFamily: SANS,
                fontSize: "15px",
                fontWeight: 600,
                color: "#F0EDE8",
              }}
            >
              {logged
                ? "Logged!"
                : addedToWatchlist
                  ? "Added!"
                  : selected
                    ? "Rate & note"
                    : "Log something"}
            </h3>
            <button
              onClick={onClose}
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                background: "#1A1A1A",
                border: "1px solid #2A2A2A",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#8A8780",
                cursor: "pointer",
              }}
            >
              <X size={13} />
            </button>
          </div>

          {/* Success state */}
          {(logged || addedToWatchlist) && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "24px 0",
                gap: "12px",
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  background: "rgba(74,158,107,0.15)",
                  border: "1px solid rgba(74,158,107,0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Check size={20} color="#4A9E6B" />
              </div>
              <p
                style={{ fontFamily: SANS, fontSize: "13px", color: "#8A8780" }}
              >
                <span style={{ color: "#F0EDE8" }}>{selected?.title}</span>{" "}
                {logged ? "logged" : "added to watchlist"}
              </p>
            </div>
          )}

          {/* Search */}
          {!logged && !addedToWatchlist && !selected && (
            <>
              <div style={{ position: "relative" }}>
                <Search
                  size={14}
                  color="#504E4A"
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    pointerEvents: "none",
                  }}
                />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search films or series..."
                  style={{
                    width: "100%",
                    background: "#1A1A1A",
                    border: "1px solid #2A2A2A",
                    borderRadius: "6px",
                    padding: "10px 14px 10px 38px",
                    color: "#F0EDE8",
                    fontFamily: SANS,
                    fontSize: "13px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                  onFocus={(e) =>
                    (e.target.style.borderColor = "rgba(200,169,110,0.4)")
                  }
                  onBlur={(e) => (e.target.style.borderColor = "#2A2A2A")}
                />
              </div>

              {loading && (
                <p
                  style={{
                    fontFamily: SANS,
                    fontSize: "12px",
                    color: "#504E4A",
                    textAlign: "center",
                    marginTop: "12px",
                  }}
                >
                  Searching...
                </p>
              )}

              {!loading && results.length > 0 && (
                <div
                  style={{
                    marginTop: "8px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                    maxHeight: "300px",
                    overflowY: "auto",
                  }}
                >
                  {results.map((item) => (
                    <button
                      key={`${item.type}-${item.id}`}
                      onClick={() => setSelected(item)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "10px",
                        borderRadius: "6px",
                        background: "#1A1A1A",
                        border: "1px solid transparent",
                        cursor: "pointer",
                        textAlign: "left",
                        width: "100%",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.border =
                          "1px solid #2A2A2A";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.border =
                          "1px solid transparent";
                      }}
                    >
                      {item.poster_url ? (
                        <img
                          src={item.poster_url}
                          alt={item.title}
                          style={{
                            width: "32px",
                            height: "48px",
                            objectFit: "cover",
                            borderRadius: "2px",
                            background: "#2A2A2A",
                            flexShrink: 0,
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "32px",
                            height: "48px",
                            borderRadius: "2px",
                            background: "#2A2A2A",
                            flexShrink: 0,
                          }}
                        />
                      )}
                      <div style={{ minWidth: 0 }}>
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
                        <p
                          style={{
                            fontFamily: SANS,
                            fontSize: "11px",
                            color: "#504E4A",
                            marginTop: "2px",
                          }}
                        >
                          {item.year} ·{" "}
                          {item.type === "series" ? "TV Series" : "Film"}
                          {item.tmdb_rating > 0 &&
                            ` · ★ ${item.tmdb_rating.toFixed(1)}`}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {!loading && query.length > 1 && results.length === 0 && (
                <p
                  style={{
                    fontFamily: SANS,
                    fontSize: "13px",
                    color: "#504E4A",
                    textAlign: "center",
                    marginTop: "16px",
                  }}
                >
                  No results found
                </p>
              )}
            </>
          )}

          {/* Rate & note state */}
          {!logged && !addedToWatchlist && selected && (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px",
                  background: "#1A1A1A",
                  border: "1px solid #2A2A2A",
                  borderRadius: "6px",
                  marginBottom: "20px",
                }}
              >
                {selected.poster_url ? (
                  <img
                    src={selected.poster_url}
                    alt={selected.title}
                    style={{
                      width: "40px",
                      height: "56px",
                      objectFit: "cover",
                      borderRadius: "2px",
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "40px",
                      height: "56px",
                      borderRadius: "2px",
                      background: "#2A2A2A",
                      flexShrink: 0,
                    }}
                  />
                )}
                <div style={{ flex: 1 }}>
                  <p
                    style={{
                      fontFamily: SANS,
                      fontSize: "13px",
                      color: "#F0EDE8",
                      fontWeight: 500,
                    }}
                  >
                    {selected.title}
                  </p>
                  <p
                    style={{
                      fontFamily: SANS,
                      fontSize: "11px",
                      color: "#504E4A",
                    }}
                  >
                    {selected.year}
                  </p>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#504E4A",
                    cursor: "pointer",
                  }}
                >
                  <X size={12} />
                </button>
              </div>

              {/* Rating */}
              <div style={{ marginBottom: "16px" }}>
                <p
                  style={{
                    fontFamily: SANS,
                    fontSize: "11px",
                    color: "#8A8780",
                    marginBottom: "8px",
                  }}
                >
                  Rating (optional)
                </p>
                <StarPicker value={rating} onChange={setRating} />
              </div>

              {/* Note */}
              <div style={{ marginBottom: "20px" }}>
                <p
                  style={{
                    fontFamily: SANS,
                    fontSize: "11px",
                    color: "#8A8780",
                    marginBottom: "8px",
                  }}
                >
                  Note (optional)
                </p>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={500}
                  placeholder="What did you think?"
                  rows={3}
                  style={{
                    width: "100%",
                    background: "#1A1A1A",
                    border: "1px solid #2A2A2A",
                    borderRadius: "6px",
                    padding: "10px 12px",
                    color: "#F0EDE8",
                    fontFamily: SANS,
                    fontSize: "13px",
                    resize: "none",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                  onFocus={(e) =>
                    (e.target.style.borderColor = "rgba(200,169,110,0.4)")
                  }
                  onBlur={(e) => (e.target.style.borderColor = "#2A2A2A")}
                />
                <p
                  style={{
                    fontFamily: MONO,
                    fontSize: "9px",
                    color: "#504E4A",
                    textAlign: "right",
                    marginTop: "4px",
                  }}
                >
                  {note.length}/500
                </p>
              </div>

              {/* CTAs */}
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={handleAddWatchlist}
                  style={{
                    flex: 1,
                    padding: "11px",
                    borderRadius: "8px",
                    border: "1px solid #2A2A2A",
                    background: "transparent",
                    color: "#8A8780",
                    fontFamily: SANS,
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  + Watchlist
                </button>
                <button
                  onClick={handleLog}
                  style={{
                    flex: 2,
                    padding: "12px",
                    borderRadius: "8px",
                    background: "#C8A96E",
                    color: "#0D0D0D",
                    fontFamily: SANS,
                    fontSize: "14px",
                    fontWeight: 600,
                    border: "none",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.background =
                      "#DFC080")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.background =
                      "#C8A96E")
                  }
                >
                  Log as watched
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
