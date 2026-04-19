"use client";
import { useState, useEffect, useCallback } from "react";
import { Trophy, Star, Zap, Award, ChevronDown, ChevronUp } from "lucide-react";
import {
  getCinephileData,
  canPrestige,
  doPrestige,
  toRoman,
  getXPBreakdown,
  RANK_COLORS,
  RANK_DESCRIPTIONS,
  RANK_THRESHOLDS,
  type CinephileData,
  type CinephileRank,
} from "@/lib/cinephile-level";
import { useLogs } from "@/lib/hooks";

const SERIF = "Playfair Display, Georgia, serif";
const SANS = "Inter, system-ui, sans-serif";
const MONO = "JetBrains Mono, Courier New, monospace";

// Rank roman-tier badge
function RankBadge({
  rank,
  prestige,
  size = "md",
}: {
  rank: CinephileRank;
  prestige: number;
  size?: "sm" | "md" | "lg";
}) {
  const colors = RANK_COLORS[rank];
  const px = {
    sm: { outer: 32, font: 8 },
    md: { outer: 44, font: 10 },
    lg: { outer: 60, font: 13 },
  }[size];

  const rankInitials: Record<CinephileRank, string> = {
    Casual: "C",
    Enthusiast: "E",
    Devotee: "D",
    Auteur: "A",
  };

  return (
    <div style={{ position: "relative", display: "inline-flex" }}>
      <div
        style={{
          width: px.outer,
          height: px.outer,
          borderRadius: "50%",
          background: colors.bg,
          border: `1.5px solid ${colors.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          boxShadow:
            rank === "Auteur" ? `0 0 12px ${colors.primary}40` : "none",
        }}
      >
        <span
          style={{
            fontFamily: SERIF,
            fontSize: px.font + 2,
            fontWeight: 700,
            color: colors.primary,
            fontStyle: "italic",
            lineHeight: 1,
          }}
        >
          {rankInitials[rank]}
        </span>
      </div>
      {prestige > 0 && (
        <div
          style={{
            position: "absolute",
            bottom: -2,
            right: -2,
            width: px.font + 6,
            height: px.font + 6,
            borderRadius: "50%",
            background: "#0D0D0D",
            border: `1px solid ${colors.primary}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{ fontFamily: MONO, fontSize: 7, color: colors.primary }}
          >
            {toRoman(prestige)}
          </span>
        </div>
      )}
    </div>
  );
}

// XP progress bar
function XPBar({ data }: { data: CinephileData }) {
  const colors = RANK_COLORS[data.rank];
  const isMax = data.xpForNextRank === null;

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "5px",
        }}
      >
        <span style={{ fontFamily: MONO, fontSize: "10px", color: "#504E4A" }}>
          {data.xp.toLocaleString()} XP
        </span>
        {!isMax && (
          <span
            style={{ fontFamily: MONO, fontSize: "10px", color: "#504E4A" }}
          >
            {data.xpForNextRank!.toLocaleString()} XP
          </span>
        )}
        {isMax && (
          <span
            style={{
              fontFamily: MONO,
              fontSize: "10px",
              color: colors.primary,
            }}
          >
            Max rank
          </span>
        )}
      </div>
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
            width: `${(isMax ? 1 : data.progressInRank) * 100}%`,
            background: colors.primary,
            borderRadius: "3px",
            boxShadow: `0 0 6px ${colors.primary}60`,
            transition: "width 1s cubic-bezier(0.16,1,0.3,1)",
          }}
        />
      </div>
      {!isMax && (
        <p
          style={{
            fontFamily: SANS,
            fontSize: "9px",
            color: "#504E4A",
            marginTop: "4px",
          }}
        >
          {(data.xpForNextRank! - data.xp).toLocaleString()} XP to{" "}
          {RANK_THRESHOLDS[data.rankIndex + 1]?.rank}
        </p>
      )}
    </div>
  );
}

