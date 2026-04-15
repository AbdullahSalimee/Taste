"use client";
import { useState, useEffect } from "react";
import { Share2, Download, RefreshCw } from "lucide-react";
import { useStats, useUserProfile } from "@/lib/hooks";

const SERIF = "Playfair Display, Georgia, serif";
const SANS = "Inter, system-ui, sans-serif";
const MONO = "JetBrains Mono, Courier New, monospace";

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

interface TasteDNACardProps {
  compact?: boolean;
}

export function TasteDNACard({ compact = false }: TasteDNACardProps) {
  const stats = useStats();
  const profile = useUserProfile();
  const [shared, setShared] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [aiData, setAiData] = useState<{
    archetype: string;
    archetype_desc: string;
    insights: string[];
  } | null>(null);

  const archetype =
    aiData?.archetype || profile.archetype || "Cinematic Explorer";
  const archetypeDesc =
    aiData?.archetype_desc ||
    profile.archetype_desc ||
    "Your taste spans eras and genres.";

  // Auto-generate when we have enough data
  useEffect(() => {
    if (stats.total_films >= 3 && !aiData && !generating) {
      generateDNA();
    }
  }, [stats.total_films]);

  async function generateDNA() {
    setGenerating(true);
    try {
      const res = await fetch("/api/taste-dna", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          genres: stats.top_genres,
          directors: stats.top_directors,
          decades: [],
          ratings: [],
        }),
      });
      const data = await res.json();
      setAiData(data);
    } catch (err) {
      console.error("DNA generation failed", err);
    } finally {
      setGenerating(false);
    }
  }

  const handleShare = () => {
    const text = `My cinema identity on Taste: "${archetype}" — ${archetypeDesc}`;
    navigator.clipboard.writeText(text).catch(() => {});
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

  if (compact) {
    return (
      <div
        className="taste-dna-card"
        style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: "8px",
          border: "1px solid #2A2A2A",
          background: "#141414",
          padding: "16px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontFamily: SANS,
                fontSize: "10px",
                color: "#504E4A",
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                marginBottom: "4px",
              }}
            >
              Taste DNA
            </p>
            <h3
              className="archetype-shimmer"
              style={{
                fontFamily: SERIF,
                fontSize: "20px",
                fontWeight: 700,
                lineHeight: 1.2,
              }}
            >
              {generating ? "Analyzing..." : archetype}
            </h3>
            <p
              style={{
                fontFamily: SANS,
                fontSize: "11px",
                color: "#504E4A",
                marginTop: "4px",
                fontStyle: "italic",
              }}
            >
              {archetypeDesc}
            </p>
          </div>
          <button
            onClick={handleShare}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 12px",
              borderRadius: "6px",
              border: "1px solid #2A2A2A",
              background: "#1A1A1A",
              color: "#8A8780",
              fontFamily: SANS,
              fontSize: "11px",
              cursor: "pointer",
              flexShrink: 0,
              marginLeft: "12px",
            }}
          >
            <Share2 size={12} />
            {shared ? "Copied!" : "Share"}
          </button>
        </div>

        {stats.top_genres.length > 0 && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "6px",
              marginTop: "12px",
            }}
          >
            {stats.top_genres.slice(0, 4).map((g) => (
              <span
                key={g.name}
                style={{
                  padding: "2px 8px",
                  borderRadius: "2px",
                  fontSize: "10px",
                  fontFamily: SANS,
                  fontWeight: 500,
                  background: `${GENRE_COLORS[g.name] || "#3A3A3A"}33`,
                  color: GENRE_COLORS[g.name] || "#8A8780",
                  border: `1px solid ${GENRE_COLORS[g.name] || "#3A3A3A"}44`,
                }}
              >
                {g.name} {g.pct}%
              </span>
            ))}
          </div>
        )}

        {stats.top_directors.length > 0 && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "4px",
              marginTop: "8px",
            }}
          >
            {stats.top_directors.slice(0, 3).map((d) => (
              <span
                key={d}
                style={{ color: "#504E4A", fontSize: "10px", fontFamily: SANS }}
              >
                {d} ·
              </span>
            ))}
          </div>
        )}

        {stats.total_films === 0 && (
          <p
            style={{
              fontFamily: SANS,
              fontSize: "11px",
              color: "#504E4A",
              marginTop: "8px",
              fontStyle: "italic",
            }}
          >
            Log films to generate your DNA card
          </p>
        )}
      </div>
    );
  }

  // Full card
  return (
    <div
      className="taste-dna-card"
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: "12px",
        border: "1px solid #2A2A2A",
        background:
          "linear-gradient(135deg, #141414 0%, #111111 50%, #0D0D0D 100%)",
      }}
    >
      {/* Top film strip */}
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

      <div style={{ padding: "24px" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: "24px",
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
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
            <p
              style={{
                fontFamily: SANS,
                fontSize: "14px",
                color: "#8A8780",
                marginBottom: "4px",
              }}
            >
              {profile.display_name}
            </p>
            <h2
              className="archetype-shimmer"
              style={{
                fontFamily: SERIF,
                fontSize: "28px",
                fontWeight: 700,
                lineHeight: 1.2,
              }}
            >
              {generating ? "Analyzing taste..." : archetype}
            </h2>
            <p
              style={{
                fontFamily: SANS,
                fontSize: "13px",
                color: "#8A8780",
                marginTop: "8px",
                fontStyle: "italic",
                lineHeight: 1.5,
              }}
            >
              {archetypeDesc}
            </p>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              flexShrink: 0,
              marginLeft: "16px",
            }}
          >
            <button
              onClick={handleShare}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 12px",
                borderRadius: "6px",
                border: "1px solid #2A2A2A",
                background: "#1A1A1A",
                color: "#8A8780",
                fontFamily: SANS,
                fontSize: "11px",
                cursor: "pointer",
              }}
            >
              <Share2 size={12} />
              {shared ? "Copied!" : "Share"}
            </button>
            <button
              onClick={generateDNA}
              disabled={generating}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 12px",
                borderRadius: "6px",
                border: "1px solid #2A2A2A",
                background: "#1A1A1A",
                color: "#504E4A",
                fontFamily: SANS,
                fontSize: "11px",
                cursor: generating ? "default" : "pointer",
                opacity: generating ? 0.5 : 1,
              }}
            >
              <RefreshCw size={12} /> Refresh
            </button>
          </div>
        </div>

        {/* Genre bars */}
        {stats.top_genres.length > 0 && (
          <div style={{ marginBottom: "20px" }}>
            <p
              style={{
                fontFamily: SANS,
                fontSize: "9px",
                color: "#504E4A",
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                marginBottom: "12px",
              }}
            >
              Genres
            </p>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              {stats.top_genres.map((g, i) => (
                <div
                  key={g.name}
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <span
                    style={{
                      fontFamily: SANS,
                      fontSize: "11px",
                      color: GENRE_COLORS[g.name] || "#8A8780",
                      width: "100px",
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
                          borderRadius: "2px",
                          width: `${g.pct}%`,
                          background: GENRE_COLORS[g.name] || "#3A3A3A",
                          "--bar-delay": `${i * 80}ms`,
                        } as React.CSSProperties
                      }
                    />
                  </div>
                  <span
                    style={{
                      fontFamily: MONO,
                      fontSize: "9px",
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

        {/* Directors */}
        {stats.top_directors.length > 0 && (
          <div
            style={{
              paddingTop: "16px",
              borderTop: "1px solid #1A1A1A",
              marginBottom: "16px",
            }}
          >
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
              Directors
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 12px" }}>
              {stats.top_directors.map((d) => (
                <span
                  key={d}
                  style={{
                    fontFamily: SANS,
                    fontSize: "11px",
                    color: "#8A8780",
                  }}
                >
                  {d}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Stats row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "16px",
            paddingTop: "16px",
            borderTop: "1px solid #1A1A1A",
          }}
        >
          {[
            { val: stats.total_films.toLocaleString(), label: "Films" },
            { val: stats.total_series, label: "Series" },
            { val: `${stats.total_hours}h`, label: "Watched" },
          ].map(({ val, label }) => (
            <div key={label}>
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

        {stats.total_films === 0 && (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <p
              style={{
                fontFamily: SANS,
                fontSize: "13px",
                color: "#504E4A",
                fontStyle: "italic",
              }}
            >
              Log films to generate your Taste DNA
            </p>
          </div>
        )}
      </div>

      {/* Bottom film strip */}
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
    </div>
  );
}
