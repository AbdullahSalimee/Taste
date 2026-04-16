"use client";
import { useState, useEffect, useCallback } from "react";
import { Check, ChevronDown, ChevronUp } from "lucide-react";

const SANS = "Inter, system-ui, sans-serif";
const MONO = "JetBrains Mono, Courier New, monospace";

function ratingToColor(r: number, watched = false): string {
  if (r === 0) return watched ? "#1A2A1A" : "#1A1A1A";
  const r5 = Math.round((r / 2) * 2) / 2;
  if (r5 >= 4.5) return "#1B6E20";
  if (r5 >= 4.0) return "#2E7D32";
  if (r5 >= 3.5) return "#558B2F";
  if (r5 >= 3.0) return "#8A7A2A";
  if (r5 >= 2.5) return "#BF6010";
  if (r5 >= 2.0) return "#BF360C";
  return "#5C1E0A";
}

const LEGEND = [
  { color: "#5C1E0A", label: "1" },
  { color: "#BF360C", label: "2" },
  { color: "#8A7A2A", label: "3" },
  { color: "#558B2F", label: "3.5" },
  { color: "#2E7D32", label: "4" },
  { color: "#1B6E20", label: "4.5+" },
];

const LS_KEY = (id: number) => `taste_ep_watched_${id}`;

function getWatchedEps(tmdbId: number): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(LS_KEY(tmdbId));
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveWatchedEps(tmdbId: number, watched: Set<string>) {
  try {
    localStorage.setItem(LS_KEY(tmdbId), JSON.stringify([...watched]));
  } catch {}
}

function epKey(s: number, e: number) {
  return `${s}x${e}`;
}

interface Episode {
  ep: number;
  title: string;
  rating: number;
  rating_5: number;
  air_date: string;
  overview: string;
  runtime: number | null;
  still_path: string | null;
}

interface Season {
  number: number;
  name: string;
  air_date: string;
  episode_count: number;
  episodes: Episode[];
}

interface HeatmapData {
  tmdb_id: number;
  title: string;
  total_seasons: number;
  total_episodes: number;
  seasons: Season[];
}

function EpisodePanel({
  ep,
  season,
  watched,
  onToggle,
  onClose,
}: {
  ep: Episode;
  season: number;
  watched: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  return (
    <div
      style={{
        background: "#141414",
        border: "1px solid #2A2A2A",
        borderRadius: "10px",
        padding: "16px",
        marginTop: "10px",
        animation: "slideUp 0.2s ease",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "8px",
        }}
      >
        <div>
          <p
            style={{
              fontFamily: MONO,
              fontSize: "10px",
              color: "#C8A96E",
              marginBottom: "3px",
            }}
          >
            S{String(season).padStart(2, "0")}E{String(ep.ep).padStart(2, "0")}
            {ep.runtime ? ` · ${ep.runtime}m` : ""}
            {ep.air_date ? ` · ${ep.air_date.slice(0, 4)}` : ""}
          </p>
          <p
            style={{
              fontFamily: "Playfair Display, Georgia, serif",
              fontSize: "15px",
              color: "#F0EDE8",
              fontWeight: 700,
              fontStyle: "italic",
            }}
          >
            {ep.title || `Episode ${ep.ep}`}
          </p>
        </div>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#504E4A",
            padding: "2px",
          }}
        >
          ✕
        </button>
      </div>
      {ep.still_path && (
        <div
          style={{
            borderRadius: "6px",
            overflow: "hidden",
            marginBottom: "10px",
          }}
        >
          <img
            src={ep.still_path}
            alt={ep.title}
            style={{
              width: "100%",
              display: "block",
              maxHeight: "150px",
              objectFit: "cover",
            }}
          />
        </div>
      )}
      {ep.rating > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "8px",
          }}
        >
          <div
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "2px",
              background: ratingToColor(ep.rating),
              flexShrink: 0,
            }}
          />
          <span
            style={{ fontFamily: MONO, fontSize: "12px", color: "#C8A96E" }}
          >
            ★ {ep.rating_5}/5
          </span>
          <span
            style={{ fontFamily: SANS, fontSize: "10px", color: "#504E4A" }}
          >
            TMDB
          </span>
        </div>
      )}
      {ep.overview && (
        <p
          style={
            {
              fontFamily: SANS,
              fontSize: "12px",
              color: "#8A8780",
              lineHeight: 1.6,
              marginBottom: "12px",
              display: "-webkit-box",
              WebkitLineClamp: 4,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            } as React.CSSProperties
          }
        >
          {ep.overview}
        </p>
      )}
      <button
        onClick={onToggle}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "7px",
          padding: "8px 14px",
          borderRadius: "6px",
          cursor: "pointer",
          border: watched
            ? "1px solid rgba(200,169,110,0.4)"
            : "1px solid #2A2A2A",
          background: watched ? "rgba(200,169,110,0.1)" : "transparent",
          color: watched ? "#C8A96E" : "#8A8780",
          fontFamily: SANS,
          fontSize: "12px",
          fontWeight: 500,
        }}
      >
        <Check size={13} />
        {watched ? "Watched ✓" : "Mark as watched"}
      </button>
    </div>
  );
}

