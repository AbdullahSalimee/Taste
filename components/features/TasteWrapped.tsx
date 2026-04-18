"use client";
import { useState, useEffect, useRef } from "react";
import {
  Share2,
  ChevronRight,
  ChevronLeft,
  X,
  Film,
  Tv,
  Star,
  Clock,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";

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

// ── Wrapped Slides ─────────────────────────────────────────────────────────────

function SlideWrapper({
  children,
  bg = "#0D0D0D",
}: {
  children: React.ReactNode;
  bg?: string;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: bg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 24px",
        textAlign: "center",
        animation: "wrappedSlideIn 0.4s cubic-bezier(0.16,1,0.3,1)",
      }}
    >
      {children}
    </div>
  );
}

function BigNumber({
  val,
  label,
  accent = "#C8A96E",
}: {
  val: string | number;
  label: string;
  accent?: string;
}) {
  return (
    <div style={{ marginBottom: "8px" }}>
      <p
        style={{
          fontFamily: MONO,
          fontSize: "clamp(52px, 15vw, 80px)",
          fontWeight: 500,
          color: accent,
          lineHeight: 1,
          textShadow: `0 0 40px ${accent}66`,
        }}
      >
        {val}
      </p>
      <p
        style={{
          fontFamily: SANS,
          fontSize: "14px",
          color: "#8A8780",
          marginTop: "6px",
        }}
      >
        {label}
      </p>
    </div>
  );
}

interface WrappedData {
  year: number;
  total_films: number;
  total_series: number;
  total_hours: number;
  total_episodes: number;
  avg_rating: number;
  top_genres: { name: string; count: number; pct: number }[];
  top_directors: string[];
  most_watched_month: string;
  films_this_year: number; // released this year
  highest_rated: {
    title: string;
    rating: number;
    poster_url: string | null;
  } | null;
  archetype: string;
  archetype_desc: string;
}

function buildWrappedData(
  logs: any[],
  year: number,
  archetype: string,
  archetypeDesc: string,
): WrappedData {
  const yearLogs = logs.filter(
    (l) => new Date(l.watched_at).getFullYear() === year,
  );
  const films = yearLogs.filter(
    (l) => l.type === "film" || l.media_type === "movie",
  );
  const series = yearLogs.filter(
    (l) => l.type === "series" || l.media_type === "tv",
  );

  const genreCounts: Record<string, number> = {};
  const directorCounts: Record<string, number> = {};
  const monthCounts: Record<string, number> = {};

  for (const log of yearLogs) {
    const month = new Date(log.watched_at).toLocaleString("en-US", {
      month: "long",
    });
    monthCounts[month] = (monthCounts[month] || 0) + 1;
    for (const g of log.genres || [])
      genreCounts[g] = (genreCounts[g] || 0) + 1;
    if (log.director)
      directorCounts[log.director] = (directorCounts[log.director] || 0) + 1;
  }

  const topMonth =
    Object.entries(monthCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";
  const ratedLogs = yearLogs.filter((l) => l.user_rating);
  const avgRating =
    ratedLogs.length > 0
      ? ratedLogs.reduce((s, l) => s + l.user_rating, 0) / ratedLogs.length
      : 0;

  const highest = yearLogs
    .filter((l) => l.user_rating === 5)
    .sort(
      (a, b) =>
        new Date(b.watched_at).getTime() - new Date(a.watched_at).getTime(),
    )[0];

  const topGenres = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({
      name,
      count,
      pct: Math.round((count / Math.max(yearLogs.length, 1)) * 100),
    }));

  const topDirectors = Object.entries(directorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([n]) => n);

  return {
    year,
    total_films: films.length,
    total_series: new Set(series.map((s) => s.tmdb_id)).size,
    total_hours: Math.round(films.length * 1.75),
    total_episodes: series.length,
    avg_rating: avgRating,
    top_genres: topGenres,
    top_directors: topDirectors,
    most_watched_month: topMonth,
    films_this_year: 0,
    highest_rated: highest
      ? {
          title: highest.title,
          rating: highest.user_rating,
          poster_url: highest.poster_url,
        }
      : null,
    archetype,
    archetype_desc: archetypeDesc,
  };
}

