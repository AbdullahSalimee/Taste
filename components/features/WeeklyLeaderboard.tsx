"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Trophy, Film, Users, TrendingUp, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

const SERIF = "Playfair Display, Georgia, serif";
const SANS = "Inter, system-ui, sans-serif";
const MONO = "JetBrains Mono, Courier New, monospace";

function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const colors = [
    "#5C4A8A",
    "#8A2A2A",
    "#2A5C8A",
    "#2A6A5C",
    "#8A7A2A",
    "#8A2A5C",
  ];
  const bg = colors[(name?.charCodeAt(0) || 0) % colors.length];
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        fontFamily: SANS,
        fontSize: size * 0.38,
        fontWeight: 600,
        color: "#F0EDE8",
      }}
    >
      {(name?.[0] || "?").toUpperCase()}
    </div>
  );
}

function RankMedal({ rank }: { rank: number }) {
  if (rank === 1) return <span style={{ fontSize: "14px" }}>🥇</span>;
  if (rank === 2) return <span style={{ fontSize: "14px" }}>🥈</span>;
  if (rank === 3) return <span style={{ fontSize: "14px" }}>🥉</span>;
  return (
    <span
      style={{
        fontFamily: MONO,
        fontSize: "11px",
        color: "#504E4A",
        width: "20px",
        textAlign: "center",
      }}
    >
      {rank}
    </span>
  );
}

// Bar fill as % of leader's count
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
          height: "4px",
          background: "#1A1A1A",
          borderRadius: "2px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: isSelf ? "#C8A96E" : "#2A3A4A",
            borderRadius: "2px",
            transition: "width 0.8s cubic-bezier(0.16,1,0.3,1)",
            boxShadow: isSelf ? "0 0 6px rgba(200,169,110,0.4)" : "none",
          }}
        />
      </div>
      <span
        style={{
          fontFamily: MONO,
          fontSize: "11px",
          color: isSelf ? "#C8A96E" : "#504E4A",
          minWidth: "20px",
          textAlign: "right",
        }}
      >
        {count}
      </span>
    </div>
  );
}