function SeasonRow({
  season,
  watchedEps,
  onToggleEp,
}: {
  season: Season;
  watchedEps: Set<string>;
  onToggleEp: (s: number, e: number) => void;
}) {
  const [selectedEp, setSelectedEp] = useState<Episode | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  const watchedCount = season.episodes.filter((e) =>
    watchedEps.has(epKey(season.number, e.ep)),
  ).length;
  const total = season.episodes.length;
  const pct = total > 0 ? Math.round((watchedCount / total) * 100) : 0;
  const ratedEps = season.episodes.filter((e) => e.rating > 0);
  const avgRating =
    ratedEps.length > 0
      ? ratedEps.reduce((s, e) => s + e.rating, 0) / ratedEps.length
      : 0;
  const avgR5 = Math.round((avgRating / 2) * 2) / 2;

  function markAll() {
    season.episodes.forEach((e) => {
      if (!watchedEps.has(epKey(season.number, e.ep)))
        onToggleEp(season.number, e.ep);
    });
  }

  return (
    <div style={{ marginBottom: "18px" }}>
      {/* Season header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "8px",
        }}
      >
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "7px",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
          }}
        >
          <span
            style={{
              fontFamily: MONO,
              fontSize: "10px",
              color: "#8A8780",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
            }}
          >
            {season.name || `Season ${season.number}`}
          </span>
          {avgR5 > 0 && (
            <span
              style={{ fontFamily: MONO, fontSize: "10px", color: "#C8A96E" }}
            >
              ★{avgR5}
            </span>
          )}
          {collapsed ? (
            <ChevronDown size={12} color="#504E4A" />
          ) : (
            <ChevronUp size={12} color="#504E4A" />
          )}
        </button>
        <div
          style={{ flex: 1, display: "flex", alignItems: "center", gap: "6px" }}
        >
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
              style={{
                height: "100%",
                width: `${pct}%`,
                background: pct === 100 ? "#C8A96E" : "#4A9E6B",
                transition: "width 0.3s ease",
              }}
            />
          </div>
          <span
            style={{
              fontFamily: MONO,
              fontSize: "9px",
              color: "#504E4A",
              flexShrink: 0,
            }}
          >
            {watchedCount}/{total}
          </span>
        </div>
        {watchedCount < total && (
          <button
            onClick={markAll}
            style={{
              fontFamily: SANS,
              fontSize: "9px",
              color: "#504E4A",
              background: "none",
              border: "1px solid #1A1A1A",
              borderRadius: "4px",
              padding: "2px 6px",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#C8A96E")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#504E4A")}
          >
            Mark all
          </button>
        )}
      </div>

      {!collapsed && (
        <>
          {/* Cells */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "3px" }}>
            {season.episodes.map((ep, i) => {
              const key = epKey(season.number, ep.ep);
              const watched = watchedEps.has(key);
              const isSelected = selectedEp?.ep === ep.ep;
              return (
                <div
                  key={ep.ep}
                  className="heatmap-cell"
                  onClick={() => setSelectedEp(isSelected ? null : ep)}
                  style={
                    {
                      width: "30px",
                      height: "30px",
                      borderRadius: "3px",
                      cursor: "pointer",
                      backgroundColor: ratingToColor(ep.rating, watched),
                      border: isSelected
                        ? "2px solid #C8A96E"
                        : watched
                          ? "1px solid rgba(200,169,110,0.25)"
                          : "1px solid rgba(0,0,0,0.3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "transform 0.15s ease",
                      opacity: watched ? 1 : 0.8,
                      position: "relative",
                      "--cell-delay": `${i * 8}ms`,
                    } as React.CSSProperties
                  }
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.transform =
                      "scale(1.2)";
                    (e.currentTarget as HTMLElement).style.opacity = "1";
                    (e.currentTarget as HTMLElement).style.zIndex = "10";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.transform =
                      "scale(1)";
                    (e.currentTarget as HTMLElement).style.opacity = watched
                      ? "1"
                      : "0.8";
                    (e.currentTarget as HTMLElement).style.zIndex = "1";
                  }}
                >
                  {watched ? (
                    <Check size={10} color="rgba(255,255,255,0.8)" />
                  ) : (
                    <span
                      style={{
                        fontFamily: MONO,
                        fontSize: "7px",
                        color: "rgba(255,255,255,0.5)",
                      }}
                    >
                      {ep.ep}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Episode detail panel */}
          {selectedEp && (
            <EpisodePanel
              ep={selectedEp}
              season={season.number}
              watched={watchedEps.has(epKey(season.number, selectedEp.ep))}
              onToggle={() => {
                onToggleEp(season.number, selectedEp.ep);
              }}
              onClose={() => setSelectedEp(null)}
            />
          )}
        </>
      )}
    </div>
  );
}

