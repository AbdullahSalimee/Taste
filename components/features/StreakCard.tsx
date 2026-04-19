"use client";
import { useState, useEffect, useCallback } from "react";
import { Flame, Trophy, Target, Calendar } from "lucide-react";
import { getStreakData, setWeeklyGoal, type StreakData } from "@/lib/streaks";
import { useLogs } from "@/lib/hooks";

const SERIF = "Playfair Display, Georgia, serif";
const SANS = "Inter, system-ui, sans-serif";
const MONO = "JetBrains Mono, Courier New, monospace";

const FLAME_COLORS = {
  cold: { primary: "#504E4A", glow: "transparent", label: "No streak" },
  warm: {
    primary: "#C87C2A",
    glow: "rgba(200,124,42,0.25)",
    label: "Warming up",
  },
  hot: { primary: "#C8A96E", glow: "rgba(200,169,110,0.3)", label: "On fire" },
  blazing: {
    primary: "#FFD166",
    glow: "rgba(255,209,102,0.35)",
    label: "Blazing",
  },
};

// Day-dot: filled circle if logged, empty ring if not, pulsing if today
function DayDot({
  logged,
  isToday,
  label,
}: {
  logged: boolean;
  isToday: boolean;
  label: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "5px",
      }}
    >
      <div
        style={{
          width: "10px",
          height: "10px",
          borderRadius: "50%",
          background: logged ? "#C8A96E" : "transparent",
          border: logged
            ? "none"
            : `1.5px solid ${isToday ? "#C8A96E" : "#2A2A2A"}`,
          boxShadow:
            isToday && logged ? "0 0 6px rgba(200,169,110,0.6)" : "none",
          animation:
            isToday && !logged ? "dotPulse 2s ease-in-out infinite" : "none",
          transition: "all 0.3s ease",
        }}
      />
      <span
        style={{
          fontFamily: MONO,
          fontSize: "9px",
          color: isToday ? "#8A8780" : "#3A3A3A",
        }}
      >
        {label}
      </span>
    </div>
  );
}

// Animated flame SVG — scales with streak intensity
function FlameIcon({
  level,
  size = 28,
}: {
  level: StreakData["flameLevel"];
  size?: number;
}) {
  const color = FLAME_COLORS[level].primary;
  const glowColor = FLAME_COLORS[level].glow;
  const isActive = level !== "cold";

  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {isActive && (
        <div
          style={{
            position: "absolute",
            inset: "-4px",
            borderRadius: "50%",
            background: glowColor,
            filter: "blur(6px)",
            animation: "flameGlow 1.8s ease-in-out infinite",
          }}
        />
      )}
      <Flame
        size={size}
        color={color}
        fill={isActive ? color : "none"}
        strokeWidth={isActive ? 0 : 1.5}
        style={{
          position: "relative",
          zIndex: 1,
          animation: isActive ? "flameBob 1.4s ease-in-out infinite" : "none",
          filter:
            level === "blazing" ? `drop-shadow(0 0 4px ${color})` : "none",
        }}
      />
    </div>
  );
}

// Weekly progress ring
function WeekRing({ current, goal }: { current: number; goal: number }) {
  const pct = Math.min(current / goal, 1);
  const r = 22;
  const circ = 2 * Math.PI * r;
  const dash = circ * pct;

  return (
    <svg width="60" height="60" viewBox="0 0 60 60">
      <circle
        cx="30"
        cy="30"
        r={r}
        fill="none"
        stroke="#1A1A1A"
        strokeWidth="4"
      />
      <circle
        cx="30"
        cy="30"
        r={r}
        fill="none"
        stroke={pct >= 1 ? "#4A9E6B" : "#C8A96E"}
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        strokeDashoffset={circ / 4} // start from top
        style={{
          transition: "stroke-dasharray 0.8s cubic-bezier(0.16,1,0.3,1)",
          filter:
            pct >= 1 ? "drop-shadow(0 0 4px rgba(74,158,107,0.5))" : "none",
        }}
      />
      <text
        x="30"
        y="30"
        textAnchor="middle"
        dominantBaseline="central"
        style={{
          fontFamily: MONO,
          fontSize: "12px",
          fill: pct >= 1 ? "#4A9E6B" : "#C8A96E",
          fontWeight: 500,
        }}
      >
        {current}
      </text>
    </svg>
  );
}

