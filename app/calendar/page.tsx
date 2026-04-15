"use client";
import { useState, useEffect } from "react";
import { Calendar, Bell, Film, Tv, Plus, Loader } from "lucide-react";
import { addToWatchlist } from "@/lib/store";

const SERIF = "Playfair Display, Georgia, serif";
const SANS = "Inter, system-ui, sans-serif";
const MONO = "JetBrains Mono, Courier New, monospace";

const TYPE_STYLES: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  "Upcoming Film": {
    bg: "rgba(92,74,138,0.15)",
    text: "#9A7ACC",
    border: "rgba(92,74,138,0.3)",
  },
  "Now Playing": {
    bg: "rgba(74,158,107,0.15)",
    text: "#4A9E6B",
    border: "rgba(74,158,107,0.3)",
  },
  "On Air": {
    bg: "rgba(200,169,110,0.15)",
    text: "#C8A96E",
    border: "rgba(200,169,110,0.3)",
  },
  "Airing Today": {
    bg: "rgba(200,124,42,0.15)",
    text: "#C87C2A",
    border: "rgba(200,124,42,0.3)",
  },
};

interface CalendarEntry {
  id: number;
  title: string;
  type: "film" | "series";
  status: string;
  poster_url: string | null;
  year: number;
  tmdb_rating: number;
  date?: string;
  overview?: string;
}

