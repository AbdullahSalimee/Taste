"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Film,
  Tv,
  Star,
  Clock,
  BookmarkPlus,
  PenLine,
  TrendingUp,
  Eye,
  ChevronRight,
  User,
  Layers,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useLogs, useWatchlist, useStats, useTrending } from "@/lib/hooks";
import { removeLog, removeFromWatchlist } from "@/lib/store";

const SERIF = "Playfair Display, Georgia, serif";
const SANS = "Inter, system-ui, sans-serif";
const MONO = "JetBrains Mono, Courier New, monospace";

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

function StatBox({
  val,
  label,
  accent,
}: {
  val: string | number;
  label: string;
  accent?: boolean;
}) {
  return (
    <div
      style={{
        background: "#141414",
        border: `1px solid ${accent ? "rgba(200,169,110,0.2)" : "#1A1A1A"}`,
        borderRadius: "10px",
        padding: "14px",
        textAlign: "center",
      }}
    >
      <p
        style={{
          fontFamily: MONO,
          color: accent ? "#C8A96E" : "#F0EDE8",
          fontSize: "22px",
          fontWeight: 500,
          lineHeight: 1,
        }}
      >
        {val}
      </p>
      <p
        style={{
          fontFamily: SANS,
          color: "#504E4A",
          fontSize: "10px",
          marginTop: "4px",
        }}
      >
        {label}
      </p>
    </div>
  );
}

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
          paddingBottom: "4px",
          scrollbarWidth: "none",
        }}
      >
        {items.map((item: any) => (
          <div
            key={`${item.type || item.media_type}-${item.id || item.tmdb_id}`}
            className="film-card"
            onClick={() =>
              router.push(
                `/title/${(item.media_type || (item.type === "series" ? "tv" : "movie")) === "tv" ? "tv" : "movie"}/${item.id || item.tmdb_id}`,
              )
            }
            style={{ flexShrink: 0, width: "88px", cursor: "pointer" }}
          >
            <div
              style={{
                width: "88px",
                height: "132px",
                borderRadius: "5px",
                overflow: "hidden",
                background: "#1A1A1A",
                position: "relative",
                marginBottom: "5px",
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
                  <Film size={16} color="#2A2A2A" />
                </div>
              )}
              <div
                className="card-overlay"
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(to top, rgba(13,13,13,0.8) 0%, transparent 60%)",
                }}
              />
              {(item.tmdb_rating > 0 || item.tmdb_rating_5 > 0) && (
                <div
                  className="card-overlay"
                  style={{ position: "absolute", bottom: "5px", left: "6px" }}
                >
                  <span
                    style={{
                      fontFamily: MONO,
                      fontSize: "9px",
                      color: "#C8A96E",
                    }}
                  >
                    ★ {item.tmdb_rating_5 || toFive(item.tmdb_rating)}
                  </span>
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
            <p
              style={{
                fontFamily: MONO,
                fontSize: "9px",
                color: "#504E4A",
                marginTop: "1px",
              }}
            >
              {item.year || ""}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function LogFeedItem({ log, onRemove }: { log: any; onRemove: () => void }) {
  const router = useRouter();
  const diff = Date.now() - new Date(log.watched_at).getTime();
  const hours = Math.floor(diff / 3600000);
  const timeStr =
    hours < 1
      ? "Just now"
      : hours < 24
        ? `${hours}h ago`
        : `${Math.floor(hours / 24)}d ago`;
  const mediaType =
    log.media_type === "tv" || log.type === "series" ? "tv" : "movie";

  return (
    <div
      className="feed-item"
      style={{
        border: "1px solid #1A1A1A",
        background: "#0F0F0F",
        borderRadius: "10px",
        padding: "14px",
        marginBottom: "8px",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#2A2A2A")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#1A1A1A")}
    >
      <div style={{ display: "flex", gap: "12px" }}>
        {/* Poster */}
        <div
          onClick={() => router.push(`/title/${mediaType}/${log.tmdb_id}`)}
          style={{
            flexShrink: 0,
            width: "44px",
            height: "66px",
            borderRadius: "4px",
            overflow: "hidden",
            background: "#1A1A1A",
            cursor: "pointer",
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
              {mediaType === "tv" ? (
                <Tv size={14} color="#2A2A2A" />
              ) : (
                <Film size={14} color="#2A2A2A" />
              )}
            </div>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Top row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "4px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              {/* Status badge */}
              <span
                style={{
                  fontFamily: SANS,
                  fontSize: "9px",
                  padding: "2px 6px",
                  borderRadius: "3px",
                  background:
                    log.status === "watched"
                      ? "rgba(200,169,110,0.12)"
                      : log.status === "watching"
                        ? "rgba(74,158,107,0.12)"
                        : "rgba(138,42,42,0.12)",
                  color:
                    log.status === "watched"
                      ? "#C8A96E"
                      : log.status === "watching"
                        ? "#4A9E6B"
                        : "#8A4A4A",
                  border:
                    log.status === "watched"
                      ? "1px solid rgba(200,169,110,0.2)"
                      : log.status === "watching"
                        ? "1px solid rgba(74,158,107,0.2)"
                        : "1px solid rgba(138,42,42,0.2)",
                  textTransform: "capitalize",
                }}
              >
                {log.status}
              </span>
              {mediaType === "tv" && <Tv size={9} color="#504E4A" />}
            </div>
            <span
              style={{ fontFamily: SANS, fontSize: "10px", color: "#504E4A" }}
            >
              {timeStr}
            </span>
          </div>

          {/* Title */}
          <p
            onClick={() => router.push(`/title/${mediaType}/${log.tmdb_id}`)}
            style={{
              fontFamily: SANS,
              fontSize: "13px",
              color: "#F0EDE8",
              fontWeight: 500,
              cursor: "pointer",
              marginBottom: "4px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {log.title}
            {log.year ? (
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: "10px",
                  color: "#504E4A",
                  marginLeft: "6px",
                }}
              >
                {log.year}
              </span>
            ) : null}
          </p>

          {/* Rating */}
          {log.user_rating && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                marginBottom: "4px",
              }}
            >
              <StarDisplay rating={log.user_rating} />
              <span
                style={{ fontFamily: MONO, fontSize: "10px", color: "#504E4A" }}
              >
                {log.user_rating}/5
              </span>
            </div>
          )}

          {/* Note */}
          {log.note && (
            <p
              style={
                {
                  fontFamily: SANS,
                  fontSize: "11px",
                  color: "#8A8780",
                  fontStyle: "italic",
                  lineHeight: 1.5,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                } as React.CSSProperties
              }
            >
              "{log.note}"
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginTop: "10px",
          paddingTop: "10px",
          borderTop: "1px solid #1A1A1A",
        }}
      >
        <Link
          href={`/title/${mediaType}/${log.tmdb_id}`}
          style={{
            fontFamily: SANS,
            fontSize: "11px",
            color: "#504E4A",
            textDecoration: "none",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#C8A96E")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#504E4A")}
        >
          View details
        </Link>
        <button
          onClick={onRemove}
          style={{
            marginLeft: "auto",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontFamily: SANS,
            fontSize: "11px",
            color: "#504E4A",
            padding: 0,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#8A4A4A")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#504E4A")}
        >
          Remove
        </button>
      </div>
    </div>
  );
}

function WatchlistRow({ item, onRemove }: { item: any; onRemove: () => void }) {
  const router = useRouter();
  const mediaType = item.type === "series" ? "tv" : "movie";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "10px",
        background: "#0F0F0F",
        border: "1px solid #1A1A1A",
        borderRadius: "8px",
        cursor: "pointer",
      }}
      onClick={() => router.push(`/title/${mediaType}/${item.tmdb_id}`)}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#2A2A2A")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#1A1A1A")}
    >
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
        {item.poster_url ? (
          <img
            src={item.poster_url}
            alt={item.title}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : null}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontFamily: SANS,
            fontSize: "12px",
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
            fontFamily: MONO,
            fontSize: "10px",
            color: "#504E4A",
            marginTop: "2px",
          }}
        >
          {item.year}
        </p>
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
          padding: "4px",
          flexShrink: 0,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#8A4A4A")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#504E4A")}
      >
        ✕
      </button>
    </div>
  );
}

// Guest view — shown when not signed in
function GuestDashboard() {
  const router = useRouter();
  const { data: trending } = useTrending("all");
  const trendingItems = [
    ...(trending?.trending_movies || []),
    ...(trending?.trending_tv || []),
  ].slice(0, 12);

  return (
    <div
      style={{
        maxWidth: "1100px",
        margin: "0 auto",
        padding: "32px 24px 80px",
      }}
    >
      {/* Hero CTA */}
      <div
        style={{
          textAlign: "center",
          padding: "48px 0 40px",
          borderBottom: "1px solid #1A1A1A",
          marginBottom: "32px",
        }}
      >
        <h1
          style={{
            fontFamily: SERIF,
            fontSize: "clamp(28px, 5vw, 48px)",
            fontWeight: 700,
            color: "#F0EDE8",
            fontStyle: "italic",
            lineHeight: 1.1,
            marginBottom: "12px",
          }}
        >
          Track everything you watch.
          <br />
          <span className="archetype-shimmer">Know your taste.</span>
        </h1>
        <p
          style={{
            fontFamily: SANS,
            fontSize: "15px",
            color: "#8A8780",
            marginBottom: "28px",
            maxWidth: "480px",
            margin: "0 auto 28px",
          }}
        >
          Log films and series, rate them out of 5, see your cinematic identity
          emerge over time.
        </p>
        <div
          style={{
            display: "flex",
            gap: "10px",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={() => router.push("/auth")}
            style={{
              padding: "12px 28px",
              borderRadius: "8px",
              background: "#C8A96E",
              color: "#0D0D0D",
              fontFamily: SANS,
              fontSize: "14px",
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
            }}
          >
            Get started free
          </button>
          <button
            onClick={() => router.push("/discover")}
            style={{
              padding: "12px 28px",
              borderRadius: "8px",
              background: "transparent",
              border: "1px solid #2A2A2A",
              color: "#8A8780",
              fontFamily: SANS,
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            Browse titles
          </button>
        </div>
      </div>

      {/* Trending preview */}
      {trendingItems.length > 0 && (
        <div>
          <SectionLabel>Trending this week</SectionLabel>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(88px, 1fr))",
              gap: "10px",
            }}
          >
            {trendingItems.map((item: any) => (
              <div
                key={`${item.type}-${item.id}`}
                className="film-card"
                onClick={() =>
                  router.push(
                    `/title/${item.type === "series" ? "tv" : "movie"}/${item.id}`,
                  )
                }
                style={{ cursor: "pointer" }}
              >
                <div
                  style={{
                    aspectRatio: "2/3",
                    borderRadius: "5px",
                    overflow: "hidden",
                    background: "#1A1A1A",
                    marginBottom: "5px",
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
                      <Film size={16} color="#2A2A2A" />
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
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Main authenticated dashboard
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
    .slice(0, 6);
  const recentWatchlist = showAllWatchlist ? watchlist : watchlist.slice(0, 6);
  const trendingMovies = trending?.trending_movies?.slice(0, 10) || [];
  const trendingTV = trending?.trending_tv?.slice(0, 10) || [];

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 24px" }}>
      {/* ── Header ── */}
      <div
        style={{
          padding: "24px 0 20px",
          borderBottom: "1px solid #1A1A1A",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: SERIF,
                fontSize: "24px",
                fontWeight: 700,
                color: "#F0EDE8",
                fontStyle: "italic",
              }}
            >
              {greeting}, {displayName}.
            </h1>
            <p
              style={{
                fontFamily: SANS,
                fontSize: "12px",
                color: "#504E4A",
                marginTop: "3px",
              }}
            >
              {stats.total_films > 0 || stats.total_series > 0
                ? `${stats.total_films} films · ${stats.total_series} series · ${stats.total_hours}h watched`
                : "Start logging what you watch"}
            </p>
          </div>
          <Link
            href="/profile"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              padding: "8px 14px",
              borderRadius: "8px",
              border: "1px solid #2A2A2A",
              color: "#8A8780",
              fontFamily: SANS,
              fontSize: "12px",
              textDecoration: "none",
            }}
          >
            <User size={13} /> Profile
          </Link>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0,1fr) 280px",
          gap: "28px",
          alignItems: "start",
        }}
        className="dash-grid"
      >
        {/* ── LEFT COLUMN ── */}
        <div style={{ minWidth: 0 }}>
          {/* Currently watching */}
          {currentlyWatching.length > 0 && (
            <div style={{ marginBottom: "28px" }}>
              <SectionLabel>Continue watching</SectionLabel>
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  overflowX: "auto",
                  paddingBottom: "4px",
                  scrollbarWidth: "none",
                }}
              >
                {currentlyWatching.map((log) => {
                  const mt =
                    log.media_type === "tv" || log.type === "series"
                      ? "tv"
                      : "movie";
                  return (
                    <div
                      key={log.id}
                      className="film-card"
                      onClick={() => router.push(`/title/${mt}/${log.tmdb_id}`)}
                      style={{
                        flexShrink: 0,
                        width: "88px",
                        cursor: "pointer",
                      }}
                    >
                      <div
                        style={{
                          width: "88px",
                          height: "132px",
                          borderRadius: "5px",
                          overflow: "hidden",
                          background: "#1A1A1A",
                          position: "relative",
                          marginBottom: "5px",
                        }}
                      >
                        {log.poster_url ? (
                          <img
                            src={log.poster_url}
                            alt={log.title}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        ) : null}
                        <div
                          style={{
                            position: "absolute",
                            top: "5px",
                            left: "5px",
                            width: "18px",
                            height: "18px",
                            borderRadius: "3px",
                            background: "rgba(74,158,107,0.9)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Eye size={10} color="#fff" />
                        </div>
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
                        {log.title}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Activity feed */}
          <div>
            {/* Filter tabs */}
            <div
              style={{
                display: "flex",
                gap: "6px",
                marginBottom: "16px",
                overflowX: "auto",
                scrollbarWidth: "none",
              }}
            >
              {(["All", "Films", "TV", "Watching", "Reviews"] as const).map(
                (f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    style={{
                      padding: "6px 14px",
                      borderRadius: "20px",
                      flexShrink: 0,
                      fontFamily: SANS,
                      fontSize: "12px",
                      cursor: "pointer",
                      border:
                        f === filter
                          ? "1px solid rgba(200,169,110,0.4)"
                          : "1px solid #2A2A2A",
                      background:
                        f === filter ? "rgba(200,169,110,0.1)" : "transparent",
                      color: f === filter ? "#C8A96E" : "#504E4A",
                    }}
                  >
                    {f}
                  </button>
                ),
              )}
            </div>

            {filteredLogs.length > 0 ? (
              filteredLogs
                .slice(0, 30)
                .map((log) => (
                  <LogFeedItem
                    key={log.id}
                    log={log}
                    onRemove={() => removeLog(log.id)}
                  />
                ))
            ) : (
              <div
                style={{
                  border: "1px dashed #1A1A1A",
                  borderRadius: "12px",
                  padding: "48px 24px",
                  textAlign: "center",
                }}
              >
                <PenLine
                  size={24}
                  color="#2A2A2A"
                  style={{ margin: "0 auto 12px", display: "block" }}
                />
                <p
                  style={{
                    fontFamily: SERIF,
                    fontSize: "17px",
                    color: "#2A2A2A",
                    fontStyle: "italic",
                    marginBottom: "6px",
                  }}
                >
                  {filter === "All"
                    ? "Nothing logged yet."
                    : `No ${filter.toLowerCase()} logged yet.`}
                </p>
                <p
                  style={{
                    fontFamily: SANS,
                    fontSize: "12px",
                    color: "#504E4A",
                  }}
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
            )}
          </div>

          {/* Trending strip */}
          <div style={{ marginTop: "32px" }}>
            <PosterStrip items={trendingMovies} label="Trending films" />
            <PosterStrip items={trendingTV} label="Trending series" />
          </div>
        </div>

        {/* ── RIGHT SIDEBAR ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Stats */}
          <div>
            <SectionLabel>Your stats</SectionLabel>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "8px",
              }}
            >
              <StatBox val={stats.total_films} label="Films" accent />
              <StatBox val={stats.total_series} label="Series" accent />
              <StatBox val={`${stats.total_hours}h`} label="Watched" />
              <StatBox
                val={stats.avg_rating > 0 ? stats.avg_rating.toFixed(1) : "—"}
                label="Avg rating"
              />
            </div>
          </div>

          {/* Top genres */}
          {stats.top_genres.length > 0 && (
            <div>
              <SectionLabel>Your top genres</SectionLabel>
              <div
                style={{ display: "flex", flexDirection: "column", gap: "6px" }}
              >
                {stats.top_genres.slice(0, 5).map((g: any) => (
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
                        fontSize: "12px",
                        color: "#8A8780",
                        width: "70px",
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
                            background: "#C8A96E",
                            width: `${g.pct}%`,
                          } as React.CSSProperties
                        }
                      />
                    </div>
                    <span
                      style={{
                        fontFamily: MONO,
                        fontSize: "10px",
                        color: "#504E4A",
                        width: "28px",
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
                      marginBottom: "12px",
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
        }
      `}</style>
    </div>
  );
}
