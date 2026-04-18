"use client";
import { useState } from "react";
import { Share2, Send } from "lucide-react";
import { useStats, useUserProfile } from "@/lib/hooks";
import { SendToFriend } from "@/components/features/SendToFriend";

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

// ── Compute archetype from real user data, no AI ──────────────────────────────

function computeArchetype(params: {
  topGenre: string;
  topGenrePct: number;
  secondGenre: string | null;
  topDirector: string | null;
  totalFilms: number;
  avgRating: number;
}): { archetype: string; archetype_desc: string } {
  const {
    topGenre,
    topGenrePct,
    secondGenre,
    topDirector,
    totalFilms,
    avgRating,
  } = params;

  // Not enough data yet
  if (!topGenre || totalFilms < 3) {
    return {
      archetype: "The Emerging Cinephile",
      archetype_desc: "Log a few more films — your identity is taking shape.",
    };
  }

  // ── Title ──────────────────────────────────────────────────────────────────

  let archetype: string;

  if (topGenrePct >= 55) {
    const single: Record<string, string> = {
      Drama: "The Drama Purist",
      Thriller: "The Tension Seeker",
      Documentary: "The Truth Chaser",
      "Sci-Fi": "The Sci-Fi Completionist",
      "Science Fiction": "The Sci-Fi Completionist",
      Comedy: "The Comedy Loyalist",
      Romance: "The Romance Devotee",
      Horror: "The Horror Obsessive",
      Animation: "The Animation Archivist",
      Action: "The Action Regular",
      Crime: "The Crime Genre Regular",
      History: "The Historical Record",
      Mystery: "The Mystery Devotee",
      Adventure: "The Adventure Completionist",
      Fantasy: "The Fantasy Loyalist",
      War: "The War Cinema Devotee",
    };
    archetype = single[topGenre] ?? `The ${topGenre} Purist`;
  } else if (secondGenre) {
    const key = [topGenre, secondGenre].sort().join("+");
    const combos: Record<string, string> = {
      "Drama+Thriller": "The Dark Drama Specialist",
      "Crime+Drama": "The Crime Drama Regular",
      "Drama+History": "The Period Drama Collector",
      "Drama+Romance": "The Emotional Cinema Devotee",
      "Horror+Thriller": "The Dread Merchant",
      "Sci-Fi+Thriller": "The Paranoid Futurist",
      "Action+Crime": "The Genre Pragmatist",
      "Comedy+Drama": "The Dramedy Curator",
      "Documentary+Drama": "The Reality-Adjacent Viewer",
      "Drama+Mystery": "The Slow Burn Collector",
      "Horror+Mystery": "The Unease Collector",
      "Action+Thriller": "The High-Stakes Regular",
    };
    archetype = combos[key] ?? `The ${topGenre}–${secondGenre} Viewer`;
  } else {
    archetype =
      totalFilms >= 200
        ? "The Dedicated Archivist"
        : totalFilms >= 50
          ? "The Steady Collector"
          : "The Emerging Cinephile";
  }

  // ── Description ───────────────────────────────────────────────────────────

  const ratingNote =
    avgRating >= 8.0
      ? "You rate generously — most films earn their keep."
      : avgRating >= 7.0
        ? "Your ratings run high; disappointment is rare."
        : avgRating >= 5.5
          ? "You hold a critical line — a 7 from you means something."
          : avgRating > 0
            ? "You're a tough critic — your stars are hard-won."
            : "";

  const directorNote = topDirector
    ? `${topDirector} is your most-watched director.`
    : "";

  let archetype_desc: string;

  if (topGenrePct >= 55 && directorNote) {
    archetype_desc =
      `${topGenrePct}% of your log is ${topGenre}. ${directorNote} ${ratingNote}`.trim();
  } else if (topGenrePct >= 55) {
    archetype_desc =
      `${topGenrePct}% ${topGenre} — a focused log with a clear centre of gravity. ${ratingNote}`.trim();
  } else if (secondGenre && directorNote) {
    archetype_desc =
      `${topGenre} and ${secondGenre} split your attention. ${directorNote} ${ratingNote}`.trim();
  } else if (secondGenre) {
    archetype_desc =
      `${topGenre} (${topGenrePct}%) and ${secondGenre} define your watching. ${ratingNote}`.trim();
  } else if (totalFilms >= 200) {
    archetype_desc =
      `${totalFilms} films logged — breadth over depth, no single genre claiming you. ${ratingNote}`.trim();
  } else {
    archetype_desc = ratingNote || "Your log is taking shape — keep watching.";
  }

  return { archetype, archetype_desc };
}

// ─────────────────────────────────────────────────────────────────────────────

interface TasteDNACardProps {
  compact?: boolean;
}

export function TasteDNACard({ compact = false }: TasteDNACardProps) {
  const stats = useStats();
  const profile = useUserProfile();
  const [shared, setShared] = useState(false);
  const [sendDnaOpen, setSendDnaOpen] = useState(false);

  const { archetype, archetype_desc } = computeArchetype({
    topGenre: stats.top_genres[0]?.name ?? "",
    topGenrePct: stats.top_genres[0]?.pct ?? 0,
    secondGenre: stats.top_genres[1]?.name ?? null,
    topDirector: stats.top_directors[0] ?? null,
    totalFilms: stats.total_films,
    avgRating: stats.avg_rating ?? 0,
  });

  const handleShare = () => {
    const text = `My cinema identity on Taste: "${archetype}" — ${archetype_desc}`;
    navigator.clipboard.writeText(text).catch(() => {});
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

  const buttonStyle = {
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
  };

  if (compact) {
    return (
      <>
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
                {archetype}
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
                {archetype_desc}
              </p>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                marginLeft: "12px",
              }}
            >
              <button onClick={handleShare} style={buttonStyle}>
                <Share2 size={12} />
                {shared ? "Copied!" : "Share"}
              </button>
              <button onClick={() => setSendDnaOpen(true)} style={buttonStyle}>
                <Send size={12} />
                Send
              </button>
            </div>
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
                  style={{
                    color: "#504E4A",
                    fontSize: "10px",
                    fontFamily: SANS,
                  }}
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

        {sendDnaOpen && (
          <SendToFriend
            mode="dna"
            dnaData={{
              archetype,
              archetype_desc,
              top_genres: stats.top_genres,
              total_films: stats.total_films,
              total_series: stats.total_series,
            }}
            onClose={() => setSendDnaOpen(false)}
          />
        )}
      </>
    );
  }

  // Full card
  return (
    <>
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
                {archetype}
              </h2>
              <p
                style={{
                  fontFamily: SANS,
                  fontSize: "13px",
                  color: "#8A8780",
                  marginTop: "8px",
                  fontStyle: "italic",
                  lineHeight: 1.5,
                  maxWidth: "360px",
                }}
              >
                {archetype_desc}
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
              <button onClick={handleShare} style={buttonStyle}>
                <Share2 size={12} />
                {shared ? "Copied!" : "Share"}
              </button>
              <button onClick={() => setSendDnaOpen(true)} style={buttonStyle}>
                <Send size={12} />
                Send
              </button>
            </div>
          </div>

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
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
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

      

          <div
            className="justify-center items-center"
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
              <div
              className="flex flex-col items-center"
                key={label}>
                <p
                  className="w-fit"
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

      {sendDnaOpen && (
        <SendToFriend
          mode="dna"
          dnaData={{
            archetype,
            archetype_desc,
            top_genres: stats.top_genres,
            total_films: stats.total_films,
            total_series: stats.total_series,
          }}
          onClose={() => setSendDnaOpen(false)}
        />
      )}
    </>
  );
}
