"use client";
import { useState } from "react";
import { Check, Plus, Eye } from "lucide-react";

interface Props {
  title: string; year: number; poster_url: string;
  tmdb_rating?: number; user_rating?: number | null;
  status?: string; size?: "sm" | "md" | "lg";
  onClick?: () => void;
}

const MONO = "JetBrains Mono, Courier New, monospace";

const SIZES = {
  sm: { w: "80px", h: "120px" },
  md: { w: "96px", h: "144px" },
  lg: { w: "128px", h: "192px" },
};

export function FilmCard({ title, year, poster_url, user_rating, status, size = "md", onClick }: Props) {
  const [err, setErr] = useState(false);
  const { w, h } = SIZES[size];

  return (
    <div className="film-card" onClick={onClick}
      style={{ position: "relative", width: w, height: h, flexShrink: 0, cursor: "pointer" }}
      role="button" tabIndex={0}>
      <div style={{ position: "absolute", inset: 0, borderRadius: "4px", overflow: "hidden", background: "#1A1A1A" }}>
        {!err ? (
          <img src={poster_url} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={() => setErr(true)} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: "8px" }}>
            <span style={{ color: "#504E4A", fontSize: "10px", textAlign: "center", fontFamily: "Inter, sans-serif" }}>{title}</span>
          </div>
        )}
        {/* Hover gradient */}
        <div className="card-overlay" style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to top, rgba(13,13,13,0.9) 0%, transparent 60%)",
        }} />
        {/* Rating */}
        {user_rating && (
          <div className="card-overlay" style={{ position: "absolute", bottom: "6px", right: "5px", display: "flex", alignItems: "center", gap: "2px" }}>
            <span style={{ fontFamily: MONO, fontSize: "9px", color: "#C8A96E" }}>★ {user_rating}</span>
          </div>
        )}
      </div>

      {/* Status pill */}
      {status && status !== "watchlist" && (
        <div style={{
          position: "absolute", top: "5px", left: "5px",
          width: "16px", height: "16px", borderRadius: "2px",
          display: "flex", alignItems: "center", justifyContent: "center",
          background: status === "watched" ? "rgba(200,169,110,0.2)" : "rgba(74,158,107,0.15)",
          border: status === "watched" ? "1px solid rgba(200,169,110,0.4)" : "1px solid rgba(74,158,107,0.3)",
        }}>
          {status === "watched" && <Check size={9} color="#C8A96E" />}
          {status === "watching" && <Eye size={9} color="#4A9E6B" />}
        </div>
      )}
      {status === "watchlist" && (
        <div style={{
          position: "absolute", top: "5px", left: "5px",
          width: "16px", height: "16px", borderRadius: "2px",
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(20,20,20,0.9)", border: "1px solid #2A2A2A",
        }}>
          <Plus size={9} color="#8A8780" />
        </div>
      )}
    </div>
  );
}

export function FilmCardSkeleton({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const { w, h } = SIZES[size];
  return <div className="skeleton" style={{ width: w, height: h, borderRadius: "4px", flexShrink: 0 }} />;
}
