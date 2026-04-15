"use client";
import { useState } from "react";
import { MOCK_HEATMAP } from "@/lib/mock-data";

const SANS = "Inter, system-ui, sans-serif";
const MONO = "JetBrains Mono, Courier New, monospace";

function ratingToColor(r: number) {
  if (r >= 9.0) return "#1B5E20";
  if (r >= 8.5) return "#2E7D32";
  if (r >= 8.0) return "#388E3C";
  if (r >= 7.5) return "#558B2F";
  if (r >= 7.0) return "#C87C2A";
  if (r >= 6.5) return "#BF360C";
  if (r >= 6.0) return "#8B2500";
  return "#5C1E0A";
}

interface HoveredEp { s: number; e: number; title: string; rating: number; x: number; y: number; }

export function EpisodeHeatmap({ data = MOCK_HEATMAP }: { data?: typeof MOCK_HEATMAP }) {
  const [hovered, setHovered] = useState<HoveredEp | null>(null);
  let idx = 0;

  return (
    <div style={{ position: "relative" }}>
      {/* Arc preview */}
      <div style={{
        marginBottom: "16px", padding: "12px",
        borderRadius: "6px", border: "1px solid rgba(42,106,92,0.3)",
        background: "rgba(42,106,92,0.08)",
      }}>
        <p style={{ fontFamily: SANS, fontSize: "11px", color: "#4A9E6B", fontWeight: 500, marginBottom: "4px" }}>Viewing Guide</p>
        <p style={{ fontFamily: SANS, fontSize: "11px", color: "#8A8780", lineHeight: 1.5 }}>
          This show has a slow mid-run in Season 2 — users with your taste profile consistently rate it 9+ by the finale. The Return (S3) is the series peak. Don&apos;t quit early.
        </p>
      </div>

      {/* Grid */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {data.seasons.map(season => (
          <div key={season.number}>
            <p style={{ fontFamily: MONO, fontSize: "9px", color: "#504E4A", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "8px" }}>
              Season {season.number}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
              {season.episodes.map(ep => {
                const cellIdx = idx++;
                return (
                  <div key={ep.ep} className="heatmap-cell" style={{
                    width: "28px", height: "28px", borderRadius: "3px", cursor: "pointer",
                    backgroundColor: ratingToColor(ep.rating),
                    border: "1px solid rgba(0,0,0,0.4)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    position: "relative", transition: "transform 0.15s ease",
                    "--cell-delay": `${cellIdx * 8}ms`,
                  } as React.CSSProperties}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.transform = "scale(1.15)";
                    (e.currentTarget as HTMLElement).style.zIndex = "10";
                    const r = e.currentTarget.getBoundingClientRect();
                    setHovered({ s: season.number, e: ep.ep, title: ep.title, rating: ep.rating, x: r.left, y: r.top });
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.transform = "scale(1)";
                    (e.currentTarget as HTMLElement).style.zIndex = "1";
                    setHovered(null);
                  }}
                  >
                    <span style={{ fontSize: "7px", fontFamily: MONO, color: "rgba(255,255,255,0.65)", fontWeight: 500 }}>{ep.ep}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "16px" }}>
        <span style={{ fontFamily: SANS, fontSize: "10px", color: "#504E4A" }}>Low</span>
        <div style={{ display: "flex", gap: "3px" }}>
          {["#5C1E0A","#8B2500","#BF360C","#C87C2A","#558B2F","#388E3C","#2E7D32","#1B5E20"].map(c => (
            <div key={c} style={{ width: "16px", height: "10px", borderRadius: "2px", backgroundColor: c }} />
          ))}
        </div>
        <span style={{ fontFamily: SANS, fontSize: "10px", color: "#504E4A" }}>High</span>
      </div>

      {/* Tooltip */}
      {hovered && (
        <div style={{
          position: "fixed", zIndex: 9999, pointerEvents: "none",
          left: hovered.x, top: hovered.y - 64,
          background: "#1A1A1A", border: "1px solid #2A2A2A",
          borderRadius: "6px", padding: "8px 12px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
        }}>
          <p style={{ fontFamily: SANS, fontSize: "11px", color: "#F0EDE8", fontWeight: 500 }}>
            S{String(hovered.s).padStart(2,"0")}E{String(hovered.e).padStart(2,"0")} — {hovered.title}
          </p>
          <p style={{ fontFamily: MONO, fontSize: "11px", color: "#C8A96E", marginTop: "2px" }}>★ {hovered.rating}</p>
        </div>
      )}
    </div>
  );
}
