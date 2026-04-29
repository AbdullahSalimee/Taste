"use client";
import { useState, useEffect } from "react";
import { RotateCcw, Star, StickyNote, Calendar } from "lucide-react";

const SERIF = "Playfair Display, Georgia, serif";
const SANS = "Inter, system-ui, sans-serif";
const MONO = "JetBrains Mono, Courier New, monospace";

interface DiaryEntry {
  id: string;
  watched_at: string;
  status: string;
  user_rating: number | null;
  note: string | null;
  rewatch: boolean;
  rewatch_count: number;
}

interface Props {
  tmdbId: number;
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <span style={{ color: "#C8A96E", fontSize: "12px", letterSpacing: "0.5px" }}>
      {[1,2,3,4,5].map(s => rating >= s ? "★" : rating >= s - 0.5 ? "⯨" : "☆").join("")}
    </span>
  );
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });
}

export function DiarySection({ tmdbId }: Props) {
  // Read from localStorage (the local log store)
  const [entries, setEntries] = useState<DiaryEntry[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("taste_logs");
      if (!raw) return;
      const allLogs: any[] = JSON.parse(raw);
      const matching = allLogs
        .filter(l => l.tmdb_id === tmdbId)
        .sort((a, b) => new Date(b.watched_at).getTime() - new Date(a.watched_at).getTime());
      setEntries(matching.map(l => ({
        id: l.id,
        watched_at: l.watched_at,
        status: l.status,
        user_rating: l.user_rating ?? null,
        note: l.note ?? null,
        rewatch: l.rewatch ?? false,
        rewatch_count: l.rewatch_count ?? 0,
      })));
    } catch {}
  }, [tmdbId]);

  // Listen for log changes
  useEffect(() => {
    function refresh() {
      if (typeof window === "undefined") return;
      try {
        const raw = localStorage.getItem("taste_logs");
        if (!raw) return;
        const allLogs: any[] = JSON.parse(raw);
        const matching = allLogs
          .filter(l => l.tmdb_id === tmdbId)
          .sort((a, b) => new Date(b.watched_at).getTime() - new Date(a.watched_at).getTime());
        setEntries(matching.map(l => ({
          id: l.id,
          watched_at: l.watched_at,
          status: l.status,
          user_rating: l.user_rating ?? null,
          note: l.note ?? null,
          rewatch: l.rewatch ?? false,
          rewatch_count: l.rewatch_count ?? 0,
        })));
      } catch {}
    }
    window.addEventListener("taste_logs_changed", refresh);
    return () => window.removeEventListener("taste_logs_changed", refresh);
  }, [tmdbId]);

  if (entries.length === 0) return null;

  const ratings = entries.filter(e => e.user_rating).map(e => e.user_rating!);
  const avgRating = ratings.length > 0
    ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
    : null;
  const rewatchCount = entries.filter(e => e.rewatch).length;

  return (
    <div style={{ marginTop: "32px", paddingTop: "28px", borderTop: "1px solid #1A1A1A" }}>
      {/* Section header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Calendar size={14} color="#C8A96E" />
          <p style={{ fontFamily: SANS, fontSize: "10px", color: "#504E4A", textTransform: "uppercase", letterSpacing: "0.14em" }}>
            Your diary
          </p>
        </div>
        <div style={{ display: "flex", gap: "14px" }}>
          {entries.length > 1 && (
            <span style={{ fontFamily: MONO, fontSize: "11px", color: "#504E4A" }}>
              {entries.length} watches
            </span>
          )}
          {rewatchCount > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <RotateCcw size={10} color="#C8A96E" />
              <span style={{ fontFamily: SANS, fontSize: "11px", color: "#C8A96E" }}>
                {rewatchCount} rewatch{rewatchCount > 1 ? "es" : ""}
              </span>
            </div>
          )}
          {avgRating && entries.length > 1 && (
            <span style={{ fontFamily: MONO, fontSize: "11px", color: "#C8A96E" }}>
              avg ★{avgRating}
            </span>
          )}
        </div>
      </div>

      {/* Rating arc — only show if multiple ratings exist */}
      {ratings.length > 1 && (
        <div style={{
          display: "flex", alignItems: "flex-end", gap: "4px", height: "32px",
          marginBottom: "16px", padding: "0 2px",
        }}>
          {[...entries].reverse().filter(e => e.user_rating).map((e, i) => {
            const h = Math.round((e.user_rating! / 5) * 28);
            return (
              <div key={e.id} title={`${formatDate(e.watched_at)}: ★${e.user_rating}`} style={{
                flex: 1, height: `${h}px`, borderRadius: "2px 2px 0 0",
                background: i === entries.filter(x => x.user_rating).length - 1
                  ? "#C8A96E" : "rgba(200,169,110,0.35)",
                minWidth: "12px", maxWidth: "40px", cursor: "default",
                transition: "background 0.15s",
              }}
                onMouseEnter={e => (e.currentTarget.style.background = "#C8A96E")}
                onMouseLeave={(e) => {
                  const isLast = i === entries.filter(x => x.user_rating).length - 1;
                  e.currentTarget.style.background = isLast ? "#C8A96E" : "rgba(200,169,110,0.35)";
                }}
              />
            );
          })}
        </div>
      )}

      {/* Entries list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {entries.map((entry, i) => (
          <div key={entry.id} style={{
            padding: "12px 14px",
            background: i === 0 ? "#141414" : "#0F0F0F",
            border: `1px solid ${i === 0 ? "#2A2A2A" : "#1A1A1A"}`,
            borderRadius: "10px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: entry.note ? "8px" : "0" }}>
              {/* Status pill */}
              <span style={{
                fontFamily: SANS, fontSize: "10px", fontWeight: 600,
                padding: "2px 8px", borderRadius: "4px", textTransform: "capitalize",
                background: entry.status === "watched"
                  ? "rgba(200,169,110,0.12)" : entry.status === "watching"
                  ? "rgba(74,158,107,0.12)" : "rgba(138,74,74,0.12)",
                color: entry.status === "watched" ? "#C8A96E"
                  : entry.status === "watching" ? "#4A9E6B" : "#8A4A4A",
              }}>
                {entry.status}
              </span>

              {/* Rewatch badge */}
              {entry.rewatch && (
                <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                  <RotateCcw size={10} color="#5C4A8A" />
                  <span style={{ fontFamily: SANS, fontSize: "10px", color: "#5C4A8A" }}>Rewatch</span>
                </div>
              )}

              {/* Rating */}
              {entry.user_rating && (
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <StarDisplay rating={entry.user_rating} />
                  <span style={{ fontFamily: MONO, fontSize: "10px", color: "#504E4A" }}>
                    {entry.user_rating}/5
                  </span>
                </div>
              )}

              {/* Date */}
              <span style={{ marginLeft: "auto", fontFamily: MONO, fontSize: "10px", color: "#504E4A" }}>
                {formatDate(entry.watched_at)}
              </span>
            </div>

            {/* Note */}
            {entry.note && (
              <div style={{
                padding: "8px 10px", background: "#0D0D0D",
                border: "1px solid #1A1A1A", borderRadius: "6px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "4px" }}>
                  <StickyNote size={10} color="#504E4A" />
                  <span style={{ fontFamily: SANS, fontSize: "9px", color: "#504E4A", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    Note
                  </span>
                </div>
                <p style={{ fontFamily: SANS, fontSize: "12px", color: "#8A8780", lineHeight: 1.6, fontStyle: "italic" }}>
                  "{entry.note}"
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}