"use client";
import { Calendar, Bell, Film, Tv, Plus } from "lucide-react";
import { MOCK_CALENDAR } from "@/lib/mock-data";

const SERIF = "Playfair Display, Georgia, serif";
const SANS  = "Inter, system-ui, sans-serif";
const MONO  = "JetBrains Mono, Courier New, monospace";

const TYPE_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  "New Episode":      { bg: "rgba(74,158,107,0.15)",  text: "#4A9E6B", border: "rgba(74,158,107,0.3)" },
  "Season Premiere":  { bg: "rgba(200,169,110,0.15)", text: "#C8A96E", border: "rgba(200,169,110,0.3)" },
  "Film Release":     { bg: "rgba(92,74,138,0.15)",   text: "#9A7ACC", border: "rgba(92,74,138,0.3)" },
  "Now Streaming":    { bg: "rgba(42,92,138,0.15)",   text: "#5A9ACA", border: "rgba(42,92,138,0.3)" },
};

export default function CalendarPage() {
  return (
    <div style={{ maxWidth: "640px", margin: "0 auto", padding: "24px 24px 48px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Calendar size={20} color="#C8A96E" />
          <h1 style={{ fontFamily: SERIF, fontSize: "24px", fontWeight: 700, color: "#F0EDE8" }}>Calendar</h1>
        </div>
        <button style={{
          display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px",
          border: "1px solid #2A2A2A", borderRadius: "6px", background: "transparent",
          color: "#8A8780", fontFamily: SANS, fontSize: "11px", cursor: "pointer",
        }}>
          <Bell size={12} /> Sync to device
        </button>
      </div>
      <p style={{ fontFamily: SANS, fontSize: "13px", color: "#504E4A", marginBottom: "28px" }}>
        Releases and episodes for shows you follow
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
        {MOCK_CALENDAR.map(day => (
          <div key={day.date}>
            {/* Day label */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
              <span style={{ fontFamily: MONO, fontSize: "11px", color: "#C8A96E", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                {day.date}
              </span>
              <div style={{ flex: 1, height: "1px", background: "#1A1A1A" }} />
            </div>

            {/* Entries */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {day.entries.map((entry, i) => {
                const style = TYPE_STYLES[entry.type] || TYPE_STYLES["New Episode"];
                const isFilm = entry.type === "Film Release";
                return (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: "16px",
                    padding: "16px", background: "#141414",
                    border: "1px solid #2A2A2A", borderRadius: "12px", cursor: "pointer",
                    transition: "border-color 0.15s ease",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = "#3A3A3A")}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = "#2A2A2A")}
                  >
                    <img src={entry.poster} alt={entry.title}
                      style={{ width: "48px", height: "68px", objectFit: "cover", borderRadius: "2px", background: "#1A1A1A", flexShrink: 0 }}
                      onError={e => (e.currentTarget.style.display = "none")} />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                        <span style={{
                          padding: "2px 8px", borderRadius: "2px", fontSize: "10px", fontFamily: SANS,
                          background: style.bg, color: style.text, border: `1px solid ${style.border}`,
                        }}>{entry.type}</span>
                        {isFilm ? <Film size={11} color="#504E4A" /> : <Tv size={11} color="#504E4A" />}
                      </div>
                      <p style={{ fontFamily: SANS, fontSize: "14px", color: "#F0EDE8", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {entry.title}
                      </p>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "2px" }}>
                        {(entry as { episode?: string }).episode && (
                          <span style={{ fontFamily: MONO, fontSize: "11px", color: "#504E4A" }}>
                            {(entry as { episode: string }).episode}
                          </span>
                        )}
                        <span style={{ fontFamily: SANS, fontSize: "11px", color: "#504E4A" }}>{entry.service}</span>
                      </div>
                    </div>

                    <button style={{
                      width: "28px", height: "28px", borderRadius: "50%", flexShrink: 0,
                      background: "#1A1A1A", border: "1px solid #2A2A2A",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer", color: "#8A8780",
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#C8A96E"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(200,169,110,0.3)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#8A8780"; (e.currentTarget as HTMLElement).style.borderColor = "#2A2A2A"; }}
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Empty state */}
        <div style={{ textAlign: "center", padding: "32px 0" }}>
          <p style={{ fontFamily: SERIF, fontSize: "18px", color: "#2A2A2A", fontStyle: "italic" }}>Nothing else scheduled</p>
          <p style={{ fontFamily: SANS, fontSize: "12px", color: "#504E4A", marginTop: "8px" }}>
            Follow more shows to see upcoming episodes
          </p>
        </div>
      </div>
    </div>
  );
}