// Individual Wrapped slides
function Slide1({ data }: { data: WrappedData }) {
  return (
    <SlideWrapper bg="linear-gradient(180deg, #0A0A0A 0%, #141008 100%)">
      <p
        style={{
          fontFamily: SANS,
          fontSize: "11px",
          color: "#504E4A",
          textTransform: "uppercase",
          letterSpacing: "0.3em",
          marginBottom: "24px",
        }}
      >
        taste · {data.year} wrapped
      </p>
      <h2
        style={{
          fontFamily: SERIF,
          fontSize: "clamp(32px, 10vw, 52px)",
          fontWeight: 700,
          color: "#F0EDE8",
          fontStyle: "italic",
          lineHeight: 1.1,
          marginBottom: "16px",
        }}
      >
        Your year in
        <br />
        <span style={{ color: "#C8A96E" }}>cinema.</span>
      </h2>
      <p
        style={{
          fontFamily: SANS,
          fontSize: "14px",
          color: "#504E4A",
          lineHeight: 1.7,
        }}
      >
        {data.total_films + data.total_series} titles watched
        <br />
        across {data.year}
      </p>
    </SlideWrapper>
  );
}

function Slide2({ data }: { data: WrappedData }) {
  return (
    <SlideWrapper bg="linear-gradient(180deg, #0D0A1A 0%, #0D0D0D 100%)">
      <p
        style={{
          fontFamily: SANS,
          fontSize: "11px",
          color: "#504E4A",
          textTransform: "uppercase",
          letterSpacing: "0.2em",
          marginBottom: "32px",
        }}
      >
        you watched
      </p>
      <BigNumber val={data.total_films} label="films" accent="#C8A96E" />
      <div
        style={{
          width: "40px",
          height: "1px",
          background: "#2A2A2A",
          margin: "12px 0",
        }}
      />
      <BigNumber val={data.total_series} label="series" accent="#5C4A8A" />
      <div
        style={{
          width: "40px",
          height: "1px",
          background: "#2A2A2A",
          margin: "12px 0",
        }}
      />
      <BigNumber
        val={`${data.total_hours}h`}
        label="total watch time"
        accent="#2A5C8A"
      />
    </SlideWrapper>
  );
}

function Slide3({ data }: { data: WrappedData }) {
  return (
    <SlideWrapper bg="linear-gradient(180deg, #0A0D0A 0%, #0D0D0D 100%)">
      <p
        style={{
          fontFamily: SANS,
          fontSize: "11px",
          color: "#504E4A",
          textTransform: "uppercase",
          letterSpacing: "0.2em",
          marginBottom: "24px",
        }}
      >
        your most active month
      </p>
      <p
        style={{
          fontFamily: SERIF,
          fontSize: "clamp(36px, 12vw, 60px)",
          fontWeight: 700,
          color: "#4A9E6B",
          fontStyle: "italic",
          lineHeight: 1,
          marginBottom: "20px",
        }}
      >
        {data.most_watched_month}
      </p>
      <p
        style={{
          fontFamily: SANS,
          fontSize: "13px",
          color: "#8A8780",
          lineHeight: 1.7,
          maxWidth: "260px",
        }}
      >
        That's when your cinema obsession hit its peak. Something must have been
        good on.
      </p>
    </SlideWrapper>
  );
}

