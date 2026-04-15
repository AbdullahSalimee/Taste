"use client";
import { useState } from "react";
import { Settings, Share2, Film, Tv } from "lucide-react";
import {
  useLogs,
  useWatchlist,
  useStats,
  useUserProfile,
  useHeatmap,
} from "@/lib/hooks";
import { TasteDNACard } from "@/components/features/TasteDNACard";
import { EpisodeHeatmap } from "@/components/features/EpisodeHeatmap";
import { StarRating } from "@/components/ui/StarRating";

const SERIF = "Playfair Display, Georgia, serif";
const SANS = "Inter, system-ui, sans-serif";
const MONO = "JetBrains Mono, Courier New, monospace";

const TABS = ["Overview", "Films", "TV", "Stats"] as const;

// Breaking Bad TMDB ID for heatmap demo
const DEMO_HEATMAP_ID = 1396;

function StatCard({ value, label }: { value: string | number; label: string }) {
  return (
    <div
      style={{
        background: "#141414",
        border: "1px solid #2A2A2A",
        borderRadius: "8px",
        padding: "16px",
        textAlign: "center",
      }}
    >
      <p
        style={{
          fontFamily: MONO,
          color: "#C8A96E",
          fontSize: "22px",
          fontWeight: 500,
        }}
      >
        {value}
      </p>
      <p
        style={{
          fontFamily: SANS,
          color: "#504E4A",
          fontSize: "11px",
          marginTop: "4px",
        }}
      >
        {label}
      </p>
    </div>
  );
}

