"use client";
import { useState } from "react";
import { Compass, Zap, Users, Calendar, Globe, TrendingUp } from "lucide-react";
import { MOCK_FILMS, MOCK_TASTE_TWINS } from "@/lib/mock-data";

const SERIF = "Playfair Display, Georgia, serif";
const SANS  = "Inter, system-ui, sans-serif";
const MONO  = "JetBrains Mono, Courier New, monospace";

const DECADES = ["1950s", "1960s", "1970s", "1980s", "1990s", "2000s", "2010s", "2020s"];
const DECADE_COLORS: Record<string, string> = {
  "1950s": "#3A5A8A", "1960s": "#5A6A3A", "1970s": "#8A6A2A", "1980s": "#6A3A5A",
  "1990s": "#3A7A6A", "2000s": "#5A4A8A", "2010s": "#8A4A3A", "2020s": "#4A6A8A",
};

const SECTIONS = [
  { id: "twins",    icon: Users,       label: "From Taste Twins",   color: "#5C4A8A" },
  { id: "directors",icon: Zap,         label: "Director Deep Dive", color: "#C8A96E" },
  { id: "decade",   icon: Globe,       label: "Decade Explorer",    color: "#2A5C8A" },
  { id: "new",      icon: TrendingUp,  label: "New on Streaming",   color: "#4A9E6B" },
  { id: "calendar", icon: Calendar,    label: "Upcoming Releases",  color: "#C87C2A" },
];

const STREAMING = [
  { title: "The Substance", year: 2024, poster: "https://image.tmdb.org/t/p/w300/lqoMzCcZYEFK729d6qzt349fB4o.jpg", service: "MUBI", match: "Based on your taste profile" },
  { title: "All We Imagine as Light", year: 2024, poster: "https://image.tmdb.org/t/p/w300/y9P7PaHDFJqsd8FoB6ky3JN3MHY.jpg", service: "MUBI", match: "Loved by your taste twins" },
  { title: "I Saw the TV Glow", year: 2024, poster: "https://image.tmdb.org/t/p/w300/mYWfeCs9FNzFFbXgMGMhvADEWBn.jpg", service: "Prime Video", match: "86% match with your tastes" },
  { title: "Dune: Part Two", year: 2024, poster: "https://image.tmdb.org/t/p/w300/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg", service: "Max", match: "Continuing your Villeneuve run" },
];

const DIRECTORS = ["Andrei Tarkovsky", "Ingmar Bergman", "Wong Kar-wai", "Agnès Varda"];

function PosterCard({ film }: { film: typeof MOCK_FILMS[0] }) {
  return (
    <div className="film-card" style={{ position: "relative", width: "80px", height: "120px", flexShrink: 0, cursor: "pointer", borderRadius: "4px", overflow: "hidden", background: "#1A1A1A" }}>
      <img src={film.poster_url} alt={film.title}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
        onError={e => (e.currentTarget.style.display = "none")} />
      <div className="card-overlay" style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(to top, rgba(13,13,13,0.9) 0%, transparent 50%)",
      }} />
    </div>
  );
}

