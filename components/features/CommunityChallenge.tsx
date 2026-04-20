"use client";
import { useState, useEffect } from "react";
import { Loader2, CheckCircle, Clock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

const SERIF = "Playfair Display, Georgia, serif";
const SANS = "Inter, system-ui, sans-serif";
const MONO = "JetBrains Mono, Courier New, monospace";

function timeLeft(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const hours = Math.floor(diff / 3600000);
  if (hours < 24) return `${hours}h left`;
  const days = Math.floor(hours / 24);
  return `${days}d left`;
}

function ChallengeCard({
  challenge,
  index,
}: {
  challenge: any;
  index: number;
}) {
  const pct =
    challenge.goal === 0
      ? 0
      : Math.round((challenge.progress / challenge.goal) * 100);
  const done = challenge.completed;

  return (
    <div
      style={{
        background: "#0F0F0F",
        border: `1px solid ${done ? `${challenge.color}44` : "#1A1A1A"}`,
        borderRadius: "10px",
        padding: "14px 16px",
        position: "relative",
        overflow: "hidden",
        animation: "challengeReveal 0.4s ease forwards",
        animationDelay: `${index * 60}ms`,
        opacity: 0,
        transition: "border-color 0.2s ease",
      }}
    >
      {/* Completed glow line */}
      {done && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "2px",
            background: `linear-gradient(90deg, transparent, ${challenge.color}, transparent)`,
          }}
        />
      )}

      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
        {/* Icon */}
        <div
          style={{
            width: "38px",
            height: "38px",
            borderRadius: "8px",
            flexShrink: 0,
            background: done ? `${challenge.color}22` : "#141414",
            border: `1px solid ${done ? challenge.color + "44" : "#2A2A2A"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "18px",
            transition: "all 0.3s ease",
          }}
        >
          {done ? "✓" : challenge.icon}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: "8px",
              marginBottom: "3px",
            }}
          >
            <p
              style={{
                fontFamily: SANS,
                fontSize: "13px",
                color: done ? challenge.color : "#F0EDE8",
                fontWeight: 600,
                lineHeight: 1.3,
              }}
            >
              {challenge.title}
            </p>
            {done ? (
              <span
                style={{
                  fontFamily: SANS,
                  fontSize: "9px",
                  color: challenge.color,
                  background: `${challenge.color}18`,
                  border: `1px solid ${challenge.color}33`,
                  padding: "2px 8px",
                  borderRadius: "10px",
                  flexShrink: 0,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                Done ✓
              </span>
            ) : (
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: "9px",
                  color: "#504E4A",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: "3px",
                }}
              >
                <Clock size={9} />
                {timeLeft(challenge.expires_at)}
              </span>
            )}
          </div>

          <p
            style={{
              fontFamily: SANS,
              fontSize: "11px",
              color: "#8A8780",
              lineHeight: 1.5,
              marginBottom: "10px",
            }}
          >
            {challenge.description}
          </p>

          {/* Progress bar */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
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
                  background: done ? challenge.color : `${challenge.color}99`,
                  borderRadius: "2px",
                  transition: "width 0.8s cubic-bezier(0.16,1,0.3,1)",
                  boxShadow: done ? `0 0 6px ${challenge.color}60` : "none",
                }}
              />
            </div>
            <span
              style={{
                fontFamily: MONO,
                fontSize: "10px",
                color: done ? challenge.color : "#504E4A",
                flexShrink: 0,
              }}
            >
              {challenge.progress}/{challenge.goal}
            </span>
          </div>

          {/* Participants */}
          <p
            style={{
              fontFamily: SANS,
              fontSize: "10px",
              color: "#2A2A2A",
              marginTop: "6px",
            }}
          >
            {challenge.participants} people logging this week
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
        style={{ display: "flex", justifyContent: "center", padding: "20px" }}
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

  if (!data?.challenges?.length) return null;

  const challenges = data.challenges;
  const completedCount = challenges.filter((c: any) => c.completed).length;

  if (compact) {
    // Compact: show first challenge + completion count
    const first = challenges[0];
    const pct = Math.round((first.progress / first.goal) * 100);

    return (
      <div
        style={{
          background: "#141414",
          border: `1px solid ${first.completed ? first.color + "33" : "#1A1A1A"}`,
          borderRadius: "10px",
          padding: "12px 14px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "10px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "13px" }}>{first.icon}</span>
            <p
              style={{
                fontFamily: SANS,
                fontSize: "10px",
                color: "#504E4A",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
              }}
            >
              Weekly Challenge
            </p>
          </div>
          <span style={{ fontFamily: MONO, fontSize: "9px", color: "#504E4A" }}>
            {completedCount}/{challenges.length} done
          </span>
        </div>
        <p
          style={{
            fontFamily: SANS,
            fontSize: "13px",
            color: first.completed ? first.color : "#F0EDE8",
            fontWeight: 600,
            marginBottom: "4px",
          }}
        >
          {first.title}
        </p>
        <p
          style={{
            fontFamily: SANS,
            fontSize: "11px",
            color: "#8A8780",
            marginBottom: "8px",
          }}
        >
          {first.description}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
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
                background: first.completed ? first.color : `${first.color}99`,
                borderRadius: "2px",
                transition: "width 0.8s cubic-bezier(0.16,1,0.3,1)",
              }}
            />
          </div>
          <span
            style={{
              fontFamily: MONO,
              fontSize: "10px",
              color: first.completed ? first.color : "#504E4A",
            }}
          >
            {first.progress}/{first.goal}
          </span>
        </div>
      </div>
    );
  }

  // Full view
  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: "16px",
        }}
      >
        <div>
          <p
            style={{
              fontFamily: SANS,
              fontSize: "11px",
              color: "#504E4A",
              marginBottom: "2px",
            }}
          >
            Challenges reset every Monday · {timeLeft(data.expires_at)}
          </p>
          {completedCount > 0 && (
            <p
              style={{
                fontFamily: SERIF,
                fontSize: "13px",
                color: "#4A9E6B",
                fontStyle: "italic",
              }}
            >
              {completedCount === challenges.length
                ? "All challenges complete. You absolute cinephile."
                : `${completedCount} of ${challenges.length} done.`}
            </p>
          )}
        </div>
        {!user && (
          <p style={{ fontFamily: SANS, fontSize: "10px", color: "#504E4A" }}>
            Sign in to track progress
          </p>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {challenges.map((c: any, i: number) => (
          <ChallengeCard key={c.id} challenge={c} index={i} />
        ))}
      </div>

      <style>{`
        @keyframes challengeReveal {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
