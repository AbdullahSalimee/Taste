"use client";
import { useState } from "react";
import { Settings, Share2, Users } from "lucide-react";
import { MOCK_USER, MOCK_FILMS, MOCK_CHAPTERS, MOCK_TASTE_TWINS } from "@/lib/mock-data";
import { TasteDNACard } from "@/components/features/TasteDNACard";
import { EpisodeHeatmap } from "@/components/features/EpisodeHeatmap";

const SERIF = "Playfair Display, Georgia, serif";
const SANS  = "Inter, system-ui, sans-serif";
const MONO  = "JetBrains Mono, Courier New, monospace";

const TABS = ["Overview", "Films", "TV", "Chapters", "Lists", "Stats"] as const;

function StatCard({ value, label }: { value: string | number; label: string }) {
  return (
    <div style={{
      background: "#141414", border: "1px solid #2A2A2A", borderRadius: "8px",
      padding: "16px", textAlign: "center",
    }}>
      <p style={{ fontFamily: MONO, color: "#C8A96E", fontSize: "22px", fontWeight: 500 }}>{value}</p>
      <p style={{ fontFamily: SANS, color: "#504E4A", fontSize: "11px", marginTop: "4px" }}>{label}</p>
    </div>
  );
}

function TwinCard({ twin }: { twin: (typeof MOCK_TASTE_TWINS)[0] }) {
  const colors = ["#5C4A8A", "#8A2A2A", "#2A5C8A", "#2A6A5C"];
  const bg = colors[twin.display_name.charCodeAt(0) % colors.length];
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "12px",
      padding: "12px", background: "#141414",
      border: "1px solid #2A2A2A", borderRadius: "8px", cursor: "pointer",
    }}
    onMouseEnter={e => (e.currentTarget.style.borderColor = "#3A3A3A")}
    onMouseLeave={e => (e.currentTarget.style.borderColor = "#2A2A2A")}
    >
      <div style={{
        width: "40px", height: "40px", borderRadius: "50%", background: bg,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "white", fontSize: "13px", fontFamily: SANS, fontWeight: 500, flexShrink: 0,
      }}>
        {twin.display_name.split(" ").map(n => n[0]).join("")}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontFamily: SANS, fontSize: "13px", color: "#F0EDE8", fontWeight: 500 }}>{twin.display_name}</p>
        <p style={{ fontFamily: SANS, fontSize: "11px", color: "#504E4A", fontStyle: "italic" }}>{twin.archetype}</p>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <p style={{ fontFamily: MONO, color: "#C8A96E", fontSize: "14px", fontWeight: 500 }}>{twin.match_score}%</p>
        <p style={{ fontFamily: SANS, color: "#504E4A", fontSize: "10px" }}>match</p>
      </div>
    </div>
  );
}

