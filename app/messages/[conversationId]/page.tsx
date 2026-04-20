"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Send,
  Smile,
  Paperclip,
  Mic,
  Phone,
  Video,
  MoreVertical,
  Check,
  CheckCheck,
  Reply,
  Trash2,
  X,
  Film,
  Tv,
  Search,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";

const SANS = "Inter, system-ui, sans-serif";
const MONO = "JetBrains Mono, Courier New, monospace";
const SERIF = "Playfair Display, Georgia, serif";

const REACTIONS = ["❤️", "😂", "😮", "😢", "🔥", "👍"];

// ─── Movie Mention Dropdown ───────────────────────────────────────────────────

interface MovieMentionDropdownProps {
  query: string;
  onSelect: (item: any) => void;
  anchorRef: React.RefObject<HTMLTextAreaElement>;
}

function MovieMentionDropdown({
  query,
  onSelect,
  anchorRef,
}: MovieMentionDropdownProps) {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [imgErrors, setImgErrors] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (query.length < 1) {
      setResults([]);
      return;
    }
    setLoading(true);
    const controller = new AbortController();
    fetch(`/api/discover?q=${encodeURIComponent(query)}&limit=6`, {
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((d) => {
        setResults((d.results || []).slice(0, 6));
        setLoading(false);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setLoading(false);
      });
    return () => controller.abort();
  }, [query]);

  if (!loading && results.length === 0 && query.length < 1) return null;

  return (
    <div
      style={{
        position: "absolute",
        bottom: "calc(100% + 8px)",
        left: 0,
        right: 0,
        background: "#141414",
        border: "1px solid #2A2A2A",
        borderRadius: "12px",
        overflow: "hidden",
        zIndex: 200,
        boxShadow: "0 -12px 40px rgba(0,0,0,0.8)",
        maxHeight: "320px",
        overflowY: "auto",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "10px 14px 8px",
          borderBottom: "1px solid #1A1A1A",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          position: "sticky",
          top: 0,
          background: "#141414",
          zIndex: 1,
        }}
      >
        <Film size={12} color="#C8A96E" />
        <span
          style={{
            fontFamily: SANS,
            fontSize: "11px",
            color: "#C8A96E",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          Mention a title
        </span>
        {loading && (
          <div
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              border: "1.5px solid #2A2A2A",
              borderTopColor: "#C8A96E",
              marginLeft: "auto",
              animation: "spin 0.8s linear infinite",
            }}
          />
        )}
      </div>

      {/* Results */}
      {results.length === 0 && !loading && query.length >= 1 ? (
        <div style={{ padding: "20px", textAlign: "center" }}>
          <p style={{ fontFamily: SANS, fontSize: "12px", color: "#504E4A" }}>
            No results for "{query}"
          </p>
        </div>
      ) : (
        results.map((item, idx) => {
          const isTV = item.media_type === "tv" || item.type === "series";
          const hasImgErr = imgErrors[item.id];
          return (
            <div
              key={`${item.media_type}-${item.id}`}
              onClick={() => onSelect(item)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 14px",
                cursor: "pointer",
                borderBottom:
                  idx < results.length - 1 ? "1px solid #1A1A1A" : "none",
                transition: "background 0.1s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#1A1A1A")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              {/* Poster */}
              <div
                style={{
                  width: "30px",
                  height: "44px",
                  borderRadius: "3px",
                  overflow: "hidden",
                  background: "#1A1A1A",
                  flexShrink: 0,
                  border: "1px solid #2A2A2A",
                }}
              >
                {item.poster_url && !hasImgErr ? (
                  <img
                    src={item.poster_url}
                    alt={item.title}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                    onError={() =>
                      setImgErrors((prev) => ({ ...prev, [item.id]: true }))
                    }
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
                    {isTV ? (
                      <Tv size={10} color="#2A2A2A" />
                    ) : (
                      <Film size={10} color="#2A2A2A" />
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
                    gap: "6px",
                    marginTop: "2px",
                  }}
                >
                  <span
                    style={{
                      fontFamily: SANS,
                      fontSize: "9px",
                      padding: "1px 5px",
                      borderRadius: "3px",
                      background: isTV
                        ? "rgba(74,158,107,0.12)"
                        : "rgba(92,74,138,0.12)",
                      color: isTV ? "#4A9E6B" : "#9A8AC0",
                    }}
                  >
                    {isTV ? "TV" : "Film"}
                  </span>
                  {item.year > 0 && (
                    <span
                      style={{
                        fontFamily: MONO,
                        fontSize: "10px",
                        color: "#504E4A",
                      }}
                    >
                      {item.year}
                    </span>
                  )}
                  {item.tmdb_rating > 0 && (
                    <span
                      style={{
                        fontFamily: MONO,
                        fontSize: "10px",
                        color: "#C8A96E",
                      }}
                    >
                      ★{" "}
                      {(item.tmdb_rating_5 || item.tmdb_rating / 2).toFixed(1)}
                    </span>
                  )}
                </div>
              </div>

              {/* Send hint */}
              <span
                style={{
                  fontFamily: SANS,
                  fontSize: "10px",
                  color: "#2A2A2A",
                  flexShrink: 0,
                }}
              >
                ↵
              </span>
            </div>
          );
        })
      )}

      {query.length === 0 && !loading && (
        <div style={{ padding: "16px 14px", textAlign: "center" }}>
          <p style={{ fontFamily: SANS, fontSize: "12px", color: "#504E4A" }}>
            Type a movie or show name…
          </p>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Avatar ──────────────────────────────────────────────────────────────────
function Avatar({
  name,
  size = 36,
  online = false,
}: {
  name: string;
  size?: number;
  online?: boolean;
}) {
  const colors = [
    "#5C4A8A",
    "#8A2A2A",
    "#2A5C8A",
    "#2A6A5C",
    "#8A7A2A",
    "#8A2A5C",
  ];
  const bg = colors[(name?.charCodeAt(0) || 0) % colors.length];
  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: SANS,
          fontSize: size * 0.38,
          fontWeight: 600,
          color: "#F0EDE8",
        }}
      >
        {(name?.[0] || "?").toUpperCase()}
      </div>
      {online && (
        <div
          style={{
            position: "absolute",
            bottom: 1,
            right: 1,
            width: Math.max(8, size * 0.22),
            height: Math.max(8, size * 0.22),
            background: "#25D366",
            borderRadius: "50%",
            border: "2px solid #0D0D0D",
          }}
        />
      )}
    </div>
  );
}

function timeStr(date: string) {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function Ticks({
  status,
  mine,
}: {
  status: "sending" | "sent" | "delivered" | "read";
  mine: boolean;
}) {
  if (!mine) return null;
  const color = status === "read" ? "#34B7F1" : "rgba(13,13,13,0.45)";
  if (status === "sending") return <Check size={12} color={color} />;
  if (status === "sent") return <Check size={12} color={color} />;
  return <CheckCheck size={12} color={color} />;
}

function MessageContent({ msg, isMine }: { msg: any; isMine: boolean }) {
  const router = useRouter();

  if (msg.content_type === "log_share" && msg.metadata) {
    const m = msg.metadata;
    const mt = m.media_type === "tv" ? "tv" : "movie";
    return (
      <div
        onClick={() => router.push(`/title/${mt}/${m.tmdb_id}`)}
        style={{
          background: isMine ? "rgba(0,0,0,0.15)" : "rgba(200,169,110,0.08)",
          border: `1px solid ${isMine ? "rgba(0,0,0,0.2)" : "rgba(200,169,110,0.2)"}`,
          borderRadius: "10px",
          padding: "10px",
          cursor: "pointer",
        }}
      >
        <p
          style={{
            fontFamily: SANS,
            fontSize: "10px",
            color: isMine ? "rgba(13,13,13,0.7)" : "#C8A96E",
            marginBottom: "6px",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          📽 Shared a log
        </p>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {m.poster_url && (
            <img
              src={m.poster_url}
              alt={m.title}
              style={{
                width: 34,
                height: 50,
                objectFit: "cover",
                borderRadius: 3,
                flexShrink: 0,
              }}
            />
          )}
          <div>
            <p
              style={{
                fontFamily: SANS,
                fontSize: "13px",
                color: isMine ? "#0D0D0D" : "#F0EDE8",
                fontWeight: 500,
              }}
            >
              {m.title}
            </p>
            <p
              style={{
                fontFamily: MONO,
                fontSize: "10px",
                color: isMine ? "rgba(13,13,13,0.5)" : "#504E4A",
              }}
            >
              {m.year}
            </p>
            {m.user_rating && (
              <p
                style={{
                  fontFamily: MONO,
                  fontSize: "11px",
                  color: isMine ? "rgba(13,13,13,0.7)" : "#C8A96E",
                }}
              >
                ★ {m.user_rating}/5
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (msg.content_type === "review_share" && msg.metadata) {
    const m = msg.metadata;
    const mt = m.media_type === "tv" ? "tv" : "movie";
    return (
      <div
        onClick={() => router.push(`/title/${mt}/${m.tmdb_id}`)}
        style={{
          background: isMine ? "rgba(0,0,0,0.15)" : "rgba(92,74,138,0.1)",
          border: `1px solid ${isMine ? "rgba(0,0,0,0.2)" : "rgba(92,74,138,0.25)"}`,
          borderRadius: "10px",
          padding: "10px",
          cursor: "pointer",
        }}
      >
        <p
          style={{
            fontFamily: SANS,
            fontSize: "10px",
            color: isMine ? "rgba(13,13,13,0.7)" : "#9A8AC0",
            marginBottom: "6px",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          ✍ Shared a review
        </p>
        <p
          style={{
            fontFamily: SANS,
            fontSize: "13px",
            color: isMine ? "#0D0D0D" : "#F0EDE8",
            fontWeight: 500,
            marginBottom: 4,
          }}
        >
          {m.title}
        </p>
        {m.rating && (
          <p
            style={{
              fontFamily: MONO,
              fontSize: "11px",
              color: isMine ? "rgba(13,13,13,0.7)" : "#C8A96E",
              marginBottom: 4,
            }}
          >
            ★ {m.rating}/5
          </p>
        )}
        <p
          style={{
            fontFamily: SANS,
            fontSize: "12px",
            color: isMine ? "rgba(13,13,13,0.6)" : "#8A8780",
            fontStyle: "italic",
          }}
        >
          "{m.body?.slice(0, 100)}
          {m.body?.length > 100 ? "…" : ""}"
        </p>
      </div>
    );
  }

  if (msg.content_type === "title_rec" && msg.metadata) {
    const m = msg.metadata;
    const mt = m.media_type === "tv" ? "tv" : "movie";
    const isTV = m.media_type === "tv";
    return (
      <div
        onClick={() => router.push(`/title/${mt}/${m.tmdb_id}`)}
        style={{
          background: isMine ? "rgba(0,0,0,0.15)" : "rgba(74,158,107,0.08)",
          border: `1px solid ${isMine ? "rgba(0,0,0,0.2)" : "rgba(74,158,107,0.2)"}`,
          borderRadius: "10px",
          padding: "10px",
          cursor: "pointer",
          minWidth: "200px",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.filter = "brightness(1.1)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.filter = "brightness(1)";
        }}
      >
        <p
          style={{
            fontFamily: SANS,
            fontSize: "10px",
            color: isMine ? "rgba(13,13,13,0.7)" : "#4A9E6B",
            marginBottom: "8px",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          🎬 {isTV ? "TV Recommendation" : "Film Recommendation"}
        </p>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {m.poster_url ? (
            <div
              style={{
                width: 40,
                height: 60,
                borderRadius: 4,
                overflow: "hidden",
                flexShrink: 0,
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
              }}
            >
              <img
                src={m.poster_url}
                alt={m.title}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
          ) : (
            <div
              style={{
                width: 40,
                height: 60,
                borderRadius: 4,
                background: "#1A1A1A",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {isTV ? (
                <Tv size={14} color="#504E4A" />
              ) : (
                <Film size={14} color="#504E4A" />
              )}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontFamily: SANS,
                fontSize: "13px",
                color: isMine ? "#0D0D0D" : "#F0EDE8",
                fontWeight: 600,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {m.title}
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                marginTop: "3px",
              }}
            >
              {m.year > 0 && (
                <p
                  style={{
                    fontFamily: MONO,
                    fontSize: "10px",
                    color: isMine ? "rgba(13,13,13,0.5)" : "#504E4A",
                  }}
                >
                  {m.year}
                </p>
              )}
              {m.tmdb_rating_5 > 0 && (
                <p
                  style={{
                    fontFamily: MONO,
                    fontSize: "10px",
                    color: isMine ? "rgba(13,13,13,0.7)" : "#C8A96E",
                  }}
                >
                  ★ {m.tmdb_rating_5}/5
                </p>
              )}
            </div>
            <p
              style={{
                fontFamily: SANS,
                fontSize: "10px",
                color: isMine ? "rgba(13,13,13,0.5)" : "#4A9E6B",
                marginTop: "4px",
              }}
            >
              Tap to view →
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (msg.content_type === "dna_share" && msg.metadata) {
    const m = msg.metadata;
    const GENRE_COLORS: Record<string, string> = {
      Drama: "#5C4A8A",
      Thriller: "#8A2A2A",
      Documentary: "#2A5C8A",
      "Sci-Fi": "#2A6A5C",
      "Science Fiction": "#2A6A5C",
      Comedy: "#8A7A2A",
      Romance: "#8A2A5C",
      Horror: "#6A2A2A",
      Animation: "#2A6A8A",
      Action: "#7A4A2A",
      Crime: "#5A3A5A",
      History: "#3A5A4A",
      Mystery: "#4A3A6A",
      Adventure: "#3A6A4A",
      Fantasy: "#6A3A7A",
      War: "#5A4A3A",
    };
    return (
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: "12px",
          border: "1px solid #2A2A2A",
          background:
            "linear-gradient(135deg, #141414 0%, #111111 50%, #0D0D0D 100%)",
          minWidth: "240px",
          maxWidth: "280px",
        }}
      >
        <div
          style={{
            display: "flex",
            height: "24px",
            borderBottom: "1px solid #1A1A1A",
          }}
        >
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                borderRight: "1px solid #1A1A1A",
                background: "#0D0D0D",
                height: "6px",
                margin: "6px 0",
              }}
            />
          ))}
        </div>
        <div style={{ padding: "16px" }}>
          <p
            style={{
              fontFamily: SANS,
              fontSize: "9px",
              color: "#504E4A",
              textTransform: "uppercase",
              letterSpacing: "0.2em",
              marginBottom: "8px",
            }}
          >
            TASTE — DNA CARD
          </p>
          <h3
            style={{
              fontFamily: "Playfair Display, Georgia, serif",
              fontSize: "20px",
              fontWeight: 700,
              lineHeight: 1.2,
              background:
                "linear-gradient(105deg, #C8A96E 0%, #F0EDE8 45%, #C8A96E 55%, #DFC080 100%)",
              backgroundSize: "300% auto",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              animation: "goldSweep 3s linear infinite",
              fontStyle: "italic",
              marginBottom: "4px",
            }}
          >
            {m.archetype}
          </h3>
          <p
            style={{
              fontFamily: SANS,
              fontSize: "11px",
              color: "#8A8780",
              fontStyle: "italic",
              lineHeight: 1.5,
              marginBottom: "12px",
            }}
          >
            {m.archetype_desc}
          </p>
          {m.top_genres?.length > 0 && (
            <div style={{ marginBottom: "12px" }}>
              <p
                style={{
                  fontFamily: SANS,
                  fontSize: "9px",
                  color: "#504E4A",
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                  marginBottom: "8px",
                }}
              >
                Genres
              </p>
              <div
                style={{ display: "flex", flexDirection: "column", gap: "6px" }}
              >
                {(m.top_genres as any[]).slice(0, 4).map((g: any) => (
                  <div
                    key={g.name}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: SANS,
                        fontSize: "10px",
                        color: GENRE_COLORS[g.name] || "#8A8780",
                        width: "72px",
                        flexShrink: 0,
                      }}
                    >
                      {g.name}
                    </span>
                    <div
                      style={{
                        flex: 1,
                        height: "4px",
                        background: "#1A1A1A",
                        borderRadius: "2px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          borderRadius: "2px",
                          width: `${g.pct}%`,
                          background: GENRE_COLORS[g.name] || "#3A3A3A",
                        }}
                      />
                    </div>
                    <span
                      style={{
                        fontFamily: MONO,
                        fontSize: "9px",
                        color: "#504E4A",
                        width: "24px",
                        textAlign: "right",
                      }}
                    >
                      {g.pct}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
              paddingTop: "12px",
              borderTop: "1px solid #1A1A1A",
            }}
          >
            {[
              { val: m.total_films, label: "Films" },
              { val: m.total_series, label: "Series" },
            ].map(
              ({ val, label }) =>
                val > 0 && (
                  <div key={label}>
                    <p
                      style={{
                        fontFamily: MONO,
                        color: "#C8A96E",
                        fontSize: "16px",
                        fontWeight: 500,
                      }}
                    >
                      {val}
                    </p>
                    <p
                      style={{
                        fontFamily: SANS,
                        color: "#504E4A",
                        fontSize: "9px",
                        marginTop: "2px",
                      }}
                    >
                      {label}
                    </p>
                  </div>
                ),
            )}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            height: "24px",
            borderTop: "1px solid #1A1A1A",
          }}
        >
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                borderRight: "1px solid #1A1A1A",
                background: "#0D0D0D",
                height: "6px",
                margin: "6px 0",
              }}
            />
          ))}
        </div>
        <style>{`@keyframes goldSweep { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }`}</style>
      </div>
    );
  }

  return (
    <p
      style={{
        fontFamily: SANS,
        fontSize: "14px",
        color: isMine ? "#0D0D0D" : "#F0EDE8",
        lineHeight: 1.55,
        wordBreak: "break-word",
      }}
    >
      {msg.content}
    </p>
  );
}

function ReactionPicker({
  onPick,
  onClose,
}: {
  onPick: (emoji: string) => void;
  onClose: () => void;
}) {
  return (
    <>
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, zIndex: 50 }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "calc(100% + 8px)",
          left: "50%",
          transform: "translateX(-50%)",
          background: "#1A1A1A",
          border: "1px solid #2A2A2A",
          borderRadius: "30px",
          padding: "8px 12px",
          display: "flex",
          gap: "8px",
          zIndex: 51,
          boxShadow: "0 8px 30px rgba(0,0,0,0.6)",
          animation: "popIn 0.15s cubic-bezier(0.34,1.56,0.64,1)",
          whiteSpace: "nowrap",
        }}
      >
        {REACTIONS.map((e) => (
          <span
            key={e}
            onClick={() => onPick(e)}
            style={{
              fontSize: "20px",
              cursor: "pointer",
              transition: "transform 0.1s",
              display: "inline-block",
            }}
            onMouseEnter={(el) =>
              (el.currentTarget.style.transform = "scale(1.35)")
            }
            onMouseLeave={(el) =>
              (el.currentTarget.style.transform = "scale(1)")
            }
          >
            {e}
          </span>
        ))}
      </div>
      <style>{`@keyframes popIn{from{opacity:0;transform:translateX(-50%) scale(0.7)}to{opacity:1;transform:translateX(-50%) scale(1)}}`}</style>
    </>
  );
}

function MessageBubble({
  msg,
  isMine,
  otherName,
  onReact,
  onReply,
  onDelete,
  showAvatar,
}: {
  msg: any;
  isMine: boolean;
  otherName: string;
  onReact: (msgId: string, emoji: string) => void;
  onReply: (msg: any) => void;
  onDelete: (msgId: string) => void;
  showAvatar: boolean;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const reactions = msg.reactions || {};
  const reactionEntries = Object.entries(reactions) as [string, number][];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: isMine ? "flex-end" : "flex-start",
        gap: "2px",
        marginBottom: "2px",
      }}
    >
      {!isMine && showAvatar && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            marginBottom: "2px",
            paddingLeft: "2px",
          }}
        >
          <Avatar name={otherName} size={18} />
          <span
            style={{ fontFamily: SANS, fontSize: "11px", color: "#504E4A" }}
          >
            {otherName}
          </span>
        </div>
      )}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          flexDirection: isMine ? "row-reverse" : "row",
        }}
      >
        <button
          onClick={() => onReply(msg)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#2A2A2A",
            padding: "4px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: 0,
            transition: "opacity 0.15s",
          }}
          className="msg-action-btn"
        >
          <Reply size={14} />
        </button>
        <div style={{ position: "relative" }}>
          <div
            onDoubleClick={() => setShowPicker(true)}
            onContextMenu={(e) => {
              e.preventDefault();
              setShowActions(true);
            }}
            style={{
              maxWidth: "280px",
              padding: "9px 13px",
              borderRadius: isMine
                ? "18px 18px 4px 18px"
                : "18px 18px 18px 4px",
              background: isMine ? "#C8A96E" : "#141414",
              border: isMine ? "none" : "1px solid #222",
              cursor: "pointer",
              position: "relative",
              transition: "filter 0.1s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.filter = "brightness(1.06)";
              const btns = e.currentTarget
                .closest("[data-msgrow]")
                ?.querySelectorAll(
                  ".msg-action-btn",
                ) as NodeListOf<HTMLElement>;
              btns?.forEach((b) => (b.style.opacity = "1"));
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.filter = "brightness(1)";
              const btns = e.currentTarget
                .closest("[data-msgrow]")
                ?.querySelectorAll(
                  ".msg-action-btn",
                ) as NodeListOf<HTMLElement>;
              btns?.forEach((b) => (b.style.opacity = "0"));
            }}
          >
            {msg.reply_to && (
              <div
                style={{
                  background: isMine
                    ? "rgba(0,0,0,0.18)"
                    : "rgba(255,255,255,0.06)",
                  borderLeft: `3px solid ${isMine ? "rgba(0,0,0,0.5)" : "#C8A96E"}`,
                  borderRadius: "6px",
                  padding: "5px 9px",
                  marginBottom: "7px",
                  overflow: "hidden",
                }}
              >
                <p
                  style={{
                    fontFamily: SANS,
                    fontSize: "11px",
                    fontWeight: 600,
                    color: isMine ? "rgba(0,0,0,0.65)" : "#C8A96E",
                    marginBottom: "2px",
                  }}
                >
                  {msg.reply_to.sender_name || otherName}
                </p>
                <p
                  style={{
                    fontFamily: SANS,
                    fontSize: "11px",
                    color: isMine ? "rgba(0,0,0,0.5)" : "#7A7875",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    maxWidth: "220px",
                  }}
                >
                  {msg.reply_to.content?.slice(0, 60)}
                </p>
              </div>
            )}
            <MessageContent msg={msg} isMine={isMine} />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: "4px",
                marginTop: "4px",
              }}
            >
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: "10px",
                  color: isMine ? "rgba(13,13,13,0.45)" : "#3A3A3A",
                }}
              >
                {timeStr(msg.created_at)}
              </span>
              <Ticks status={msg.status || "read"} mine={isMine} />
            </div>
            {showPicker && (
              <ReactionPicker
                onPick={(e) => {
                  onReact(msg.id, e);
                  setShowPicker(false);
                }}
                onClose={() => setShowPicker(false)}
              />
            )}
          </div>
          {showActions && (
            <>
              <div
                onClick={() => setShowActions(false)}
                style={{ position: "fixed", inset: 0, zIndex: 50 }}
              />
              <div
                style={{
                  position: "absolute",
                  [isMine ? "right" : "left"]: 0,
                  bottom: "calc(100% + 6px)",
                  zIndex: 51,
                  background: "#1A1A1A",
                  border: "1px solid #2A2A2A",
                  borderRadius: "12px",
                  overflow: "hidden",
                  minWidth: "140px",
                  boxShadow: "0 8px 30px rgba(0,0,0,0.6)",
                }}
              >
                {[
                  {
                    icon: <Smile size={13} />,
                    label: "React",
                    action: () => {
                      setShowPicker(true);
                      setShowActions(false);
                    },
                  },
                  {
                    icon: <Reply size={13} />,
                    label: "Reply",
                    action: () => {
                      onReply(msg);
                      setShowActions(false);
                    },
                  },
                  ...(isMine
                    ? [
                        {
                          icon: <Trash2 size={13} />,
                          label: "Delete",
                          action: () => {
                            onDelete(msg.id);
                            setShowActions(false);
                          },
                          danger: true,
                        },
                      ]
                    : []),
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={item.action}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      width: "100%",
                      padding: "10px 14px",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: (item as any).danger ? "#E05C5C" : "#C8C4BC",
                      fontFamily: SANS,
                      fontSize: "13px",
                      textAlign: "left",
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#222")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "none")
                    }
                  >
                    {item.icon} {item.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        {isMine && (
          <button
            onClick={() => onDelete(msg.id)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#2A2A2A",
              padding: "4px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: 0,
              transition: "opacity 0.15s",
            }}
            className="msg-action-btn"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>
      {reactionEntries.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: "4px",
            flexWrap: "wrap",
            justifyContent: isMine ? "flex-end" : "flex-start",
            marginTop: "2px",
          }}
        >
          {reactionEntries.map(([emoji, count]) => (
            <div
              key={emoji}
              onClick={() => onReact(msg.id, emoji)}
              style={{
                background: "#1A1A1A",
                border: "1px solid #2A2A2A",
                borderRadius: "20px",
                padding: "2px 8px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                cursor: "pointer",
                transition: "background 0.1s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#252525")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "#1A1A1A")
              }
            >
              <span style={{ fontSize: "13px" }}>{emoji}</span>
              <span
                style={{ fontFamily: MONO, fontSize: "10px", color: "#504E4A" }}
              >
                {count}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main chat page ───────────────────────────────────────────────────────────
export default function ChatPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { user } = useAuth();
  const router = useRouter();
const [attachedTitles, setAttachedTitles] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [replyTo, setReplyTo] = useState<any>(null);
  const [online, setOnline] = useState(false);

  // @movie mention state
  const [mentionActive, setMentionActive] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionStart, setMentionStart] = useState(-1);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<any>(null);
  const channelRef = useRef<any>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);

  async function getSession() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session;
  }

  const loadMessages = useCallback(async () => {
    const session = await getSession();
    if (!session) return;
    const res = await fetch(`/api/messages/${conversationId}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    const data = await res.json();
    setMessages(data.messages || []);
    setLoading(false);
  }, [conversationId]);

  async function loadOtherUser() {
    const session = await getSession();
    if (!session) return;
    const res = await fetch("/api/conversations", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    const data = await res.json();
    const conv = (data.conversations || []).find(
      (c: any) => c.id === conversationId,
    );
    if (conv?.others?.[0]) setOtherUser(conv.others[0]);
  }

  useEffect(() => {
    if (!user) return;
    loadMessages();
    loadOtherUser();

    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as any;
          if (newMsg.sender_id === user.id) return;
          setMessages((prev) => [
            ...prev,
            { ...newMsg, is_mine: false, status: "read" },
          ]);
        },
      )
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState() as any;
        const others = Object.values(state)
          .flat()
          .filter((p: any) => p.user_id !== user.id);
        setIsTyping(others.some((p: any) => p.typing));
        setOnline(others.length > 0);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED")
          await channel.track({ user_id: user.id, typing: false });
      });

    channelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: messages.length < 5 ? "instant" : "smooth",
    } as any);
  }, [messages, isTyping]);

  // Send a regular text message
  async function send() {
    if (!text.trim() && attachedTitles.length === 0) return;
    if (sending) return;
    setSending(true);

    const session = await getSession();
    if (!session) {
      setSending(false);
      return;
    }

    // Send attached title cards first
    for (const metadata of attachedTitles) {
      const tempId = `temp-${Date.now()}-${metadata.tmdb_id}`;
      const optimistic: any = {
        id: tempId,
        content: `Check out ${metadata.title}`,
        content_type: "title_rec",
        metadata,
        created_at: new Date().toISOString(),
        is_mine: true,
        sender_id: user!.id,
        status: "sending",
        reply_to: null,
        reactions: {},
      };
      setMessages((prev) => [...prev, optimistic]);

      const res = await fetch(`/api/messages/${conversationId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          content: `Check out ${metadata.title}`,
          content_type: "title_rec",
          metadata,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId
              ? {
                  ...data.message,
                  is_mine: true,
                  status: "sent",
                  reactions: {},
                }
              : m,
          ),
        );
      }
    }
    setAttachedTitles([]);

    if (!text.trim() || sending) return;
  
    const tempId = `temp-${Date.now()}`;
    const optimistic: any = {
      id: tempId,
      content: text.trim(),
      content_type: "text",
      created_at: new Date().toISOString(),
      is_mine: true,
      sender_id: user!.id,
      status: "sending",
      reply_to: replyTo || null,
      reactions: {},
    };
    setMessages((prev) => [...prev, optimistic]);
    setText("");
    setReplyTo(null);
    setMentionActive(false);
    if (inputRef.current) inputRef.current.style.height = "auto";
    setSending(true);
    channelRef.current?.track({ user_id: user!.id, typing: false });

    const res = await fetch(`/api/messages/${conversationId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        content: optimistic.content,
        content_type: "text",
        reply_to_id: replyTo?.id || null,
      }),
    });
    const data = await res.json();
    setMessages((prev) =>
      prev.map((m) =>
        m.id === tempId
          ? { ...data.message, is_mine: true, status: "sent", reactions: {} }
          : m,
      ),
    );
    setTimeout(
      () =>
        setMessages((prev) =>
          prev.map((m) =>
            m.id === data.message?.id ? { ...m, status: "delivered" } : m,
          ),
        ),
      800,
    );
    setTimeout(
      () =>
        setMessages((prev) =>
          prev.map((m) =>
            m.id === data.message?.id ? { ...m, status: "read" } : m,
          ),
        ),
      2000,
    );
    setSending(false);
  }

  // Send a movie/TV title recommendation
 function attachTitle(item: any) {
  const isTV = item.media_type === "tv" || item.type === "series";
  const metadata = {
    tmdb_id: item.tmdb_id || item.id,
    media_type: isTV ? "tv" : "movie",
    title: item.title,
    poster_url: item.poster_url,
    year: item.year,
    tmdb_rating_5:
      item.tmdb_rating_5 ||
      (item.tmdb_rating ? Math.round((item.tmdb_rating / 2) * 2) / 2 : 0),
    overview: item.overview,
  };

  // Avoid duplicates
  setAttachedTitles((prev) =>
    prev.find((t) => t.tmdb_id === metadata.tmdb_id)
      ? prev
      : [...prev, metadata],
  );

  // Clear the @mention from input, keep any text before @
  setText((prev) => {
    const beforeAt = prev.slice(0, mentionStart).trimEnd();
    return beforeAt ? beforeAt + " " : "";
  });
  setMentionActive(false);
  setMentionQuery("");
  setMentionStart(-1);
  if (inputRef.current) {
    inputRef.current.style.height = "auto";
    inputRef.current.focus();
  }
}

  // Handle textarea input — detect @mention
  function onInput(e: React.FormEvent<HTMLTextAreaElement>) {
    const t = e.currentTarget;
    t.style.height = "auto";
    t.style.height = Math.min(t.scrollHeight, 130) + "px";
    const val = t.value;
    setText(val);

    // Detect @ mentions
    const cursor = t.selectionStart || 0;
    const textUpToCursor = val.slice(0, cursor);
    const atMatch = textUpToCursor.match(/@(.*)$/);

    if (atMatch) {
      setMentionActive(true);
      setMentionQuery(atMatch[1]);
      setMentionStart(cursor - atMatch[0].length);
    } else {
      setMentionActive(false);
      setMentionQuery("");
      setMentionStart(-1);
    }

    channelRef.current?.track({ user_id: user?.id, typing: true });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      channelRef.current?.track({ user_id: user?.id, typing: false });
    }, 2000);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (mentionActive && e.key === "Escape") {
      e.preventDefault();
      setMentionActive(false);
      setMentionQuery("");
      return;
    }
    if (e.key === "Enter" && !e.shiftKey && !mentionActive) {
      e.preventDefault();
      send();
    }
  }

  function handleReact(msgId: string, emoji: string) {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== msgId) return m;
        const reactions = { ...(m.reactions || {}) };
        reactions[emoji] = (reactions[emoji] || 0) + 1;
        return { ...m, reactions };
      }),
    );
  }

  function handleDelete(msgId: string) {
    setMessages((prev) => prev.filter((m) => m.id !== msgId));
  }

  const otherName = otherUser?.username || otherUser?.display_name || "Chat";

  return (
    <div
      className="chat-shell"
      style={{
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        background: "#0D0D0D",
      }}
    >
      <style>{`
        .msg-action-btn { opacity: 0; }
        [data-msgrow]:hover .msg-action-btn { opacity: 1; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .msg-in { animation: fadeUp 0.2s ease; }
        @media (min-width: 640px) { .chat-shell { left: 224px !important; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes typingBounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}
        @keyframes mentionFadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .mention-dropdown { animation: mentionFadeIn 0.18s cubic-bezier(0.16,1,0.3,1); }
      `}</style>

      {/* ── Header ── */}
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid #181818",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          background: "rgba(11,11,11,0.97)",
          backdropFilter: "blur(12px)",
          position: "sticky",
          top: 0,
          zIndex: 20,
        }}
      >
        <button
          onClick={() => router.push("/messages")}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#C8A96E",
            padding: "4px 8px 4px 0",
          }}
        >
          <ArrowLeft size={18} />
        </button>
        {otherUser && <Avatar name={otherName} size={38} online={online} />}
        <div style={{ flex: 1 }}>
          <p
            style={{
              fontFamily: SANS,
              fontSize: "14px",
              color: "#F0EDE8",
              fontWeight: 600,
            }}
          >
            {otherName}
          </p>
          <p
            style={{
              fontFamily: SANS,
              fontSize: "11px",
              color: isTyping ? "#C8A96E" : online ? "#25D366" : "#504E4A",
              transition: "color 0.3s",
            }}
          >
            {isTyping
              ? "typing…"
              : online
                ? "online"
                : `@${otherUser?.username || "…"}`}
          </p>
        </div>
        <div style={{ display: "flex", gap: "12px", color: "#504E4A" }}>
          <button
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#504E4A",
              display: "flex",
            }}
            title="Voice call"
          >
            <Phone size={17} />
          </button>
          <button
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#504E4A",
              display: "flex",
            }}
            title="Video call"
          >
            <Video size={17} />
          </button>
        </div>
      </div>

      {/* ── Messages ── */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px 16px 8px",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          background: "#0A0A0A",
        }}
      >
        {loading ? (
          [58, 42, 65, 38, 55, 44].map((w, i) => (
            <div
              key={`skel-${i}`}
              style={{
                display: "flex",
                justifyContent: i % 2 === 0 ? "flex-start" : "flex-end",
              }}
            >
              <div
                className="skeleton"
                style={{ height: "44px", borderRadius: "14px", width: `${w}%` }}
              />
            </div>
          ))
        ) : messages.length === 0 ? (
          <div
            style={{ textAlign: "center", margin: "auto", padding: "40px 0" }}
          >
            <Film
              size={28}
              color="#1E1E1E"
              style={{ margin: "0 auto 12px", display: "block" }}
            />
            <p
              style={{
                fontFamily: SERIF,
                fontSize: "16px",
                color: "#2A2A2A",
                fontStyle: "italic",
              }}
            >
              Start the conversation.
            </p>
            <p
              style={{
                fontFamily: SANS,
                fontSize: "12px",
                color: "#1E1E1E",
                marginTop: "6px",
              }}
            >
              Share logs, reviews, or type @ to recommend a film
            </p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMine = msg.is_mine;
            const prevMsg = messages[i - 1];
            const showAvatar = !isMine && (!prevMsg || prevMsg.is_mine);
            const msgDate = new Date(msg.created_at).toDateString();
            const prevDate = prevMsg
              ? new Date(prevMsg.created_at).toDateString()
              : null;
            const showDate = msgDate !== prevDate;
            return (
              <div key={msg.id} data-msgrow="1">
                {showDate && (
                  <div style={{ textAlign: "center", margin: "12px 0 8px" }}>
                    <span
                      style={{
                        fontFamily: MONO,
                        fontSize: "10px",
                        color: "#3A3A3A",
                        background: "#111",
                        padding: "3px 10px",
                        borderRadius: "20px",
                        border: "1px solid #1E1E1E",
                      }}
                    >
                      {new Date(msg.created_at).toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                )}
                <div className="msg-in">
                  <MessageBubble
                    msg={msg}
                    isMine={isMine}
                    otherName={otherName}
                    showAvatar={showAvatar}
                    onReact={handleReact}
                    onReply={setReplyTo}
                    onDelete={handleDelete}
                  />
                </div>
              </div>
            );
          })
        )}

        {isTyping && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Avatar name={otherName} size={20} />
            <div
              style={{
                background: "#141414",
                border: "1px solid #222",
                borderRadius: "14px 14px 14px 4px",
                padding: "10px 14px",
                display: "flex",
                gap: "4px",
                alignItems: "center",
              }}
            >
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#504E4A",
                    animation: "typingBounce 1.2s infinite",
                    animationDelay: `${i * 0.18}s`,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Reply bar ── */}
      {replyTo && (
        <div
          style={{
            padding: "8px 16px",
            background: "#0E0E0E",
            borderTop: "1px solid #1A1A1A",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <Reply size={14} color="#C8A96E" style={{ flexShrink: 0 }} />
          <div
            style={{
              flex: 1,
              borderLeft: "2px solid #C8A96E",
              paddingLeft: "10px",
            }}
          >
            <p
              style={{
                fontFamily: SANS,
                fontSize: "11px",
                color: "#C8A96E",
                marginBottom: "1px",
              }}
            >
              {replyTo.is_mine ? "You" : otherName}
            </p>
            <p
              style={{
                fontFamily: SANS,
                fontSize: "12px",
                color: "#504E4A",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {replyTo.content?.slice(0, 80)}
            </p>
          </div>
          <button
            onClick={() => setReplyTo(null)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#504E4A",
              display: "flex",
              padding: "4px",
            }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Input area ── */}
      <div
        ref={inputContainerRef}
        style={{
          padding: "10px 14px",
          borderTop: "1px solid #181818",
          background: "#0D0D0D",
          display: "flex",
          gap: "8px",
          alignItems: "flex-end",
          position: "relative",
        }}
      >
        {/* @Movie Mention Dropdown */}
        {mentionActive && (
          <div
            className="mention-dropdown"
            style={{
              position: "absolute",
              bottom: "calc(100% + 4px)",
              left: "14px",
              right: "14px",
              zIndex: 100,
            }}
          >
            <MovieMentionDropdown
              query={mentionQuery}
              onSelect={attachTitle} // ← was sendTitleRec
              anchorRef={inputRef}
            />
          </div>
        )}

        <button
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "#141414",
            border: "1px solid #222",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "#504E4A",
            flexShrink: 0,
          }}
          title="Attach"
        >
          <Paperclip size={15} />
        </button>

        <div style={{ flex: 1, position: "relative" }}>
          {/* @hint badge */}
          {!mentionActive && text.length === 0 && (
            <div
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                pointerEvents: "none",
                opacity: 0.4,
              }}
            >
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: "10px",
                  color: "#504E4A",
                  background: "#1A1A1A",
                  border: "1px solid #2A2A2A",
                  borderRadius: "4px",
                  padding: "1px 5px",
                }}
              >
                @
              </span>
              <span
                style={{ fontFamily: SANS, fontSize: "10px", color: "#504E4A" }}
              >
                film
              </span>
            </div>
          )}
          {/* Attached title chips */}
          {attachedTitles.length > 0 && (
            <div
              style={{
                padding: "8px 14px",
                borderTop: "1px solid #1A1A1A",
                display: "flex",
                flexWrap: "wrap",
                gap: "6px",
                background: "#0D0D0D",
              }}
            >
              {attachedTitles.map((t) => (
                <div
                  key={t.tmdb_id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "4px 8px 4px 4px",
                    background: "#141414",
                    border: "1px solid rgba(200,169,110,0.3)",
                    borderRadius: "8px",
                  }}
                >
                  {t.poster_url && (
                    <img
                      src={t.poster_url}
                      style={{
                        width: 20,
                        height: 30,
                        borderRadius: 3,
                        objectFit: "cover",
                      }}
                    />
                  )}
                  <span
                    style={{
                      fontFamily: SANS,
                      fontSize: "12px",
                      color: "#F0EDE8",
                    }}
                  >
                    {t.title}
                  </span>
                  <button
                    onClick={() =>
                      setAttachedTitles((prev) =>
                        prev.filter((x) => x.tmdb_id !== t.tmdb_id),
                      )
                    }
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#504E4A",
                      padding: 0,
                      display: "flex",
                    }}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <textarea
            ref={inputRef}
            value={text}
            onInput={onInput}
            onKeyDown={onKeyDown}
            placeholder="Message… or @ to recommend a film"
            rows={1}
            style={{
              width: "100%",
              background: "#141414",
              border: `1px solid ${mentionActive ? "rgba(200,169,110,0.4)" : "#222"}`,
              borderRadius: "20px",
              padding: "9px 16px",
              color: "#F0EDE8",
              fontFamily: SANS,
              fontSize: "14px",
              resize: "none",
              outline: "none",
              maxHeight: "130px",
              lineHeight: 1.45,
              transition: "border-color 0.15s",
            }}
            onFocus={(e) =>
              (e.target.style.borderColor = "rgba(200,169,110,0.4)")
            }
            onBlur={(e) => {
              if (!mentionActive) e.target.style.borderColor = "#222";
            }}
          />
        </div>

        {text.trim() ? (
          <button
            onClick={send}
            disabled={sending}
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              background: sending ? "#1A1A1A" : "#C8A96E",
              border: "none",
              cursor: sending ? "default" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              transition: "background 0.15s, transform 0.1s",
            }}
            onMouseEnter={(e) =>
              !sending && (e.currentTarget.style.transform = "scale(1.05)")
            }
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <Send size={15} color={sending ? "#2A2A2A" : "#0D0D0D"} />
          </button>
        ) : (
          <button
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              background: "#141414",
              border: "1px solid #222",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#504E4A",
              flexShrink: 0,
            }}
            title="Voice message"
          >
            <Mic size={15} />
          </button>
        )}
      </div>
    </div>
  );
}
