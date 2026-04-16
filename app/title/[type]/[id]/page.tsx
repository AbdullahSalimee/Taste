"use client";
import { CommunityReviews } from "@/components/features/CommunityReviews";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";

import Link from "next/link";
import {
  ArrowLeft,
  Star,
  BookmarkPlus,
  BookmarkCheck,
  Eye,
  EyeOff,
  Check,
  Clock,
  Play,
  ChevronDown,
  ChevronUp,
  Users,
  Calendar,
  Film,
  Tv,
  MessageCircle,
  Send,
  Hash,
  Globe,
  Award,
  Layers,
  X,
} from "lucide-react";
import {
  addLog,
  isLogged,
  addToWatchlist,
  removeFromWatchlist,
  isOnWatchlist,
  setRating,
  getRating,
  getLogs,
} from "@/lib/store";

const SERIF = "Playfair Display, Georgia, serif";
const SANS = "Inter, system-ui, sans-serif";
const MONO = "JetBrains Mono, Courier New, monospace";

// Convert TMDB /10 rating to /5 (half-star precision)
function toFive(rating: number): number {
  return Math.round((rating / 2) * 2) / 2; // rounds to nearest 0.5
}

function formatRuntime(mins: number) {
  if (!mins) return null;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// Episode heatmap color based on rating/5
function heatColor(rating: number): string {
  const r5 = toFive(rating);
  if (r5 === 0) return "#1A1A1A";
  if (r5 < 1.5) return "#4A1A1A";
  if (r5 < 2.0) return "#7A2A1A";
  if (r5 < 2.5) return "#8A4A2A";
  if (r5 < 3.0) return "#6A5A2A";
  if (r5 < 3.5) return "#4A6A3A";
  if (r5 < 4.0) return "#2A7A5A";
  if (r5 < 4.5) return "#2A6A8A";
  return "#C8A96E";
}

interface Comment {
  id: string;
  author: string;
  text: string;
  rating: number | null;
  date: string;
  likes: number;
}

function StarRatingInput({
  value,
  onChange,
  size = 24,
}: {
  value: number;
  onChange: (v: number) => void;
  size?: number;
}) {
  const [hovered, setHovered] = useState(0);

  return (
    <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = (hovered || value) >= star;
        const halfFilled = !filled && (hovered || value) >= star - 0.5;
        return (
          <button
            key={star}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const half = e.clientX < rect.left + rect.width / 2;
              setHovered(half ? star - 0.5 : star);
            }}
            onMouseLeave={() => setHovered(0)}
            onClick={() => {
              const rect = (
                document.elementFromPoint(0, 0) as HTMLElement
              )?.getBoundingClientRect();
              onChange(hovered || star);
            }}
            onMouseDown={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const half = e.clientX < rect.left + rect.width / 2;
              onChange(half ? star - 0.5 : star);
            }}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "2px",
              color: filled || halfFilled ? "#C8A96E" : "#2A2A2A",
              fontSize: `${size}px`,
              lineHeight: 1,
              transition: "transform 0.15s ease",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.transform = "scale(1.15)")
            }
          >
            {filled ? "★" : halfFilled ? "⯨" : "☆"}
          </button>
        );
      })}
      {value > 0 && (
        <span
          style={{
            fontFamily: MONO,
            fontSize: "14px",
            color: "#C8A96E",
            marginLeft: "4px",
          }}
        >
          {value}/5
        </span>
      )}
    </div>
  );
}

function StarDisplay({ rating, size = 14 }: { rating: number; size?: number }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (rating >= i) stars.push("★");
    else if (rating >= i - 0.5) stars.push("⯨");
    else stars.push("☆");
  }
  return (
    <span
      style={{
        color: "#C8A96E",
        fontSize: `${size}px`,
        letterSpacing: "1px",
      }}
    >
      {stars.join("")}
    </span>
  );
}

function CastCard({ member }: { member: any }) {
  const [imgErr, setImgErr] = useState(false);
  return (
    <div
      style={{
        flexShrink: 0,
        width: "88px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: "72px",
          height: "72px",
          borderRadius: "50%",
          overflow: "hidden",
          background: "#1A1A1A",
          border: "2px solid #2A2A2A",
          margin: "0 auto 8px",
        }}
      >
        {member.profile_url && !imgErr ? (
          <img
            src={member.profile_url}
            alt={member.name}
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
              fontFamily: SANS,
              fontSize: "20px",
              color: "#504E4A",
            }}
          >
            {member.name?.[0] || "?"}
          </div>
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
        }}
      >
        {member.name}
      </p>
      <p
        style={{
          fontFamily: SANS,
          fontSize: "10px",
          color: "#504E4A",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          marginTop: "2px",
        }}
      >
        {member.character}
      </p>
    </div>
  );
}

