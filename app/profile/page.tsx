"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Settings,
  Share2,
  Film,
  Tv,
  Star,
  Clock,
  BookmarkPlus,
  Edit3,
  Check,
  X,
  Calendar,
  TrendingUp,
  Award,
  Eye,
  Grid,
  List,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useLogs, useWatchlist, useStats, useUserProfile } from "@/lib/hooks";
import { saveUserProfile, removeLog } from "@/lib/store";
import { TasteDNACard } from "@/components/features/TasteDNACard";
import { getMyTwins } from "@/lib/twins";

const SERIF = "Playfair Display, Georgia, serif";
const SANS = "Inter, system-ui, sans-serif";
const MONO = "JetBrains Mono, Courier New, monospace";

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
  History: "#3A5A4A",
  Mystery: "#4A3A6A",
  Adventure: "#3A6A4A",
  Fantasy: "#6A3A7A",
  War: "#5A4A3A",
};

function toFive(r: number) {
  return Math.round((r / 2) * 2) / 2;
}

function StarDisplay({ rating, size = 12 }: { rating: number; size?: number }) {
  return (
    <span
      style={{ color: "#C8A96E", fontSize: `${size}px`, letterSpacing: "1px" }}
    >
      {[1, 2, 3, 4, 5]
        .map((s) => (rating >= s ? "★" : rating >= s - 0.5 ? "⯨" : "☆"))
        .join("")}
    </span>
  );
}

function Avatar({ name, size = 64 }: { name: string; size?: number }) {
  const colors = [
    "#5C4A8A",
    "#8A2A2A",
    "#2A5C8A",
    "#2A6A5C",
    "#8A7A2A",
    "#8A2A5C",
  ];
  const bg = colors[name.charCodeAt(0) % colors.length];
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
        border: "3px solid rgba(200,169,110,0.3)",
        flexShrink: 0,
        fontFamily: SANS,
        fontSize: size * 0.38,
        fontWeight: 600,
        color: "#F0EDE8",
      }}
    >
      {name[0].toUpperCase()}
    </div>
  );
}

function StatPill({ val, label }: { val: string | number; label: string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <p
        style={{
          fontFamily: MONO,
          fontSize: "22px",
          fontWeight: 500,
          color: "#C8A96E",
          lineHeight: 1,
        }}
      >
        {val}
      </p>
      <p
        style={{
          fontFamily: SANS,
          fontSize: "10px",
          color: "#504E4A",
          marginTop: "3px",
        }}
      >
        {label}
      </p>
    </div>
  );
}

// Radar chart for genre distribution
function GenreRadar({ genres }: { genres: { name: string; pct: number }[] }) {
  if (!genres.length) return null;
  const cx = 100,
    cy = 100,
    r = 70;
  const n = Math.min(genres.length, 6);
  const top = genres.slice(0, n);

  const points = top.map((g, i) => {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
    const radius = (g.pct / 100) * r;
    return {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
      ...g,
      angle,
    };
  });

  const polygon = points.map((p) => `${p.x},${p.y}`).join(" ");
  const spokes = top.map((_, i) => {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  });

  return (
    <svg
      viewBox="0 0 200 200"
      style={{
        width: "100%",
        maxWidth: "200px",
        margin: "0 auto",
        display: "block",
      }}
    >
      {/* Grid circles */}
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <circle
          key={f}
          cx={cx}
          cy={cy}
          r={r * f}
          fill="none"
          stroke="#1A1A1A"
          strokeWidth="1"
        />
      ))}
      {/* Spokes */}
      {spokes.map((s, i) => (
        <line
          key={i}
          x1={cx}
          y1={cy}
          x2={s.x}
          y2={s.y}
          stroke="#2A2A2A"
          strokeWidth="1"
        />
      ))}
      {/* Data polygon */}
      <polygon
        points={polygon}
        fill="rgba(200,169,110,0.15)"
        stroke="#C8A96E"
        strokeWidth="1.5"
      />
      {/* Labels */}
      {points.map((p, i) => {
        const labelR = r + 16;
        const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
        const lx = cx + labelR * Math.cos(angle);
        const ly = cy + labelR * Math.sin(angle);
        const color = GENRE_COLORS[p.name] || "#8A8780";
        return (
          <text
            key={i}
            x={lx}
            y={ly}
            textAnchor="middle"
            dominantBaseline="middle"
            style={{
              fontFamily: SANS,
              fontSize: "7px",
              fill: color,
              fontWeight: 600,
            }}
          >
            {p.name}
          </text>
        );
      })}
    </svg>
  );
}