function FilmGrid({ films }: { films: typeof MOCK_FILMS }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
      {films.map(film => (
        <div key={film.id} className="film-card" style={{ position: "relative", width: "96px", height: "144px", flexShrink: 0, cursor: "pointer" }}>
          <div style={{ position: "absolute", inset: 0, borderRadius: "4px", overflow: "hidden", background: "#1A1A1A" }}>
            <img src={film.poster_url} alt={film.title}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={e => (e.currentTarget.style.display = "none")} />
            <div className="card-overlay" style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(to top, rgba(13,13,13,0.9) 0%, transparent 60%)",
            }} />
            {film.user_rating && (
              <div className="card-overlay" style={{
                position: "absolute", bottom: "6px", right: "6px",
                display: "flex", alignItems: "center", gap: "2px",
              }}>
                <span style={{ color: "#C8A96E", fontSize: "9px", fontFamily: MONO }}>★ {film.user_rating}</span>
              </div>
            )}
          </div>
          {film.status && (
            <div style={{
              position: "absolute", top: "5px", left: "5px",
              width: "16px", height: "16px", borderRadius: "2px",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: film.status === "watched" ? "rgba(200,169,110,0.15)" : "rgba(20,20,20,0.9)",
              border: film.status === "watched" ? "1px solid rgba(200,169,110,0.3)" : "1px solid #2A2A2A",
              fontSize: "8px", color: film.status === "watched" ? "#C8A96E" : "#8A8780",
            }}>
              {film.status === "watched" ? "✓" : film.status === "watchlist" ? "+" : "▶"}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function ProfilePage() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");
  const watched = MOCK_FILMS.filter(f => f.status === "watched");

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0 24px 48px" }}>
      {/* Profile header */}
      <div style={{ position: "relative", paddingTop: "32px", paddingBottom: "24px" }}>
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
          <div style={{ position: "absolute", top: "-40px", left: "-40px", width: "256px", height: "256px", borderRadius: "50%", background: "rgba(200,169,110,0.04)", filter: "blur(40px)" }} />
        </div>

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {/* Avatar */}
            <div style={{
              width: "72px", height: "72px", borderRadius: "50%", flexShrink: 0,
              background: "linear-gradient(135deg, #5C4A8A, #8A2A5C)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: SERIF, fontSize: "28px", fontWeight: 700, color: "white",
              border: "2px solid #2A2A2A",
            }}>A</div>
            <div>
              <h1 style={{ fontFamily: SERIF, fontSize: "24px", fontWeight: 700, color: "#F0EDE8" }}>
                {MOCK_USER.display_name}
              </h1>
              <p style={{ fontFamily: SANS, fontSize: "13px", color: "#C8A96E", fontStyle: "italic", marginTop: "2px" }}>{MOCK_USER.archetype}</p>
              <p style={{ fontFamily: SANS, fontSize: "13px", color: "#504E4A", marginTop: "4px" }}>{MOCK_USER.bio}</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
            <button style={{
              display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px",
              borderRadius: "6px", border: "1px solid #2A2A2A", background: "transparent",
              color: "#8A8780", fontFamily: SANS, fontSize: "11px", cursor: "pointer",
            }}>
              <Share2 size={12} /> Share
            </button>
            <button style={{
              padding: "6px", borderRadius: "6px", border: "1px solid #2A2A2A",
              background: "transparent", color: "#8A8780", cursor: "pointer",
            }}>
              <Settings size={14} />
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "12px", marginTop: "24px" }}>
          <StatCard value={MOCK_USER.stats.total_films.toLocaleString()} label="Films" />
          <StatCard value={MOCK_USER.stats.total_series} label="Series" />
          <StatCard value={`${(MOCK_USER.stats.total_hours / 24).toFixed(0)}d`} label="Watched" />
          <StatCard value={MOCK_USER.stats.total_episodes.toLocaleString()} label="Episodes" />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "4px", overflowX: "auto", paddingBottom: "0", marginBottom: "24px", borderBottom: "1px solid #1A1A1A" }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "8px 16px", fontFamily: SANS, fontSize: "13px", flexShrink: 0,
            background: "none", border: "none", cursor: "pointer",
            borderBottom: t === tab ? "2px solid #C8A96E" : "2px solid transparent",
            color: t === tab ? "#C8A96E" : "#504E4A",
            transition: "all 0.15s ease",
          }}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {tab === "Overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>

          {/* DNA Card */}
          <TasteDNACard user={MOCK_USER} />

          {/* Chapters */}
          <section>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <h2 style={{ fontFamily: SERIF, fontSize: "20px", fontWeight: 700, color: "#F0EDE8", fontStyle: "italic" }}>Chapters</h2>
              <button style={{ fontFamily: SANS, fontSize: "12px", color: "#C8A96E", background: "none", border: "none", cursor: "pointer" }}>View all</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {MOCK_CHAPTERS.map((ch, i) => (
                <div key={ch.id} className="chapter-card" style={{
                  display: "flex", alignItems: "center", gap: "16px",
                  padding: "16px", background: "#141414", border: "1px solid #2A2A2A",
                  borderRadius: "10px", cursor: "pointer",
                  "--chapter-delay": `${i * 100}ms`,
                } as React.CSSProperties}
                onMouseEnter={e => (e.currentTarget.style.borderColor = "#3A3A3A")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = "#2A2A2A")}
                >
                  <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
                    {ch.posters.slice(0, 3).map((p, pi) => (
                      <img key={pi} src={p} alt="" style={{ width: "32px", height: "48px", objectFit: "cover", borderRadius: "2px", background: "#1A1A1A" }}
                        onError={e => (e.currentTarget.style.display = "none")} />
                    ))}
                  </div>
                  <div>
                    <p style={{ fontFamily: SANS, fontSize: "10px", color: "#504E4A", marginBottom: "2px" }}>{ch.date_start}</p>
                    <p style={{ fontFamily: SERIF, fontSize: "14px", fontWeight: 700, color: "#F0EDE8", fontStyle: "italic", lineHeight: 1.3 }}>{ch.title}</p>
                    <p style={{ fontFamily: SANS, fontSize: "10px", color: "#504E4A", marginTop: "4px" }}>{ch.count} titles</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Taste twins */}
          <section>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
              <Users size={16} color="#C8A96E" />
              <h2 style={{ fontFamily: SANS, fontSize: "15px", fontWeight: 600, color: "#F0EDE8" }}>Taste Twins</h2>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {MOCK_TASTE_TWINS.map(twin => <TwinCard key={twin.id} twin={twin} />)}
            </div>
          </section>

          {/* Episode heatmap */}
          <section>
            <h2 style={{ fontFamily: SANS, fontSize: "15px", fontWeight: 600, color: "#F0EDE8", marginBottom: "16px" }}>
              Episode Quality — Twin Peaks
            </h2>
            <div style={{ background: "#141414", border: "1px solid #2A2A2A", borderRadius: "10px", padding: "16px" }}>
              <EpisodeHeatmap />
            </div>
          </section>
        </div>
      )}

      {/* Tab: Films */}
      {tab === "Films" && (
        <div>
          <p style={{ fontFamily: SANS, fontSize: "13px", color: "#8A8780", marginBottom: "16px" }}>{watched.length} films watched</p>
          <FilmGrid films={watched} />
        </div>
      )}

      {/* Tab: Chapters */}
      {tab === "Chapters" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {MOCK_CHAPTERS.map((ch, i) => (
            <div key={ch.id} className="chapter-card" style={{
              background: "#141414", border: "1px solid #2A2A2A", borderRadius: "12px",
              padding: "24px", cursor: "pointer",
              "--chapter-delay": `${i * 80}ms`,
            } as React.CSSProperties}
            onMouseEnter={e => (e.currentTarget.style.borderColor = "#3A3A3A")}
            onMouseLeave={e => (e.currentTarget.style.borderColor = "#2A2A2A")}
            >
              <p style={{ fontFamily: SANS, fontSize: "11px", color: "#504E4A", marginBottom: "8px" }}>
                {ch.date_start} — {ch.date_end}
              </p>
              <h3 style={{ fontFamily: SERIF, fontSize: "20px", fontWeight: 700, color: "#F0EDE8", fontStyle: "italic", lineHeight: 1.3, marginBottom: "16px" }}>
                {ch.title}
              </h3>
              <div style={{ display: "flex", gap: "8px" }}>
                {ch.posters.map((p, pi) => (
                  <img key={pi} src={p} alt="" style={{ width: "56px", height: "84px", objectFit: "cover", borderRadius: "2px", background: "#1A1A1A", flexShrink: 0 }}
                    onError={e => (e.currentTarget.style.display = "none")} />
                ))}
              </div>
              <p style={{ fontFamily: SANS, fontSize: "11px", color: "#504E4A", marginTop: "12px" }}>{ch.count} titles in this chapter</p>
            </div>
          ))}
        </div>
      )}

      {/* Empty tabs */}
      {(tab === "TV" || tab === "Lists" || tab === "Stats") && (
        <div style={{ textAlign: "center", padding: "64px 0" }}>
          <p style={{ fontFamily: SERIF, fontSize: "20px", color: "#2A2A2A", fontStyle: "italic" }}>{tab}</p>
          <p style={{ fontFamily: SANS, fontSize: "13px", color: "#504E4A", marginTop: "8px" }}>Coming in v1.1</p>
        </div>
      )}
    </div>
  );
}
