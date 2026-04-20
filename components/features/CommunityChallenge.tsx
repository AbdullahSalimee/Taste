"use client";
import { useState, useEffect } from "react";
import { Loader2, Clock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

const DISPLAY = "'Cormorant Garamond', 'Playfair Display', Georgia, serif";
const BODY = "'DM Sans', 'Inter', system-ui, sans-serif";
const MONO = "'Geist Mono', 'JetBrains Mono', 'Courier New', monospace";

function timeLeft(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const hours = Math.floor(diff / 3600000);
  if (hours < 24) return `${hours}h left`;
  const days = Math.floor(hours / 24);
  return `${days}d left`;
}

function GrainOverlay() {
  return (
    <svg
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        opacity: 0.035,
        borderRadius: "inherit",
      }}
    >
      <filter id="grain">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.65"
          numOctaves="3"
          stitchTiles="stitch"
        />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#grain)" />
    </svg>
  );
}

function ChallengeCard({
  challenge,
  index,
}: {
  challenge: any;
  index: number;
}) {
  const [hovered, setHovered] = useState(false);
  const pct =
    challenge.goal === 0
      ? 0
      : Math.round((challenge.progress / challenge.goal) * 100);
  const done = challenge.completed;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        background: done
          ? `linear-gradient(135deg, ${challenge.color}0a 0%, #0C0C0C 60%)`
          : hovered
            ? "linear-gradient(135deg, #141414 0%, #111111 100%)"
            : "#0C0C0C",
        border: `1px solid ${done ? challenge.color + "30" : hovered ? "#2A2A2A" : "#181818"}`,
        borderRadius: "12px",
        padding: "18px 20px",
        overflow: "hidden",
        animation: `challengeReveal 0.5s cubic-bezier(0.16,1,0.3,1) forwards`,
        animationDelay: `${index * 80}ms`,
        opacity: 0,
        transition:
          "background 0.3s ease, border-color 0.3s ease, transform 0.2s ease",
        transform: hovered ? "translateY(-1px)" : "translateY(0)",
        cursor: "default",
      }}
    >
      <GrainOverlay />

      {/* Top accent line */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "1px",
          background: done
            ? `linear-gradient(90deg, transparent 0%, ${challenge.color}80 30%, ${challenge.color} 50%, ${challenge.color}80 70%, transparent 100%)`
            : hovered
              ? `linear-gradient(90deg, transparent 0%, #2A2A2A 50%, transparent 100%)`
              : "transparent",
          transition: "background 0.4s ease",
        }}
      />

      <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
        {/* Icon badge */}
        <div
          style={{
            width: "42px",
            height: "42px",
            flexShrink: 0,
            borderRadius: "10px",
            background: done
              ? `radial-gradient(circle at center, ${challenge.color}22 0%, ${challenge.color}08 100%)`
              : "rgba(255,255,255,0.03)",
            border: `1px solid ${done ? challenge.color + "40" : "#222"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: done ? "16px" : "20px",
            boxShadow: done ? `0 0 20px ${challenge.color}20` : "none",
            transition: "all 0.4s ease",
            position: "relative",
          }}
        >
          {done ? (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M3 8L6.5 11.5L13 4.5"
                stroke={challenge.color}
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            challenge.icon
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: "10px",
              marginBottom: "5px",
            }}
          >
            <p
              style={{
                fontFamily: DISPLAY,
                fontSize: "15px",
                fontWeight: 600,
                letterSpacing: "0.01em",
                color: done ? challenge.color : "#EAE7E1",
                lineHeight: 1.25,
              }}
            >
              {challenge.title}
            </p>

            {done ? (
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: "8px",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: challenge.color,
                  background: `${challenge.color}14`,
                  border: `1px solid ${challenge.color}28`,
                  padding: "3px 9px",
                  borderRadius: "20px",
                  flexShrink: 0,
                  fontWeight: 500,
                }}
              >
                Complete
              </span>
            ) : (
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: "9px",
                  color: "#3A3A3A",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  flexShrink: 0,
                }}
              >
                <Clock size={8} strokeWidth={1.5} />
                {timeLeft(challenge.expires_at)}
              </span>
            )}
          </div>

          <p
            style={{
              fontFamily: BODY,
              fontSize: "12px",
              color: "#5A5855",
              lineHeight: 1.6,
              marginBottom: "13px",
              fontWeight: 400,
            }}
          >
            {challenge.description}
          </p>

          {/* Progress */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                flex: 1,
                height: "3px",
                background: "rgba(255,255,255,0.05)",
                borderRadius: "2px",
                overflow: "hidden",
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  width: `${pct}%`,
                  background: done
                    ? `linear-gradient(90deg, ${challenge.color}bb, ${challenge.color})`
                    : `linear-gradient(90deg, ${challenge.color}44, ${challenge.color}88)`,
                  borderRadius: "2px",
                  transition: "width 1s cubic-bezier(0.16,1,0.3,1) 0.2s",
                  boxShadow: done ? `0 0 8px ${challenge.color}50` : "none",
                }}
              />
            </div>
            <span
              style={{
                fontFamily: MONO,
                fontSize: "10px",
                color: done ? challenge.color : "#3A3A3A",
                flexShrink: 0,
                letterSpacing: "0.05em",
              }}
            >
              {challenge.progress}/{challenge.goal}
            </span>
          </div>

          <p
            style={{
              fontFamily: BODY,
              fontSize: "10px",
              color: "#2A2A2A",
              marginTop: "8px",
              letterSpacing: "0.02em",
            }}
          >
            {challenge.participants.toLocaleString()} logging this week
          </p>
        </div>
      </div>
    </div>
  );
}

interface CommunityChallengesProps {
  compact?: boolean;
}

export function CommunityChallenges({
  compact = false,
}: CommunityChallengesProps) {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, [user]);

  async function load() {
    setLoading(true);
    const headers: Record<string, string> = {};
    if (user) {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) headers.Authorization = `Bearer ${session.access_token}`;
    }
    try {
      const res = await fetch("/api/social/challenges", { headers });
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div
        style={{ display: "flex", justifyContent: "center", padding: "32px" }}
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

  if (!data?.challenges?.length) return null;

  const challenges = data.challenges;
  const completedCount = challenges.filter((c: any) => c.completed).length;

  if (compact) {
    const first = challenges[0];
    const pct = Math.round((first.progress / first.goal) * 100);

    return (
      <div
        style={{
          position: "relative",
          background: "linear-gradient(145deg, #0E0E0E, #0A0A0A)",
          border: `1px solid ${first.completed ? first.color + "28" : "#181818"}`,
          borderRadius: "12px",
          padding: "14px 16px",
          overflow: "hidden",
        }}
      >
        <GrainOverlay />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
            <span style={{ fontSize: "11px" }}>{first.icon}</span>
            <p
              style={{
                fontFamily: MONO,
                fontSize: "8px",
                color: "#3A3A3A",
                textTransform: "uppercase",
                letterSpacing: "0.16em",
              }}
            >
              Weekly Challenge
            </p>
          </div>
          <span style={{ fontFamily: MONO, fontSize: "9px", color: "#3A3A3A" }}>
            {completedCount}/{challenges.length}
          </span>
        </div>
        <p
          style={{
            fontFamily: DISPLAY,
            fontSize: "14px",
            fontWeight: 600,
            color: first.completed ? first.color : "#EAE7E1",
            marginBottom: "4px",
          }}
        >
          {first.title}
        </p>
        <p
          style={{
            fontFamily: BODY,
            fontSize: "11px",
            color: "#4A4845",
            marginBottom: "10px",
            lineHeight: 1.5,
          }}
        >
          {first.description}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              flex: 1,
              height: "2px",
              background: "rgba(255,255,255,0.04)",
              borderRadius: "1px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${pct}%`,
                background: first.completed ? first.color : `${first.color}70`,
                borderRadius: "1px",
                transition: "width 1s cubic-bezier(0.16,1,0.3,1)",
              }}
            />
          </div>
          <span
            style={{
              fontFamily: MONO,
              fontSize: "9px",
              color: first.completed ? first.color : "#3A3A3A",
            }}
          >
            {first.progress}/{first.goal}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: "20px",
        }}
      >
        <div>
          <p
            style={{
              fontFamily: MONO,
              fontSize: "9px",
              color: "#3A3A3A",
              textTransform: "uppercase",
              letterSpacing: "0.16em",
              marginBottom: "5px",
            }}
          >
            Resets Monday · {timeLeft(data.expires_at)}
          </p>
          {completedCount > 0 && (
            <p
              style={{
                fontFamily: DISPLAY,
                fontSize: "15px",
                color: "#4A9E6B",
                fontStyle: "italic",
                fontWeight: 500,
                letterSpacing: "0.01em",
              }}
            >
              {completedCount === challenges.length
                ? "All complete. You absolute cinephile."
                : `${completedCount} of ${challenges.length} done.`}
            </p>
          )}
        </div>
        {!user && (
          <span
            style={{ fontFamily: BODY, fontSize: "10px", color: "#3A3A3A" }}
          >
            Sign in to track
          </span>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {challenges.map((c: any, i: number) => (
          <ChallengeCard key={c.id} challenge={c} index={i} />
        ))}
      </div>

      <style>{`
        @keyframes challengeReveal {
          from { opacity: 0; transform: translateY(12px) scale(0.99); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
