"use client";
import { useState, useEffect } from "react";
import {
  Heart,
  MessageCircle,
  Bookmark,
  Film,
  Tv,
  Plus,
  Star,
} from "lucide-react";
import { useLogs, useWatchlist, useStats, useTrending } from "@/lib/hooks";
import { removeLog } from "@/lib/store";
import { StarRating } from "@/components/ui/StarRating";
import { TasteDNACard } from "@/components/features/TasteDNACard";

const SANS = "Inter, system-ui, sans-serif";
const SERIF = "Playfair Display, Georgia, serif";
const MONO = "JetBrains Mono, Courier New, monospace";

const FILTERS = ["All", "Films", "TV", "Reviews"] as const;

function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const colors = [
    "#5C4A8A",
    "#8A2A2A",
    "#2A5C8A",
    "#2A6A5C",
    "#8A7A2A",
    "#8A2A5C",
  ];
  const bg = colors[name.charCodeAt(0) % colors.length];
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        color: "white",
        fontFamily: SANS,
        fontSize: size * 0.35,
        fontWeight: 500,
      }}
    >
      {initials}
    </div>
  );
}

function LogCard({ log, onRemove }: { log: any; onRemove: () => void }) {
  const [liked, setLiked] = useState(false);
  const timeSince = new Date(log.watched_at);
  const diff = Date.now() - timeSince.getTime();
  const hours = Math.floor(diff / 3600000);
  const timeStr =
    hours < 1
      ? "Just now"
      : hours < 24
        ? `${hours}h ago`
        : `${Math.floor(hours / 24)}d ago`;

  return (
    <div
      className="feed-item"
      style={{
        border: "1px solid #2A2A2A",
        background: "#141414",
        borderRadius: "8px",
        padding: "16px",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#3A3A3A")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#2A2A2A")}
    >
      <div style={{ display: "flex", gap: "12px" }}>
        {log.poster_url ? (
          <img
            src={log.poster_url}
            alt={log.title}
            style={{
              width: "48px",
              height: "72px",
              objectFit: "cover",
              borderRadius: "2px",
              flexShrink: 0,
            }}
          />
        ) : (
          <div
            style={{
              width: "48px",
              height: "72px",
              borderRadius: "2px",
              background: "#1A1A1A",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Film size={16} color="#2A2A2A" />
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "6px",
            }}
          >
            <Avatar name="You" size={22} />
            <span
              style={{
                fontFamily: SANS,
                fontSize: "12px",
                color: "#F0EDE8",
                fontWeight: 500,
              }}
            >
              You
            </span>
            <span
              style={{ fontFamily: SANS, fontSize: "12px", color: "#504E4A" }}
            >
              watched
            </span>
            <span
              style={{
                marginLeft: "auto",
                fontFamily: SANS,
                fontSize: "10px",
                color: "#504E4A",
                flexShrink: 0,
              }}
            >
              {timeStr}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginBottom: "4px",
            }}
          >
            <span
              style={{
                fontFamily: SANS,
                fontSize: "13px",
                color: "#F0EDE8",
                fontWeight: 500,
              }}
            >
              {log.title}
            </span>
            {log.type === "series" ? (
              <Tv size={10} color="#504E4A" />
            ) : (
              <Film size={10} color="#504E4A" />
            )}
          </div>
          {log.user_rating && (
            <div style={{ marginBottom: "6px" }}>
              <StarRating value={log.user_rating} readonly size="sm" />
            </div>
          )}
          {log.note && (
            <p
              style={
                {
                  fontFamily: SANS,
                  fontSize: "12px",
                  color: "#8A8780",
                  lineHeight: 1.5,
                  fontStyle: "italic",
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                } as React.CSSProperties
              }
            >
              &ldquo;{log.note}&rdquo;
            </p>
          )}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          marginTop: "12px",
          paddingTop: "12px",
          borderTop: "1px solid #1A1A1A",
        }}
      >
        <button
          onClick={() => setLiked(!liked)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontFamily: SANS,
            fontSize: "12px",
            color: liked ? "#C87C2A" : "#504E4A",
          }}
        >
          <Heart
            size={12}
            fill={liked ? "#C87C2A" : "none"}
            stroke={liked ? "#C87C2A" : "#504E4A"}
          />{" "}
          Like
        </button>
        <button
          onClick={onRemove}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontFamily: SANS,
            fontSize: "12px",
            color: "#504E4A",
            marginLeft: "auto",
          }}
        >
          Remove
        </button>
      </div>
    </div>
  );
}

