"use client";
import { useState } from "react";
import { Share2, Download } from "lucide-react";
import { MOCK_USER } from "@/lib/mock-data";

const SERIF = "Playfair Display, Georgia, serif";
const SANS  = "Inter, system-ui, sans-serif";
const MONO  = "JetBrains Mono, Courier New, monospace";

interface TasteDNACardProps {
  user?: typeof MOCK_USER;
  compact?: boolean;
}

const GENRE_COLORS: Record<string, string> = {
  Drama: "#5C4A8A", Thriller: "#8A2A2A", Documentary: "#2A5C8A",
  "Sci-Fi": "#2A6A5C", Comedy: "#8A7A2A", Romance: "#8A2A5C",
  Horror: "#6A2A2A", Animation: "#2A6A8A",
};
const DECADE_COLORS: Record<string, string> = {
  "1950s": "#3A5A8A", "1960s": "#5A6A3A", "1970s": "#8A6A2A",
  "1980s": "#6A3A5A", "1990s": "#3A7A6A", "2000s": "#5A4A8A",
  "2010s": "#8A4A3A", "2020s": "#4A6A8A",
};

export function TasteDNACard({ user = MOCK_USER, compact = false }: TasteDNACardProps) {
  const [shared, setShared] = useState(false);

  const handleShare = () => {
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

  if (compact) {
    return (
      <div className="taste-dna-card" style={{
        position: "relative", overflow: "hidden", borderRadius: "8px",
        border: "1px solid #2A2A2A", background: "#141414", padding: "16px",
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontFamily: SANS, fontSize: "10px", color: "#504E4A", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "4px" }}>Taste DNA</p>
            <h3 className="archetype-shimmer" style={{ fontFamily: SERIF, fontSize: "20px", fontWeight: 700, lineHeight: 1.2 }}>
              {user.archetype}
            </h3>
            <p style={{ fontFamily: SANS, fontSize: "11px", color: "#504E4A", marginTop: "4px", fontStyle: "italic" }}>{user.archetype_desc}</p>
          </div>
          <button onClick={handleShare} style={{
            display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px",
            borderRadius: "6px", border: "1px solid #2A2A2A", background: "#1A1A1A",
            color: "#8A8780", fontFamily: SANS, fontSize: "11px", cursor: "pointer",
          }}>
            <Share2 size={12} />
            {shared ? "Copied!" : "Share"}
          </button>
        </div>

        {/* Genre pills */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "12px" }}>
          {user.taste_dna.top_genres.slice(0, 4).map((g) => (
            <span key={g.name} style={{
              padding: "2px 8px", borderRadius: "2px", fontSize: "10px", fontFamily: SANS, fontWeight: 500,
              background: `${GENRE_COLORS[g.name] || "#3A3A3A"}33`,
              color: GENRE_COLORS[g.name] || "#8A8780",
              border: `1px solid ${GENRE_COLORS[g.name] || "#3A3A3A"}44`,
            }}>
              {g.name} {g.pct}%
            </span>
          ))}
        </div>

        {/* Directors */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "8px" }}>
          {user.taste_dna.top_directors.slice(0, 3).map((d) => (
            <span key={d} style={{ color: "#504E4A", fontSize: "10px", fontFamily: SANS }}>{d} ·</span>
          ))}
        </div>
      </div>
    );
  }

  // Full card
  return (
    <div className="taste-dna-card" style={{
      position: "relative", overflow: "hidden", borderRadius: "12px",
      border: "1px solid #2A2A2A",
      background: "linear-gradient(135deg, #141414 0%, #111111 50%, #0D0D0D 100%)",
    }}>
      {/* Top film strip */}
      <div style={{ display: "flex", height: "24px", borderBottom: "1px solid #1A1A1A" }}>
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} style={{ flex: 1, borderRight: "1px solid #1A1A1A", background: "#0D0D0D", height: "6px", margin: "6px 0" }} />
        ))}
      </div>

      <div style={{ padding: "24px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "24px" }}>
          <div>
            <p style={{ fontFamily: SANS, fontSize: "9px", color: "#504E4A", textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: "8px" }}>TASTE — DNA CARD</p>
            <p style={{ fontFamily: SANS, fontSize: "14px", color: "#8A8780", marginBottom: "4px" }}>{user.display_name}</p>
            <h2 className="archetype-shimmer" style={{ fontFamily: SERIF, fontSize: "28px", fontWeight: 700, lineHeight: 1.2 }}>
              {user.archetype}
            </h2>
            <p style={{ fontFamily: SANS, fontSize: "13px", color: "#8A8780", marginTop: "8px", fontStyle: "italic", lineHeight: 1.5 }}>
              {user.archetype_desc}
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", flexShrink: 0 }}>
            <button onClick={handleShare} style={{
              display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px",
              borderRadius: "6px", border: "1px solid #2A2A2A", background: "#1A1A1A",
              color: "#8A8780", fontFamily: SANS, fontSize: "11px", cursor: "pointer",
            }}>
              <Share2 size={12} />
              {shared ? "Copied!" : "Share"}
            </button>
            <button style={{
              display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px",
              borderRadius: "6px", border: "1px solid #2A2A2A", background: "#1A1A1A",
              color: "#504E4A", fontFamily: SANS, fontSize: "11px", cursor: "pointer",
            }}>
              <Download size={12} /> PNG
            </button>
          </div>
        </div>

        {/* Genre bars */}
        <div style={{ marginBottom: "20px" }}>
          <p style={{ fontFamily: SANS, fontSize: "9px", color: "#504E4A", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "12px" }}>Genres</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {user.taste_dna.top_genres.map((g, i) => (
              <div key={g.name} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontFamily: SANS, fontSize: "11px", color: GENRE_COLORS[g.name] || "#8A8780", width: "88px", flexShrink: 0 }}>{g.name}</span>
                <div style={{ flex: 1, height: "4px", background: "#1A1A1A", borderRadius: "2px", overflow: "hidden" }}>
                  <div className="decade-bar" style={{
                    height: "100%", borderRadius: "2px", width: `${g.pct}%`,
                    background: GENRE_COLORS[g.name] || "#3A3A3A",
                    "--bar-delay": `${i * 80}ms`,
                  } as React.CSSProperties} />
                </div>
                <span style={{ fontFamily: MONO, fontSize: "9px", color: "#504E4A", width: "28px", textAlign: "right" }}>{g.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Decade heat strip */}
        <div style={{ marginBottom: "20px" }}>
          <p style={{ fontFamily: SANS, fontSize: "9px", color: "#504E4A", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "12px" }}>Decades</p>
          <div style={{ display: "flex", gap: "4px" }}>
            {user.taste_dna.decade_dist.map((d, i) => (
              <div key={d.decade} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                <div className="decade-bar" style={{
                  width: "100%", height: `${Math.max(4, d.pct * 2)}px`,
                  background: DECADE_COLORS[d.decade] || "#3A3A3A",
                  borderRadius: "2px", opacity: 0.7 + (d.pct / 100) * 0.3,
                  "--bar-delay": `${i * 60}ms`,
                } as React.CSSProperties} />
                <span style={{ fontFamily: MONO, fontSize: "7px", color: "#504E4A" }}>{d.decade.slice(2)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Directors */}
        <div style={{ paddingTop: "16px", borderTop: "1px solid #1A1A1A", marginBottom: "16px" }}>
          <p style={{ fontFamily: SANS, fontSize: "9px", color: "#504E4A", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "8px" }}>Directors</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 12px" }}>
            {user.taste_dna.top_directors.map((d) => (
              <span key={d} style={{ fontFamily: SANS, fontSize: "11px", color: "#8A8780" }}>{d}</span>
            ))}
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", paddingTop: "16px", borderTop: "1px solid #1A1A1A" }}>
          {[
            { val: user.stats.total_films.toLocaleString(), label: "Films" },
            { val: user.stats.total_series, label: "Series" },
            { val: `${(user.stats.total_hours / 24).toFixed(0)}d`, label: "Watched" },
          ].map(({ val, label }) => (
            <div key={label}>
              <p style={{ fontFamily: MONO, color: "#C8A96E", fontSize: "18px", fontWeight: 500 }}>{val}</p>
              <p style={{ fontFamily: SANS, color: "#504E4A", fontSize: "10px", marginTop: "2px" }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom film strip */}
      <div style={{ display: "flex", height: "24px", borderTop: "1px solid #1A1A1A" }}>
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} style={{ flex: 1, borderRight: "1px solid #1A1A1A", background: "#0D0D0D", height: "6px", margin: "6px 0" }} />
        ))}
      </div>
    </div>
  );
}