function Slide4({ data }: { data: WrappedData }) {
  return (
    <SlideWrapper bg="linear-gradient(180deg, #1A0A0A 0%, #0D0D0D 100%)">
      <p
        style={{
          fontFamily: SANS,
          fontSize: "11px",
          color: "#504E4A",
          textTransform: "uppercase",
          letterSpacing: "0.2em",
          marginBottom: "24px",
        }}
      >
        your taste profile
      </p>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          width: "100%",
          maxWidth: "280px",
          marginBottom: "20px",
        }}
      >
        {data.top_genres.map((g, i) => (
          <div
            key={g.name}
            style={{ display: "flex", alignItems: "center", gap: "10px" }}
          >
            <span
              style={{
                fontFamily: MONO,
                fontSize: "9px",
                color: "#504E4A",
                width: "14px",
              }}
            >
              {i + 1}
            </span>
            <span
              style={{
                fontFamily: SANS,
                fontSize: "12px",
                color: GENRE_COLORS[g.name] || "#8A8780",
                width: "90px",
                textAlign: "left",
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
                style={{
                  height: "100%",
                  background: GENRE_COLORS[g.name] || "#C8A96E",
                  width: `${g.pct}%`,
                  animation: `barGrow 1s cubic-bezier(0.16,1,0.3,1) ${i * 80}ms both`,
                }}
              />
            </div>
            <span
              style={{ fontFamily: MONO, fontSize: "9px", color: "#504E4A" }}
            >
              {g.pct}%
            </span>
          </div>
        ))}
      </div>
    </SlideWrapper>
  );
}

function Slide5({ data }: { data: WrappedData }) {
  return (
    <SlideWrapper bg="linear-gradient(180deg, #0A0A1A 0%, #0D0D0D 100%)">
      {data.highest_rated ? (
        <>
          <p
            style={{
              fontFamily: SANS,
              fontSize: "11px",
              color: "#504E4A",
              textTransform: "uppercase",
              letterSpacing: "0.2em",
              marginBottom: "20px",
            }}
          >
            you gave 5 stars to
          </p>
          {data.highest_rated.poster_url && (
            <div
              style={{
                width: "120px",
                height: "180px",
                borderRadius: "6px",
                overflow: "hidden",
                boxShadow: "0 20px 60px rgba(200,169,110,0.25)",
                marginBottom: "16px",
              }}
            >
              <img
                src={data.highest_rated.poster_url}
                alt={data.highest_rated.title}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
          )}
          <p
            style={{
              fontFamily: SERIF,
              fontSize: "20px",
              fontWeight: 700,
              color: "#F0EDE8",
              fontStyle: "italic",
              marginBottom: "8px",
            }}
          >
            {data.highest_rated.title}
          </p>
          <p style={{ fontFamily: MONO, fontSize: "18px", color: "#C8A96E" }}>
            ★★★★★
          </p>
        </>
      ) : (
        <>
          <p
            style={{
              fontFamily: SANS,
              fontSize: "11px",
              color: "#504E4A",
              textTransform: "uppercase",
              letterSpacing: "0.2em",
              marginBottom: "24px",
            }}
          >
            your average rating
          </p>
          <BigNumber
            val={data.avg_rating > 0 ? data.avg_rating.toFixed(1) : "—"}
            label="out of 5"
            accent="#C8A96E"
          />
        </>
      )}
    </SlideWrapper>
  );
}

