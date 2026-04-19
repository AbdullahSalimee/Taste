"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Film,
  Tv,
  Star,
  TrendingUp,
  User,
  Layers,
  Play,
  Bookmark,
  BookmarkPlus,
  Sparkles,
  ChevronRight,
  Clock,
  Eye,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useLogs, useWatchlist, useStats, useTrending } from "@/lib/hooks";
import { removeLog, removeFromWatchlist } from "@/lib/store";

const SERIF = "Playfair Display, Georgia, serif";
const SANS = "Inter, system-ui, sans-serif";
const MONO = "JetBrains Mono, Courier New, monospace";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toFive(r: number) {
  return Math.round((r / 2) * 2) / 2;
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <span style={{ color: "#C8A96E", fontSize: "11px", letterSpacing: "1px" }}>
      {[1, 2, 3, 4, 5]
        .map((s) => (rating >= s ? "★" : rating >= s - 0.5 ? "⯨" : "☆"))
        .join("")}
    </span>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
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
      {children}
    </p>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  val,
  label,
  sub,
  accent,
}: {
  val: string | number;
  label: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div
      style={{
        background: "#141414",
        border: `1px solid ${accent ? "rgba(200,169,110,0.25)" : "#1A1A1A"}`,
        borderRadius: "10px",
        padding: "16px 14px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {accent && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "2px",
            background:
              "linear-gradient(90deg, transparent, rgba(200,169,110,0.6), transparent)",
          }}
        />
      )}
      <p
        style={{
          fontFamily: SANS,
          fontSize: "10px",
          color: "#504E4A",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          marginBottom: "8px",
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontFamily: MONO,
          color: accent ? "#C8A96E" : "#F0EDE8",
          fontSize: "26px",
          fontWeight: 500,
          lineHeight: 1,
        }}
      >
        {val}
      </p>
      {sub && (
        <p
          style={{
            fontFamily: SANS,
            color: "#504E4A",
            fontSize: "10px",
            marginTop: "5px",
          }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

// ─── Continue Watching Card ───────────────────────────────────────────────────

function ContinueCard({ log }: { log: any }) {
  const router = useRouter();
  const mt = log.media_type === "tv" || log.type === "series" ? "tv" : "movie";
  const progress =
    log.episode_progress != null
      ? Math.min(
          100,
          Math.round((log.episode_progress / (log.total_episodes || 1)) * 100),
        )
      : null;

  return (
    <div
      onClick={() => router.push(`/title/${mt}/${log.tmdb_id}`)}
      style={{
        flexShrink: 0,
        width: "120px",
        cursor: "pointer",
      }}
    >
      <div
        style={{
          width: "120px",
          height: "68px",
          borderRadius: "6px",
          overflow: "hidden",
          background: "#1A1A1A",
          position: "relative",
          marginBottom: "7px",
          border: "1px solid #2A2A2A",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor =
            "rgba(200,169,110,0.5)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = "#2A2A2A";
        }}
      >
        {log.poster_url ? (
          <img
            src={log.poster_url}
            alt={log.title}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
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
            {mt === "tv" ? (
              <Tv size={20} color="#2A2A2A" />
            ) : (
              <Film size={20} color="#2A2A2A" />
            )}
          </div>
        )}

        {/* Play overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: 0,
            transition: "opacity 0.15s",
          }}
          className="continue-overlay"
        >
          <Play size={20} color="#C8A96E" fill="#C8A96E" />
        </div>

        {/* Progress bar */}
        {progress !== null && (
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "3px",
              background: "rgba(0,0,0,0.5)",
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                background: "#C8A96E",
                borderRadius: "1px",
              }}
            />
          </div>
        )}

        {/* Status pill */}
        {mt === "tv" && log.next_episode && (
          <div
            style={{
              position: "absolute",
              top: "4px",
              left: "4px",
              background: "rgba(13,13,13,0.85)",
              borderRadius: "4px",
              padding: "2px 5px",
              fontFamily: MONO,
              fontSize: "9px",
              color: "#C8A96E",
            }}
          >
            {log.next_episode}
          </div>
        )}
      </div>

      <p
        style={{
          fontFamily: SANS,
          fontSize: "11px",
          color: "#8A8780",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          lineHeight: 1.3,
        }}
      >
        {log.title}
      </p>
      {log.status === "watching" && (
        <p
          style={{
            fontFamily: MONO,
            fontSize: "9px",
            color: "#504E4A",
            marginTop: "2px",
          }}
        >
          {log.current_episode
            ? `S${String(log.current_season ?? 1).padStart(2, "0")}E${String(
                log.current_episode,
              ).padStart(2, "0")}`
            : "In progress"}
        </p>
      )}
    </div>
  );
}

// ─── Feed Item ────────────────────────────────────────────────────────────────

function FeedItem({ log, onRemove }: { log: any; onRemove: () => void }) {
  const router = useRouter();
  const mt = log.media_type === "tv" || log.type === "series" ? "tv" : "movie";
  const [hovered, setHovered] = useState(false);

  const statusLabel: Record<string, { label: string; color: string }> = {
    watching: { label: "Watching", color: "#C87C2A" },
    completed: { label: "Completed", color: "#4A9E6B" },
    dropped: { label: "Dropped", color: "#8A2A2A" },
    on_hold: { label: "On Hold", color: "#5C4A8A" },
    plan_to_watch: { label: "Planned", color: "#2A5C8A" },
  };

  const status = log.status ? statusLabel[log.status] : null;

  return (
    <div
      className="feed-item"
      style={{
        display: "flex",
        gap: "12px",
        padding: "14px 0",
        borderBottom: "1px solid #1A1A1A",
        alignItems: "flex-start",
        position: "relative",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Poster */}
      <div
        onClick={() => router.push(`/title/${mt}/${log.tmdb_id}`)}
        style={{
          flexShrink: 0,
          width: "44px",
          height: "66px",
          borderRadius: "4px",
          overflow: "hidden",
          background: "#1A1A1A",
          cursor: "pointer",
          border: "1px solid #2A2A2A",
          transition: "border-color 0.15s",
        }}
      >
        {log.poster_url ? (
          <img
            src={log.poster_url}
            alt={log.title}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
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
            <Film size={14} color="#2A2A2A" />
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "8px",
            flexWrap: "wrap",
            marginBottom: "4px",
          }}
        >
          <span
            onClick={() => router.push(`/title/${mt}/${log.tmdb_id}`)}
            style={{
              fontFamily: SANS,
              fontSize: "14px",
              fontWeight: 500,
              color: "#F0EDE8",
              cursor: "pointer",
              lineHeight: 1.3,
            }}
            onMouseEnter={(e) =>
              ((e.target as HTMLElement).style.color = "#C8A96E")
            }
            onMouseLeave={(e) =>
              ((e.target as HTMLElement).style.color = "#F0EDE8")
            }
          >
            {log.title}
          </span>
          {log.year && (
            <span
              style={{
                fontFamily: MONO,
                fontSize: "10px",
                color: "#504E4A",
                paddingTop: "2px",
              }}
            >
              {log.year}
            </span>
          )}
          {status && (
            <span
              style={{
                fontFamily: SANS,
                fontSize: "10px",
                color: status.color,
                background: `${status.color}18`,
                padding: "1px 6px",
                borderRadius: "3px",
              }}
            >
              {status.label}
            </span>
          )}
        </div>

        {log.rating != null && log.rating > 0 && (
          <div style={{ marginBottom: "5px" }}>
            <StarDisplay rating={toFive(log.rating)} />
          </div>
        )}

        {log.note && (
          <p
            style={{
              fontFamily: SANS,
              fontSize: "12px",
              color: "#8A8780",
              fontStyle: "italic",
              lineHeight: 1.5,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              marginBottom: "4px",
            }}
          >
            "{log.note}"
          </p>
        )}

        {log.episode_title && (
          <p style={{ fontFamily: MONO, fontSize: "10px", color: "#504E4A" }}>
            {log.season_number
              ? `S${String(log.season_number).padStart(2, "0")}E${String(
                  log.episode_number ?? 1,
                ).padStart(2, "0")} · `
              : ""}
            {log.episode_title}
          </p>
        )}

        <p
          style={{
            fontFamily: SANS,
            fontSize: "10px",
            color: "#504E4A",
            marginTop: "4px",
          }}
        >
          {log.watched_at
            ? new Date(log.watched_at).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            : ""}
          {log.is_rewatch && (
            <span style={{ marginLeft: "6px", color: "#5C4A8A" }}>
              ↩ rewatch
            </span>
          )}
        </p>
      </div>

      {/* Delete */}
      {hovered && (
        <button
          onClick={onRemove}
          style={{
            position: "absolute",
            top: "14px",
            right: 0,
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#504E4A",
            padding: "2px",
            lineHeight: 1,
            fontSize: "14px",
          }}
          title="Remove log"
        >
          ×
        </button>
      )}
    </div>
  );
}

// ─── Watchlist Row ────────────────────────────────────────────────────────────

function WatchlistRow({ item, onRemove }: { item: any; onRemove: () => void }) {
  const router = useRouter();
  const mt =
    item.media_type === "tv" || item.type === "series" ? "tv" : "movie";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "8px 10px",
        borderRadius: "8px",
        background: "#141414",
        border: "1px solid #1A1A1A",
        cursor: "pointer",
        transition: "border-color 0.15s",
      }}
      onClick={() => router.push(`/title/${mt}/${item.tmdb_id}`)}
      onMouseEnter={(e) =>
        ((e.currentTarget as HTMLElement).style.borderColor = "#2A2A2A")
      }
      onMouseLeave={(e) =>
        ((e.currentTarget as HTMLElement).style.borderColor = "#1A1A1A")
      }
    >
      <div
        style={{
          width: "28px",
          height: "42px",
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
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
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
            <Film size={10} color="#2A2A2A" />
          </div>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontFamily: SANS,
            fontSize: "12px",
            color: "#F0EDE8",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {item.title}
        </p>
        {item.year && (
          <p
            style={{
              fontFamily: MONO,
              fontSize: "9px",
              color: "#504E4A",
              marginTop: "1px",
            }}
          >
            {item.year}
          </p>
        )}
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "#504E4A",
          padding: "2px",
          fontSize: "14px",
          lineHeight: 1,
          flexShrink: 0,
        }}
        title="Remove from watchlist"
      >
        ×
      </button>
    </div>
  );
}