// Film grid
function FilmGrid({
  logs,
  mediaType,
}: {
  logs: any[];
  mediaType?: "film" | "series";
}) {
  const router = useRouter();
  const filtered = mediaType
    ? logs.filter(
        (l) =>
          l.type === mediaType ||
          (mediaType === "film" && l.media_type === "movie") ||
          (mediaType === "series" && l.media_type === "tv"),
      )
    : logs;
  if (!filtered.length)
    return (
      <div style={{ textAlign: "center", padding: "40px", color: "#2A2A2A" }}>
        <p style={{ fontFamily: SERIF, fontSize: "16px", fontStyle: "italic" }}>
          Nothing here yet.
        </p>
      </div>
    );
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(88px, 1fr))",
        gap: "8px",
      }}
    >
      {filtered.map((log) => {
        const mt =
          log.media_type === "tv" || log.type === "series" ? "tv" : "movie";
        return (
          <div
            key={log.id}
            className="film-card"
            onClick={() => router.push(`/title/${mt}/${log.tmdb_id}`)}
            style={{ cursor: "pointer", position: "relative" }}
          >
            <div
              style={{
                aspectRatio: "2/3",
                borderRadius: "4px",
                overflow: "hidden",
                background: "#1A1A1A",
                marginBottom: "4px",
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
              {/* Rating overlay */}
              {log.user_rating && (
                <div
                  className="card-overlay"
                  style={{ position: "absolute", bottom: "24px", left: "4px" }}
                >
                  <span
                    style={{
                      fontFamily: MONO,
                      fontSize: "9px",
                      color: "#C8A96E",
                    }}
                  >
                    ★{log.user_rating}
                  </span>
                </div>
              )}
              {/* Status dot */}
              <div
                style={{
                  position: "absolute",
                  top: "4px",
                  right: "4px",
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background:
                    log.status === "watched"
                      ? "#C8A96E"
                      : log.status === "watching"
                        ? "#4A9E6B"
                        : "#8A4A4A",
                }}
              />
            </div>
            <p
              style={{
                fontFamily: SANS,
                fontSize: "9px",
                color: "#504E4A",
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
  );
}

// Year-by-year activity chart
function ActivityChart({ logs }: { logs: any[] }) {
  if (!logs.length) return null;
  const byYear: Record<number, number> = {};
  for (const log of logs) {
    const y = new Date(log.watched_at).getFullYear();
    byYear[y] = (byYear[y] || 0) + 1;
  }
  const years = Object.keys(byYear).map(Number).sort();
  const max = Math.max(...Object.values(byYear));
  if (years.length < 2) return null;

  return (
    <div>
      <p
        style={{
          fontFamily: SANS,
          fontSize: "10px",
          color: "#504E4A",
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          marginBottom: "12px",
        }}
      >
        Activity by year
      </p>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: "4px",
          height: "60px",
        }}
      >
        {years.map((y) => {
          const h = Math.round(((byYear[y] || 0) / max) * 60);
          return (
            <div
              key={y}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "3px",
              }}
            >
              <div
                title={`${byYear[y]} titles in ${y}`}
                style={{
                  width: "100%",
                  height: `${h}px`,
                  background: "#C8A96E",
                  borderRadius: "2px 2px 0 0",
                  opacity: 0.7,
                  minHeight: "2px",
                  cursor: "default",
                }}
              />
              <span
                style={{ fontFamily: MONO, fontSize: "8px", color: "#504E4A" }}
              >
                {String(y).slice(2)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Bio editor
function BioEditor({
  bio,
  onSave,
}: {
  bio: string;
  onSave: (b: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(bio);
  function save() {
    onSave(val);
    setEditing(false);
  }
  if (!editing)
    return (
      <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
        <p
          style={{
            fontFamily: SANS,
            fontSize: "13px",
            color: "#8A8780",
            lineHeight: 1.6,
            flex: 1,
          }}
        >
          {bio || "No bio yet."}
        </p>
        <button
          onClick={() => setEditing(true)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#504E4A",
            padding: "2px",
            flexShrink: 0,
          }}
        >
          <Edit3 size={12} />
        </button>
      </div>
    );
  return (
    <div>
      <textarea
        value={val}
        onChange={(e) => setVal(e.target.value)}
        style={{
          width: "100%",
          background: "#141414",
          border: "1px solid rgba(200,169,110,0.3)",
          borderRadius: "6px",
          padding: "8px",
          color: "#F0EDE8",
          fontFamily: SANS,
          fontSize: "13px",
          resize: "none",
          height: "80px",
          outline: "none",
        }}
      />
      <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
        <button
          onClick={save}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            padding: "5px 12px",
            borderRadius: "5px",
            background: "#C8A96E",
            color: "#0D0D0D",
            fontFamily: SANS,
            fontSize: "11px",
            fontWeight: 600,
            border: "none",
            cursor: "pointer",
          }}
        >
          <Check size={11} /> Save
        </button>
        <button
          onClick={() => {
            setVal(bio);
            setEditing(false);
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            padding: "5px 12px",
            borderRadius: "5px",
            background: "transparent",
            border: "1px solid #2A2A2A",
            color: "#8A8780",
            fontFamily: SANS,
            fontSize: "11px",
            cursor: "pointer",
          }}
        >
          <X size={11} /> Cancel
        </button>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const logs = useLogs();
  const watchlist = useWatchlist();
  const stats = useStats();
  const profile = useUserProfile();
  const [twins, setTwins] = useState<any[]>([]);
  const [tab, setTab] = useState<
    "overview" | "films" | "tv" | "watchlist" | "stats"
  >("overview");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user) getMyTwins().then(setTwins);
  }, [user]);

  if (!user) {
    return (
      <div
        style={{
          maxWidth: "480px",
          margin: "80px auto",
          padding: "0 24px",
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontFamily: SERIF,
            fontSize: "22px",
            color: "#504E4A",
            fontStyle: "italic",
            marginBottom: "16px",
          }}
        >
          Sign in to view your profile.
        </p>
        <Link
          href="/auth"
          style={{
            display: "inline-block",
            padding: "10px 24px",
            borderRadius: "8px",
            background: "#C8A96E",
            color: "#0D0D0D",
            fontFamily: SANS,
            fontSize: "13px",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Sign in
        </Link>
      </div>
    );
  }

  const displayName =
    user.user_metadata?.username || user.email?.split("@")[0] || "you";
  const watched = logs.filter((l) => l.status === "watched");
  const watching = logs.filter((l) => l.status === "watching");
  const films = logs.filter(
    (l) => l.type === "film" || l.media_type === "movie",
  );
  const series = logs.filter(
    (l) => l.type === "series" || l.media_type === "tv",
  );
  const ratedLogs = logs.filter((l) => l.user_rating);
  const avgRating =
    ratedLogs.length > 0
      ? ratedLogs.reduce((s, l) => s + (l.user_rating || 0), 0) /
        ratedLogs.length
      : 0;

  function handleShare() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleBioSave(bio: string) {
    saveUserProfile({ bio });
  }

  const TABS = [
    { id: "overview", label: "Overview" },
    { id: "films", label: `Films (${films.length})` },
    { id: "tv", label: `TV (${series.length})` },
    { id: "watchlist", label: `Watchlist (${watchlist.length})` },
    { id: "stats", label: "Stats" },
  ] as const;

  return (
    <div
      style={{ maxWidth: "1000px", margin: "0 auto", padding: "0 24px 80px" }}
    >
      {/* ── Profile Header ── */}
      <div style={{ paddingTop: "32px", marginBottom: "28px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "20px",
            flexWrap: "wrap",
          }}
        >
          <Avatar name={displayName} size={72} />

          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "4px",
                flexWrap: "wrap",
              }}
            >
              <h1
                style={{
                  fontFamily: SERIF,
                  fontSize: "26px",
                  fontWeight: 700,
                  color: "#F0EDE8",
                  fontStyle: "italic",
                }}
              >
                {displayName}
              </h1>
              <Link
                href="/settings"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "4px 10px",
                  borderRadius: "6px",
                  border: "1px solid #2A2A2A",
                  color: "#504E4A",
                  fontFamily: SANS,
                  fontSize: "11px",
                  textDecoration: "none",
                }}
              >
                <Settings size={11} /> Edit
              </Link>
              <button
                onClick={handleShare}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "4px 10px",
                  borderRadius: "6px",
                  border: "1px solid #2A2A2A",
                  background: "none",
                  color: "#504E4A",
                  fontFamily: SANS,
                  fontSize: "11px",
                  cursor: "pointer",
                }}
              >
                <Share2 size={11} /> {copied ? "Copied!" : "Share"}
              </button>
            </div>

            {/* Bio */}
            <div style={{ marginBottom: "16px", maxWidth: "480px" }}>
              <BioEditor bio={profile.bio} onSave={handleBioSave} />
            </div>

            {/* Stats row */}
            <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
              <StatPill val={films.length} label="Films" />
              <StatPill val={series.length} label="Series" />
              <StatPill val={watchlist.length} label="Watchlist" />
              <StatPill
                val={avgRating > 0 ? avgRating.toFixed(1) : "—"}
                label="Avg ★"
              />
              <StatPill val={`${stats.total_hours}h`} label="Watched" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div
        style={{
          display: "flex",
          gap: "0",
          borderBottom: "1px solid #1A1A1A",
          marginBottom: "24px",
          overflowX: "auto",
          scrollbarWidth: "none",
        }}
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as typeof tab)}
            style={{
              padding: "10px 18px",
              background: "none",
              border: "none",
              flexShrink: 0,
              borderBottom:
                tab === t.id ? "2px solid #C8A96E" : "2px solid transparent",
              color: tab === t.id ? "#F0EDE8" : "#504E4A",
              fontFamily: SANS,
              fontSize: "13px",
              fontWeight: tab === t.id ? 500 : 400,
              cursor: "pointer",
              marginBottom: "-1px",
              transition: "color 0.15s ease",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Overview tab ── */}
      {tab === "overview" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 300px",
            gap: "28px",
          }}
          className="profile-grid"
        >
          {/* Left — recent activity */}
          <div>
            {/* Recent watched */}
            {watched.length > 0 && (
              <div style={{ marginBottom: "28px" }}>
                <p
                  style={{
                    fontFamily: SANS,
                    fontSize: "10px",
                    color: "#504E4A",
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    marginBottom: "12px",
                  }}
                >
                  Recently watched
                </p>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))",
                    gap: "8px",
                  }}
                >
                  {watched.slice(0, 12).map((log) => {
                    const mt =
                      log.media_type === "tv" || log.type === "series"
                        ? "tv"
                        : "movie";
                    return (
                      <div
                        key={log.id}
                        className="film-card"
                        onClick={() =>
                          router.push(`/title/${mt}/${log.tmdb_id}`)
                        }
                        style={{ cursor: "pointer" }}
                      >
                        <div
                          style={{
                            aspectRatio: "2/3",
                            borderRadius: "4px",
                            overflow: "hidden",
                            background: "#1A1A1A",
                            position: "relative",
                            marginBottom: "4px",
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
                          {log.user_rating && (
                            <div
                              className="card-overlay"
                              style={{
                                position: "absolute",
                                bottom: "4px",
                                left: "4px",
                              }}
                            >
                              <span
                                style={{
                                  fontFamily: MONO,
                                  fontSize: "9px",
                                  color: "#C8A96E",
                                }}
                              >
                                ★{log.user_rating}
                              </span>
                            </div>
                          )}
                        </div>
                        <p
                          style={{
                            fontFamily: SANS,
                            fontSize: "9px",
                            color: "#504E4A",
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
                {watched.length > 12 && (
                  <button
                    onClick={() => setTab("films")}
                    style={{
                      fontFamily: SANS,
                      fontSize: "11px",
                      color: "#C8A96E",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      marginTop: "10px",
                      padding: 0,
                    }}
                  >
                    See all {watched.length} →
                  </button>
                )}
              </div>
            )}

            {/* Currently watching */}
            {watching.length > 0 && (
              <div style={{ marginBottom: "28px" }}>
                <p
                  style={{
                    fontFamily: SANS,
                    fontSize: "10px",
                    color: "#504E4A",
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    marginBottom: "12px",
                  }}
                >
                  Currently watching
                </p>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  {watching.slice(0, 4).map((log) => {
                    const mt =
                      log.media_type === "tv" || log.type === "series"
                        ? "tv"
                        : "movie";
                    return (
                      <div
                        key={log.id}
                        onClick={() =>
                          router.push(`/title/${mt}/${log.tmdb_id}`)
                        }
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          padding: "10px",
                          background: "#0F0F0F",
                          border: "1px solid rgba(74,158,107,0.2)",
                          borderRadius: "8px",
                          cursor: "pointer",
                        }}
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
                          {log.poster_url && (
                            <img
                              src={log.poster_url}
                              alt={log.title}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                          )}
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
                            {log.title}
                          </p>
                          <p
                            style={{
                              fontFamily: SANS,
                              fontSize: "10px",
                              color: "#4A9E6B",
                              marginTop: "2px",
                            }}
                          >
                            ● Watching
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Taste DNA */}
            <div style={{ marginBottom: "28px" }}>
              <p
                style={{
                  fontFamily: SANS,
                  fontSize: "10px",
                  color: "#504E4A",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  marginBottom: "12px",
                }}
              >
                Taste DNA
              </p>
              <TasteDNACard />
            </div>
          </div>

          {/* Right sidebar */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "24px" }}
          >
            {/* Genre radar */}
            {stats.top_genres.length >= 3 && (
              <div>
                <p
                  style={{
                    fontFamily: SANS,
                    fontSize: "10px",
                    color: "#504E4A",
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    marginBottom: "12px",
                  }}
                >
                  Genre profile
                </p>
                <GenreRadar genres={stats.top_genres} />
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "5px",
                    marginTop: "12px",
                  }}
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
                      <div
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "2px",
                          background: GENRE_COLORS[g.name] || "#504E4A",
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          fontFamily: SANS,
                          fontSize: "11px",
                          color: "#8A8780",
                          flex: 1,
                        }}
                      >
                        {g.name}
                      </span>
                      <span
                        style={{
                          fontFamily: MONO,
                          fontSize: "10px",
                          color: "#504E4A",
                        }}
                      >
                        {g.pct}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Activity by year */}
            <ActivityChart logs={logs} />

            {/* Top directors */}
            {stats.top_directors.length > 0 && (
              <div>
                <p
                  style={{
                    fontFamily: SANS,
                    fontSize: "10px",
                    color: "#504E4A",
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    marginBottom: "10px",
                  }}
                >
                  Top directors
                </p>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  {stats.top_directors.map((d: string) => (
                    <div
                      key={d}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "6px 10px",
                        background: "#0F0F0F",
                        borderRadius: "6px",
                        border: "1px solid #1A1A1A",
                      }}
                    >
                      <Award size={11} color="#C8A96E" />
                      <span
                        style={{
                          fontFamily: SANS,
                          fontSize: "12px",
                          color: "#8A8780",
                        }}
                      >
                        {d}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Taste Twins ── */}
      {tab === "overview" && (
        <div
          style={{
            marginTop: "24px",
            padding: "20px 24px",
            background: "#111",
            borderRadius: "12px",
            border: "1px solid #1A1A1A",
          }}
        >
          <p
            style={{
              fontFamily: SANS,
              fontSize: "10px",
              color: "#504E4A",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              marginBottom: "14px",
            }}
          >
            Taste Twins ({twins.length})
          </p>
          {twins.length === 0 ? (
            <p style={{ fontFamily: SANS, fontSize: "13px", color: "#504E4A" }}>
              Log 5+ films to discover your taste twins.
            </p>
          ) : (
            twins.map((t: any) => (
              <div
                key={t.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 0",
                  borderBottom: "1px solid #1A1A1A",
                }}
              >
                <span
                  style={{
                    fontFamily: SANS,
                    fontSize: "13px",
                    color: "#F0EDE8",
                  }}
                >
                  {t.profiles?.display_name ||
                    t.profiles?.username ||
                    t.twin_user_id}
                </span>
                <span
                  style={{
                    fontFamily: SANS,
                    fontSize: "12px",
                    color: "#C8A96E",
                  }}
                >
                  {t.match_count} shared · {t.match_percentage}%
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Films tab ── */}
      {tab === "films" && (
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "16px",
            }}
          >
            <p style={{ fontFamily: SANS, fontSize: "12px", color: "#504E4A" }}>
              {films.length} films logged
            </p>
          </div>
          <FilmGrid logs={logs} mediaType="film" />
        </div>
      )}

      {/* ── TV tab ── */}
      {tab === "tv" && (
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "16px",
            }}
          >
            <p style={{ fontFamily: SANS, fontSize: "12px", color: "#504E4A" }}>
              {series.length} series logged
            </p>
          </div>
          <FilmGrid logs={logs} mediaType="series" />
        </div>
      )}

      {/* ── Watchlist tab ── */}
      {tab === "watchlist" && (
        <div>
          {watchlist.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <BookmarkPlus
                size={28}
                color="#2A2A2A"
                style={{ margin: "0 auto 12px", display: "block" }}
              />
              <p
                style={{
                  fontFamily: SERIF,
                  fontSize: "18px",
                  color: "#2A2A2A",
                  fontStyle: "italic",
                }}
              >
                Watchlist is empty.
              </p>
              <p
                style={{
                  fontFamily: SANS,
                  fontSize: "12px",
                  color: "#504E4A",
                  marginTop: "6px",
                }}
              >
                Add titles from{" "}
                <Link
                  href="/discover"
                  style={{ color: "#C8A96E", textDecoration: "none" }}
                >
                  Discover
                </Link>
              </p>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))",
                gap: "8px",
              }}
            >
              {watchlist.map((item) => {
                const mt = item.type === "series" ? "tv" : "movie";
                return (
                  <div
                    key={item.id}
                    className="film-card"
                    onClick={() => router.push(`/title/${mt}/${item.tmdb_id}`)}
                    style={{ cursor: "pointer" }}
                  >
                    <div
                      style={{
                        aspectRatio: "2/3",
                        borderRadius: "4px",
                        overflow: "hidden",
                        background: "#1A1A1A",
                        marginBottom: "4px",
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
                          <Film size={14} color="#2A2A2A" />
                        </div>
                      )}
                    </div>
                    <p
                      style={{
                        fontFamily: SANS,
                        fontSize: "9px",
                        color: "#504E4A",
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
                        color: "#2A2A2A",
                      }}
                    >
                      {item.year}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Stats tab ── */}
      {tab === "stats" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "24px",
          }}
          className="stats-grid"
        >
          {/* Left */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "20px" }}
          >
            {/* Overview numbers */}
            <div>
              <p
                style={{
                  fontFamily: SANS,
                  fontSize: "10px",
                  color: "#504E4A",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  marginBottom: "12px",
                }}
              >
                Overview
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "8px",
                }}
              >
                {[
                  { val: films.length, label: "Films" },
                  { val: series.length, label: "Series" },
                  { val: `${stats.total_hours}h`, label: "Watched" },
                  { val: ratedLogs.length, label: "Rated" },
                  { val: watching.length, label: "Watching" },
                  { val: watchlist.length, label: "Saved" },
                ].map(({ val, label }) => (
                  <div
                    key={label}
                    style={{
                      background: "#141414",
                      border: "1px solid #1A1A1A",
                      borderRadius: "8px",
                      padding: "14px",
                      textAlign: "center",
                    }}
                  >
                    <p
                      style={{
                        fontFamily: MONO,
                        fontSize: "20px",
                        color: "#C8A96E",
                        fontWeight: 500,
                        lineHeight: 1,
                      }}
                    >
                      {val}
                    </p>
                    <p
                      style={{
                        fontFamily: SANS,
                        fontSize: "10px",
                        color: "#504E4A",
                        marginTop: "4px",
                      }}
                    >
                      {label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Rating distribution */}
            {ratedLogs.length > 0 && (
              <div>
                <p
                  style={{
                    fontFamily: SANS,
                    fontSize: "10px",
                    color: "#504E4A",
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    marginBottom: "12px",
                  }}
                >
                  Rating distribution
                </p>
                {[5, 4.5, 4, 3.5, 3, 2.5, 2, 1.5, 1, 0.5].map((r) => {
                  const count = ratedLogs.filter(
                    (l) => l.user_rating === r,
                  ).length;
                  const pct = Math.round((count / ratedLogs.length) * 100);
                  return count > 0 ? (
                    <div
                      key={r}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "4px",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: MONO,
                          fontSize: "10px",
                          color: "#C8A96E",
                          width: "24px",
                          textAlign: "right",
                          flexShrink: 0,
                        }}
                      >
                        {r}
                      </span>
                      <div
                        style={{
                          flex: 1,
                          height: "6px",
                          background: "#1A1A1A",
                          borderRadius: "3px",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${pct}%`,
                            background: "#C8A96E",
                            borderRadius: "3px",
                            opacity: r >= 4 ? 1 : r >= 3 ? 0.7 : 0.4,
                          }}
                        />
                      </div>
                      <span
                        style={{
                          fontFamily: MONO,
                          fontSize: "10px",
                          color: "#504E4A",
                          width: "24px",
                          flexShrink: 0,
                        }}
                      >
                        {count}
                      </span>
                    </div>
                  ) : null;
                })}
              </div>
            )}
          </div>

          {/* Right */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "20px" }}
          >
            {/* Genre breakdown */}
            {stats.top_genres.length > 0 && (
              <div>
                <p
                  style={{
                    fontFamily: SANS,
                    fontSize: "10px",
                    color: "#504E4A",
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    marginBottom: "12px",
                  }}
                >
                  Top genres
                </p>
                {stats.top_genres.map((g: any) => (
                  <div
                    key={g.name}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "8px",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: SANS,
                        fontSize: "12px",
                        color: "#8A8780",
                        width: "80px",
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
                        className="decade-bar"
                        style={
                          {
                            height: "100%",
                            background: GENRE_COLORS[g.name] || "#C8A96E",
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
                        width: "32px",
                        textAlign: "right",
                      }}
                    >
                      {g.pct}%
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Activity chart */}
            <ActivityChart logs={logs} />

            {/* Top directors */}
            {stats.top_directors.length > 0 && (
              <div>
                <p
                  style={{
                    fontFamily: SANS,
                    fontSize: "10px",
                    color: "#504E4A",
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    marginBottom: "10px",
                  }}
                >
                  Top directors
                </p>
                {stats.top_directors.map((d: string, i: number) => (
                  <div
                    key={d}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "8px 0",
                      borderBottom: "1px solid #1A1A1A",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: MONO,
                        fontSize: "11px",
                        color: "#2A2A2A",
                        width: "16px",
                      }}
                    >
                      {i + 1}
                    </span>
                    <span
                      style={{
                        fontFamily: SANS,
                        fontSize: "12px",
                        color: "#8A8780",
                      }}
                    >
                      {d}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 700px) {
          .profile-grid { grid-template-columns: 1fr !important; }
          .stats-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
