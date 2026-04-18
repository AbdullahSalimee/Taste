"use client";
import { useState, useEffect } from "react";
import { UserPlus, UserCheck, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

const SANS = "Inter, system-ui, sans-serif";
const MONO = "JetBrains Mono, Courier New, monospace";

interface FollowButtonProps {
  targetUserId: string;
  targetUsername?: string;
  size?: "sm" | "md";
  onFollowChange?: (following: boolean) => void;
}

export function FollowButton({
  targetUserId,
  targetUsername,
  size = "md",
  onFollowChange,
}: FollowButtonProps) {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followers, setFollowers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    if (!user || user.id === targetUserId) {
      setLoading(false);
      return;
    }
    load();
  }, [user, targetUserId]);

  async function load() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const headers: Record<string, string> = {};
    if (session) headers.Authorization = `Bearer ${session.access_token}`;
    const res = await fetch(`/api/follows?target_id=${targetUserId}`, {
      headers,
    });
    const data = await res.json();
    setIsFollowing(data.is_following);
    setFollowers(data.followers);
    setLoading(false);
  }

  async function toggle() {
    if (!user || toggling) return;
    setToggling(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      setToggling(false);
      return;
    }

    const method = isFollowing ? "DELETE" : "POST";
    const res = await fetch("/api/follows", {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ target_id: targetUserId }),
    });
    const data = await res.json();
    setIsFollowing(data.following);
    setFollowers((prev) => (data.following ? prev + 1 : prev - 1));
    onFollowChange?.(data.following);
    setToggling(false);
  }

  // Don't show for own profile
  if (!user || user.id === targetUserId) return null;

  const isSmall = size === "sm";

  return (
    <button
      onClick={toggle}
      disabled={loading || toggling}
      style={{
        display: "flex",
        alignItems: "center",
        gap: isSmall ? "4px" : "6px",
        padding: isSmall ? "5px 10px" : "8px 16px",
        borderRadius: "8px",
        cursor: loading || toggling ? "not-allowed" : "pointer",
        border: isFollowing
          ? "1px solid rgba(200,169,110,0.3)"
          : "1px solid #2A2A2A",
        background: isFollowing ? "rgba(200,169,110,0.1)" : "#C8A96E",
        color: isFollowing ? "#C8A96E" : "#0D0D0D",
        fontFamily: SANS,
        fontSize: isSmall ? "11px" : "13px",
        fontWeight: 600,
        transition: "all 0.15s ease",
        opacity: loading ? 0.5 : 1,
      }}
      onMouseEnter={(e) => {
        if (!loading && !toggling && isFollowing) {
          e.currentTarget.style.background = "rgba(138,42,42,0.1)";
          e.currentTarget.style.borderColor = "rgba(138,42,42,0.3)";
          e.currentTarget.style.color = "#8A4A4A";
          e.currentTarget.querySelector(".follow-label")!.textContent =
            "Unfollow";
        }
      }}
      onMouseLeave={(e) => {
        if (!loading && !toggling && isFollowing) {
          e.currentTarget.style.background = "rgba(200,169,110,0.1)";
          e.currentTarget.style.borderColor = "rgba(200,169,110,0.3)";
          e.currentTarget.style.color = "#C8A96E";
          e.currentTarget.querySelector(".follow-label")!.textContent =
            "Following";
        }
      }}
    >
      {toggling ? (
        <Loader2
          size={isSmall ? 11 : 13}
          style={{ animation: "spin 1s linear infinite" }}
        />
      ) : isFollowing ? (
        <UserCheck size={isSmall ? 11 : 13} />
      ) : (
        <UserPlus size={isSmall ? 11 : 13} />
      )}
      <span className="follow-label">
        {toggling ? "…" : isFollowing ? "Following" : "Follow"}
      </span>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </button>
  );
}

// ── Follow stats display ───────────────────────────────────────────────────────
export function FollowStats({ userId }: { userId: string }) {
  const [stats, setStats] = useState({ followers: 0, following: 0 });

  useEffect(() => {
    fetch(`/api/follows?target_id=${userId}`)
      .then((r) => r.json())
      .then((d) =>
        setStats({ followers: d.followers || 0, following: d.following || 0 }),
      );
  }, [userId]);

  return (
    <div style={{ display: "flex", gap: "20px" }}>
      {[
        { val: stats.followers, label: "Followers" },
        { val: stats.following, label: "Following" },
      ].map(({ val, label }) => (
        <div key={label} style={{ textAlign: "center" }}>
          <p
            style={{
              fontFamily: "JetBrains Mono, monospace",
              fontSize: "18px",
              color: "#C8A96E",
              fontWeight: 500,
            }}
          >
            {val}
          </p>
          <p
            style={{
              fontFamily: SANS,
              fontSize: "10px",
              color: "#504E4A",
              marginTop: "2px",
            }}
          >
            {label}
          </p>
        </div>
      ))}
    </div>
  );
}
