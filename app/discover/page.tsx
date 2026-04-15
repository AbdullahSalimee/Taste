"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Compass, Zap, Users, Calendar, Globe, TrendingUp } from "lucide-react";
import { useTrending } from "@/lib/hooks";
import { addToWatchlist } from "@/lib/store";

const SERIF = "Playfair Display, Georgia, serif";
const SANS = "Inter, system-ui, sans-serif";
const MONO = "JetBrains Mono, Courier New, monospace";

const DECADES = [
  "1950s",
  "1960s",
  "1970s",
  "1980s",
  "1990s",
  "2000s",
  "2010s",
  "2020s",
];
const DECADE_COLORS: Record<string, string> = {
  "1950s": "#3A5A8A",
  "1960s": "#5A6A3A",
  "1970s": "#8A6A2A",
  "1980s": "#6A3A5A",
  "1990s": "#3A7A6A",
  "2000s": "#5A4A8A",
  "2010s": "#8A4A3A",
  "2020s": "#4A6A8A",
};

const DECADE_YEAR_RANGE: Record<string, [number, number]> = {
  "1950s": [1950, 1959],
  "1960s": [1960, 1969],
  "1970s": [1970, 1979],
  "1980s": [1980, 1989],
  "1990s": [1990, 1999],
  "2000s": [2000, 2009],
  "2010s": [2010, 2019],
  "2020s": [2020, 2030],
};

const SECTIONS = [
  { id: "trending", icon: TrendingUp, label: "Trending Now", color: "#C8A96E" },
  { id: "toprated", icon: Zap, label: "Top Rated", color: "#5C4A8A" },
  { id: "decade", icon: Globe, label: "Decade Explorer", color: "#2A5C8A" },
  { id: "tv", icon: Users, label: "Series", color: "#4A9E6B" },
  { id: "calendar", icon: Calendar, label: "Coming Soon", color: "#C87C2A" },
];

