"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Trophy, Film, Users, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

const DISPLAY = "'Cormorant Garamond', 'Playfair Display', Georgia, serif";
const BODY = "'DM Sans', 'Inter', system-ui, sans-serif";
const MONO = "'Geist Mono', 'JetBrains Mono', 'Courier New', monospace";

const AVATAR_COLORS = [
  ["#3D2B6B", "#7B5EA7"],
  ["#6B2B2B", "#A75E5E"],
  ["#1E4A7A", "#5E8FB8"],
  ["#1D5C4A", "#4A9E6B"],
  ["#5C4A1D", "#A88C4A"],
  ["#5C1D4A", "#A84A8C"],
];

function GrainOverlay({ opacity = 0.035 }: { opacity?: number }) {
  return (
    <svg
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        opacity,
        borderRadius: "inherit",
      }}
      aria-hidden
    >
      <filter id={`grain-lb`}>
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.65"
          numOctaves="3"
          stitchTiles="stitch"
        />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#grain-lb)`} />
    </svg>
  );
}

function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const idx = (name?.charCodeAt(0) || 0) % AVATAR_COLORS.length;
  const [from, to] = AVATAR_COLORS[idx];
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: `radial-gradient(circle at 35% 35%, ${from}, ${to})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        fontFamily: BODY,
        fontSize: size * 0.4,
        fontWeight: 600,
        color: "rgba(255,255,255,0.9)",
        boxShadow: `0 0 0 1px rgba(255,255,255,0.06)`,
      }}
    >
      {(name?.[0] || "?").toUpperCase()}
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <div
        style={{
          width: "22px",
          textAlign: "center",
          fontSize: "13px",
          flexShrink: 0,
        }}
      >
        🥇
      </div>
    );
  if (rank === 2)
    return (
      <div
        style={{
          width: "22px",
          textAlign: "center",
          fontSize: "13px",
          flexShrink: 0,
        }}
      >
        🥈
      </div>
    );
  if (rank === 3)
    return (
      <div
        style={{
          width: "22px",
          textAlign: "center",
          fontSize: "13px",
          flexShrink: 0,
        }}
      >
        🥉
      </div>
    );
  return (
    <span
      style={{
        fontFamily: MONO,
        fontSize: "10px",
        color: "#2E2E2E",
        width: "22px",
        textAlign: "center",
        flexShrink: 0,
        letterSpacing: "-0.02em",
      }}
    >
      {rank}
    </span>
  );
}

function LogBar({
  count,
  max,
  isSelf,
}: {
  count: number;
  max: number;
  isSelf: boolean;
}) {
  const pct = max === 0 ? 0 : Math.round((count / max) * 100);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
      <div
        style={{
          flex: 1,
          height: "3px",
          background: "rgba(255,255,255,0.04)",
          borderRadius: "2px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: isSelf
              ? "linear-gradient(90deg, #B8945E, #D4AA74)"
              : "linear-gradient(90deg, #1E2A38, #263545)",
            borderRadius: "2px",
            transition: "width 1s cubic-bezier(0.16,1,0.3,1)",
            boxShadow: isSelf ? "0 0 8px rgba(200,169,110,0.35)" : "none",
          }}
        />
      </div>
      <span
        style={{
          fontFamily: MONO,
          fontSize: "10px",
          color: isSelf ? "#C8A96E" : "#383533",
          minWidth: "18px",
          textAlign: "right",
          letterSpacing: "0.02em",
        }}
      >
        {count}
      </span>
    </div>
  );
}

function TwinRivalry({ rivalry }: { rivalry: any }) {
  const total = rivalry.my_count + rivalry.twin_count;
  const myPct = total === 0 ? 50 : Math.round((rivalry.my_count / total) * 100);
  const isWinning = rivalry.leader === "me";
  const isTied = rivalry.leader === "tie";

  return (
    <div
      style={{
        position: "relative",
        background: "linear-gradient(145deg, #0E0E0E, #0A0A0A)",
        border: "1px solid #181818",
        borderRadius: "14px",
        padding: "20px",
        overflow: "hidden",
        marginBottom: "10px",
      }}
    >
      <GrainOverlay />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "7px",
          marginBottom: "18px",
        }}
      >
        <div
          style={{
            width: "4px",
            height: "4px",
            borderRadius: "50%",
            background: "#C8A96E",
            boxShadow: "0 0 6px rgba(200,169,110,0.6)",
          }}
        />
        <p
          style={{
            fontFamily: MONO,
            fontSize: "8px",
            color: "#3A3A3A",
            textTransform: "uppercase",
            letterSpacing: "0.18em",
          }}
        >
          Twin Rivalry · This Week
        </p>
      </div>

      {/* VS */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          marginBottom: "14px",
        }}
      >
        {/* Me */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "6px",
            minWidth: "54px",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              background:
                "radial-gradient(circle at 35% 35%, rgba(200,169,110,0.2), rgba(200,169,110,0.05))",
              border: `1.5px solid ${isWinning ? "rgba(200,169,110,0.5)" : "#222"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: DISPLAY,
              fontSize: "13px",
              fontStyle: "italic",
              fontWeight: 700,
              color: "#C8A96E",
              boxShadow: isWinning ? "0 0 16px rgba(200,169,110,0.18)" : "none",
              transition: "all 0.4s ease",
            }}
          >
            Me
          </div>
          <span
            style={{
              fontFamily: MONO,
              fontSize: "16px",
              color: isWinning ? "#C8A96E" : "#EAE7E1",
              fontWeight: 500,
              letterSpacing: "-0.03em",
            }}
          >
            {rivalry.my_count}
          </span>
        </div>

        {/* Tug-of-war */}
        <div style={{ flex: 1 }}>
          <div
            style={{
              height: "5px",
              background: "#111",
              borderRadius: "3px",
              overflow: "hidden",
              display: "flex",
            }}
          >
            <div
              style={{
                width: `${myPct}%`,
                background: isTied
                  ? "linear-gradient(90deg, #2A2A2A, #333)"
                  : isWinning
                    ? "linear-gradient(90deg, #B8945E, #D4AA74)"
                    : "linear-gradient(90deg, #1A3A5C, #2A5C8A)",
                transition: "width 1.2s cubic-bezier(0.16,1,0.3,1)",
                boxShadow: isWinning
                  ? "2px 0 10px rgba(200,169,110,0.4)"
                  : !isTied
                    ? "2px 0 10px rgba(42,92,138,0.4)"
                    : "none",
              }}
            />
          </div>
          <p
            style={{
              fontFamily: BODY,
              fontSize: "10px",
              color: "#3A3A3A",
              textAlign: "center",
              marginTop: "6px",
              letterSpacing: "0.02em",
            }}
          >
            {isTied ? "Tied" : isWinning ? "You're ahead" : "They're ahead"}
          </p>
        </div>

        {/* Twin */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "6px",
            minWidth: "54px",
          }}
        >
          <Avatar name={rivalry.username} size={40} />
          <span
            style={{
              fontFamily: MONO,
              fontSize: "16px",
              color: !isWinning && !isTied ? "#C8A96E" : "#EAE7E1",
              fontWeight: 500,
              letterSpacing: "-0.03em",
            }}
          >
            {rivalry.twin_count}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: "14px",
          borderTop: "1px solid #161616",
        }}
      >
        <div>
          <p
            style={{
              fontFamily: BODY,
              fontSize: "13px",
              color: "#EAE7E1",
              fontWeight: 500,
            }}
          >
            {rivalry.username}
          </p>
          {rivalry.archetype && (
            <p
              style={{
                fontFamily: DISPLAY,
                fontSize: "11px",
                color: "#3A3A3A",
                fontStyle: "italic",
              }}
            >
              {rivalry.archetype}
            </p>
          )}
        </div>
        <div
          style={{
            padding: "4px 12px",
            borderRadius: "20px",
            background: "rgba(200,169,110,0.06)",
            border: "1px solid rgba(200,169,110,0.15)",
          }}
        >
          <span
            style={{
              fontFamily: MONO,
              fontSize: "9px",
              color: "#C8A96E",
              letterSpacing: "0.06em",
            }}
          >
            {rivalry.match_percentage}% match
          </span>
        </div>
      </div>
    </div>
  );
}