export default function CalendarPage() {
  const [entries, setEntries] = useState<
    { group: string; items: CalendarEntry[] }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState<Record<number, boolean>>({});

  useEffect(() => {
    async function load() {
      try {
        const [upcomingRes, nowPlayingRes, onAirRes, airingRes] =
          await Promise.all([
            fetch("/api/trending?type=film"),
            fetch("/api/search?q=2024 movies"),
            fetch("/api/trending?type=tv"),
            fetch("/api/trending?type=tv"),
          ]);

        const trending = await upcomingRes.json();

        const upcoming = (trending.trending_movies || [])
          .slice(0, 5)
          .map((m: any) => ({
            ...m,
            status: "Upcoming Film",
          }));
        const nowPlaying = (trending.top_movies || [])
          .slice(0, 5)
          .map((m: any) => ({
            ...m,
            status: "Now Playing",
          }));
        const onAir = (trending.trending_tv || [])
          .slice(0, 5)
          .map((t: any) => ({
            ...t,
            status: "On Air",
          }));
        const airing = (trending.top_tv || []).slice(0, 5).map((t: any) => ({
          ...t,
          status: "Airing Today",
        }));

        setEntries([
          { group: "Trending Films", items: upcoming },
          { group: "Top Rated Films", items: nowPlaying },
          { group: "Trending Series", items: onAir },
          { group: "Top Rated Series", items: airing },
        ]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function handleAdd(item: CalendarEntry) {
    addToWatchlist({
      tmdb_id: item.id,
      type: item.type,
      title: item.title,
      poster_url: item.poster_url,
      year: item.year,
      tmdb_rating: item.tmdb_rating,
      priority: "normal",
    });
    setAdded((prev) => ({ ...prev, [item.id]: true }));
    setTimeout(() => setAdded((prev) => ({ ...prev, [item.id]: false })), 2000);
  }

  return (
    <div
      style={{ maxWidth: "640px", margin: "0 auto", padding: "24px 24px 48px" }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "4px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Calendar size={20} color="#C8A96E" />
          <h1
            style={{
              fontFamily: SERIF,
              fontSize: "24px",
              fontWeight: 700,
              color: "#F0EDE8",
            }}
          >
            Calendar
          </h1>
        </div>
        <button
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "6px 12px",
            border: "1px solid #2A2A2A",
            borderRadius: "6px",
            background: "transparent",
            color: "#8A8780",
            fontFamily: SANS,
            fontSize: "11px",
            cursor: "pointer",
          }}
        >
          <Bell size={12} /> Notifications
        </button>
      </div>
      <p
        style={{
          fontFamily: SANS,
          fontSize: "13px",
          color: "#504E4A",
          marginBottom: "28px",
        }}
      >
        Live data from TMDB · Tap + to add to watchlist
      </p>

      {loading ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "60px",
          }}
        >
          <Loader
            size={20}
            color="#504E4A"
            style={{ animation: "spin 1s linear infinite" }}
          />
          <p
            style={{
              fontFamily: SANS,
              fontSize: "13px",
              color: "#504E4A",
              marginLeft: "12px",
            }}
          >
            Loading...
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          {entries.map((group) => (
            <div key={group.group}>
              {/* Group label */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "12px",
                }}
              >
                <span
                  style={{
                    fontFamily: MONO,
                    fontSize: "11px",
                    color: "#C8A96E",
                    fontWeight: 500,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                  }}
                >
                  {group.group}
                </span>
                <div
                  style={{ flex: 1, height: "1px", background: "#1A1A1A" }}
                />
              </div>

              {/* Entries */}
              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                {group.items.map((entry) => {
                  const style =
                    TYPE_STYLES[entry.status] || TYPE_STYLES["Upcoming Film"];
                  const isFilm = entry.type === "film";
                  const isAdded = added[entry.id];

                  return (
                    <div
                      key={entry.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "16px",
                        padding: "16px",
                        background: "#141414",
                        border: "1px solid #2A2A2A",
                        borderRadius: "12px",
                        cursor: "pointer",
                        transition: "border-color 0.15s ease",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.borderColor = "#3A3A3A")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.borderColor = "#2A2A2A")
                      }
                    >
                      {entry.poster_url ? (
                        <img
                          src={entry.poster_url}
                          alt={entry.title}
                          style={{
                            width: "48px",
                            height: "68px",
                            objectFit: "cover",
                            borderRadius: "2px",
                            flexShrink: 0,
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "48px",
                            height: "68px",
                            borderRadius: "2px",
                            background: "#1A1A1A",
                            flexShrink: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {isFilm ? (
                            <Film size={16} color="#2A2A2A" />
                          ) : (
                            <Tv size={16} color="#2A2A2A" />
                          )}
                        </div>
                      )}

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            marginBottom: "4px",
                          }}
                        >
                          <span
                            style={{
                              padding: "2px 8px",
                              borderRadius: "2px",
                              fontSize: "10px",
                              fontFamily: SANS,
                              background: style.bg,
                              color: style.text,
                              border: `1px solid ${style.border}`,
                              flexShrink: 0,
                            }}
                          >
                            {entry.status}
                          </span>
                          {isFilm ? (
                            <Film size={11} color="#504E4A" />
                          ) : (
                            <Tv size={11} color="#504E4A" />
                          )}
                        </div>
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
                          {entry.title}
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
                            style={{
                              fontFamily: SANS,
                              fontSize: "11px",
                              color: "#504E4A",
                            }}
                          >
                            {entry.year}
                          </span>
                          {entry.tmdb_rating > 0 && (
                            <span
                              style={{
                                fontFamily: MONO,
                                fontSize: "10px",
                                color: "#C8A96E",
                              }}
                            >
                              ★ {entry.tmdb_rating.toFixed(1)}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleAdd(entry)}
                        style={{
                          width: "28px",
                          height: "28px",
                          borderRadius: "50%",
                          flexShrink: 0,
                          background: isAdded
                            ? "rgba(74,158,107,0.15)"
                            : "#1A1A1A",
                          border: isAdded
                            ? "1px solid rgba(74,158,107,0.4)"
                            : "1px solid #2A2A2A",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          color: isAdded ? "#4A9E6B" : "#8A8780",
                        }}
                        onMouseEnter={(e) => {
                          if (!isAdded) {
                            (e.currentTarget as HTMLElement).style.color =
                              "#C8A96E";
                            (e.currentTarget as HTMLElement).style.borderColor =
                              "rgba(200,169,110,0.3)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isAdded) {
                            (e.currentTarget as HTMLElement).style.color =
                              "#8A8780";
                            (e.currentTarget as HTMLElement).style.borderColor =
                              "#2A2A2A";
                          }
                        }}
                      >
                        {isAdded ? "✓" : <Plus size={13} />}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Empty */}
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <p
              style={{
                fontFamily: SERIF,
                fontSize: "18px",
                color: "#2A2A2A",
                fontStyle: "italic",
              }}
            >
              More releases coming soon
            </p>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