function TrendingCard({ item }: { item: any }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "10px",
        background: "#141414",
        border: "1px solid #2A2A2A",
        borderRadius: "8px",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#3A3A3A")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#2A2A2A")}
    >
      {item.poster_url ? (
        <img
          src={item.poster_url}
          alt={item.title}
          style={{
            width: "36px",
            height: "52px",
            objectFit: "cover",
            borderRadius: "2px",
            flexShrink: 0,
          }}
        />
      ) : (
        <div
          style={{
            width: "36px",
            height: "52px",
            borderRadius: "2px",
            background: "#1A1A1A",
            flexShrink: 0,
          }}
        />
      )}
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
        <p
          style={{
            fontFamily: SANS,
            fontSize: "11px",
            color: "#504E4A",
            marginTop: "2px",
          }}
        >
          {item.year}
        </p>
        {item.tmdb_rating > 0 && (
          <p
            style={{
              fontFamily: MONO,
              fontSize: "10px",
              color: "#C8A96E",
              marginTop: "2px",
            }}
          >
            ★ {item.tmdb_rating.toFixed(1)}
          </p>
        )}
      </div>
    </div>
  );
}

function WatchlistCard({ item }: { item: any }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "10px",
        background: "#141414",
        border: "1px solid #2A2A2A",
        borderRadius: "8px",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#3A3A3A")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#2A2A2A")}
    >
      {item.poster_url ? (
        <img
          src={item.poster_url}
          alt={item.title}
          style={{
            width: "36px",
            height: "52px",
            objectFit: "cover",
            borderRadius: "2px",
            flexShrink: 0,
          }}
        />
      ) : (
        <div
          style={{
            width: "36px",
            height: "52px",
            borderRadius: "2px",
            background: "#1A1A1A",
            flexShrink: 0,
          }}
        />
      )}
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
        <p
          style={{
            fontFamily: SANS,
            fontSize: "11px",
            color: "#504E4A",
            marginTop: "2px",
          }}
        >
          {item.year}
        </p>
      </div>
      {item.priority === "high" && (
        <Star size={12} color="#C8A96E" fill="#C8A96E" />
      )}
    </div>
  );
}