// ─── Poster Strip ─────────────────────────────────────────────────────────────

function PosterStrip({ items, label }: { items: any[]; label: string }) {
  const router = useRouter();
  if (!items.length) return null;

  return (
    <div style={{ marginBottom: "28px" }}>
      <SectionLabel>{label}</SectionLabel>
      <div
        style={{
          display: "flex",
          gap: "8px",
          overflowX: "auto",
          paddingBottom: "6px",
          scrollbarWidth: "none",
        }}
      >
        {items.map((item: any) => {
          const mt =
            (item.media_type || (item.type === "series" ? "tv" : "movie")) ===
            "tv"
              ? "tv"
              : "movie";
          return (
            <div
              key={`${mt}-${item.id || item.tmdb_id}`}
              onClick={() =>
                router.push(`/title/${mt}/${item.id || item.tmdb_id}`)
              }
              style={{ flexShrink: 0, width: "72px", cursor: "pointer" }}
            >
              <div
                style={{
                  width: "72px",
                  height: "108px",
                  borderRadius: "5px",
                  overflow: "hidden",
                  background: "#1A1A1A",
                  marginBottom: "5px",
                  border: "1px solid #2A2A2A",
                  transition: "border-color 0.15s",
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLElement).style.borderColor =
                    "rgba(200,169,110,0.4)")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLElement).style.borderColor =
                    "#2A2A2A")
                }
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
                    <Film size={14} color="#2A2A2A" />
                  </div>
                )}
              </div>
              <p
                style={{
                  fontFamily: SANS,
                  fontSize: "10px",
                  color: "#8A8780",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {item.title}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Insight Card ─────────────────────────────────────────────────────────────

function InsightCard({ stats }: { stats: any }) {
  const insights: string[] = [];

  if (stats.total_films > 0) {
    insights.push(
      `You've logged <strong>${stats.total_films} film${stats.total_films !== 1 ? "s" : ""}</strong> — that's <strong>${stats.total_hours}h</strong> of cinema.`,
    );
  }
  if (stats.avg_rating > 0) {
    const sentiment =
      stats.avg_rating >= 4
        ? "You rate generously — you love what you watch."
        : stats.avg_rating <= 2.5
          ? "You're a tough critic. That's a badge of honour."
          : "You hold films to a fair standard.";
    insights.push(sentiment);
  }
  if (stats.top_genres.length > 0) {
    insights.push(
      `Your most-watched genre is <strong>${stats.top_genres[0].name}</strong> — but is it your favourite, or just a habit?`,
    );
  }

  if (!insights.length) return null;

  return (
    <div
      style={{
        background: "#141414",
        border: "1px solid #1A1A1A",
        borderLeft: "3px solid rgba(200,169,110,0.5)",
        borderRadius: "0 8px 8px 0",
        padding: "14px 16px",
        marginBottom: "20px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          marginBottom: "10px",
        }}
      >
        <Sparkles size={12} color="#C8A96E" />
        <span
          style={{
            fontFamily: SANS,
            fontSize: "10px",
            color: "#504E4A",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          Taste insight
        </span>
      </div>
      {insights.slice(0, 2).map((text, i) => (
        <p
          key={i}
          style={{
            fontFamily: SANS,
            fontSize: "13px",
            color: "#8A8780",
            lineHeight: 1.6,
            marginBottom: i < insights.length - 1 ? "6px" : 0,
          }}
          dangerouslySetInnerHTML={{ __html: text }}
        />
      ))}
    </div>
  );
}

// ─── Genre Bars ───────────────────────────────────────────────────────────────

const GENRE_COLORS: Record<string, string> = {
  Drama: "#5C4A8A",
  Thriller: "#8A2A2A",
  Documentary: "#2A5C8A",
  "Sci-Fi": "#2A6A5C",
  Comedy: "#8A7A2A",
  Romance: "#8A2A5C",
  Horror: "#6A2A2A",
  Animation: "#2A6A8A",
  Action: "#7A4A2A",
  Crime: "#5A3A5A",
};

function GenreBars({ genres }: { genres: any[] }) {
  if (!genres.length) return null;
  const max = genres[0].count;

  return (
    <div>
      <SectionLabel>Top genres</SectionLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {genres.slice(0, 5).map((g: any) => (
          <div
            key={g.name}
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
          >
            <span
              style={{
                fontFamily: SANS,
                fontSize: "12px",
                color: "#8A8780",
                width: "72px",
                flexShrink: 0,
              }}
            >
              {g.name}
            </span>
            <div
              style={{
                flex: 1,
                height: "3px",
                background: "#1A1A1A",
                borderRadius: "2px",
                overflow: "hidden",
              }}
            >
              <div
                className="decade-bar"
                style={
                  {
                    height: "100%",
                    width: `${Math.round((g.count / max) * 100)}%`,
                    background: GENRE_COLORS[g.name] || "#C8A96E",
                    borderRadius: "2px",
                  } as React.CSSProperties
                }
              />
            </div>
            <span
              style={{
                fontFamily: MONO,
                fontSize: "10px",
                color: "#504E4A",
                width: "24px",
                textAlign: "right",
              }}
            >
              {g.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Guest Dashboard ──────────────────────────────────────────────────────────

function GuestDashboard() {
  return (
    <div
      style={{
        maxWidth: "480px",
        margin: "100px auto",
        padding: "0 24px",
        textAlign: "center",
      }}
    >
      <h1
        style={{
          fontFamily: SERIF,
          fontSize: "32px",
          fontWeight: 700,
          color: "#F0EDE8",
          fontStyle: "italic",
          marginBottom: "12px",
        }}
      >
        Your cinematic life, in one place.
      </h1>
      <p
        style={{
          fontFamily: SANS,
          fontSize: "14px",
          color: "#8A8780",
          marginBottom: "28px",
          lineHeight: 1.6,
        }}
      >
        Track every film. Every episode. Discover your taste DNA.
      </p>
      <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
        <Link
          href="/auth"
          style={{
            padding: "10px 22px",
            borderRadius: "8px",
            background: "#C8A96E",
            color: "#0D0D0D",
            fontFamily: SANS,
            fontSize: "13px",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Get started
        </Link>
        <Link
          href="/discover"
          style={{
            padding: "10px 22px",
            borderRadius: "8px",
            border: "1px solid #2A2A2A",
            color: "#8A8780",
            fontFamily: SANS,
            fontSize: "13px",
            textDecoration: "none",
          }}
        >
          Browse titles
        </Link>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [filter, setFilter] = useState<
    "All" | "Films" | "TV" | "Watching" | "Reviews"
  >("All");
  const [showAllWatchlist, setShowAllWatchlist] = useState(false);
  const logs = useLogs();
  const watchlist = useWatchlist();
  const stats = useStats();
  const { data: trending } = useTrending("all");
  const [greeting, setGreeting] = useState("Good evening");

  useEffect(() => {
    const h = new Date().getHours();
    if (h < 12) setGreeting("Good morning");
    else if (h < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  if (authLoading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            className="skeleton"
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "8px",
              margin: "0 auto 12px",
            }}
          />
          <p style={{ fontFamily: SANS, fontSize: "12px", color: "#504E4A" }}>
            Loading…
          </p>
        </div>
      </div>
    );
  }

  if (!user) return <GuestDashboard />;

  const displayName =
    user.user_metadata?.username || user.email?.split("@")[0] || "there";

  const filteredLogs = logs.filter((l) => {
    if (filter === "Films")
      return l.type === "film" || l.media_type === "movie";
    if (filter === "TV") return l.type === "series" || l.media_type === "tv";
    if (filter === "Watching") return l.status === "watching";
    if (filter === "Reviews") return !!l.note;
    return true;
  });

  const currentlyWatching = logs
    .filter((l) => l.status === "watching")
    .slice(0, 8);
  const recentWatchlist = showAllWatchlist ? watchlist : watchlist.slice(0, 6);
  const trendingMovies = trending?.trending_movies?.slice(0, 12) || [];
  const trendingTV = trending?.trending_tv?.slice(0, 12) || [];

  return (
    <div
      style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 24px 80px" }}
    >
      {/* ── Header ── */}
      <div
        style={{
          padding: "32px 0 28px",
          borderBottom: "1px solid #1A1A1A",
          marginBottom: "28px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: SERIF,
                fontSize: "30px",
                fontWeight: 700,
                color: "#F0EDE8",
                fontStyle: "italic",
                lineHeight: 1.2,
              }}
            >
              {greeting}, {displayName}.
            </h1>
            <p
              style={{
                fontFamily: SANS,
                fontSize: "12px",
                color: "#504E4A",
                marginTop: "5px",
              }}
            >
              {stats.total_films > 0 || stats.total_series > 0
                ? `${stats.total_films} films · ${stats.total_series} series · ${stats.total_hours}h watched`
                : "Start logging what you watch"}
            </p>
          </div>

          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <Link
              href="/logbook"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "8px",
                border: "1px solid #2A2A2A",
                color: "#8A8780",
                fontFamily: SANS,
                fontSize: "12px",
                textDecoration: "none",
                transition: "color 0.15s, border-color 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = "#F0EDE8";
                (e.currentTarget as HTMLElement).style.borderColor = "#3A3A3A";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = "#8A8780";
                (e.currentTarget as HTMLElement).style.borderColor = "#2A2A2A";
              }}
            >
              <Eye size={13} /> Logbook
            </Link>
            <Link
              href="/profile"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "8px",
                border: "1px solid #2A2A2A",
                color: "#8A8780",
                fontFamily: SANS,
                fontSize: "12px",
                textDecoration: "none",
                transition: "color 0.15s, border-color 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = "#F0EDE8";
                (e.currentTarget as HTMLElement).style.borderColor = "#3A3A3A";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = "#8A8780";
                (e.currentTarget as HTMLElement).style.borderColor = "#2A2A2A";
              }}
            >
              <User size={13} /> Profile
            </Link>
          </div>
        </div>
      </div>

      {/* ── Stats Row ── */}
      {(stats.total_films > 0 || stats.total_series > 0) && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "10px",
            marginBottom: "28px",
          }}
          className="stats-row"
        >
          <StatCard val={stats.total_films} label="Films" accent />
          <StatCard val={stats.total_series} label="Series" accent />
          <StatCard
            val={`${stats.total_hours}h`}
            label="Watched"
            sub="across all time"
          />
          <StatCard
            val={stats.avg_rating > 0 ? `${stats.avg_rating.toFixed(1)}★` : "—"}
            label="Avg Rating"
            sub="your critical score"
          />
        </div>
      )}

      {/* ── Continue Watching ── */}
      {currentlyWatching.length > 0 && (
        <div style={{ marginBottom: "32px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "12px",
            }}
          >
            <SectionLabel>Continue watching</SectionLabel>
            <Link
              href="/profile"
              style={{
                fontFamily: SANS,
                fontSize: "10px",
                color: "#504E4A",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: "2px",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.color = "#C8A96E")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.color = "#504E4A")
              }
            >
              All <ChevronRight size={10} />
            </Link>
          </div>
          <div
            style={{
              display: "flex",
              gap: "10px",
              overflowX: "auto",
              paddingBottom: "4px",
              scrollbarWidth: "none",
            }}
          >
            {currentlyWatching.map((log) => (
              <ContinueCard key={log.id} log={log} />
            ))}
          </div>
        </div>
      )}

      {/* ── Main two-column layout ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0,1fr) 280px",
          gap: "28px",
          alignItems: "start",
        }}
        className="dash-grid"
      >
        {/* ── LEFT: Feed ── */}
        <div style={{ minWidth: 0 }}>
          {/* Insight card */}
          {(stats.total_films > 0 || stats.total_series > 0) && (
            <InsightCard stats={stats} />
          )}

          {/* Filter bar */}
          <div
            style={{
              display: "flex",
              gap: "6px",
              marginBottom: "16px",
              flexWrap: "wrap",
            }}
          >
            {(["All", "Films", "TV", "Watching", "Reviews"] as const).map(
              (f) => {
                const active = filter === f;
                return (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    style={{
                      padding: "5px 13px",
                      borderRadius: "20px",
                      background: active ? "#C8A96E" : "transparent",
                      border: `1px solid ${active ? "#C8A96E" : "#2A2A2A"}`,
                      color: active ? "#0D0D0D" : "#8A8780",
                      fontFamily: SANS,
                      fontSize: "11px",
                      fontWeight: active ? 600 : 400,
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      if (!active) {
                        (e.currentTarget as HTMLElement).style.borderColor =
                          "#3A3A3A";
                        (e.currentTarget as HTMLElement).style.color =
                          "#F0EDE8";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        (e.currentTarget as HTMLElement).style.borderColor =
                          "#2A2A2A";
                        (e.currentTarget as HTMLElement).style.color =
                          "#8A8780";
                      }
                    }}
                  >
                    {f}
                  </button>
                );
              },
            )}
          </div>

          {/* Feed */}
          {filteredLogs.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "60px 0",
                borderTop: "1px solid #1A1A1A",
              }}
            >
              <Film
                size={28}
                color="#2A2A2A"
                style={{ margin: "0 auto 12px" }}
              />
              <p
                style={{
                  fontFamily: SERIF,
                  fontSize: "18px",
                  color: "#504E4A",
                  fontStyle: "italic",
                  marginBottom: "8px",
                }}
              >
                {filter === "All"
                  ? "Nothing logged yet."
                  : `No ${filter.toLowerCase()} logged yet.`}
              </p>
              <p
                style={{ fontFamily: SANS, fontSize: "12px", color: "#504E4A" }}
              >
                Find something to watch in{" "}
                <Link
                  href="/discover"
                  style={{ color: "#C8A96E", textDecoration: "none" }}
                >
                  Discover
                </Link>
              </p>
            </div>
          ) : (
            <div>
              {filteredLogs.map((log, i) => (
                <FeedItem
                  key={log.id}
                  log={log}
                  onRemove={() => removeLog(log.id)}
                />
              ))}

              {logs.length > 10 && (
                <div style={{ textAlign: "center", paddingTop: "20px" }}>
                  <Link
                    href="/logbook"
                    style={{
                      fontFamily: SANS,
                      fontSize: "12px",
                      color: "#504E4A",
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLElement).style.color = "#C8A96E")
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLElement).style.color = "#504E4A")
                    }
                  >
                    View full logbook <ChevronRight size={12} />
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Trending strips */}
          {(trendingMovies.length > 0 || trendingTV.length > 0) && (
            <div
              style={{
                marginTop: "40px",
                paddingTop: "28px",
                borderTop: "1px solid #1A1A1A",
              }}
            >
              <PosterStrip items={trendingMovies} label="Trending films" />
              <PosterStrip items={trendingTV} label="Trending series" />
            </div>
          )}
        </div>

        {/* ── RIGHT SIDEBAR ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Stats */}
          {(stats.total_films > 0 || stats.total_series > 0) && (
            <div>
              <GenreBars genres={stats.top_genres} />
            </div>
          )}

          {/* Watchlist */}
          {watchlist.length > 0 && (
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "12px",
                }}
              >
                <SectionLabel>Watchlist ({watchlist.length})</SectionLabel>
                {watchlist.length > 6 && (
                  <button
                    onClick={() => setShowAllWatchlist(!showAllWatchlist)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontFamily: SANS,
                      fontSize: "10px",
                      color: "#C8A96E",
                      padding: 0,
                    }}
                  >
                    {showAllWatchlist ? "Show less" : `See all`}
                  </button>
                )}
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", gap: "6px" }}
              >
                {recentWatchlist.map((item) => (
                  <WatchlistRow
                    key={item.id}
                    item={item}
                    onRemove={() => removeFromWatchlist(item.tmdb_id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Quick links */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {[
              { href: "/discover", icon: TrendingUp, label: "Discover titles" },
              { href: "/discover?sort=rating", icon: Star, label: "Top rated" },
              { href: "/profile", icon: Layers, label: "Your profile" },
            ].map(({ href, icon: Icon, label }) => (
              <Link
                key={href}
                href={href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid #1A1A1A",
                  color: "#8A8780",
                  fontFamily: SANS,
                  fontSize: "13px",
                  textDecoration: "none",
                  transition: "border-color 0.15s, color 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor =
                    "#2A2A2A";
                  (e.currentTarget as HTMLElement).style.color = "#F0EDE8";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor =
                    "#1A1A1A";
                  (e.currentTarget as HTMLElement).style.color = "#8A8780";
                }}
              >
                <Icon size={14} /> {label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 700px) {
          .dash-grid { grid-template-columns: 1fr !important; }
          .dash-grid > div:last-child { order: -1; }
          .stats-row { grid-template-columns: repeat(2, 1fr) !important; }
        }
        .continue-overlay { transition: opacity 0.15s; }
        div:hover > .continue-overlay { opacity: 1 !important; }
        @keyframes goldPulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