interface StreakCardProps {
  compact?: boolean; // compact = sidebar/dashboard widget; false = full page card
}

export function StreakCard({ compact = true }: StreakCardProps) {
  const logs = useLogs(); // re-renders when logs change
  const [data, setData] = useState<StreakData | null>(null);
  const [goalEditing, setGoalEditing] = useState(false);
  const [goalInput, setGoalInput] = useState("5");

  const refresh = useCallback(() => {
    setData(getStreakData());
  }, []);

  // Recalculate whenever logs update
  useEffect(() => {
    refresh();
  }, [logs, refresh]);

  if (!data) return null;

  const flame = FLAME_COLORS[data.flameLevel];
  const dayLabels = ["T", "Y", "2", "3", "4", "5", "6"]; // Today, Yesterday, ...

  function handleGoalSave() {
    const v = Math.max(1, Math.min(30, parseInt(goalInput, 10) || 5));
    setWeeklyGoal(v);
    setGoalEditing(false);
    refresh();
  }

  // ── COMPACT MODE (dashboard widget) ──────────────────────────────────────
  if (compact) {
    return (
      <>
        <style>{`
          @keyframes flameBob {
            0%,100% { transform: translateY(0) scale(1); }
            50%      { transform: translateY(-2px) scale(1.05); }
          }
          @keyframes flameGlow {
            0%,100% { opacity: 0.6; }
            50%      { opacity: 1; }
          }
          @keyframes dotPulse {
            0%,100% { opacity: 0.4; transform: scale(1); }
            50%      { opacity: 1; transform: scale(1.3); }
          }
        `}</style>
        <div
          style={{
            background: "#141414",
            border: `1px solid ${data.current >= 3 ? "rgba(200,169,110,0.2)" : "#1A1A1A"}`,
            borderRadius: "10px",
            padding: "14px 16px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Subtle glow when active */}
          {data.flameLevel !== "cold" && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "2px",
                background: `linear-gradient(90deg, transparent, ${flame.primary}80, transparent)`,
              }}
            />
          )}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <FlameIcon level={data.flameLevel} size={20} />
              <div>
                <p
                  style={{
                    fontFamily: MONO,
                    fontSize: "22px",
                    color: flame.primary,
                    fontWeight: 500,
                    lineHeight: 1,
                  }}
                >
                  {data.current}
                </p>
                <p
                  style={{
                    fontFamily: SANS,
                    fontSize: "9px",
                    color: "#504E4A",
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    marginTop: "1px",
                  }}
                >
                  day streak
                </p>
              </div>
            </div>

            {/* Week ring */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "2px",
              }}
            >
              <WeekRing current={data.thisWeek} goal={data.weekGoal} />
              <p
                style={{ fontFamily: SANS, fontSize: "9px", color: "#504E4A" }}
              >
                this week
              </p>
            </div>
          </div>

          {/* 7-day dots */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              paddingTop: "10px",
              borderTop: "1px solid #1A1A1A",
            }}
          >
            {data.lastSevenDays.map((logged, i) => (
              <DayDot
                key={i}
                logged={logged}
                isToday={i === 0}
                label={dayLabels[i]}
              />
            ))}
          </div>

          {/* Status label */}
          {data.todayLogged && (
            <p
              style={{
                fontFamily: SANS,
                fontSize: "10px",
                color: "#4A9E6B",
                marginTop: "8px",
                textAlign: "center",
              }}
            >
              ✓ Logged today
            </p>
          )}
          {!data.todayLogged && data.current > 0 && (
            <p
              style={{
                fontFamily: SANS,
                fontSize: "10px",
                color: "#C87C2A",
                marginTop: "8px",
                textAlign: "center",
              }}
            >
              Log something today to keep your streak alive
            </p>
          )}
        </div>
      </>
    );
  }

  // ── FULL CARD (profile / dedicated page) ──────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes flameBob {
          0%,100% { transform: translateY(0) scale(1); }
          50%      { transform: translateY(-3px) scale(1.08); }
        }
        @keyframes flameGlow {
          0%,100% { opacity: 0.5; }
          50%      { opacity: 1; }
        }
        @keyframes dotPulse {
          0%,100% { opacity: 0.4; transform: scale(1); }
          50%      { opacity: 1; transform: scale(1.3); }
        }
        @keyframes streakReveal {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div
        style={{
          background: "#141414",
          border: `1px solid ${data.current >= 3 ? "rgba(200,169,110,0.25)" : "#2A2A2A"}`,
          borderRadius: "12px",
          overflow: "hidden",
          animation: "streakReveal 0.5s ease",
        }}
      >
        {/* Top accent line */}
        {data.flameLevel !== "cold" && (
          <div
            style={{
              height: "2px",
              background: `linear-gradient(90deg, transparent 0%, ${flame.primary} 50%, transparent 100%)`,
            }}
          />
        )}

        <div style={{ padding: "20px" }}>
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              marginBottom: "20px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <FlameIcon level={data.flameLevel} size={32} />
              <div>
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
                  Watch streak
                </p>
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: "6px",
                  }}
                >
                  <span
                    style={{
                      fontFamily: MONO,
                      fontSize: "40px",
                      fontWeight: 500,
                      color: flame.primary,
                      lineHeight: 1,
                    }}
                  >
                    {data.current}
                  </span>
                  <span
                    style={{
                      fontFamily: SANS,
                      fontSize: "14px",
                      color: "#504E4A",
                    }}
                  >
                    days
                  </span>
                </div>
                <p
                  style={{
                    fontFamily: SANS,
                    fontSize: "11px",
                    color: flame.primary,
                    fontStyle: "italic",
                    marginTop: "2px",
                  }}
                >
                  {flame.label}
                </p>
              </div>
            </div>

            {/* Stats column */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                alignItems: "flex-end",
              }}
            >
              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    justifyContent: "flex-end",
                  }}
                >
                  <Trophy size={11} color="#504E4A" />
                  <span
                    style={{
                      fontFamily: MONO,
                      fontSize: "18px",
                      color: "#F0EDE8",
                      fontWeight: 500,
                    }}
                  >
                    {data.longest}
                  </span>
                </div>
                <p
                  style={{
                    fontFamily: SANS,
                    fontSize: "9px",
                    color: "#504E4A",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                  }}
                >
                  Best streak
                </p>
              </div>
            </div>
          </div>

          {/* 7-day strip */}
          <div style={{ marginBottom: "20px" }}>
            <p
              style={{
                fontFamily: SANS,
                fontSize: "9px",
                color: "#504E4A",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                marginBottom: "10px",
              }}
            >
              Last 7 days
            </p>
            <div style={{ display: "flex", gap: "6px" }}>
              {data.lastSevenDays.map((logged, i) => {
                const labels = ["Today", "Yest.", "2d", "3d", "4d", "5d", "6d"];
                return (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      height: "36px",
                      borderRadius: "5px",
                      background: logged
                        ? i === 0 && data.todayLogged
                          ? "rgba(200,169,110,0.25)"
                          : "rgba(200,169,110,0.15)"
                        : "#1A1A1A",
                      border: logged
                        ? "1px solid rgba(200,169,110,0.35)"
                        : i === 0
                          ? "1px dashed #3A3A3A"
                          : "1px solid #1A1A1A",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "3px",
                      transition: "all 0.3s ease",
                    }}
                  >
                    {logged ? (
                      <div
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          background: "#C8A96E",
                          boxShadow:
                            i === 0 ? "0 0 5px rgba(200,169,110,0.6)" : "none",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          border: `1px solid ${i === 0 ? "#504E4A" : "#2A2A2A"}`,
                          animation:
                            i === 0
                              ? "dotPulse 2s ease-in-out infinite"
                              : "none",
                        }}
                      />
                    )}
                    <span
                      style={{
                        fontFamily: MONO,
                        fontSize: "8px",
                        color: logged ? "#8A8780" : "#3A3A3A",
                      }}
                    >
                      {labels[i]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Weekly goal */}
          <div
            style={{
              background: "#0F0F0F",
              borderRadius: "8px",
              padding: "12px 14px",
              border: "1px solid #1A1A1A",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "8px",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <Target size={12} color="#504E4A" />
                <span
                  style={{
                    fontFamily: SANS,
                    fontSize: "11px",
                    color: "#8A8780",
                  }}
                >
                  Weekly goal — {data.thisWeek} / {data.weekGoal} titles
                </span>
              </div>
              {!goalEditing ? (
                <button
                  onClick={() => {
                    setGoalInput(String(data.weekGoal));
                    setGoalEditing(true);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: SANS,
                    fontSize: "10px",
                    color: "#504E4A",
                    padding: 0,
                  }}
                >
                  Edit
                </button>
              ) : (
                <div
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <input
                    type="number"
                    value={goalInput}
                    onChange={(e) => setGoalInput(e.target.value)}
                    min={1}
                    max={30}
                    style={{
                      width: "40px",
                      background: "#141414",
                      border: "1px solid rgba(200,169,110,0.3)",
                      borderRadius: "4px",
                      padding: "2px 6px",
                      color: "#F0EDE8",
                      fontFamily: MONO,
                      fontSize: "12px",
                      outline: "none",
                      textAlign: "center",
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleGoalSave()}
                    autoFocus
                  />
                  <button
                    onClick={handleGoalSave}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontFamily: SANS,
                      fontSize: "10px",
                      color: "#C8A96E",
                      padding: 0,
                    }}
                  >
                    Save
                  </button>
                </div>
              )}
            </div>

            {/* Progress bar */}
            <div
              style={{
                height: "5px",
                background: "#1A1A1A",
                borderRadius: "3px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${Math.min((data.thisWeek / data.weekGoal) * 100, 100)}%`,
                  background:
                    data.thisWeek >= data.weekGoal ? "#4A9E6B" : "#C8A96E",
                  borderRadius: "3px",
                  transition: "width 0.8s cubic-bezier(0.16,1,0.3,1)",
                  boxShadow:
                    data.thisWeek >= data.weekGoal
                      ? "0 0 6px rgba(74,158,107,0.5)"
                      : "none",
                }}
              />
            </div>

            {data.thisWeek >= data.weekGoal && (
              <p
                style={{
                  fontFamily: SANS,
                  fontSize: "10px",
                  color: "#4A9E6B",
                  marginTop: "6px",
                }}
              >
                ✓ Weekly goal crushed
              </p>
            )}
          </div>

          {/* Nudge message */}
          {!data.todayLogged && (
            <p
              style={{
                fontFamily: SERIF,
                fontSize: "13px",
                color: "#504E4A",
                fontStyle: "italic",
                textAlign: "center",
                marginTop: "14px",
                lineHeight: 1.5,
              }}
            >
              {data.current > 0
                ? `${data.current} days and counting — don't stop now.`
                : "Start your streak. Log something today."}
            </p>
          )}
          {data.todayLogged && data.current === 1 && (
            <p
              style={{
                fontFamily: SERIF,
                fontSize: "13px",
                color: "#C8A96E",
                fontStyle: "italic",
                textAlign: "center",
                marginTop: "14px",
              }}
            >
              Day one. Come back tomorrow.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