function EpisodeHeatmapSection({ tmdbId }: { tmdbId: number }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeSeason, setActiveSeason] = useState(0);
  const [hoveredEp, setHoveredEp] = useState<any>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    fetch(`/api/heatmap/${tmdbId}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [tmdbId]);

  if (loading)
    return (
      <div
        className="skeleton"
        style={{ height: "120px", borderRadius: "8px" }}
      />
    );
  if (!data?.seasons?.length) return null;

  const season = data.seasons[activeSeason];

  return (
    <div>
      {/* Season tabs */}
      <div
        style={{
          display: "flex",
          gap: "6px",
          marginBottom: "16px",
          flexWrap: "wrap",
        }}
      >
        {data.seasons.map((s: any, i: number) => (
          <button
            key={i}
            onClick={() => setActiveSeason(i)}
            style={{
              padding: "5px 12px",
              borderRadius: "4px",
              fontFamily: MONO,
              fontSize: "11px",
              cursor: "pointer",
              border:
                i === activeSeason
                  ? "1px solid rgba(200,169,110,0.4)"
                  : "1px solid #2A2A2A",
              background:
                i === activeSeason ? "rgba(200,169,110,0.1)" : "transparent",
              color: i === activeSeason ? "#C8A96E" : "#504E4A",
            }}
          >
            S{s.number}
          </button>
        ))}
      </div>

      {/* Heatmap grid */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "4px",
          position: "relative",
        }}
      >
        {season?.episodes?.map((ep: any, i: number) => (
          <div
            key={i}
            className="heatmap-cell"
            style={
              {
                width: "32px",
                height: "32px",
                borderRadius: "3px",
                background: heatColor(ep.rating),
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: MONO,
                fontSize: "9px",
                color: "rgba(240,237,232,0.5)",
                border: "1px solid rgba(255,255,255,0.05)",
                transition: "transform 0.15s ease, border-color 0.15s ease",
                "--cell-delay": `${i * 15}ms`,
              } as React.CSSProperties
            }
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.2)";
              e.currentTarget.style.borderColor = "rgba(200,169,110,0.5)";
              e.currentTarget.style.zIndex = "10";
              setHoveredEp(ep);
              const rect = e.currentTarget.getBoundingClientRect();
              setTooltipPos({ x: rect.left, y: rect.top });
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)";
              e.currentTarget.style.zIndex = "auto";
              setHoveredEp(null);
            }}
          >
            {ep.ep}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          marginTop: "12px",
        }}
      >
        <span style={{ fontFamily: SANS, fontSize: "10px", color: "#504E4A" }}>
          Low
        </span>
        {["#4A1A1A", "#7A2A1A", "#6A5A2A", "#4A6A3A", "#2A6A8A", "#C8A96E"].map(
          (c) => (
            <div
              key={c}
              style={{
                width: "16px",
                height: "8px",
                background: c,
                borderRadius: "2px",
              }}
            />
          ),
        )}
        <span style={{ fontFamily: SANS, fontSize: "10px", color: "#504E4A" }}>
          High
        </span>
      </div>

      {/* Hovered episode tooltip */}
      {hoveredEp && (
        <div
          style={{
            position: "fixed",
            top: `${tooltipPos.y - 90}px`,
            left: `${tooltipPos.x}px`,
            background: "#1A1A1A",
            border: "1px solid #3A3A3A",
            borderRadius: "8px",
            padding: "10px 14px",
            zIndex: 1000,
            pointerEvents: "none",
            maxWidth: "220px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.8)",
          }}
        >
          <p
            style={{
              fontFamily: MONO,
              fontSize: "10px",
              color: "#C8A96E",
              marginBottom: "4px",
            }}
          >
            E{hoveredEp.ep} ·{" "}
            <StarDisplay rating={toFive(hoveredEp.rating)} size={10} />
            <span style={{ color: "#504E4A" }}>
              {" "}
              {toFive(hoveredEp.rating)}/5
            </span>
          </p>
          <p
            style={{
              fontFamily: SANS,
              fontSize: "12px",
              color: "#F0EDE8",
              fontWeight: 500,
              marginBottom: "4px",
            }}
          >
            {hoveredEp.title}
          </p>
          {hoveredEp.overview && (
            <p
              style={{
                fontFamily: SANS,
                fontSize: "11px",
                color: "#8A8780",
                lineHeight: 1.5,
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {hoveredEp.overview}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function LogSheet({
  title,
  tmdbId,
  type,
  posterUrl,
  year,
  tmdbRating,
  genres,
  director,
  onClose,
  onLogged,
}: any) {
  const [status, setStatus] = useState<"watched" | "watching" | "dropped">(
    "watched",
  );
  const [rating, setRatingVal] = useState(0);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  function save() {
    setSaving(true);
    addLog({
      tmdb_id: tmdbId,
      type: type === "series" ? "series" : "film",
      title,
      poster_url: posterUrl,
      year,
      tmdb_rating: tmdbRating,
      user_rating: rating || null,
      note: note || null,
      status,
      genres: genres || [],
      director: director || undefined,
    });
    if (rating) setRating(tmdbId, rating);
    setSaving(false);
    onLogged();
    onClose();
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.7)",
          backdropFilter: "blur(4px)",
        }}
        onClick={onClose}
      />
      <div
        className="log-sheet"
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "480px",
          background: "#141414",
          borderRadius: "16px 16px 0 0",
          border: "1px solid #2A2A2A",
          borderBottom: "none",
          padding: "24px",
          zIndex: 1,
        }}
      >
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
              fontFamily: SERIF,
              fontSize: "18px",
              fontWeight: 700,
              color: "#F0EDE8",
              fontStyle: "italic",
            }}
          >
            Log{" "}
            <span style={{ color: "#C8A96E" }}>
              {title.length > 28 ? title.slice(0, 28) + "…" : title}
            </span>
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#504E4A",
              padding: "4px",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Status */}
        <p
          style={{
            fontFamily: SANS,
            fontSize: "11px",
            color: "#504E4A",
            marginBottom: "8px",
            textTransform: "uppercase",
            letterSpacing: "0.12em",
          }}
        >
          Status
        </p>
        <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
          {(["watched", "watching", "dropped"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              style={{
                flex: 1,
                padding: "8px",
                borderRadius: "6px",
                fontFamily: SANS,
                fontSize: "12px",
                cursor: "pointer",
                border:
                  status === s
                    ? "1px solid rgba(200,169,110,0.4)"
                    : "1px solid #2A2A2A",
                background:
                  status === s ? "rgba(200,169,110,0.1)" : "transparent",
                color: status === s ? "#C8A96E" : "#504E4A",
                textTransform: "capitalize",
              }}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Rating */}
        <p
          style={{
            fontFamily: SANS,
            fontSize: "11px",
            color: "#504E4A",
            marginBottom: "10px",
            textTransform: "uppercase",
            letterSpacing: "0.12em",
          }}
        >
          Your Rating
        </p>
        <div style={{ marginBottom: "20px" }}>
          <StarRatingInput value={rating} onChange={setRatingVal} size={28} />
        </div>

        {/* Note */}
        <p
          style={{
            fontFamily: SANS,
            fontSize: "11px",
            color: "#504E4A",
            marginBottom: "8px",
            textTransform: "uppercase",
            letterSpacing: "0.12em",
          }}
        >
          Note (optional)
        </p>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="What did you think?"
          style={{
            width: "100%",
            background: "#0D0D0D",
            border: "1px solid #2A2A2A",
            borderRadius: "8px",
            padding: "12px",
            color: "#F0EDE8",
            fontFamily: SANS,
            fontSize: "13px",
            resize: "none",
            height: "80px",
            outline: "none",
            marginBottom: "16px",
          }}
          onFocus={(e) =>
            (e.target.style.borderColor = "rgba(200,169,110,0.3)")
          }
          onBlur={(e) => (e.target.style.borderColor = "#2A2A2A")}
        />

        <button
          onClick={save}
          disabled={saving}
          style={{
            width: "100%",
            padding: "13px",
            borderRadius: "8px",
            background: "#C8A96E",
            color: "#0D0D0D",
            fontFamily: SANS,
            fontSize: "14px",
            fontWeight: 600,
            border: "none",
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? "Saving…" : "Save to Log"}
        </button>
      </div>
    </div>
  );
}

function CommentsSection({ tmdbId, title }: { tmdbId: number; title: string }) {
  const STORAGE_KEY = `taste_comments_${tmdbId}`;

  function loadComments(): Comment[] {
    if (typeof window === "undefined") return DEMO_COMMENTS;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}
    return DEMO_COMMENTS;
  }

  const DEMO_COMMENTS: Comment[] = [
    {
      id: "d1",
      author: "elena_watches",
      text: "One of those rare films that actually earns every minute of its runtime. The final act is breathtaking.",
      rating: 4.5,
      date: "2 days ago",
      likes: 14,
    },
    {
      id: "d2",
      author: "staticframes",
      text: "Technically brilliant but emotionally cold. Still very much worth a watch — the cinematography alone justifies it.",
      rating: 3.5,
      date: "5 days ago",
      likes: 8,
    },
    {
      id: "d3",
      author: "celluloid_ghost",
      text: "Haven't stopped thinking about it since I watched it three weeks ago. Rewatched it twice.",
      rating: 5,
      date: "1 week ago",
      likes: 22,
    },
  ];

  const [comments, setComments] = useState<Comment[]>(loadComments);
  const [text, setText] = useState("");
  const [rating, setRatingVal] = useState(0);
  const [author, setAuthor] = useState("");
  const [likedSet, setLikedSet] = useState<Set<string>>(new Set());

  function submit() {
    if (!text.trim() || !author.trim()) return;
    const c: Comment = {
      id: Date.now().toString(),
      author: author.trim(),
      text: text.trim(),
      rating: rating || null,
      date: "just now",
      likes: 0,
    };
    const updated = [c, ...comments];
    setComments(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
    setText("");
    setRatingVal(0);
  }

  function toggleLike(id: string) {
    const next = new Set(likedSet);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setLikedSet(next);
    setComments((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, likes: c.likes + (next.has(id) ? 1 : -1) } : c,
      ),
    );
  }

  return (
    <div>
      {/* Write comment */}
      <div
        style={{
          background: "#141414",
          border: "1px solid #2A2A2A",
          borderRadius: "12px",
          padding: "16px",
          marginBottom: "20px",
        }}
      >
        <p
          style={{
            fontFamily: SANS,
            fontSize: "11px",
            color: "#504E4A",
            marginBottom: "10px",
            textTransform: "uppercase",
            letterSpacing: "0.12em",
          }}
        >
          Add your review
        </p>
        <div style={{ marginBottom: "12px" }}>
          <StarRatingInput value={rating} onChange={setRatingVal} />
        </div>
        <input
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder="Your username"
          style={{
            width: "100%",
            background: "#0D0D0D",
            border: "1px solid #2A2A2A",
            borderRadius: "6px",
            padding: "9px 12px",
            color: "#F0EDE8",
            fontFamily: SANS,
            fontSize: "12px",
            outline: "none",
            marginBottom: "8px",
          }}
          onFocus={(e) =>
            (e.target.style.borderColor = "rgba(200,169,110,0.3)")
          }
          onBlur={(e) => (e.target.style.borderColor = "#2A2A2A")}
        />
        <div style={{ display: "flex", gap: "8px" }}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`What did you think of ${title.length > 20 ? title.slice(0, 20) + "…" : title}?`}
            style={{
              flex: 1,
              background: "#0D0D0D",
              border: "1px solid #2A2A2A",
              borderRadius: "6px",
              padding: "9px 12px",
              color: "#F0EDE8",
              fontFamily: SANS,
              fontSize: "12px",
              resize: "none",
              height: "60px",
              outline: "none",
            }}
            onFocus={(e) =>
              (e.target.style.borderColor = "rgba(200,169,110,0.3)")
            }
            onBlur={(e) => (e.target.style.borderColor = "#2A2A2A")}
          />
          <button
            onClick={submit}
            style={{
              padding: "0 14px",
              background: "#C8A96E",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <Send size={14} color="#0D0D0D" />
          </button>
        </div>
      </div>

      {/* Comment list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {comments.map((c, i) => (
          <div
            key={c.id}
            style={{
              padding: "16px",
              background: "#0F0F0F",
              border: "1px solid #1A1A1A",
              borderRadius: "10px",
              animation: "feedFadeUp 0.4s ease forwards",
              animationDelay: `${i * 40}ms`,
              opacity: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "8px",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    background: `hsl(${(c.author.charCodeAt(0) * 37) % 360}, 30%, 25%)`,
                    border: "1px solid rgba(255,255,255,0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: SANS,
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#F0EDE8",
                  }}
                >
                  {c.author[0].toUpperCase()}
                </div>
                <div>
                  <p
                    style={{
                      fontFamily: SANS,
                      fontSize: "12px",
                      color: "#F0EDE8",
                      fontWeight: 500,
                    }}
                  >
                    {c.author}
                  </p>
                  {c.rating && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <StarDisplay rating={c.rating} size={10} />
                      <span
                        style={{
                          fontFamily: MONO,
                          fontSize: "10px",
                          color: "#504E4A",
                        }}
                      >
                        {c.rating}/5
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <span
                style={{
                  fontFamily: SANS,
                  fontSize: "10px",
                  color: "#504E4A",
                }}
              >
                {c.date}
              </span>
            </div>
            <p
              style={{
                fontFamily: SANS,
                fontSize: "13px",
                color: "#8A8780",
                lineHeight: 1.65,
                marginBottom: "10px",
              }}
            >
              {c.text}
            </p>
            <button
              onClick={() => toggleLike(c.id)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontFamily: SANS,
                fontSize: "11px",
                color: likedSet.has(c.id) ? "#C8A96E" : "#504E4A",
                padding: 0,
              }}
            >
              {likedSet.has(c.id) ? "♥" : "♡"} {c.likes}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TitleDetailPage() {
  const { type, id } = useParams<{ type: string; id: string }>();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [similar, setSimilar] = useState<any[]>([]);
  const [logOpen, setLogOpen] = useState(false);
  const [logged, setLogged] = useState(false);
  const [onWatchlist, setOnWatchlist] = useState(false);
  const [userRating, setUserRatingState] = useState<number>(0);
  const [overviewExpanded, setOverviewExpanded] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<"info" | "heatmap" | "reviews">(
    "info",
  );
  const heroRef = useRef<HTMLDivElement>(null);

  const tmdbId = parseInt(id);
  const mediaType = type === "movie" ? "movie" : "tv";

  useEffect(() => {
    setLoading(true);
    fetch(`/api/title/${mediaType}/${tmdbId}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
        // Check local state
        setLogged(!!isLogged(tmdbId));
        setOnWatchlist(isOnWatchlist(tmdbId));
        const stored = getRating(tmdbId);
        if (stored) setUserRatingState(stored);
        // Load similar
        loadSimilar(d);
      })
      .catch(() => setLoading(false));
  }, [tmdbId, mediaType]);

  async function loadSimilar(titleData: any) {
    try {
      const endpoint =
        mediaType === "movie"
          ? `/api/search?q=${encodeURIComponent(
              (titleData.genres?.[0] || "drama") + " " + (titleData.year || ""),
            )}&type=movie`
          : `/api/search?q=${encodeURIComponent(titleData.genres?.[0] || "drama")}&type=tv`;
      const res = await fetch(endpoint);
      const d = await res.json();
      setSimilar(
        (d.results || []).filter((r: any) => r.id !== tmdbId).slice(0, 8),
      );
    } catch {}
  }

  function handleToggleWatchlist() {
    if (onWatchlist) {
      removeFromWatchlist(tmdbId);
      setOnWatchlist(false);
    } else {
      addToWatchlist({
        tmdb_id: tmdbId,
        type: data.type === "series" ? "series" : "film",
        title: data.title,
        poster_url: data.poster_url,
        year: data.year,
        tmdb_rating: data.tmdb_rating,
        overview: data.overview,
        genres: data.genres || [],
        priority: "normal",
      });
      setOnWatchlist(true);
    }
  }

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0D0D0D",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            textAlign: "center",
          }}
        >
          <div
            className="scanline-loading"
            style={{
              position: "relative",
              width: "48px",
              height: "48px",
              margin: "0 auto 16px",
              background: "#141414",
              borderRadius: "8px",
              overflow: "hidden",
            }}
          />
          <p
            style={{
              fontFamily: SANS,
              fontSize: "12px",
              color: "#504E4A",
            }}
          >
            Loading…
          </p>
        </div>
      </div>
    );
  }

  if (!data || data.error) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0D0D0D",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
        }}
      >
        <p
          style={{
            fontFamily: SERIF,
            fontSize: "24px",
            color: "#504E4A",
            fontStyle: "italic",
          }}
        >
          Not found.
        </p>
        <button
          onClick={() => router.back()}
          style={{
            background: "none",
            border: "1px solid #2A2A2A",
            borderRadius: "6px",
            padding: "8px 16px",
            color: "#8A8780",
            fontFamily: SANS,
            fontSize: "13px",
            cursor: "pointer",
          }}
        >
          ← Go back
        </button>
      </div>
    );
  }

  const rating5 = toFive(data.tmdb_rating || 0);
  const isTV = data.type === "series";
  const longOverview = (data.overview || "").length > 300;

  return (
    <div style={{ background: "#0D0D0D", minHeight: "100vh" }}>
      {/* Back button */}
      <div
        style={{
          position: "fixed",
          top: "16px",
          left: "16px",
          zIndex: 100,
        }}
      >
        <button
          onClick={() => router.back()}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 12px",
            background: "rgba(13,13,13,0.9)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(42,42,42,0.8)",
            borderRadius: "8px",
            color: "#8A8780",
            fontFamily: SANS,
            fontSize: "12px",
            cursor: "pointer",
          }}
        >
          <ArrowLeft size={14} />
          Back
        </button>
      </div>

      {/* ── HERO BACKDROP ── */}
      <div
        ref={heroRef}
        style={{
          position: "relative",
          height: "min(70vh, 560px)",
          overflow: "hidden",
        }}
      >
        {data.backdrop_url && (
          <img
            src={data.backdrop_url}
            alt=""
            onLoad={() => setImgLoaded(true)}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: imgLoaded ? 1 : 0,
              transition: "opacity 0.8s ease",
              filter: "brightness(0.5) saturate(0.7)",
            }}
          />
        )}
        {!data.backdrop_url && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(135deg, #0D0D0D 0%, ${data.genres?.[0] === "Horror" ? "#1A0A0A" : data.genres?.[0] === "Drama" ? "#0D0D1A" : "#0A0D0D"} 100%)`,
            }}
          />
        )}
        {/* Multi-layer gradient */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to right, rgba(13,13,13,0.95) 30%, rgba(13,13,13,0.3) 70%, rgba(13,13,13,0.7) 100%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom, transparent 40%, rgba(13,13,13,0.8) 70%, #0D0D0D 100%)",
          }}
        />

        {/* Content over hero */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "32px",
            maxWidth: "1100px",
            margin: "0 auto",
            display: "flex",
            gap: "28px",
            alignItems: "flex-end",
          }}
        >
          {/* Poster */}
          <div
            style={{
              flexShrink: 0,
              width: "120px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.8)",
              borderRadius: "6px",
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.08)",
              display: "none",
            }}
            className="hero-poster"
          >
            {data.poster_url ? (
              <img
                src={data.poster_url}
                alt={data.title}
                style={{ width: "100%", display: "block" }}
              />
            ) : (
              <div
                style={{
                  aspectRatio: "2/3",
                  background: "#1A1A1A",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {isTV ? (
                  <Tv size={24} color="#504E4A" />
                ) : (
                  <Film size={24} color="#504E4A" />
                )}
              </div>
            )}
          </div>

          <div style={{ flex: 1 }}>
            {/* Type badge */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "3px 10px",
                borderRadius: "4px",
                background: isTV
                  ? "rgba(74,158,107,0.15)"
                  : "rgba(92,74,138,0.15)",
                border: isTV
                  ? "1px solid rgba(74,158,107,0.3)"
                  : "1px solid rgba(92,74,138,0.3)",
                marginBottom: "10px",
              }}
            >
              {isTV ? (
                <Tv size={10} color="#4A9E6B" />
              ) : (
                <Film size={10} color="#5C4A8A" />
              )}
              <span
                style={{
                  fontFamily: SANS,
                  fontSize: "10px",
                  color: isTV ? "#4A9E6B" : "#5C4A8A",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                {isTV ? "Series" : "Film"} · {data.year}
              </span>
            </div>

            {/* Title */}
            <h1
              style={{
                fontFamily: SERIF,
                fontSize: "clamp(28px, 5vw, 52px)",
                fontWeight: 700,
                color: "#F0EDE8",
                lineHeight: 1.05,
                letterSpacing: "-0.02em",
                marginBottom: "8px",
              }}
            >
              {data.title}
            </h1>

            {/* Tagline */}
            {data.tagline && (
              <p
                style={{
                  fontFamily: SERIF,
                  fontSize: "15px",
                  color: "#8A8780",
                  fontStyle: "italic",
                  marginBottom: "12px",
                }}
              >
                "{data.tagline}"
              </p>
            )}

            {/* Meta row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                flexWrap: "wrap",
              }}
            >
              {/* Rating */}
              <div
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <StarDisplay rating={rating5} size={14} />
                <span
                  style={{
                    fontFamily: MONO,
                    fontSize: "13px",
                    color: "#C8A96E",
                    fontWeight: 500,
                  }}
                >
                  {rating5}/5
                </span>
                <span
                  style={{
                    fontFamily: SANS,
                    fontSize: "11px",
                    color: "#504E4A",
                  }}
                >
                  ({data.vote_count?.toLocaleString() || 0} votes)
                </span>
              </div>

              {data.runtime && (
                <div
                  style={{ display: "flex", alignItems: "center", gap: "4px" }}
                >
                  <Clock size={11} color="#504E4A" />
                  <span
                    style={{
                      fontFamily: SANS,
                      fontSize: "12px",
                      color: "#504E4A",
                    }}
                  >
                    {formatRuntime(data.runtime)}
                  </span>
                </div>
              )}

              {isTV && data.seasons && (
                <span
                  style={{
                    fontFamily: SANS,
                    fontSize: "12px",
                    color: "#504E4A",
                  }}
                >
                  {data.seasons} seasons · {data.episodes} episodes
                </span>
              )}

              {data.original_language && data.original_language !== "en" && (
                <div
                  style={{ display: "flex", alignItems: "center", gap: "4px" }}
                >
                  <Globe size={11} color="#504E4A" />
                  <span
                    style={{
                      fontFamily: SANS,
                      fontSize: "12px",
                      color: "#504E4A",
                      textTransform: "uppercase",
                    }}
                  >
                    {data.original_language}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "0 24px 80px",
          display: "grid",
          gridTemplateColumns: "1fr 280px",
          gap: "32px",
        }}
        className="title-grid"
      >
        {/* ── LEFT COLUMN ── */}
        <div>
          {/* Action buttons */}
          <div
            style={{
              display: "flex",
              gap: "8px",
              padding: "16px 0",
              borderBottom: "1px solid #1A1A1A",
              marginBottom: "24px",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={() => setLogOpen(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "7px",
                padding: "10px 18px",
                borderRadius: "8px",
                background: logged ? "rgba(200,169,110,0.15)" : "#C8A96E",
                border: logged ? "1px solid rgba(200,169,110,0.3)" : "none",
                color: logged ? "#C8A96E" : "#0D0D0D",
                fontFamily: SANS,
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {logged ? <Check size={14} /> : <Eye size={14} />}
              {logged ? "Logged" : "Log this"}
            </button>

            <button
              onClick={handleToggleWatchlist}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "7px",
                padding: "10px 16px",
                borderRadius: "8px",
                background: "transparent",
                border: "1px solid #2A2A2A",
                color: onWatchlist ? "#4A9E6B" : "#8A8780",
                fontFamily: SANS,
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              {onWatchlist ? (
                <BookmarkCheck size={14} />
              ) : (
                <BookmarkPlus size={14} />
              )}
              {onWatchlist ? "Saved" : "Watchlist"}
            </button>

            {/* User quick-rate */}
            {!logged && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid #2A2A2A",
                  background: "transparent",
                }}
              >
                <StarRatingInput
                  value={userRating}
                  onChange={(v) => {
                    setUserRatingState(v);
                    setRating(tmdbId, v);
                  }}
                  size={18}
                />
              </div>
            )}
          </div>

          {/* Tabs */}
          <div
            style={{
              display: "flex",
              gap: "0",
              borderBottom: "1px solid #1A1A1A",
              marginBottom: "24px",
            }}
          >
            {(
              [
                { id: "info", label: "Details" },
                ...(isTV ? [{ id: "heatmap", label: "Episode Map" }] : []),
                { id: "reviews", label: "Reviews" },
              ] as { id: "info" | "heatmap" | "reviews"; label: string }[]
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: "10px 20px",
                  background: "none",
                  border: "none",
                  borderBottom:
                    activeTab === tab.id
                      ? "2px solid #C8A96E"
                      : "2px solid transparent",
                  color: activeTab === tab.id ? "#F0EDE8" : "#504E4A",
                  fontFamily: SANS,
                  fontSize: "13px",
                  fontWeight: activeTab === tab.id ? 500 : 400,
                  cursor: "pointer",
                  transition: "color 0.15s ease",
                  marginBottom: "-1px",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab: Details */}
          {activeTab === "info" && (
            <div
              style={{
                animation: "fadeIn 0.3s ease",
              }}
            >
              {/* Overview */}
              {data.overview && (
                <div style={{ marginBottom: "28px" }}>
                  <p
                    style={{
                      fontFamily: SANS,
                      fontSize: "15px",
                      color: "#8A8780",
                      lineHeight: 1.75,
                      display: overviewExpanded ? "block" : "-webkit-box",
                      WebkitLineClamp: overviewExpanded ? undefined : 4,
                      WebkitBoxOrient: "vertical",
                      overflow: overviewExpanded ? "visible" : "hidden",
                    }}
                  >
                    {data.overview}
                  </p>
                  {longOverview && (
                    <button
                      onClick={() => setOverviewExpanded(!overviewExpanded)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#C8A96E",
                        fontFamily: SANS,
                        fontSize: "12px",
                        marginTop: "8px",
                        padding: 0,
                      }}
                    >
                      {overviewExpanded ? (
                        <>
                          Show less <ChevronUp size={12} />
                        </>
                      ) : (
                        <>
                          Read more <ChevronDown size={12} />
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}

              {/* Director / Created by */}
              {(data.director || data.created_by?.length > 0) && (
                <div style={{ marginBottom: "20px" }}>
                  <p
                    style={{
                      fontFamily: SANS,
                      fontSize: "10px",
                      color: "#504E4A",
                      textTransform: "uppercase",
                      letterSpacing: "0.15em",
                      marginBottom: "6px",
                    }}
                  >
                    {isTV ? "Created by" : "Director"}
                  </p>
                  <p
                    style={{
                      fontFamily: SANS,
                      fontSize: "14px",
                      color: "#F0EDE8",
                      fontWeight: 500,
                    }}
                  >
                    {data.director || (data.created_by || []).join(", ")}
                  </p>
                </div>
              )}

              {/* Genres */}
              {data.genres?.length > 0 && (
                <div style={{ marginBottom: "24px" }}>
                  <p
                    style={{
                      fontFamily: SANS,
                      fontSize: "10px",
                      color: "#504E4A",
                      textTransform: "uppercase",
                      letterSpacing: "0.15em",
                      marginBottom: "8px",
                    }}
                  >
                    Genres
                  </p>
                  <div
                    style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}
                  >
                    {data.genres.map((g: string) => (
                      <span
                        key={g}
                        style={{
                          padding: "4px 12px",
                          borderRadius: "4px",
                          background: "#1A1A1A",
                          border: "1px solid #2A2A2A",
                          fontFamily: SANS,
                          fontSize: "12px",
                          color: "#8A8780",
                        }}
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Cast */}
              {data.cast?.length > 0 && (
                <div style={{ marginBottom: "32px" }}>
                  <p
                    style={{
                      fontFamily: SANS,
                      fontSize: "10px",
                      color: "#504E4A",
                      textTransform: "uppercase",
                      letterSpacing: "0.15em",
                      marginBottom: "16px",
                    }}
                  >
                    Cast
                  </p>
                  <div
                    style={{
                      display: "flex",
                      gap: "16px",
                      overflowX: "auto",
                      paddingBottom: "8px",
                      scrollbarWidth: "none",
                    }}
                  >
                    {data.cast.map((member: any) => (
                      <CastCard key={member.id} member={member} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab: Episode Heatmap */}
          {activeTab === "heatmap" && isTV && (
            <div style={{ animation: "fadeIn 0.3s ease" }}>
              <p
                style={{
                  fontFamily: SANS,
                  fontSize: "13px",
                  color: "#504E4A",
                  marginBottom: "20px",
                  lineHeight: 1.6,
                }}
              >
                Each cell is one episode. Color indicates rating — from crimson
                (low) to gold (exceptional). Hover any cell for details.
              </p>
              <EpisodeHeatmapSection tmdbId={tmdbId} />
            </div>
          )}

          {/* Tab: Reviews */}
          {activeTab === "reviews" && (
            <div style={{ animation: "fadeIn 0.3s ease" }}>
              <CommunityReviews
                tmdbId={tmdbId}
                mediaType={mediaType}
                titleName={data.title}
              />
            </div>
          )}

          {/* Similar titles */}
          {similar.length > 0 && activeTab === "info" && (
            <div style={{ marginTop: "32px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "16px",
                }}
              >
                <Layers size={14} color="#504E4A" />
                <p
                  style={{
                    fontFamily: SANS,
                    fontSize: "10px",
                    color: "#504E4A",
                    textTransform: "uppercase",
                    letterSpacing: "0.15em",
                  }}
                >
                  More like this
                </p>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  overflowX: "auto",
                  paddingBottom: "8px",
                  scrollbarWidth: "none",
                }}
              >
                {similar.map((item: any) => (
                  <Link
                    key={item.id}
                    href={`/title/${item.type === "series" ? "tv" : "movie"}/${item.id}`}
                    style={{
                      flexShrink: 0,
                      width: "96px",
                      textDecoration: "none",
                    }}
                  >
                    <div
                      className="film-card"
                      style={{
                        width: "96px",
                        height: "144px",
                        borderRadius: "4px",
                        overflow: "hidden",
                        background: "#1A1A1A",
                        position: "relative",
                        marginBottom: "6px",
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
                          <Film size={20} color="#504E4A" />
                        </div>
                      )}
                      <div
                        className="card-overlay"
                        style={{
                          position: "absolute",
                          inset: 0,
                          background:
                            "linear-gradient(to top, rgba(13,13,13,0.9) 0%, transparent 60%)",
                        }}
                      />
                      <div
                        className="card-overlay"
                        style={{
                          position: "absolute",
                          bottom: "5px",
                          left: "5px",
                          right: "5px",
                        }}
                      >
                        <span
                          style={{
                            fontFamily: MONO,
                            fontSize: "9px",
                            color: "#C8A96E",
                          }}
                        >
                          ★ {toFive(item.tmdb_rating || 0)}
                        </span>
                      </div>
                    </div>
                    <p
                      style={{
                        fontFamily: SANS,
                        fontSize: "11px",
                        color: "#8A8780",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.title}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT SIDEBAR ── */}
        <div style={{ paddingTop: "16px" }}>
          {/* Poster */}
          <div
            style={{
              borderRadius: "8px",
              overflow: "hidden",
              boxShadow: "0 16px 48px rgba(0,0,0,0.7)",
              border: "1px solid rgba(255,255,255,0.06)",
              marginBottom: "20px",
            }}
          >
            {data.poster_url ? (
              <img
                src={data.poster_url}
                alt={data.title}
                style={{ width: "100%", display: "block" }}
                className="poster-reveal"
              />
            ) : (
              <div
                style={{
                  aspectRatio: "2/3",
                  background: "#141414",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {isTV ? (
                  <Tv size={40} color="#2A2A2A" />
                ) : (
                  <Film size={40} color="#2A2A2A" />
                )}
              </div>
            )}
          </div>

          {/* Rating breakdown */}
          <div
            style={{
              background: "#141414",
              border: "1px solid #2A2A2A",
              borderRadius: "10px",
              padding: "16px",
              marginBottom: "14px",
            }}
          >
            <p
              style={{
                fontFamily: SANS,
                fontSize: "10px",
                color: "#504E4A",
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                marginBottom: "10px",
              }}
            >
              Rating
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "8px",
              }}
            >
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: "32px",
                  fontWeight: 500,
                  color: "#C8A96E",
                  lineHeight: 1,
                }}
              >
                {rating5}
              </span>
              <div>
                <StarDisplay rating={rating5} size={13} />
                <p
                  style={{
                    fontFamily: SANS,
                    fontSize: "10px",
                    color: "#504E4A",
                    marginTop: "2px",
                  }}
                >
                  out of 5
                </p>
              </div>
            </div>
            <p
              style={{
                fontFamily: SANS,
                fontSize: "11px",
                color: "#504E4A",
              }}
            >
              Based on {data.vote_count?.toLocaleString() || 0} TMDB votes
            </p>
            {userRating > 0 && (
              <div
                style={{
                  marginTop: "10px",
                  paddingTop: "10px",
                  borderTop: "1px solid #1A1A1A",
                }}
              >
                <p
                  style={{
                    fontFamily: SANS,
                    fontSize: "10px",
                    color: "#504E4A",
                    marginBottom: "4px",
                  }}
                >
                  Your rating
                </p>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <StarDisplay rating={userRating} size={12} />
                  <span
                    style={{
                      fontFamily: MONO,
                      fontSize: "12px",
                      color: "#C8A96E",
                    }}
                  >
                    {userRating}/5
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Quick facts */}
          <div
            style={{
              background: "#141414",
              border: "1px solid #2A2A2A",
              borderRadius: "10px",
              padding: "16px",
              marginBottom: "14px",
            }}
          >
            <p
              style={{
                fontFamily: SANS,
                fontSize: "10px",
                color: "#504E4A",
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                marginBottom: "12px",
              }}
            >
              Info
            </p>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              {[
                { label: "Year", val: data.year || "—" },
                ...(data.runtime
                  ? [{ label: "Runtime", val: formatRuntime(data.runtime) }]
                  : []),
                ...(isTV && data.seasons
                  ? [
                      { label: "Seasons", val: String(data.seasons) },
                      { label: "Episodes", val: String(data.episodes) },
                    ]
                  : []),
                ...(data.status ? [{ label: "Status", val: data.status }] : []),
                ...(data.original_language
                  ? [
                      {
                        label: "Language",
                        val: data.original_language.toUpperCase(),
                      },
                    ]
                  : []),
              ].map(({ label, val }) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontFamily: SANS,
                      fontSize: "11px",
                      color: "#504E4A",
                    }}
                  >
                    {label}
                  </span>
                  <span
                    style={{
                      fontFamily: MONO,
                      fontSize: "11px",
                      color: "#8A8780",
                    }}
                  >
                    {val}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* IMDB link */}
          {data.imdb_id && (
            <a
              href={`https://www.imdb.com/title/${data.imdb_id}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                padding: "9px",
                borderRadius: "8px",
                background: "transparent",
                border: "1px solid #2A2A2A",
                color: "#504E4A",
                fontFamily: SANS,
                fontSize: "12px",
                textDecoration: "none",
                marginBottom: "8px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#3A3A3A";
                e.currentTarget.style.color = "#8A8780";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#2A2A2A";
                e.currentTarget.style.color = "#504E4A";
              }}
            >
              <Award size={12} />
              View on IMDB
            </a>
          )}

          {/* TV heatmap shortcut */}
          {isTV && (
            <button
              onClick={() => setActiveTab("heatmap")}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                padding: "9px",
                borderRadius: "8px",
                background: "transparent",
                border: "1px solid #2A2A2A",
                color: "#504E4A",
                fontFamily: SANS,
                fontSize: "12px",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(200,169,110,0.3)";
                e.currentTarget.style.color = "#C8A96E";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#2A2A2A";
                e.currentTarget.style.color = "#504E4A";
              }}
            >
              <Hash size={12} />
              View episode heatmap
            </button>
          )}
        </div>
      </div>

      {/* Log Sheet */}
      {logOpen && (
        <LogSheet
          title={data.title}
          tmdbId={tmdbId}
          type={data.type}
          posterUrl={data.poster_url}
          year={data.year}
          tmdbRating={data.tmdb_rating}
          genres={data.genres}
          director={data.director}
          onClose={() => setLogOpen(false)}
          onLogged={() => setLogged(true)}
        />
      )}

      <style>{`
        @media (max-width: 700px) {
          .title-grid {
            grid-template-columns: 1fr !important;
          }
          .title-grid > div:last-child {
            order: -1;
            display: flex;
            gap: 16px;
            align-items: flex-start;
          }
          .title-grid > div:last-child > div:first-child {
            width: 120px !important;
            flex-shrink: 0;
          }
          .title-grid > div:last-child > div:not(:first-child) {
            flex: 1;
          }
        }
        @media (min-width: 700px) {
          .hero-poster {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
}