// Genre badge grid
function BadgeGrid({
  data,
  showAll,
}: {
  data: CinephileData;
  showAll: boolean;
}) {
  const earned = data.badges.filter((b) => b.earned);
  const pending = data.badges.filter((b) => !b.earned);
  const visible = showAll
    ? [...earned, ...pending]
    : [...earned, ...pending.slice(0, 6 - earned.length)];

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
      {visible.map((badge) => (
        <div
          key={badge.genre}
          title={
            badge.earned
              ? `${badge.genre} badge earned`
              : `${Math.round(badge.progress * badge.required)}/${badge.required} films`
          }
          style={{
            padding: "4px 10px",
            borderRadius: "4px",
            background: badge.earned ? `${badge.color}22` : "#141414",
            border: `1px solid ${badge.earned ? badge.color + "55" : "#2A2A2A"}`,
            display: "flex",
            alignItems: "center",
            gap: "6px",
            cursor: "default",
            opacity: badge.earned ? 1 : 0.55,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Progress underline for in-progress badges */}
          {!badge.earned && badge.progress > 0 && (
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                height: "2px",
                width: `${badge.progress * 100}%`,
                background: badge.color,
                opacity: 0.6,
              }}
            />
          )}
          {badge.earned && <Award size={10} color={badge.color} />}
          <span
            style={{
              fontFamily: SANS,
              fontSize: "11px",
              color: badge.earned ? badge.color : "#504E4A",
              fontWeight: badge.earned ? 500 : 400,
            }}
          >
            {badge.genre}
          </span>
          {!badge.earned && badge.progress > 0 && (
            <span
              style={{ fontFamily: MONO, fontSize: "9px", color: "#504E4A" }}
            >
              {Math.round(badge.progress * badge.required)}/{badge.required}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

// XP breakdown row
function XPBreakdown({ data }: { data: CinephileData }) {
  const items = getXPBreakdown(data);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {items.map((item) => (
        <div
          key={item.label}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
            <span style={{ fontSize: "12px", lineHeight: 1 }}>{item.icon}</span>
            <span
              style={{ fontFamily: SANS, fontSize: "12px", color: "#8A8780" }}
            >
              {item.label}
            </span>
          </div>
          <span
            style={{
              fontFamily: MONO,
              fontSize: "11px",
              color: item.xp > 0 ? "#C8A96E" : "#2A2A2A",
            }}
          >
            +{item.xp}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Compact badge (for sidebar / DNA card) ────────────────────────────────────
export function CinephileBadge({
  rank,
  prestige,
  xp,
}: {
  rank: CinephileRank;
  prestige: number;
  xp: number;
}) {
  const colors = RANK_COLORS[rank];
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "3px 10px 3px 6px",
        borderRadius: "20px",
        background: colors.bg,
        border: `1px solid ${colors.border}`,
      }}
    >
      <RankBadge rank={rank} prestige={prestige} size="sm" />
      <span
        style={{
          fontFamily: SERIF,
          fontSize: "11px",
          color: colors.primary,
          fontStyle: "italic",
          fontWeight: 600,
        }}
      >
        {rank}
        {prestige > 0 && (
          <span
            style={{ fontFamily: MONO, fontSize: "9px", marginLeft: "3px" }}
          >
            {toRoman(prestige)}
          </span>
        )}
      </span>
      <span
        style={{
          fontFamily: MONO,
          fontSize: "9px",
          color: "#504E4A",
          borderLeft: "1px solid #2A2A2A",
          paddingLeft: "6px",
          marginLeft: "2px",
        }}
      >
        {xp.toLocaleString()} XP
      </span>
    </div>
  );
}

// ── Full level card ───────────────────────────────────────────────────────────
interface CinephileLevelProps {
  compact?: boolean;
}

export function CinephileLevel({ compact = false }: CinephileLevelProps) {
  const logs = useLogs();
  const [data, setData] = useState<CinephileData | null>(null);
  const [showBadges, setShowBadges] = useState(false);
  const [showXP, setShowXP] = useState(false);
  const [prestigeConfirm, setPrestigeConfirm] = useState(false);
  const [prestigeFlash, setPrestigeFlash] = useState(false);

  const refresh = useCallback(() => {
    getCinephileData().then(setData);
  }, []);

  useEffect(() => {
    refresh();
  }, [logs, refresh]);
 

  if (!data) return null;

  const colors = RANK_COLORS[data.rank];
  const earnedBadgeCount = data.badges.filter((b) => b.earned).length;

  function handlePrestige() {
    if (!prestigeConfirm) {
      setPrestigeConfirm(true);
      return;
    }
    doPrestige().then(() => {
      setPrestigeFlash(true);
      setPrestigeConfirm(false);
      setTimeout(() => {
        setPrestigeFlash(false);
        refresh();
      }, 1200);
    });
  }
 

  // ── COMPACT (profile sidebar / DNA card embed) ─────────────────────────
  if (compact) {
    return (
      <div
        style={{
          background: "#141414",
          border: `1px solid ${colors.border}`,
          borderRadius: "10px",
          padding: "14px 16px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {data.rank === "Auteur" && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "2px",
              background: `linear-gradient(90deg, transparent, ${colors.primary}, transparent)`,
            }}
          />
        )}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "10px",
          }}
        >
          <RankBadge rank={data.rank} prestige={data.prestige} size="md" />
          <div style={{ flex: 1 }}>
            <p
              style={{
                fontFamily: SERIF,
                fontSize: "15px",
                color: colors.primary,
                fontWeight: 700,
                fontStyle: "italic",
              }}
            >
              {data.rank}
              {data.prestige > 0 && (
                <span
                  style={{
                    fontFamily: MONO,
                    fontSize: "10px",
                    marginLeft: "5px",
                    fontStyle: "normal",
                  }}
                >
                  {toRoman(data.prestige)}
                </span>
              )}
            </p>
            <p
              style={{
                fontFamily: MONO,
                fontSize: "10px",
                color: "#504E4A",
                marginTop: "1px",
              }}
            >
              {data.xp.toLocaleString()} XP · {earnedBadgeCount} badge
              {earnedBadgeCount !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <XPBar data={data} />
      </div>
    );
  }

  // ── FULL CARD ──────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes prestigeFlash {
          0%   { opacity: 0; transform: scale(0.8); }
          40%  { opacity: 1; transform: scale(1.05); }
          100% { opacity: 0; transform: scale(1.2); }
        }
        @keyframes levelReveal {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div
        style={{
          background: "#141414",
          border: `1px solid ${colors.border}`,
          borderRadius: "12px",
          overflow: "hidden",
          animation: "levelReveal 0.5s ease",
          position: "relative",
        }}
      >
        {/* Prestige flash overlay */}
        {prestigeFlash && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: colors.primary,
              zIndex: 10,
              animation: "prestigeFlash 1.2s ease forwards",
              pointerEvents: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <p
              style={{
                fontFamily: SERIF,
                fontSize: "20px",
                color: "#0D0D0D",
                fontStyle: "italic",
                fontWeight: 700,
              }}
            >
              Prestige achieved
            </p>
          </div>
        )}

        {/* Top accent */}
        <div
          style={{
            height: "2px",
            background: `linear-gradient(90deg, transparent, ${colors.primary}, transparent)`,
          }}
        />

        <div style={{ padding: "20px" }}>
          {/* Header row */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "14px",
              marginBottom: "20px",
            }}
          >
            <RankBadge rank={data.rank} prestige={data.prestige} size="lg" />
            <div style={{ flex: 1 }}>
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
                Cinephile rank
              </p>
              <h3
                style={{
                  fontFamily: SERIF,
                  fontSize: "26px",
                  fontWeight: 700,
                  color: colors.primary,
                  fontStyle: "italic",
                  lineHeight: 1.1,
                  marginBottom: "4px",
                }}
              >
                {data.rank}
                {data.prestige > 0 && (
                  <span
                    style={{
                      fontFamily: MONO,
                      fontSize: "14px",
                      marginLeft: "8px",
                      fontStyle: "normal",
                      color: colors.primary,
                      opacity: 0.7,
                    }}
                  >
                    {toRoman(data.prestige)}
                  </span>
                )}
              </h3>
              <p
                style={{
                  fontFamily: SANS,
                  fontSize: "12px",
                  color: "#8A8780",
                  fontStyle: "italic",
                }}
              >
                {RANK_DESCRIPTIONS[data.rank]}
              </p>
            </div>
          </div>

          {/* XP bar */}
          <div style={{ marginBottom: "20px" }}>
            <XPBar data={data} />
          </div>

          {/* Stats row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "10px",
              marginBottom: "20px",
              padding: "12px",
              background: "#0F0F0F",
              borderRadius: "8px",
              border: "1px solid #1A1A1A",
            }}
          >
            {[
              {
                val: data.totalFilms,
                label: "Films",
                icon: <Zap size={11} color="#504E4A" />,
              },
              {
                val: earnedBadgeCount,
                label: "Badges",
                icon: <Award size={11} color="#504E4A" />,
              },
              {
                val: data.xp,
                label: "Total XP",
                icon: <Star size={11} color="#504E4A" />,
              },
            ].map(({ val, label, icon }) => (
              <div key={label} style={{ textAlign: "center" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "4px",
                    marginBottom: "3px",
                  }}
                >
                  {icon}
                </div>
                <p
                  style={{
                    fontFamily: MONO,
                    fontSize: "18px",
                    color: colors.primary,
                    fontWeight: 500,
                    lineHeight: 1,
                  }}
                >
                  {typeof val === "number" && val > 999
                    ? `${(val / 1000).toFixed(1)}k`
                    : val}
                </p>
                <p
                  style={{
                    fontFamily: SANS,
                    fontSize: "9px",
                    color: "#504E4A",
                    marginTop: "2px",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                  }}
                >
                  {label}
                </p>
              </div>
            ))}
          </div>

          {/* Genre badges */}
          <div style={{ marginBottom: "16px" }}>
            <button
              onClick={() => setShowBadges(!showBadges)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "0 0 10px",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <Award size={12} color="#504E4A" />
                <span
                  style={{
                    fontFamily: SANS,
                    fontSize: "10px",
                    color: "#504E4A",
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                  }}
                >
                  Genre badges ({earnedBadgeCount}/{data.badges.length})
                </span>
              </div>
              {showBadges ? (
                <ChevronUp size={12} color="#504E4A" />
              ) : (
                <ChevronDown size={12} color="#504E4A" />
              )}
            </button>
            {showBadges && <BadgeGrid data={data} showAll={true} />}
            {!showBadges && earnedBadgeCount > 0 && (
              <BadgeGrid data={data} showAll={false} />
            )}
          </div>

          {/* XP breakdown */}
          <div style={{ marginBottom: "16px" }}>
            <button
              onClick={() => setShowXP(!showXP)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "0 0 10px",
                borderTop: "1px solid #1A1A1A",
                paddingTop: "12px",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <Zap size={12} color="#504E4A" />
                <span
                  style={{
                    fontFamily: SANS,
                    fontSize: "10px",
                    color: "#504E4A",
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                  }}
                >
                  XP breakdown
                </span>
              </div>
              {showXP ? (
                <ChevronUp size={12} color="#504E4A" />
              ) : (
                <ChevronDown size={12} color="#504E4A" />
              )}
            </button>
            {showXP && (
              <div
                style={{
                  background: "#0F0F0F",
                  borderRadius: "8px",
                  padding: "12px",
                  border: "1px solid #1A1A1A",
                }}
              >
                <XPBreakdown data={data} />
              </div>
            )}
          </div>

          {/* Prestige button — only at Auteur */}
          {canPrestige(data) && (
            <div style={{ borderTop: "1px solid #1A1A1A", paddingTop: "14px" }}>
              <p
                style={{
                  fontFamily: SANS,
                  fontSize: "11px",
                  color: "#504E4A",
                  marginBottom: "8px",
                  lineHeight: 1.5,
                }}
              >
                You've reached the top. Prestige to start again with a badge of
                honour. Your history and badges are kept.
              </p>
              <button
                onClick={handlePrestige}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "8px",
                  background: prestigeConfirm ? colors.primary : "transparent",
                  border: `1px solid ${colors.border}`,
                  color: prestigeConfirm ? "#0D0D0D" : colors.primary,
                  fontFamily: SANS,
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                {prestigeConfirm
                  ? "Confirm prestige — this resets your XP display"
                  : `✦ Prestige (currently ${toRoman(data.prestige + 1) || "I"})`}
              </button>
              {prestigeConfirm && (
                <button
                  onClick={() => setPrestigeConfirm(false)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: SANS,
                    fontSize: "11px",
                    color: "#504E4A",
                    marginTop: "6px",
                    width: "100%",
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