function Slide6({ data }: { data: WrappedData }) {
  return (
    <SlideWrapper bg="linear-gradient(135deg, #141410 0%, #0D0D0D 100%)">
      <p
        style={{
          fontFamily: SANS,
          fontSize: "11px",
          color: "#504E4A",
          textTransform: "uppercase",
          letterSpacing: "0.2em",
          marginBottom: "16px",
        }}
      >
        your cinema identity
      </p>
      {/* DNA Card mini */}
      <div
        style={{
          width: "100%",
          maxWidth: "300px",
          background: "linear-gradient(135deg, #1A1A10, #141414, #0D0D0D)",
          border: "1px solid rgba(200,169,110,0.3)",
          borderRadius: "12px",
          overflow: "hidden",
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            display: "flex",
            height: "16px",
            borderBottom: "1px solid #1A1A1A",
          }}
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                borderRight: "1px solid #1A1A1A",
                background: "#0A0A0A",
                height: "4px",
                margin: "4px 0",
              }}
            />
          ))}
        </div>
        <div style={{ padding: "16px" }}>
          <p
            style={{
              fontFamily: SANS,
              fontSize: "8px",
              color: "#504E4A",
              textTransform: "uppercase",
              letterSpacing: "0.2em",
              marginBottom: "6px",
            }}
          >
            TASTE · {data.year} · DNA
          </p>
          <p
            style={{
              fontFamily: SERIF,
              fontSize: "20px",
              fontWeight: 700,
              background:
                "linear-gradient(105deg, #C8A96E 0%, #F0EDE8 45%, #C8A96E 55%, #DFC080 100%)",
              backgroundSize: "300% auto",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              animation: "goldSweep 3s linear infinite",
              fontStyle: "italic",
              marginBottom: "4px",
            }}
          >
            {data.archetype}
          </p>
          <p
            style={{
              fontFamily: SANS,
              fontSize: "10px",
              color: "#8A8780",
              fontStyle: "italic",
              lineHeight: 1.5,
              marginBottom: "12px",
            }}
          >
            {data.archetype_desc}
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "10px",
              paddingTop: "10px",
              borderTop: "1px solid #1A1A1A",
            }}
          >
            {[
              [data.total_films, "Films"],
              [data.total_series, "Series"],
              [`${data.total_hours}h`, "Watched"],
            ].map(([v, l]) => (
              <div key={String(l)}>
                <p
                  style={{
                    fontFamily: MONO,
                    color: "#C8A96E",
                    fontSize: "14px",
                  }}
                >
                  {v}
                </p>
                <p
                  style={{
                    fontFamily: SANS,
                    color: "#504E4A",
                    fontSize: "8px",
                    marginTop: "1px",
                  }}
                >
                  {l}
                </p>
              </div>
            ))}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            height: "16px",
            borderTop: "1px solid #1A1A1A",
          }}
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                borderRight: "1px solid #1A1A1A",
                background: "#0A0A0A",
                height: "4px",
                margin: "4px 0",
              }}
            />
          ))}
        </div>
      </div>
      <p style={{ fontFamily: SANS, fontSize: "11px", color: "#504E4A" }}>
        {data.year} · taste.app
      </p>
    </SlideWrapper>
  );
}

const SLIDES = [Slide1, Slide2, Slide3, Slide4, Slide5, Slide6];

// ── Main Wrapped Modal ─────────────────────────────────────────────────────────
interface TasteWrappedProps {
  logs: any[];
  archetype: string;
  archetypeDesc: string;
  year?: number;
  onClose: () => void;
}