interface EpisodeHeatmapProps {
  tmdbId?: number;
  staticData?: HeatmapData;
}

export function EpisodeHeatmap({ tmdbId, staticData }: EpisodeHeatmapProps) {
  const [data, setData] = useState<HeatmapData | null>(staticData || null);
  const [loading, setLoading] = useState(!staticData && !!tmdbId);
  const [watchedEps, setWatchedEps] = useState<Set<string>>(new Set());
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (!tmdbId || staticData) return;
    setLoading(true);
    fetch(`/api/tv/${tmdbId}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [tmdbId]);

  useEffect(() => {
    if (!tmdbId) return;
    setWatchedEps(getWatchedEps(tmdbId));
  }, [tmdbId]);

  const toggleEp = useCallback(
    (season: number, ep: number) => {
      if (!tmdbId) return;
      setWatchedEps((prev) => {
        const next = new Set(prev);
        const key = epKey(season, ep);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        saveWatchedEps(tmdbId, next);
        return next;
      });
    },
    [tmdbId],
  );

  if (loading)
    return (
      <div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "3px",
            marginBottom: "8px",
          }}
        >
          {Array.from({ length: 24 }).map((_, i) => (
            <div
              key={i}
              className="skeleton"
              style={{ width: "30px", height: "30px", borderRadius: "3px" }}
            />
          ))}
        </div>
        <p style={{ fontFamily: SANS, fontSize: "11px", color: "#504E4A" }}>
          Loading episodes…
        </p>
      </div>
    );

  if (!data?.seasons?.length)
    return (
      <p style={{ fontFamily: SANS, fontSize: "12px", color: "#504E4A" }}>
        No episode data available.
      </p>
    );

  const totalWatched = watchedEps.size;
  const totalEps = data.seasons.reduce(
    (s, season) => s + season.episodes.length,
    0,
  );
  const overallPct =
    totalEps > 0 ? Math.round((totalWatched / totalEps) * 100) : 0;
  const visibleSeasons = showAll ? data.seasons : data.seasons.slice(0, 3);

  return (
    <div>
      {/* Overall progress bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "16px",
          padding: "12px",
          background: "#0F0F0F",
          borderRadius: "8px",
          border: "1px solid #1A1A1A",
        }}
      >
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "5px",
            }}
          >
            <span
              style={{ fontFamily: SANS, fontSize: "11px", color: "#8A8780" }}
            >
              Your progress
            </span>
            <span
              style={{ fontFamily: MONO, fontSize: "11px", color: "#C8A96E" }}
            >
              {totalWatched}/{totalEps}
            </span>
          </div>
          <div
            style={{
              height: "4px",
              background: "#1A1A1A",
              borderRadius: "2px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${overallPct}%`,
                background: overallPct === 100 ? "#C8A96E" : "#4A9E6B",
                borderRadius: "2px",
                transition: "width 0.4s ease",
              }}
            />
          </div>
        </div>
        <span
          style={{
            fontFamily: MONO,
            fontSize: "14px",
            color: overallPct === 100 ? "#C8A96E" : "#4A9E6B",
            flexShrink: 0,
            fontWeight: 500,
          }}
        >
          {overallPct}%
        </span>
      </div>

      <p
        style={{
          fontFamily: SANS,
          fontSize: "11px",
          color: "#504E4A",
          marginBottom: "14px",
        }}
      >
        Click any cell for episode details · check to mark watched
      </p>

      {visibleSeasons.map((season) => (
        <SeasonRow
          key={season.number}
          season={season}
          watchedEps={watchedEps}
          onToggleEp={toggleEp}
        />
      ))}

      {data.seasons.length > 3 && (
        <button
          onClick={() => setShowAll(!showAll)}
          style={{
            fontFamily: SANS,
            fontSize: "12px",
            color: "#C8A96E",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "4px 0",
            marginBottom: "12px",
          }}
        >
          {showAll
            ? "Show fewer seasons"
            : `Show all ${data.seasons.length} seasons`}
        </button>
      )}

      {/* Legend */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginTop: "12px",
          paddingTop: "12px",
          borderTop: "1px solid #1A1A1A",
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontFamily: SANS, fontSize: "10px", color: "#504E4A" }}>
          Quality:
        </span>
        {LEGEND.map((l) => (
          <div
            key={l.color}
            style={{ display: "flex", alignItems: "center", gap: "3px" }}
          >
            <div
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "2px",
                background: l.color,
              }}
            />
            <span
              style={{ fontFamily: MONO, fontSize: "9px", color: "#504E4A" }}
            >
              {l.label}
            </span>
          </div>
        ))}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "3px",
            marginLeft: "6px",
          }}
        >
          <div
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "2px",
              background: "#1A2A1A",
              border: "1px solid rgba(200,169,110,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Check size={7} color="rgba(255,255,255,0.6)" />
          </div>
          <span style={{ fontFamily: MONO, fontSize: "9px", color: "#504E4A" }}>
            watched
          </span>
        </div>
      </div>
    </div>
  );
}