function TwinDiscovery({ twin }: { twin: typeof MOCK_TASTE_TWINS[0] }) {
  const colors = ["#5C4A8A", "#8A2A2A", "#2A5C8A"];
  const bg = colors[twin.display_name.charCodeAt(0) % colors.length];
  return (
    <div style={{
      background: "#141414", border: "1px solid #2A2A2A", borderRadius: "12px", padding: "20px",
    }}
    onMouseEnter={e => (e.currentTarget.style.borderColor = "#3A3A3A")}
    onMouseLeave={e => (e.currentTarget.style.borderColor = "#2A2A2A")}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
        <div style={{
          width: "40px", height: "40px", borderRadius: "50%",
          background: `linear-gradient(135deg, ${bg}, #8A2A5C)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "white", fontSize: "13px", fontFamily: SANS, fontWeight: 500, flexShrink: 0,
        }}>{twin.display_name[0]}</div>
        <div style={{ flex: 1 }}>
          <p style={{ fontFamily: SANS, fontSize: "13px", color: "#F0EDE8", fontWeight: 500 }}>{twin.display_name}</p>
          <p style={{ fontFamily: SANS, fontSize: "11px", color: "#504E4A", fontStyle: "italic" }}>{twin.archetype}</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontFamily: MONO, color: "#C8A96E", fontSize: "14px" }}>{twin.match_score}%</p>
          <p style={{ fontFamily: SANS, color: "#504E4A", fontSize: "10px" }}>match</p>
        </div>
      </div>
      <p style={{ fontFamily: SANS, fontSize: "11px", color: "#8A8780", marginBottom: "12px" }}>
        {twin.discovery_count} films in your style you haven&apos;t seen:
      </p>
      <div style={{ display: "flex", gap: "8px" }}>
        {MOCK_FILMS.slice(0, 3).map(f => (
          <img key={f.id} src={f.poster_url} alt={f.title}
            style={{ width: "48px", height: "72px", objectFit: "cover", borderRadius: "2px", background: "#1A1A1A" }}
            onError={e => (e.currentTarget.style.display = "none")} />
        ))}
        <div style={{
          width: "48px", height: "72px", borderRadius: "2px", background: "#1A1A1A",
          border: "1px solid #2A2A2A", display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", fontSize: "10px", fontFamily: MONO, color: "#504E4A",
        }}>+{twin.discovery_count - 3}</div>
      </div>
      <button style={{
        width: "100%", marginTop: "16px", padding: "8px",
        border: "1px solid #2A2A2A", borderRadius: "6px", background: "transparent",
        color: "#8A8780", fontFamily: SANS, fontSize: "12px", cursor: "pointer",
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(200,169,110,0.3)"; (e.currentTarget as HTMLElement).style.color = "#C8A96E"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#2A2A2A"; (e.currentTarget as HTMLElement).style.color = "#8A8780"; }}
      >
        View {twin.display_name.split(" ")[0]}&apos;s profile
      </button>
    </div>
  );
}

function StreamCard({ film }: { film: typeof STREAMING[0] }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "12px", padding: "12px",
      background: "#141414", border: "1px solid #2A2A2A", borderRadius: "8px", cursor: "pointer",
    }}
    onMouseEnter={e => (e.currentTarget.style.borderColor = "#3A3A3A")}
    onMouseLeave={e => (e.currentTarget.style.borderColor = "#2A2A2A")}
    >
      <img src={film.poster} alt={film.title}
        style={{ width: "40px", height: "60px", objectFit: "cover", borderRadius: "2px", background: "#1A1A1A", flexShrink: 0 }}
        onError={e => (e.currentTarget.style.display = "none")} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontFamily: SANS, fontSize: "13px", color: "#F0EDE8", fontWeight: 500 }}>{film.title}</p>
        <p style={{ fontFamily: SANS, fontSize: "11px", color: "#504E4A" }}>{film.year}</p>
        <p style={{ fontFamily: SANS, fontSize: "10px", color: "#4A9E6B", marginTop: "2px" }}>{film.match}</p>
      </div>
      <span style={{
        padding: "2px 8px", borderRadius: "2px",
        background: "rgba(74,158,107,0.1)", border: "1px solid rgba(74,158,107,0.3)",
        color: "#4A9E6B", fontFamily: SANS, fontSize: "10px", flexShrink: 0,
      }}>{film.service}</span>
    </div>
  );
}

export default function DiscoverPage() {
  const [active, setActive] = useState("twins");
  const [decade, setDecade] = useState("1970s");

  return (
    <div style={{ maxWidth: "960px", margin: "0 auto", padding: "24px 24px 48px" }}>

      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
          <Compass size={20} color="#C8A96E" />
          <h1 style={{ fontFamily: SERIF, fontSize: "24px", fontWeight: 700, color: "#F0EDE8" }}>Discover</h1>
        </div>
        <p style={{ fontFamily: SANS, fontSize: "13px", color: "#504E4A" }}>
          Not algorithmic trending. Discovery through genuine taste.
        </p>
      </div>

      {/* Section tabs */}
      <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "8px", marginBottom: "24px", scrollbarWidth: "none" }}>
        {SECTIONS.map(s => {
          const Icon = s.icon;
          const isActive = active === s.id;
          return (
            <button key={s.id} onClick={() => setActive(s.id)} style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "8px 16px", borderRadius: "8px", flexShrink: 0,
              fontFamily: SANS, fontSize: "12px", cursor: "pointer",
              border: isActive ? `1px solid ${s.color}44` : "1px solid #2A2A2A",
              background: isActive ? `${s.color}18` : "transparent",
              color: isActive ? "#F0EDE8" : "#504E4A",
              transition: "all 0.15s ease",
            }}>
              <Icon size={13} color={isActive ? s.color : undefined} />
              {s.label}
            </button>
          );
        })}
      </div>

      {/* Twins */}
      {active === "twins" && (
        <div>
          <p style={{ fontFamily: SANS, fontSize: "13px", color: "#8A8780", marginBottom: "20px" }}>
            Films your taste twins love that you haven&apos;t seen yet.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
            {MOCK_TASTE_TWINS.map(twin => <TwinDiscovery key={twin.id} twin={twin} />)}
          </div>
        </div>
      )}

      {/* Directors */}
      {active === "directors" && (
        <div>
          <p style={{ fontFamily: SANS, fontSize: "13px", color: "#8A8780", marginBottom: "20px" }}>
            You love Tarkovsky. Here&apos;s his full filmography — what you haven&apos;t seen yet.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "24px" }}>
            {DIRECTORS.map((d, i) => (
              <button key={d} style={{
                display: "flex", alignItems: "center", gap: "12px", padding: "12px",
                borderRadius: "8px", textAlign: "left", cursor: "pointer",
                background: i === 0 ? "rgba(200,169,110,0.1)" : "#141414",
                border: i === 0 ? "1px solid rgba(200,169,110,0.3)" : "1px solid #2A2A2A",
                color: i === 0 ? "#C8A96E" : "#8A8780",
              }}>
                <div style={{
                  width: "32px", height: "32px", borderRadius: "50%",
                  background: "#2A2A2A", display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "10px", fontFamily: MONO, color: "#504E4A", flexShrink: 0,
                }}>
                  {d.split(" ").map(n => n[0]).join("")}
                </div>
                <div>
                  <p style={{ fontFamily: SANS, fontSize: "13px", fontWeight: 500 }}>{d}</p>
                  <p style={{ fontFamily: SANS, fontSize: "10px", opacity: 0.6 }}>
                    {Math.floor(Math.random() * 8 + 3)} unseen films
                  </p>
                </div>
              </button>
            ))}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {MOCK_FILMS.map(f => <PosterCard key={f.id} film={f} />)}
          </div>
        </div>
      )}

      {/* Decade */}
      {active === "decade" && (
        <div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "20px" }}>
            {DECADES.map(d => (
              <button key={d} onClick={() => setDecade(d)} style={{
                padding: "6px 14px", borderRadius: "4px", cursor: "pointer",
                fontFamily: MONO, fontSize: "11px",
                border: d === decade ? "1px solid rgba(200,169,110,0.4)" : "1px solid #2A2A2A",
                background: d === decade ? `${DECADE_COLORS[d]}33` : "transparent",
                color: d === decade ? "#F0EDE8" : "#504E4A",
              }}>{d}</button>
            ))}
          </div>
          <div style={{
            background: "#141414", border: "1px solid #2A2A2A", borderRadius: "12px",
            padding: "20px", marginBottom: "20px",
          }}>
            <h3 style={{ fontFamily: SERIF, fontSize: "18px", fontWeight: 700, color: "#F0EDE8", fontStyle: "italic", marginBottom: "4px" }}>
              {decade} Cinema
            </h3>
            <p style={{ fontFamily: SANS, fontSize: "11px", color: "#504E4A", marginBottom: "16px" }}>
              {decade === "1970s" ? "Your most-watched era — 24% of your library" : `Explore ${decade} cinema`}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {MOCK_FILMS.slice(0, 6).map(f => <PosterCard key={f.id} film={f} />)}
            </div>
          </div>
        </div>
      )}

      {/* Streaming */}
      {active === "new" && (
        <div>
          <p style={{ fontFamily: SANS, fontSize: "13px", color: "#8A8780", marginBottom: "20px" }}>
            New on your streaming services, filtered to match your taste profile.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {STREAMING.map((f, i) => <StreamCard key={i} film={f} />)}
          </div>
        </div>
      )}

      {/* Calendar placeholder */}
      {active === "calendar" && (
        <div style={{ textAlign: "center", padding: "64px 0" }}>
          <Calendar size={32} color="#2A2A2A" style={{ margin: "0 auto 12px" }} />
          <p style={{ fontFamily: SERIF, fontSize: "20px", color: "#2A2A2A", fontStyle: "italic" }}>Release Calendar</p>
          <p style={{ fontFamily: SANS, fontSize: "13px", color: "#504E4A", marginTop: "8px" }}>
            View at <span style={{ color: "#C8A96E" }}>/calendar</span>
          </p>
        </div>
      )}
    </div>
  );
}