export default function DashboardPage() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const logs = useLogs();
  const watchlist = useWatchlist();
  const stats = useStats();
  const { data: trending, loading: trendingLoading } = useTrending("all");
  const [greeting, setGreeting] = useState("Good evening");

  useEffect(() => {
    const h = new Date().getHours();
    if (h < 12) setGreeting("Good morning");
    else if (h < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  const filteredLogs = logs.filter((l) => {
    if (filter === "Films") return l.type === "film";
    if (filter === "TV") return l.type === "series";
    if (filter === "Reviews") return !!l.note;
    return true;
  });

  const trendingMovies = trending?.trending_movies?.slice(0, 5) || [];
  const trendingTV = trending?.trending_tv?.slice(0, 5) || [];
  const recentWatchlist = watchlist.slice(0, 4);

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 24px" }}>
      {/* Page header */}
      <div style={{ padding: "24px 0 16px" }}>
        <h1
          style={{
            fontFamily: SERIF,
            fontSize: "26px",
            fontWeight: 700,
            color: "#F0EDE8",
          }}
        >
          {greeting}.
        </h1>
        <p
          style={{
            fontFamily: SANS,
            fontSize: "13px",
            color: "#504E4A",
            marginTop: "2px",
          }}
        >
          {stats.total_films > 0
            ? `${stats.total_films} films logged · ${stats.total_hours}h watched`
            : "What did you watch today?"}
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) 300px",
          gap: "24px",
          alignItems: "start",
          paddingBottom: "40px",
        }}
      >
        {/* ── LEFT: Feed ── */}
        <div style={{ minWidth: 0 }}>
          {/* Filter chips */}
          <div
            style={{
              display: "flex",
              gap: "6px",
              marginBottom: "20px",
              overflowX: "auto",
              paddingBottom: "4px",
            }}
          >
            {FILTERS.map((f) => (
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
            ))}
          </div>

          {/* Your logs */}
          {filteredLogs.length > 0 ? (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              {filteredLogs.slice(0, 20).map((log) => (
                <LogCard
                  key={log.id}
                  log={log}
                  onRemove={() => removeLog(log.id)}
                />
              ))}
            </div>
          ) : (
            <div
              style={{
                border: "1px dashed #2A2A2A",
                borderRadius: "12px",
                padding: "40px",
                textAlign: "center",
              }}
            >
              <p
                style={{
                  fontFamily: SERIF,
                  fontSize: "18px",
                  color: "#2A2A2A",
                  fontStyle: "italic",
                  marginBottom: "8px",
                }}
              >
                Your feed is empty
              </p>
              <p
                style={{ fontFamily: SANS, fontSize: "13px", color: "#504E4A" }}
              >
                Tap the Log button to add your first film or series
              </p>
            </div>
          )}

          {/* Trending section */}
          {trendingMovies.length > 0 && (
            <div style={{ marginTop: "32px" }}>
              <p
                style={{
                  fontFamily: SANS,
                  fontSize: "10px",
                  color: "#8A8780",
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                  marginBottom: "12px",
                }}
              >
                Trending this week
              </p>
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  overflowX: "auto",
                  paddingBottom: "8px",
                  scrollbarWidth: "none",
                }}
              >
                {[...trendingMovies, ...trendingTV]
                  .slice(0, 8)
                  .map((item: any) => (
                    <div
                      key={`${item.type}-${item.id}`}
                      style={{
                        flexShrink: 0,
                        width: "80px",
                        cursor: "pointer",
                      }}
                    >
                      {item.poster_url ? (
                        <img
                          src={item.poster_url}
                          alt={item.title}
                          style={{
                            width: "80px",
                            height: "120px",
                            objectFit: "cover",
                            borderRadius: "4px",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "80px",
                            height: "120px",
                            borderRadius: "4px",
                            background: "#1A1A1A",
                          }}
                        />
                      )}
                      <p
                        style={{
                          fontFamily: SANS,
                          fontSize: "10px",
                          color: "#8A8780",
                          marginTop: "4px",
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

        {/* ── RIGHT: Sidebar ── */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            minWidth: 0,
          }}
        >
          {/* Stats */}
          {stats.total_films > 0 && (
            <div>
              <p
                style={{
                  fontFamily: SANS,
                  fontSize: "10px",
                  color: "#8A8780",
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                  marginBottom: "10px",
                }}
              >
                Your stats
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "8px",
                }}
              >
                {[
                  { val: stats.total_films, label: "Films" },
                  { val: stats.total_series, label: "Series" },
                  { val: `${stats.total_hours}h`, label: "Watched" },
                  {
                    val:
                      stats.avg_rating > 0 ? stats.avg_rating.toFixed(1) : "—",
                    label: "Avg rating",
                  },
                ].map(({ val, label }) => (
                  <div
                    key={label}
                    style={{
                      background: "#141414",
                      border: "1px solid #2A2A2A",
                      borderRadius: "8px",
                      padding: "12px",
                      textAlign: "center",
                    }}
                  >
                    <p
                      style={{
                        fontFamily: MONO,
                        color: "#C8A96E",
                        fontSize: "18px",
                        fontWeight: 500,
                      }}
                    >
                      {val}
                    </p>
                    <p
                      style={{
                        fontFamily: SANS,
                        color: "#504E4A",
                        fontSize: "10px",
                        marginTop: "2px",
                      }}
                    >
                      {label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Watchlist */}
          {recentWatchlist.length > 0 && (
            <div>
              <p
                style={{
                  fontFamily: SANS,
                  fontSize: "10px",
                  color: "#8A8780",
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                  marginBottom: "10px",
                }}
              >
                Watchlist
              </p>
              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                {recentWatchlist.map((item) => (
                  <WatchlistCard key={item.id} item={item} />
                ))}
                {watchlist.length > 4 && (
                  <p
                    style={{
                      fontFamily: SANS,
                      fontSize: "11px",
                      color: "#504E4A",
                      textAlign: "center",
                    }}
                  >
                    +{watchlist.length - 4} more
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Taste DNA compact */}
          <div>
            <p
              style={{
                fontFamily: SANS,
                fontSize: "10px",
                color: "#8A8780",
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                marginBottom: "10px",
              }}
            >
              Your DNA
            </p>
            <TasteDNACard compact />
          </div>

          {/* Trending sidebar */}
          {trendingMovies.length > 0 && (
            <div>
              <p
                style={{
                  fontFamily: SANS,
                  fontSize: "10px",
                  color: "#8A8780",
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                  marginBottom: "10px",
                }}
              >
                Trending films
              </p>
              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                {trendingMovies.map((item: any) => (
                  <TrendingCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