function ObscurePick({ film }: { film: any }) {
  return (
    <div
      style={{
        position: "relative",
        background: "#0C0C0C",
        border: "1px solid #161616",
        borderRadius: "10px",
        padding: "12px 14px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        marginTop: "10px",
        overflow: "hidden",
      }}
    >
      {film.poster_url ? (
        <img
          src={film.poster_url}
          alt={film.title}
          style={{
            width: "28px",
            height: "42px",
            objectFit: "cover",
            borderRadius: "4px",
            flexShrink: 0,
            opacity: 0.85,
          }}
        />
      ) : (
        <div
          style={{
            width: "28px",
            height: "42px",
            background: "#141414",
            borderRadius: "4px",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Film size={10} color="#2E2E2E" />
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontFamily: MONO,
            fontSize: "8px",
            color: "#3A3A3A",
            textTransform: "uppercase",
            letterSpacing: "0.14em",
            marginBottom: "3px",
          }}
        >
          🔮 Most obscure this week
        </p>
        <p
          style={{
            fontFamily: BODY,
            fontSize: "12px",
            color: "#EAE7E1",
            fontWeight: 500,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {film.title}
          {film.year ? ` (${film.year})` : ""}
        </p>
        <p style={{ fontFamily: BODY, fontSize: "10px", color: "#3A3A3A" }}>
          logged by {film.logged_by}
        </p>
      </div>
    </div>
  );
}

interface WeeklyLeaderboardProps {
  compact?: boolean;
}

export function WeeklyLeaderboard({ compact = false }: WeeklyLeaderboardProps) {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"board" | "rival">("board");

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    load();
  }, [user]);

  async function load() {
    setLoading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      setLoading(false);
      return;
    }
    const res = await fetch("/api/social/leaderboard", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    const json = await res.json();
    setData(json);
    setLoading(false);
  }

  if (!user) return null;

  if (loading) {
    return (
      <div
        style={{ padding: "32px", display: "flex", justifyContent: "center" }}
      >
        <Loader2
          size={14}
          color="#3A3A3A"
          style={{ animation: "spin 1s linear infinite" }}
        />
        <style>{`@keyframes spin { to { transform:rotate(360deg) } }`}</style>
      </div>
    );
  }

  if (!data) return null;

  const { leaderboard, twin_rivalry, most_obscure } = data;
  const selfEntry = leaderboard.find((e: any) => e.is_self);
  const selfRank = selfEntry?.rank ?? null;

  /* ─── COMPACT ─── */
  if (compact) {
    const top3 = leaderboard.slice(0, 3);
    const maxCount = top3[0]?.count || 1;

    return (
      <div
        style={{
          position: "relative",
          background: "linear-gradient(145deg, #0E0E0E, #0A0A0A)",
          border: "1px solid #181818",
          borderRadius: "12px",
          padding: "16px 18px",
          overflow: "hidden",
        }}
      >
        <GrainOverlay />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "14px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
            <Trophy size={10} color="#C8A96E" strokeWidth={1.5} />
            <p
              style={{
                fontFamily: MONO,
                fontSize: "8px",
                color: "#3A3A3A",
                textTransform: "uppercase",
                letterSpacing: "0.16em",
              }}
            >
              This week
            </p>
          </div>
          {selfRank && selfRank > 3 && (
            <span
              style={{ fontFamily: MONO, fontSize: "9px", color: "#C8A96E" }}
            >
              You #{selfRank}
            </span>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {top3.map((entry: any) => (
            <div
              key={entry.user_id}
              style={{ display: "flex", alignItems: "center", gap: "9px" }}
            >
              <RankBadge rank={entry.rank} />
              <Avatar name={entry.username} size={22} />
              <span
                style={{
                  fontFamily: BODY,
                  fontSize: "12px",
                  color: entry.is_self ? "#C8A96E" : "#8A8780",
                  fontWeight: entry.is_self ? 600 : 400,
                  flex: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {entry.is_self ? "You" : entry.username}
              </span>
              <LogBar
                count={entry.count}
                max={maxCount}
                isSelf={entry.is_self}
              />
            </div>
          ))}

          {selfRank && selfRank > 3 && selfEntry && (
            <>
              <div
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <div
                  style={{
                    flex: 1,
                    height: "1px",
                    background: "rgba(255,255,255,0.03)",
                  }}
                />
                <span
                  style={{ fontFamily: MONO, fontSize: "8px", color: "#222" }}
                >
                  ···
                </span>
                <div
                  style={{
                    flex: 1,
                    height: "1px",
                    background: "rgba(255,255,255,0.03)",
                  }}
                />
              </div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "9px" }}
              >
                <RankBadge rank={selfRank} />
                <Avatar name={selfEntry.username} size={22} />
                <span
                  style={{
                    fontFamily: BODY,
                    fontSize: "12px",
                    color: "#C8A96E",
                    fontWeight: 600,
                    flex: 1,
                  }}
                >
                  You
                </span>
                <LogBar
                  count={selfEntry.count}
                  max={leaderboard[0]?.count || 1}
                  isSelf={true}
                />
              </div>
            </>
          )}
        </div>

        {leaderboard.length <= 1 && (
          <p
            style={{
              fontFamily: DISPLAY,
              fontSize: "12px",
              color: "#2A2A2A",
              textAlign: "center",
              marginTop: "8px",
              fontStyle: "italic",
            }}
          >
            Follow people to see the leaderboard
          </p>
        )}
      </div>
    );
  }

  /* ─── FULL VIEW ─── */
  const maxCount = leaderboard[0]?.count || 1;

  return (
    <div>
      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: "0",
          borderBottom: "1px solid #141414",
          marginBottom: "18px",
        }}
      >
        {(
          [
            { id: "board", label: "Leaderboard" },
            { id: "rival", label: "Twin Rivalry" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: "8px 18px 10px",
              background: "none",
              border: "none",
              borderBottom:
                tab === t.id
                  ? "1.5px solid #C8A96E"
                  : "1.5px solid transparent",
              color: tab === t.id ? "#EAE7E1" : "#3A3A3A",
              fontFamily: BODY,
              fontSize: "12px",
              fontWeight: tab === t.id ? 500 : 400,
              cursor: "pointer",
              marginBottom: "-1px",
              letterSpacing: "0.02em",
              transition: "color 0.2s ease",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "board" && (
        <div>
          <p
            style={{
              fontFamily: MONO,
              fontSize: "8px",
              color: "#2E2E2E",
              textTransform: "uppercase",
              letterSpacing: "0.16em",
              marginBottom: "16px",
            }}
          >
            Films logged · resets every Monday
          </p>

          {leaderboard.length <= 1 ? (
            <div style={{ textAlign: "center", padding: "50px 0" }}>
              <Users
                size={20}
                color="#1E1E1E"
                style={{ margin: "0 auto 12px", display: "block" }}
              />
              <p
                style={{
                  fontFamily: DISPLAY,
                  fontSize: "17px",
                  color: "#2A2A2A",
                  fontStyle: "italic",
                }}
              >
                No one to compete with yet.
              </p>
              <p
                style={{
                  fontFamily: BODY,
                  fontSize: "12px",
                  color: "#3A3A3A",
                  marginTop: "5px",
                }}
              >
                Follow people to see a leaderboard.
              </p>
            </div>
          ) : (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "5px" }}
            >
              {leaderboard.map((entry: any, i: number) => (
                <div
                  key={entry.user_id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "11px 14px",
                    borderRadius: "10px",
                    background: entry.is_self
                      ? "linear-gradient(135deg, rgba(200,169,110,0.07) 0%, rgba(200,169,110,0.03) 100%)"
                      : i % 2 === 0
                        ? "#0C0C0C"
                        : "#0A0A0A",
                    border: `1px solid ${entry.is_self ? "rgba(200,169,110,0.18)" : "#141414"}`,
                    animation: `fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) forwards`,
                    animationDelay: `${i * 45}ms`,
                    opacity: 0,
                    transition: "border-color 0.2s ease",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {entry.is_self && (
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: "2px",
                        background:
                          "linear-gradient(180deg, transparent, rgba(200,169,110,0.6), transparent)",
                        borderRadius: "1px",
                      }}
                    />
                  )}
                  <RankBadge rank={entry.rank} />
                  <Avatar name={entry.username} size={28} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontFamily: BODY,
                        fontSize: "13px",
                        color: entry.is_self ? "#C8A96E" : "#EAE7E1",
                        fontWeight: entry.is_self ? 600 : 500,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {entry.is_self ? "You" : entry.username}
                    </p>
                    {entry.archetype && !entry.is_self && (
                      <p
                        style={{
                          fontFamily: DISPLAY,
                          fontSize: "10px",
                          color: "#3A3A3A",
                          fontStyle: "italic",
                        }}
                      >
                        {entry.archetype}
                      </p>
                    )}
                  </div>
                  <LogBar
                    count={entry.count}
                    max={maxCount}
                    isSelf={entry.is_self}
                  />
                </div>
              ))}
            </div>
          )}

          {most_obscure && <ObscurePick film={most_obscure} />}
        </div>
      )}

      {tab === "rival" && (
        <div>
          {twin_rivalry ? (
            <>
              <p
                style={{
                  fontFamily: MONO,
                  fontSize: "8px",
                  color: "#2E2E2E",
                  textTransform: "uppercase",
                  letterSpacing: "0.16em",
                  marginBottom: "16px",
                }}
              >
                Head-to-head vs. your closest taste twin
              </p>
              <TwinRivalry rivalry={twin_rivalry} />
              <div
                style={{
                  position: "relative",
                  background: "#0C0C0C",
                  border: "1px solid #161616",
                  borderRadius: "10px",
                  padding: "14px 16px",
                  overflow: "hidden",
                }}
              >
                <p
                  style={{
                    fontFamily: MONO,
                    fontSize: "8px",
                    color: "#3A3A3A",
                    textTransform: "uppercase",
                    letterSpacing: "0.14em",
                    marginBottom: "6px",
                  }}
                >
                  All-time overlap
                </p>
                <p
                  style={{
                    fontFamily: BODY,
                    fontSize: "13px",
                    color: "#6A6865",
                  }}
                >
                  <span style={{ color: "#C8A96E", fontWeight: 600 }}>
                    {twin_rivalry.match_count}
                  </span>{" "}
                  films watched by both of you
                </p>
              </div>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "50px 0" }}>
              <p
                style={{
                  fontFamily: DISPLAY,
                  fontSize: "17px",
                  color: "#2A2A2A",
                  fontStyle: "italic",
                }}
              >
                No taste twin yet.
              </p>
              <p
                style={{
                  fontFamily: BODY,
                  fontSize: "12px",
                  color: "#3A3A3A",
                  marginTop: "5px",
                }}
              >
                Log 5+ films and run the twin match from{" "}
                <Link
                  href="/twins"
                  style={{ color: "#C8A96E", textDecoration: "none" }}
                >
                  Twins
                </Link>
                .
              </p>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { to { transform:rotate(360deg) } }
      `}</style>
    </div>
  );
}