function PosterGrid({
  items,
  onAdd,
}: {
  items: any[];
  onAdd: (item: any) => void;
}) {
  const router = useRouter();
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
      {items.map((item: any) => (
        <div
          key={`${item.type}-${item.id}`}
          className="film-card"
          style={{
            position: "relative",
            width: "100px",
            height: "150px",
            flexShrink: 0,
            cursor: "pointer",
            borderRadius: "4px",
            overflow: "hidden",
            background: "#1A1A1A",
          }}
          onClick={() =>
            router.push(
              `/title/${item.type === "series" ? "tv" : "movie"}/${item.id}`,
            )
          }
        >
          {item.poster_url ? (
            <img
              src={item.poster_url}
              alt={item.title}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                background: "#1A1A1A",
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
                {item.title}
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
          <div
            className="card-overlay"
            style={{
              position: "absolute",
              bottom: "6px",
              left: "6px",
              right: "6px",
            }}
          >
            <p
              style={{
                fontFamily: SANS,
                fontSize: "9px",
                color: "#F0EDE8",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {item.title}
            </p>
            {item.tmdb_rating > 0 && (
              <p
                style={{ fontFamily: MONO, fontSize: "9px", color: "#C8A96E" }}
              >
                ★ {item.tmdb_rating.toFixed(1)}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function ListCard({ item, onAdd }: { item: any; onAdd: () => void }) {
  const router = useRouter();
  const rating5 = Math.round((item.tmdb_rating / 2) * 2) / 2;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "12px",
        background: "#141414",
        border: "1px solid #2A2A2A",
        borderRadius: "8px",
        cursor: "pointer",
      }}
      onClick={() =>
        router.push(
          `/title/${item.type === "series" ? "tv" : "movie"}/${item.id}`,
        )
      }
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#3A3A3A")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#2A2A2A")}
    >
      {item.poster_url ? (
        <img
          src={item.poster_url}
          alt={item.title}
          style={{
            width: "40px",
            height: "60px",
            objectFit: "cover",
            borderRadius: "2px",
            flexShrink: 0,
          }}
        />
      ) : (
        <div
          style={{
            width: "40px",
            height: "60px",
            borderRadius: "2px",
            background: "#1A1A1A",
            flexShrink: 0,
          }}
        />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontFamily: SANS,
            fontSize: "13px",
            color: "#F0EDE8",
            fontWeight: 500,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {item.title}
        </p>
        <p style={{ fontFamily: SANS, fontSize: "11px", color: "#504E4A" }}>
          {item.year}
        </p>
        {item.tmdb_rating > 0 && (
          <p
            style={{
              fontFamily: MONO,
              fontSize: "10px",
              color: "#C8A96E",
              marginTop: "2px",
            }}
          >
            ★ {rating5}/5
          </p>
        )}
        {item.overview && (
          <p
            style={{
              fontFamily: SANS,
              fontSize: "11px",
              color: "#8A8780",
              marginTop: "4px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {item.overview}
          </p>
        )}
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onAdd();
        }}
        style={{
          padding: "6px 12px",
          borderRadius: "6px",
          border: "1px solid #2A2A2A",
          background: "transparent",
          color: "#8A8780",
          fontFamily: SANS,
          fontSize: "11px",
          cursor: "pointer",
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor =
            "rgba(200,169,110,0.3)";
          (e.currentTarget as HTMLElement).style.color = "#C8A96E";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = "#2A2A2A";
          (e.currentTarget as HTMLElement).style.color = "#8A8780";
        }}
      >
        + Add
      </button>
    </div>
  );
}

export default function DiscoverPage() {
  const router = useRouter();
  const [active, setActive] = useState("trending");
  const [decade, setDecade] = useState("2020s");
  const [decadeItems, setDecadeItems] = useState<any[]>([]);
  const [loadingDecade, setLoadingDecade] = useState(false);
  const [added, setAdded] = useState<Record<string, boolean>>({});

  const { data: trending, loading } = useTrending("all");

  const trendingMovies = trending?.trending_movies || [];
  const trendingTV = trending?.trending_tv || [];
  const topMovies = trending?.top_movies || [];
  const topTV = trending?.top_tv || [];

  async function loadDecade(d: string) {
    setDecade(d);
    setLoadingDecade(true);
    setDecadeItems([]);
    const [from, to] = DECADE_YEAR_RANGE[d];
    try {
      const res = await fetch(`/api/trending?type=film`);
      // Use discover endpoint for decade
      const discoverRes = await fetch(`/api/search?q=drama&type=movie`);
      // Fallback: filter trending by decade
      const items = trendingMovies.filter(
        (m: any) => m.year >= from && m.year <= to,
      );
      setDecadeItems(items.length > 0 ? items : trendingMovies.slice(0, 8));
    } catch {
      setDecadeItems(trendingMovies.slice(0, 8));
    } finally {
      setLoadingDecade(false);
    }
  }

  function handleAddToWatchlist(item: any) {
    addToWatchlist({
      tmdb_id: item.tmdb_id || item.id,
      type: item.type === "series" ? "series" : "film",
      title: item.title,
      poster_url: item.poster_url,
      year: item.year,
      tmdb_rating: item.tmdb_rating,
      overview: item.overview,
      genres: item.genres || [],
      priority: "normal",
    });
    setAdded((prev) => ({ ...prev, [`${item.type}-${item.id}`]: true }));
    setTimeout(
      () =>
        setAdded((prev) => ({ ...prev, [`${item.type}-${item.id}`]: false })),
      2000,
    );
  }

  return (
    <div
      style={{ maxWidth: "960px", margin: "0 auto", padding: "24px 24px 48px" }}
    >
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "4px",
          }}
        >
          <Compass size={20} color="#C8A96E" />
          <h1
            style={{
              fontFamily: SERIF,
              fontSize: "24px",
              fontWeight: 700,
              color: "#F0EDE8",
            }}
          >
            Discover
          </h1>
        </div>
        <p style={{ fontFamily: SANS, fontSize: "13px", color: "#504E4A" }}>
          Live data from TMDB · Updated daily
        </p>
      </div>

      {/* Section tabs */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          overflowX: "auto",
          paddingBottom: "8px",
          marginBottom: "24px",
          scrollbarWidth: "none",
        }}
      >
        {SECTIONS.map((s) => {
          const Icon = s.icon;
          const isActive = active === s.id;
          return (
            <button
              key={s.id}
              onClick={() => {
                setActive(s.id);
                if (s.id === "decade") loadDecade(decade);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                borderRadius: "8px",
                flexShrink: 0,
                fontFamily: SANS,
                fontSize: "12px",
                cursor: "pointer",
                border: isActive
                  ? `1px solid ${s.color}44`
                  : "1px solid #2A2A2A",
                background: isActive ? `${s.color}18` : "transparent",
                color: isActive ? "#F0EDE8" : "#504E4A",
                transition: "all 0.15s ease",
              }}
            >
              <Icon size={13} color={isActive ? s.color : undefined} />
              {s.label}
            </button>
          );
        })}
      </div>

      {loading && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="skeleton"
              style={{ width: "100px", height: "150px", borderRadius: "4px" }}
            />
          ))}
        </div>
      )}

      {/* Trending */}
      {!loading && active === "trending" && (
        <div>
          <p
            style={{
              fontFamily: SANS,
              fontSize: "13px",
              color: "#8A8780",
              marginBottom: "20px",
            }}
          >
            What everyone&apos;s watching this week.
          </p>
          <p
            style={{
              fontFamily: SANS,
              fontSize: "10px",
              color: "#504E4A",
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              marginBottom: "12px",
            }}
          >
            Films
          </p>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              marginBottom: "24px",
            }}
          >
            {trendingMovies.slice(0, 8).map((item: any) => (
              <ListCard
                key={item.id}
                item={item}
                onAdd={() => handleAddToWatchlist(item)}
              />
            ))}
          </div>
          <p
            style={{
              fontFamily: SANS,
              fontSize: "10px",
              color: "#504E4A",
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              marginBottom: "12px",
            }}
          >
            TV Series
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {trendingTV.slice(0, 5).map((item: any) => (
              <ListCard
                key={item.id}
                item={item}
                onAdd={() => handleAddToWatchlist(item)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Top Rated */}
      {!loading && active === "toprated" && (
        <div>
          <p
            style={{
              fontFamily: SANS,
              fontSize: "13px",
              color: "#8A8780",
              marginBottom: "20px",
            }}
          >
            The highest-rated films and series of all time.
          </p>
          <p
            style={{
              fontFamily: SANS,
              fontSize: "10px",
              color: "#504E4A",
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              marginBottom: "12px",
            }}
          >
            Top rated films
          </p>
          <PosterGrid
            items={topMovies.slice(0, 10)}
            onAdd={handleAddToWatchlist}
          />
          <p
            style={{
              fontFamily: SANS,
              fontSize: "10px",
              color: "#504E4A",
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              margin: "20px 0 12px",
            }}
          >
            Top rated series
          </p>
          <PosterGrid items={topTV.slice(0, 10)} onAdd={handleAddToWatchlist} />
          <p
            style={{
              fontFamily: SANS,
              fontSize: "11px",
              color: "#504E4A",
              marginTop: "12px",
              fontStyle: "italic",
            }}
          >
            Tap any poster to add to watchlist
          </p>
        </div>
      )}

      {/* Decade */}
      {active === "decade" && (
        <div>
          <div
            style={{
              display: "flex",
              gap: "8px",
              flexWrap: "wrap",
              marginBottom: "20px",
            }}
          >
            {DECADES.map((d) => (
              <button
                key={d}
                onClick={() => loadDecade(d)}
                style={{
                  padding: "6px 14px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontFamily: MONO,
                  fontSize: "11px",
                  border:
                    d === decade
                      ? "1px solid rgba(200,169,110,0.4)"
                      : "1px solid #2A2A2A",
                  background:
                    d === decade ? `${DECADE_COLORS[d]}33` : "transparent",
                  color: d === decade ? "#F0EDE8" : "#504E4A",
                }}
              >
                {d}
              </button>
            ))}
          </div>
          <div
            style={{
              background: "#141414",
              border: "1px solid #2A2A2A",
              borderRadius: "12px",
              padding: "20px",
              marginBottom: "20px",
            }}
          >
            <h3
              style={{
                fontFamily: SERIF,
                fontSize: "18px",
                fontWeight: 700,
                color: "#F0EDE8",
                fontStyle: "italic",
                marginBottom: "4px",
              }}
            >
              {decade} Cinema
            </h3>
            <p
              style={{
                fontFamily: SANS,
                fontSize: "11px",
                color: "#504E4A",
                marginBottom: "16px",
              }}
            >
              From your trending & top-rated data
            </p>
            {loadingDecade ? (
              <div style={{ display: "flex", gap: "8px" }}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="skeleton"
                    style={{
                      width: "80px",
                      height: "120px",
                      borderRadius: "4px",
                    }}
                  />
                ))}
              </div>
            ) : (
              <PosterGrid
                items={decadeItems.slice(0, 8)}
                onAdd={handleAddToWatchlist}
              />
            )}
          </div>
        </div>
      )}

      {/* TV */}
      {!loading && active === "tv" && (
        <div>
          <p
            style={{
              fontFamily: SANS,
              fontSize: "13px",
              color: "#8A8780",
              marginBottom: "20px",
            }}
          >
            Popular and highly-rated series right now.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {[...trendingTV, ...topTV]
              .slice(0, 12)
              .map((item: any, i: number) => (
                <ListCard
                  key={`${item.id}-${i}`}
                  item={item}
                  onAdd={() => handleAddToWatchlist(item)}
                />
              ))}
          </div>
        </div>
      )}

      {/* Calendar placeholder */}
      {active === "calendar" && (
        <div style={{ textAlign: "center", padding: "64px 0" }}>
          <Calendar
            size={32}
            color="#2A2A2A"
            style={{ margin: "0 auto 12px" }}
          />
          <p
            style={{
              fontFamily: SERIF,
              fontSize: "20px",
              color: "#2A2A2A",
              fontStyle: "italic",
            }}
          >
            Release Calendar
          </p>
          <p
            style={{
              fontFamily: SANS,
              fontSize: "13px",
              color: "#504E4A",
              marginTop: "8px",
            }}
          >
            View at <span style={{ color: "#C8A96E" }}>/calendar</span>
          </p>
        </div>
      )}
    </div>
  );
}