// Head-to-head twin rivalry card
function TwinRivalry({ rivalry }: { rivalry: any }) {
  const myPct =
    rivalry.my_count + rivalry.twin_count === 0
      ? 50
      : Math.round(
          (rivalry.my_count / (rivalry.my_count + rivalry.twin_count)) * 100,
        );
  const twinPct = 100 - myPct;
  const isWinning = rivalry.leader === "me";
  const isTied = rivalry.leader === "tie";

  return (
    <div
      style={{
        background: "#0F0F0F",
        border: "1px solid #2A2A2A",
        borderRadius: "10px",
        padding: "14px 16px",
        marginBottom: "8px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          marginBottom: "12px",
        }}
      >
        <Users size={12} color="#C8A96E" />
        <p
          style={{
            fontFamily: SANS,
            fontSize: "10px",
            color: "#504E4A",
            textTransform: "uppercase",
            letterSpacing: "0.12em",
          }}
        >
          Twin Rivalry — This Week
        </p>
      </div>

      {/* VS row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "10px",
        }}
      >
        {/* Me */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "4px",
            minWidth: "52px",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: "rgba(200,169,110,0.12)",
              border: `2px solid ${isWinning ? "#C8A96E" : "#2A2A2A"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: SERIF,
              fontSize: "14px",
              color: "#C8A96E",
              fontStyle: "italic",
              fontWeight: 700,
            }}
          >
            Me
          </div>
          <span
            style={{
              fontFamily: MONO,
              fontSize: "14px",
              color: isWinning ? "#C8A96E" : "#F0EDE8",
              fontWeight: 500,
            }}
          >
            {rivalry.my_count}
          </span>
        </div>

        {/* Progress tug-of-war bar */}
        <div style={{ flex: 1 }}>
          <div
            style={{
              height: "6px",
              background: "#1A1A1A",
              borderRadius: "3px",
              overflow: "hidden",
              display: "flex",
            }}
          >
            <div
              style={{
                width: `${myPct}%`,
                height: "100%",
                background: isTied
                  ? "#504E4A"
                  : isWinning
                    ? "#C8A96E"
                    : "#2A5C8A",
                borderRadius: "3px 0 0 3px",
                transition: "width 1s cubic-bezier(0.16,1,0.3,1)",
              }}
            />
          </div>
          <p
            style={{
              fontFamily: SANS,
              fontSize: "10px",
              color: "#504E4A",
              textAlign: "center",
              marginTop: "4px",
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
            gap: "4px",
            minWidth: "52px",
          }}
        >
          <Avatar name={rivalry.username} size={36} />
          <span
            style={{
              fontFamily: MONO,
              fontSize: "14px",
              color: !isWinning && !isTied ? "#C8A96E" : "#F0EDE8",
              fontWeight: 500,
            }}
          >
            {rivalry.twin_count}
          </span>
        </div>
      </div>

      {/* Twin name + match */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <p
            style={{
              fontFamily: SANS,
              fontSize: "12px",
              color: "#F0EDE8",
              fontWeight: 500,
            }}
          >
            {rivalry.username}
          </p>
          {rivalry.archetype && (
            <p
              style={{
                fontFamily: SANS,
                fontSize: "10px",
                color: "#504E4A",
                fontStyle: "italic",
              }}
            >
              {rivalry.archetype}
            </p>
          )}
        </div>
        <div
          style={{
            padding: "3px 10px",
            borderRadius: "20px",
            background: "rgba(200,169,110,0.08)",
            border: "1px solid rgba(200,169,110,0.2)",
          }}
        >
          <span
            style={{ fontFamily: MONO, fontSize: "10px", color: "#C8A96E" }}
          >
            {rivalry.match_percentage}% match
          </span>
        </div>
      </div>
    </div>
  );
}

// Most obscure film logged this week
function ObscurePick({ film }: { film: any }) {
  const router = useRouter();
  return (
    <div
      onClick={() => {}} // could link to title page if we had tmdb_id
      style={{
        background: "#0F0F0F",
        border: "1px solid #1A1A1A",
        borderRadius: "8px",
        padding: "10px 12px",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        marginTop: "8px",
      }}
    >
      {film.poster_url ? (
        <img
          src={film.poster_url}
          alt={film.title}
          style={{
            width: "30px",
            height: "44px",
            objectFit: "cover",
            borderRadius: "3px",
            flexShrink: 0,
          }}
        />
      ) : (
        <div
          style={{
            width: "30px",
            height: "44px",
            background: "#1A1A1A",
            borderRadius: "3px",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Film size={12} color="#504E4A" />
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontFamily: SANS,
            fontSize: "11px",
            color: "#504E4A",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            marginBottom: "2px",
          }}
        >
          🔮 Most obscure this week
        </p>
        <p
          style={{
            fontFamily: SANS,
            fontSize: "12px",
            color: "#F0EDE8",
            fontWeight: 500,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {film.title} {film.year ? `(${film.year})` : ""}
        </p>
        <p style={{ fontFamily: SANS, fontSize: "10px", color: "#504E4A" }}>
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
        style={{ padding: "20px", display: "flex", justifyContent: "center" }}
      >
        <Loader2
          size={16}
          color="#504E4A"
          style={{ animation: "spin 1s linear infinite" }}
        />
        <style>{`@keyframes spin { from { transform:rotate(0) } to { transform:rotate(360deg) } }`}</style>
      </div>
    );
  }

  if (!data) return null;

  const { leaderboard, twin_rivalry, most_obscure } = data;
  const selfEntry = leaderboard.find((e: any) => e.is_self);
  const selfRank = selfEntry?.rank ?? null;

  // Compact mode — just a small widget showing top 3 + your position
  if (compact) {
    const top3 = leaderboard.slice(0, 3);
    const maxCount = top3[0]?.count || 1;

    return (
      <div
        style={{
          background: "#141414",
          border: "1px solid #1A1A1A",
          borderRadius: "10px",
          padding: "14px 16px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Trophy size={12} color="#C8A96E" />
            <p
              style={{
                fontFamily: SANS,
                fontSize: "10px",
                color: "#504E4A",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
              }}
            >
              This week
            </p>
          </div>
          {selfRank && selfRank > 3 && (
            <span
              style={{ fontFamily: MONO, fontSize: "10px", color: "#C8A96E" }}
            >
              You #{selfRank}
            </span>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {top3.map((entry: any) => (
            <div
              key={entry.user_id}
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              <RankMedal rank={entry.rank} />
              <Avatar name={entry.username} size={22} />
              <span
                style={{
                  fontFamily: SANS,
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

          {/* Separator + your row if outside top 3 */}
          {selfRank && selfRank > 3 && selfEntry && (
            <>
              <div
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <div
                  style={{
                    flex: 1,
                    height: "1px",
                    background: "#1A1A1A",
                    borderStyle: "dashed",
                  }}
                />
                <span
                  style={{
                    fontFamily: MONO,
                    fontSize: "9px",
                    color: "#2A2A2A",
                  }}
                >
                  ···
                </span>
                <div
                  style={{ flex: 1, height: "1px", background: "#1A1A1A" }}
                />
              </div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <RankMedal rank={selfRank} />
                <Avatar name={selfEntry.username} size={22} />
                <span
                  style={{
                    fontFamily: SANS,
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
              fontFamily: SANS,
              fontSize: "11px",
              color: "#504E4A",
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

  // ── FULL PAGE / SECTION VIEW ─────────────────────────────────────────────
  const maxCount = leaderboard[0]?.count || 1;

  return (
    <div>
      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: "0",
          borderBottom: "1px solid #1A1A1A",
          marginBottom: "16px",
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
              padding: "8px 16px",
              background: "none",
              border: "none",
              borderBottom:
                tab === t.id ? "2px solid #C8A96E" : "2px solid transparent",
              color: tab === t.id ? "#F0EDE8" : "#504E4A",
              fontFamily: SANS,
              fontSize: "13px",
              fontWeight: tab === t.id ? 500 : 400,
              cursor: "pointer",
              marginBottom: "-1px",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "board" && (
        <div>
          {/* Header note */}
          <p
            style={{
              fontFamily: SANS,
              fontSize: "11px",
              color: "#504E4A",
              marginBottom: "14px",
            }}
          >
            Films logged this week · resets every Monday
          </p>

          {leaderboard.length <= 1 ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <Users
                size={24}
                color="#2A2A2A"
                style={{ margin: "0 auto 10px", display: "block" }}
              />
              <p
                style={{
                  fontFamily: SERIF,
                  fontSize: "16px",
                  color: "#2A2A2A",
                  fontStyle: "italic",
                }}
              >
                No one to compete with yet.
              </p>
              <p
                style={{
                  fontFamily: SANS,
                  fontSize: "12px",
                  color: "#504E4A",
                  marginTop: "4px",
                }}
              >
                Follow people to see a leaderboard.
              </p>
            </div>
          ) : (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "6px" }}
            >
              {leaderboard.map((entry: any, i: number) => (
                <div
                  key={entry.user_id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    background: entry.is_self
                      ? "rgba(200,169,110,0.06)"
                      : "#0F0F0F",
                    border: `1px solid ${entry.is_self ? "rgba(200,169,110,0.2)" : "#1A1A1A"}`,
                    transition: "border-color 0.15s ease",
                    animation: `fadeUp 0.3s ease forwards`,
                    animationDelay: `${i * 40}ms`,
                    opacity: 0,
                  }}
                >
                  <RankMedal rank={entry.rank} />
                  <Avatar name={entry.username} size={28} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontFamily: SANS,
                        fontSize: "13px",
                        color: entry.is_self ? "#C8A96E" : "#F0EDE8",
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
                          fontFamily: SANS,
                          fontSize: "10px",
                          color: "#504E4A",
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

          {/* Most obscure */}
          {most_obscure && <ObscurePick film={most_obscure} />}
        </div>
      )}

      {tab === "rival" && (
        <div>
          {twin_rivalry ? (
            <>
              <p
                style={{
                  fontFamily: SANS,
                  fontSize: "11px",
                  color: "#504E4A",
                  marginBottom: "14px",
                }}
              >
                Head-to-head vs. your closest taste twin · resets Monday
              </p>
              <TwinRivalry rivalry={twin_rivalry} />
              <div
                style={{
                  background: "#0F0F0F",
                  border: "1px solid #1A1A1A",
                  borderRadius: "8px",
                  padding: "12px 14px",
                  marginTop: "8px",
                }}
              >
                <p
                  style={{
                    fontFamily: SANS,
                    fontSize: "11px",
                    color: "#504E4A",
                    marginBottom: "4px",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                  }}
                >
                  All-time overlap
                </p>
                <p
                  style={{
                    fontFamily: SANS,
                    fontSize: "13px",
                    color: "#8A8780",
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
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <p
                style={{
                  fontFamily: SERIF,
                  fontSize: "16px",
                  color: "#2A2A2A",
                  fontStyle: "italic",
                }}
              >
                No taste twin yet.
              </p>
              <p
                style={{
                  fontFamily: SANS,
                  fontSize: "12px",
                  color: "#504E4A",
                  marginTop: "4px",
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
        @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { from { transform:rotate(0) } to { transform:rotate(360deg) } }
      `}</style>
    </div>
  );
}