export function TasteWrapped({
  logs,
  archetype,
  archetypeDesc,
  year = new Date().getFullYear(),
  onClose,
}: TasteWrappedProps) {
  const [slide, setSlide] = useState(0);
  const [data] = useState<WrappedData>(() =>
    buildWrappedData(logs, year, archetype, archetypeDesc),
  );

  const SlideComponent = SLIDES[slide];

  function prev() {
    if (slide > 0) setSlide((s) => s - 1);
  }
  function next() {
    if (slide < SLIDES.length - 1) setSlide((s) => s + 1);
    else onClose();
  }

  function shareSlide() {
    navigator.clipboard
      .writeText(
        `My ${year} Taste Wrapped: ${data.total_films} films, ${data.total_series} series, ${data.total_hours}h watched. My identity: "${data.archetype}" — taste.app`,
      )
      .catch(() => {});
  }

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 950,
          background: "rgba(0,0,0,0.95)",
          backdropFilter: "blur(20px)",
        }}
      />

      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
          zIndex: 951,
          width: "min(420px, 95vw)",
          height: "min(680px, 90vh)",
          borderRadius: "20px",
          overflow: "hidden",
          border: "1px solid #2A2A2A",
          boxShadow: "0 40px 120px rgba(0,0,0,0.95)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Progress dots */}
        <div
          style={{
            position: "absolute",
            top: "16px",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: "5px",
            zIndex: 10,
          }}
        >
          {SLIDES.map((_, i) => (
            <div
              key={i}
              onClick={() => setSlide(i)}
              style={{
                width: i === slide ? "20px" : "6px",
                height: "6px",
                borderRadius: "3px",
                background: i === slide ? "#C8A96E" : "rgba(255,255,255,0.2)",
                transition: "all 0.3s ease",
                cursor: "pointer",
              }}
            />
          ))}
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            zIndex: 10,
            background: "rgba(0,0,0,0.5)",
            border: "1px solid #2A2A2A",
            borderRadius: "50%",
            width: "28px",
            height: "28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "#8A8780",
          }}
        >
          <X size={13} />
        </button>

        {/* Slide content */}
        <div style={{ flex: 1, overflow: "hidden" }}>
          <SlideComponent data={data} />
        </div>

        {/* Nav */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 16px",
            background: "#0A0A0A",
            borderTop: "1px solid #1A1A1A",
          }}
        >
          <button
            onClick={prev}
            disabled={slide === 0}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              background: "none",
              border: "1px solid #2A2A2A",
              borderRadius: "7px",
              padding: "7px 12px",
              cursor: slide === 0 ? "not-allowed" : "pointer",
              color: slide === 0 ? "#2A2A2A" : "#8A8780",
              fontFamily: SANS,
              fontSize: "12px",
            }}
          >
            <ChevronLeft size={13} /> Prev
          </button>

          <button
            onClick={shareSlide}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              background: "none",
              border: "1px solid #2A2A2A",
              borderRadius: "7px",
              padding: "7px 12px",
              cursor: "pointer",
              color: "#504E4A",
              fontFamily: SANS,
              fontSize: "12px",
            }}
          >
            <Share2 size={12} /> Share
          </button>

          <button
            onClick={next}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              background:
                slide === SLIDES.length - 1 ? "#C8A96E" : "transparent",
              border: "1px solid #2A2A2A",
              borderRadius: "7px",
              padding: "7px 12px",
              cursor: "pointer",
              color: slide === SLIDES.length - 1 ? "#0D0D0D" : "#8A8780",
              fontFamily: SANS,
              fontSize: "12px",
              fontWeight: slide === SLIDES.length - 1 ? 600 : 400,
            }}
          >
            {slide === SLIDES.length - 1 ? "Close" : "Next"}{" "}
            {slide < SLIDES.length - 1 && <ChevronRight size={13} />}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes wrappedSlideIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes barGrow {
          from { width: 0; }
        }
        @keyframes goldSweep {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
      `}</style>
    </>
  );
}

// ── Wrapped trigger button ─────────────────────────────────────────────────────
export function WrappedButton({
  logs,
  archetype,
  archetypeDesc,
}: {
  logs: any[];
  archetype: string;
  archetypeDesc: string;
}) {
  const [open, setOpen] = useState(false);
  const currentYear = new Date().getFullYear();
  const yearLogs = logs.filter(
    (l) => new Date(l.watched_at).getFullYear() === currentYear,
  );

  if (yearLogs.length < 3) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "10px 16px",
          borderRadius: "8px",
          cursor: "pointer",
          background:
            "linear-gradient(90deg, rgba(200,169,110,0.15), rgba(200,169,110,0.08))",
          border: "1px solid rgba(200,169,110,0.3)",
          color: "#C8A96E",
          fontFamily: SANS,
          fontSize: "13px",
          fontWeight: 600,
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.background =
            "linear-gradient(90deg, rgba(200,169,110,0.25), rgba(200,169,110,0.12))")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.background =
            "linear-gradient(90deg, rgba(200,169,110,0.15), rgba(200,169,110,0.08))")
        }
      >
        ✦ {currentYear} Wrapped
      </button>
      {open && (
        <TasteWrapped
          logs={logs}
          archetype={archetype}
          archetypeDesc={archetypeDesc}
          year={currentYear}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