function LogFilmCard({ log }: { log: any }) {
  return (
    <div
      className="film-card"
      style={{
        position: "relative",
        width: "96px",
        height: "144px",
        flexShrink: 0,
        cursor: "pointer",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "4px",
          overflow: "hidden",
          background: "#1A1A1A",
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
              padding: "8px",
            }}
          >
            <span
              style={{
                color: "#504E4A",
                fontSize: "10px",
                textAlign: "center",
                fontFamily: SANS,
              }}
            >
              {log.title}
            </span>
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
        {log.user_rating && (
          <div
            className="card-overlay"
            style={{ position: "absolute", bottom: "6px", right: "6px" }}
          >
            <span
              style={{ fontFamily: MONO, fontSize: "9px", color: "#C8A96E" }}
            >
              ★ {log.user_rating}
            </span>
          </div>
        )}
      </div>
      <div
        style={{
          position: "absolute",
          top: "5px",
          left: "5px",
          width: "16px",
          height: "16px",
          borderRadius: "2px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(200,169,110,0.2)",
          border: "1px solid rgba(200,169,110,0.4)",
        }}
      >
        <span style={{ fontSize: "8px", color: "#C8A96E" }}>✓</span>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");
  const logs = useLogs();
  const watchlist = useWatchlist();
  const stats = useStats();
  const profile = useUserProfile();

  const filmLogs = logs.filter((l) => l.type === "film");
  const tvLogs = logs.filter((l) => l.type === "series");
  const recentLogs = logs.slice(0, 10);

  // Pick the most-logged series for heatmap
  const topSeriesId =
    tvLogs.length > 0
      ? tvLogs.reduce((acc: Record<number, number>, l) => {
          acc[l.tmdb_id] = (acc[l.tmdb_id] || 0) + 1;
          return acc;
        }, {})
      : {};
  const topSeriesTmdbId = Object.entries(topSeriesId).sort(
    (a, b) => (b[1] as number) - (a[1] as number),
  )[0]?.[0];
  const heatmapId = topSeriesTmdbId
    ? parseInt(topSeriesTmdbId)
    : DEMO_HEATMAP_ID;

  return (
    <div
      style={{ maxWidth: "900px", margin: "0 auto", padding: "0 24px 48px" }}
    >
      {/* Profile header */}
      <div
        style={{
          position: "relative",
          paddingTop: "32px",
          paddingBottom: "24px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                width: "72px",
                height: "72px",
                borderRadius: "50%",
                flexShrink: 0,
                background: "linear-gradient(135deg, #5C4A8A, #8A2A5C)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: SERIF,
                fontSize: "28px",
                fontWeight: 700,
                color: "white",
                border: "2px solid #2A2A2A",
              }}
            >
              {profile.display_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1
                style={{
                  fontFamily: SERIF,
                  fontSize: "24px",
                  fontWeight: 700,
                  color: "#F0EDE8",
                }}
              >
                {profile.display_name}
              </h1>
              <p
                style={{
                  fontFamily: SANS,
                  fontSize: "13px",
                  color: "#C8A96E",
                  fontStyle: "italic",
                  marginTop: "2px",
                }}
              >
                {profile.archetype}
              </p>
              <p
                style={{
                  fontFamily: SANS,
                  fontSize: "13px",
                  color: "#504E4A",
                  marginTop: "4px",
                }}
              >
                {profile.bio}
              </p>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flexShrink: 0,
            }}
          >
            <button
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 12px",
                borderRadius: "6px",
                border: "1px solid #2A2A2A",
                background: "transparent",
                color: "#8A8780",
                fontFamily: SANS,
                fontSize: "11px",
                cursor: "pointer",
              }}
            >
              <Share2 size={12} /> Share
            </button>
            <button
              style={{
                padding: "6px",
                borderRadius: "6px",
                border: "1px solid #2A2A2A",
                background: "transparent",
                color: "#8A8780",
                cursor: "pointer",
              }}
            >
              <Settings size={14} />
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr 1fr",
            gap: "12px",
            marginTop: "24px",
          }}
        >
          <StatCard value={stats.total_films} label="Films" />
          <StatCard value={stats.total_series} label="Series" />
          <StatCard value={`${stats.total_hours}h`} label="Watched" />
          <StatCard value={watchlist.length} label="Watchlist" />
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: "4px",
          overflowX: "auto",
          paddingBottom: "0",
          marginBottom: "24px",
          borderBottom: "1px solid #1A1A1A",
        }}
      >
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "8px 16px",
              fontFamily: SANS,
              fontSize: "13px",
              flexShrink: 0,
              background: "none",
              border: "none",
              cursor: "pointer",
              borderBottom:
                t === tab ? "2px solid #C8A96E" : "2px solid transparent",
              color: t === tab ? "#C8A96E" : "#504E4A",
              transition: "all 0.15s ease",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {tab === "Overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          {/* DNA Card */}
          <TasteDNACard />

          {/* Recent activity */}
          {recentLogs.length > 0 && (
            <section>
              <h2
                style={{
                  fontFamily: SANS,
                  fontSize: "15px",
                  fontWeight: 600,
                  color: "#F0EDE8",
                  marginBottom: "16px",
                }}
              >
                Recent Activity
              </h2>
              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                {recentLogs.map((log) => (
                  <div
                    key={log.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "12px",
                      background: "#141414",
                      border: "1px solid #2A2A2A",
                      borderRadius: "8px",
                    }}
                  >
                    {log.poster_url ? (
                      <img
                        src={log.poster_url}
                        alt={log.title}
                        style={{
                          width: "32px",
                          height: "48px",
                          objectFit: "cover",
                          borderRadius: "2px",
                          flexShrink: 0,
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "32px",
                          height: "48px",
                          borderRadius: "2px",
                          background: "#1A1A1A",
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
                        {log.title}
                      </p>
                      <p
                        style={{
                          fontFamily: SANS,
                          fontSize: "11px",
                          color: "#504E4A",
                          marginTop: "2px",
                        }}
                      >
                        {log.year} · {log.type === "series" ? "Series" : "Film"}
                      </p>
                      {log.user_rating && (
                        <StarRating
                          value={log.user_rating}
                          readonly
                          size="sm"
                        />
                      )}
                    </div>
                    <p
                      style={{
                        fontFamily: SANS,
                        fontSize: "10px",
                        color: "#504E4A",
                      }}
                    >
                      {new Date(log.watched_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Heatmap */}
          <section>
            <h2
              style={{
                fontFamily: SANS,
                fontSize: "15px",
                fontWeight: 600,
                color: "#F0EDE8",
                marginBottom: "16px",
              }}
            >
              Episode Quality Heatmap
              {tvLogs.length === 0 && (
                <span
                  style={{
                    fontFamily: SANS,
                    fontSize: "11px",
                    color: "#504E4A",
                    fontWeight: 400,
                    marginLeft: "8px",
                  }}
                >
                  (showing Breaking Bad as demo)
                </span>
              )}
            </h2>
            <div
              style={{
                background: "#141414",
                border: "1px solid #2A2A2A",
                borderRadius: "10px",
                padding: "16px",
              }}
            >
              <EpisodeHeatmap tmdbId={heatmapId} />
            </div>
          </section>

          {logs.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "40px",
                border: "1px dashed #2A2A2A",
                borderRadius: "12px",
              }}
            >
              <p
                style={{
                  fontFamily: SERIF,
                  fontSize: "20px",
                  color: "#2A2A2A",
                  fontStyle: "italic",
                }}
              >
                Your profile is empty
              </p>
              <p
                style={{
                  fontFamily: SANS,
                  fontSize: "13px",
                  color: "#504E4A",
                  marginTop: "8px",
                }}
              >
                Start logging films to build your identity
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab: Films */}
      {tab === "Films" && (
        <div>
          <p
            style={{
              fontFamily: SANS,
              fontSize: "13px",
              color: "#8A8780",
              marginBottom: "16px",
            }}
          >
            {filmLogs.length} films logged
          </p>
          {filmLogs.length > 0 ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {filmLogs.map((log) => (
                <LogFilmCard key={log.id} log={log} />
              ))}
            </div>
          ) : (
            <p
              style={{
                fontFamily: SANS,
                fontSize: "13px",
                color: "#504E4A",
                fontStyle: "italic",
              }}
            >
              No films logged yet. Start watching!
            </p>
          )}
        </div>
      )}

      {/* Tab: TV */}
      {tab === "TV" && (
        <div>
          <p
            style={{
              fontFamily: SANS,
              fontSize: "13px",
              color: "#8A8780",
              marginBottom: "16px",
            }}
          >
            {tvLogs.length} series episodes logged
          </p>
          {tvLogs.length > 0 ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {tvLogs.map((log) => (
                <LogFilmCard key={log.id} log={log} />
              ))}
            </div>
          ) : (
            <p
              style={{
                fontFamily: SANS,
                fontSize: "13px",
                color: "#504E4A",
                fontStyle: "italic",
              }}
            >
              No TV series logged yet.
            </p>
          )}
        </div>
      )}

      {/* Tab: Stats */}
      {tab === "Stats" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {stats.total_films > 0 ? (
            <>
              <div>
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
                  Genre breakdown
                </p>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  {stats.top_genres.map((g) => (
                    <div
                      key={g.name}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: SANS,
                          fontSize: "12px",
                          color: "#8A8780",
                          width: "100px",
                          flexShrink: 0,
                        }}
                      >
                        {g.name}
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
                            background: "#C8A96E",
                            width: `${g.pct}%`,
                            borderRadius: "3px",
                          }}
                        />
                      </div>
                      <span
                        style={{
                          fontFamily: MONO,
                          fontSize: "11px",
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
              </div>

              {stats.top_directors.length > 0 && (
                <div>
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
                    Favorite directors
                  </p>
                  <div
                    style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}
                  >
                    {stats.top_directors.map((d) => (
                      <span
                        key={d}
                        style={{
                          padding: "4px 12px",
                          borderRadius: "4px",
                          background: "#141414",
                          border: "1px solid #2A2A2A",
                          fontFamily: SANS,
                          fontSize: "12px",
                          color: "#8A8780",
                        }}
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    background: "#141414",
                    border: "1px solid #2A2A2A",
                    borderRadius: "8px",
                    padding: "16px",
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
                    Average Rating
                  </p>
                  <p
                    style={{
                      fontFamily: MONO,
                      color: "#C8A96E",
                      fontSize: "28px",
                    }}
                  >
                    {stats.avg_rating > 0 ? stats.avg_rating.toFixed(1) : "—"}
                  </p>
                </div>
                <div
                  style={{
                    background: "#141414",
                    border: "1px solid #2A2A2A",
                    borderRadius: "8px",
                    padding: "16px",
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
                    Time Watched
                  </p>
                  <p
                    style={{
                      fontFamily: MONO,
                      color: "#C8A96E",
                      fontSize: "28px",
                    }}
                  >
                    {stats.total_hours}h
                  </p>
                </div>
              </div>
            </>
          ) : (
            <p
              style={{
                fontFamily: SANS,
                fontSize: "13px",
                color: "#504E4A",
                fontStyle: "italic",
                textAlign: "center",
                padding: "40px 0",
              }}
            >
              Log films to see your stats
            </p>
          )}
        </div>
      )}
    </div>
  );
}
