"use client";
import { useState } from "react";
import { Heart, MessageCircle, Bookmark, Film, Tv } from "lucide-react";
import { MOCK_FEED, MOCK_USER, MOCK_SERIES, MOCK_INSIGHT_CARDS, MOCK_CHAPTERS } from "@/lib/mock-data";
import { StarRating } from "@/components/ui/StarRating";
import { TasteDNACard } from "@/components/features/TasteDNACard";

const SANS  = "Inter, system-ui, sans-serif";
const SERIF = "Playfair Display, Georgia, serif";
const MONO  = "JetBrains Mono, Courier New, monospace";

const FILTERS = ["All", "Films", "TV", "Reviews"] as const;

function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const colors = ["#5C4A8A", "#8A2A2A", "#2A5C8A", "#2A6A5C", "#8A7A2A", "#8A2A5C"];
  const bg = colors[name.charCodeAt(0) % colors.length];
  const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", background: bg,
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0, color: "white", fontFamily: SANS,
      fontSize: size * 0.35, fontWeight: 500,
    }}>{initials}</div>
  );
}

function FeedCard({ item, index }: { item: (typeof MOCK_FEED)[0]; index: number }) {
  const [liked, setLiked] = useState(false);

  if (item.type === "list") {
    return (
      <div className="feed-item" style={{
        border: "1px solid #2A2A2A", background: "#141414", borderRadius: "8px",
        padding: "16px", "--feed-delay": `${index * 60}ms`,
      } as React.CSSProperties}
      onMouseEnter={e => (e.currentTarget.style.borderColor = "#3A3A3A")}
      onMouseLeave={e => (e.currentTarget.style.borderColor = "#2A2A2A")}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
          <Avatar name={item.user.display_name} size={28} />
          <span style={{ fontFamily: SANS, fontSize: "13px", color: "#F0EDE8", fontWeight: 500 }}>{item.user.display_name}</span>
          <span style={{ fontFamily: SANS, fontSize: "13px", color: "#504E4A" }}> made a list</span>
          <span style={{ marginLeft: "auto", fontFamily: SANS, fontSize: "11px", color: "#504E4A" }}>{item.timestamp}</span>
        </div>
        <p style={{ fontFamily: SANS, fontSize: "13px", color: "#C8A96E", fontWeight: 500, marginBottom: "10px" }}>
          {(item as { list_name: string }).list_name}
        </p>
        <div style={{ display: "flex", gap: "6px" }}>
          {(item as { preview_posters: string[] }).preview_posters.map((p, i) => (
            <img key={i} src={p} alt="" style={{ width: "40px", height: "56px", objectFit: "cover", borderRadius: "2px", background: "#1A1A1A" }}
              onError={e => (e.currentTarget.style.display = "none")} />
          ))}
          {(item as { list_count: number }).list_count > 4 && (
            <div style={{ width: "40px", height: "56px", borderRadius: "2px", background: "#1A1A1A", border: "1px solid #2A2A2A", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontFamily: MONO, fontSize: "10px", color: "#504E4A" }}>+{(item as { list_count: number }).list_count - 4}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="feed-item" style={{
      border: "1px solid #2A2A2A", background: "#141414", borderRadius: "8px",
      padding: "16px", "--feed-delay": `${index * 60}ms`,
    } as React.CSSProperties}
    onMouseEnter={e => (e.currentTarget.style.borderColor = "#3A3A3A")}
    onMouseLeave={e => (e.currentTarget.style.borderColor = "#2A2A2A")}>
      <div style={{ display: "flex", gap: "12px" }}>
        {/* Poster thumbnail */}
        <div style={{ flexShrink: 0 }}>
          <img src={item.poster_url} alt={item.title}
            style={{ width: "48px", height: "72px", objectFit: "cover", borderRadius: "2px", background: "#1A1A1A" }}
            onError={e => (e.currentTarget.style.display = "none")} />
        </div>
        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
            <Avatar name={item.user.display_name} size={22} />
            <span style={{ fontFamily: SANS, fontSize: "12px", color: "#F0EDE8", fontWeight: 500 }}>{item.user.display_name}</span>
            <span style={{ fontFamily: SANS, fontSize: "12px", color: "#504E4A" }}>watched</span>
            <span style={{ marginLeft: "auto", fontFamily: SANS, fontSize: "10px", color: "#504E4A", flexShrink: 0 }}>{item.timestamp}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" as const, marginBottom: "4px" }}>
            <span style={{ fontFamily: SANS, fontSize: "13px", color: "#F0EDE8", fontWeight: 500 }}>{item.title}</span>
            {(item as { episode?: string }).episode && (
              <span style={{ fontFamily: MONO, fontSize: "11px", color: "#504E4A" }}>{(item as { episode: string }).episode}</span>
            )}
            {item.media_type === "series"
              ? <Tv size={10} color="#504E4A" />
              : <Film size={10} color="#504E4A" />
            }
          </div>
          {item.rating && (
            <div style={{ marginBottom: "6px" }}><StarRating value={item.rating} readonly size="sm" /></div>
          )}
          {item.note && (
            <p style={{ fontFamily: SANS, fontSize: "12px", color: "#8A8780", lineHeight: 1.5, fontStyle: "italic",
              display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" } as React.CSSProperties}>
              &ldquo;{item.note}&rdquo;
            </p>
          )}
        </div>
      </div>
      {/* Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #1A1A1A" }}>
        <button onClick={() => setLiked(!liked)} style={{
          display: "flex", alignItems: "center", gap: "6px",
          background: "none", border: "none", cursor: "pointer",
          fontFamily: SANS, fontSize: "12px",
          color: liked ? "#C87C2A" : "#504E4A",
        }}>
          <Heart size={12} fill={liked ? "#C87C2A" : "none"} stroke={liked ? "#C87C2A" : "#504E4A"} /> Like
        </button>
        <button style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", cursor: "pointer", fontFamily: SANS, fontSize: "12px", color: "#504E4A" }}>
          <MessageCircle size={12} /> Reply
        </button>
        <button style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", cursor: "pointer", fontFamily: SANS, fontSize: "12px", color: "#504E4A", marginLeft: "auto" }}>
          <Bookmark size={12} />
        </button>
      </div>
    </div>
  );
}

function InsightCard({ text, type }: { text: string; type: string }) {
  const colors: Record<string, string> = { rare: "#C8A96E", behavioral: "#5C4A8A", growth: "#4A9E6B", personality: "#2A5C8A" };
  const color = colors[type] || "#8A8780";
  return (
    <div style={{
      padding: "16px", borderRadius: "8px", border: `1px solid ${color}33`,
      background: "#141414", flexShrink: 0, width: "240px",
    }}>
      <div style={{ width: "3px", height: "24px", borderRadius: "2px", marginBottom: "10px", backgroundColor: color }} />
      <p style={{ fontFamily: SANS, fontSize: "12px", color: "#F0EDE8", lineHeight: 1.6 }}>{text}</p>
      <button style={{ marginTop: "10px", fontFamily: SANS, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", background: "none", border: "none", cursor: "pointer", color }}>
        Share →
      </button>
    </div>
  );
}

export default function DashboardPage() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const watching = MOCK_SERIES.filter(s => s.status === "watching");

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 24px" }}>
      {/* Page header */}
      <div style={{ padding: "24px 0 16px" }}>
        <h1 style={{ fontFamily: SERIF, fontSize: "26px", fontWeight: 700, color: "#F0EDE8" }}>
          Good evening, {MOCK_USER.display_name}.
        </h1>
        <p style={{ fontFamily: SANS, fontSize: "13px", color: "#504E4A", marginTop: "2px" }}>What did you watch today?</p>
      </div>

      {/* Two-column grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) 300px",
        gap: "24px",
        alignItems: "start",
        paddingBottom: "40px",
      }}>

        {/* ── LEFT: Feed ── */}
        <div style={{ minWidth: 0 }}>
          {/* Filter chips */}
          <div style={{ display: "flex", gap: "6px", marginBottom: "20px", overflowX: "auto", paddingBottom: "4px" }}>
            {FILTERS.map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding: "6px 14px", borderRadius: "20px", flexShrink: 0,
                fontFamily: SANS, fontSize: "12px", cursor: "pointer",
                border: f === filter ? "1px solid rgba(200,169,110,0.4)" : "1px solid #2A2A2A",
                background: f === filter ? "rgba(200,169,110,0.1)" : "transparent",
                color: f === filter ? "#C8A96E" : "#504E4A",
              }}>{f}</button>
            ))}
          </div>

          {/* Feed */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {MOCK_FEED.map((item, i) => <FeedCard key={item.id} item={item} index={i} />)}
          </div>

          {/* Taste twin teaser */}
          <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid #1A1A1A" }}>
            <p style={{ fontFamily: SANS, fontSize: "10px", color: "#8A8780", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "8px" }}>
              Taste twin activity
            </p>
            <p style={{ fontFamily: SANS, fontSize: "12px", color: "#504E4A", fontStyle: "italic" }}>
              Yuki M. (91% match) recently logged 8 films you haven&apos;t seen.{" "}
              <button style={{ color: "#C8A96E", background: "none", border: "none", cursor: "pointer", fontFamily: SANS, fontSize: "12px" }}>
                View their profile →
              </button>
            </p>
          </div>
        </div>

        {/* ── RIGHT: Sidebar widgets ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px", minWidth: 0 }}>

          {/* Continue watching */}
          <div>
            <p style={{ fontFamily: SANS, fontSize: "10px", color: "#8A8780", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "10px" }}>
              Continue watching
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {watching.map(show => (
                <div key={show.id} style={{
                  display: "flex", alignItems: "center", gap: "10px", padding: "10px",
                  background: "#141414", border: "1px solid #2A2A2A", borderRadius: "8px", cursor: "pointer",
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = "#3A3A3A")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = "#2A2A2A")}>
                  <img src={show.poster_url} alt={show.title}
                    style={{ width: "36px", height: "52px", objectFit: "cover", borderRadius: "2px", background: "#1A1A1A", flexShrink: 0 }}
                    onError={e => (e.currentTarget.style.display = "none")} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: SANS, fontSize: "13px", color: "#F0EDE8", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {show.title}
                    </p>
                    {show.next_episode && (
                      <p style={{ fontFamily: MONO, fontSize: "10px", color: "#504E4A", marginTop: "2px" }}>
                        Next: S{String(show.next_episode.season).padStart(2,"0")}E{String(show.next_episode.episode).padStart(2,"0")}
                      </p>
                    )}
                    <div style={{ height: "3px", background: "#1A1A1A", borderRadius: "2px", marginTop: "6px", overflow: "hidden" }}>
                      <div style={{ height: "100%", background: "#C8A96E", borderRadius: "2px", width: `${Math.round((show.watched_episodes / show.episodes) * 100)}%` }} />
                    </div>
                    <p style={{ fontFamily: MONO, fontSize: "10px", color: "#504E4A", marginTop: "3px" }}>
                      {show.watched_episodes}/{show.episodes} eps
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Insights */}
          <div>
            <p style={{ fontFamily: SANS, fontSize: "10px", color: "#8A8780", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "10px" }}>
              This week&apos;s insights
            </p>
            <div style={{ display: "flex", gap: "10px", overflowX: "auto", paddingBottom: "4px", scrollbarWidth: "none" }}>
              {MOCK_INSIGHT_CARDS.map(card => (
                <InsightCard key={card.id} text={card.text} type={card.type} />
              ))}
            </div>
          </div>

          {/* Taste DNA compact */}
          <div>
            <p style={{ fontFamily: SANS, fontSize: "10px", color: "#8A8780", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "10px" }}>
              Your DNA
            </p>
            <TasteDNACard compact />
          </div>

          {/* Latest chapter */}
          <div>
            <p style={{ fontFamily: SANS, fontSize: "10px", color: "#8A8780", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "10px" }}>
              Latest chapter
            </p>
            {MOCK_CHAPTERS.slice(0, 1).map(ch => (
              <div key={ch.id} className="chapter-card" style={{
                padding: "14px", background: "#141414", border: "1px solid #2A2A2A", borderRadius: "8px",
                "--chapter-delay": "0ms",
              } as React.CSSProperties}>
                <p style={{ fontFamily: SANS, fontSize: "10px", color: "#504E4A", marginBottom: "4px" }}>
                  {ch.date_start} — {ch.date_end}
                </p>
                <p style={{ fontFamily: SERIF, fontSize: "15px", fontWeight: 700, color: "#F0EDE8", fontStyle: "italic", lineHeight: 1.3 }}>
                  {ch.title}
                </p>
                <div style={{ display: "flex", gap: "6px", marginTop: "10px" }}>
                  {ch.posters.map((p, i) => (
                    <img key={i} src={p} alt="" style={{ width: "36px", height: "52px", objectFit: "cover", borderRadius: "2px", background: "#1A1A1A" }}
                      onError={e => (e.currentTarget.style.display = "none")} />
                  ))}
                </div>
                <p style={{ fontFamily: SANS, fontSize: "11px", color: "#504E4A", marginTop: "8px" }}>
                  {ch.count} titles in this chapter
                </p>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* Responsive: collapse to single column below 860px */}
      <style>{`
        @media (max-width: 860px) {
          .dashboard-two-col { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
