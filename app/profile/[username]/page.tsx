"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Film,
  Tv,
  Star,
  Users,
  UserPlus,
  UserCheck,
  ArrowLeft,
  Share2,
  Calendar,
  Loader2,
  X,
  MessageCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

const SERIF = "Playfair Display, Georgia, serif";
const SANS = "Inter, system-ui, sans-serif";
const MONO = "JetBrains Mono, Courier New, monospace";

const TMDB_IMG = "https://image.tmdb.org/t/p";

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function avatarColor(name: string): string {
  const colors = [
    "#5C4A8A",
    "#8A2A2A",
    "#2A5C8A",
    "#2A6A5C",
    "#8A7A2A",
    "#8A2A5C",
    "#4A6A3A",
  ];
  return colors[(name?.charCodeAt(0) || 0) % colors.length];
}

function Avatar({
  name,
  size = 40,
  url,
}: {
  name: string;
  size?: number;
  url?: string | null;
}) {
  const [err, setErr] = useState(false);
  if (url && !err) {
    return (
      <img
        src={url}
        onError={() => setErr(true)}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          flexShrink: 0,
          border: "1px solid rgba(255,255,255,0.06)",
        }}
        alt={name}
      />
    );
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: avatarColor(name),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        fontFamily: SANS,
        fontSize: size * 0.38,
        fontWeight: 700,
        color: "#F0EDE8",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {(name?.[0] || "?").toUpperCase()}
    </div>
  );
}

function StarRow({ rating }: { rating: number }) {
  return (
    <span
      style={{ color: "#C8A96E", fontSize: "11px", letterSpacing: "0.5px" }}
    >
      {[1, 2, 3, 4, 5]
        .map((s) => (rating >= s ? "★" : rating >= s - 0.5 ? "⯨" : "☆"))
        .join("")}
    </span>
  );
}

// ── Follow/Follower List Modal ────────────────────────────────────────────────

function UserListModal({
  userId,
  type,
  title,
  onClose,
}: {
  userId: string;
  type: "followers" | "following";
  title: string;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      if (session) headers.Authorization = `Bearer ${session.access_token}`;
      const res = await fetch(
        `/api/follows/list?user_id=${userId}&type=${type}`,
        { headers },
      );
      const data = await res.json();
      setUsers(data.users || []);
      const set = new Set<string>(
        (data.users || [])
          .filter((u: any) => u.is_following)
          .map((u: any) => u.id),
      );
      setFollowing(set);
      setLoading(false);
    }
    load();
  }, [userId, type]);

  async function toggleFollow(targetId: string, currently: boolean) {
    if (!user || toggling) return;
    setToggling(targetId);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      setToggling(null);
      return;
    }
    const method = currently ? "DELETE" : "POST";
    await fetch("/api/follows", {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ target_id: targetId }),
    });
    setFollowing((prev) => {
      const next = new Set(prev);
      currently ? next.delete(targetId) : next.add(targetId);
      return next;
    });
    setToggling(null);
  }

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 900,
          background: "rgba(0,0,0,0.8)",
          backdropFilter: "blur(8px)",
        }}
      />
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
          zIndex: 901,
          width: "calc(100% - 32px)",
          maxWidth: "420px",
          background: "#141414",
          border: "1px solid #2A2A2A",
          borderRadius: "16px",
          overflow: "hidden",
          maxHeight: "70vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid #1A1A1A",
          }}
        >
          <p
            style={{
              fontFamily: SANS,
              fontSize: "14px",
              fontWeight: 600,
              color: "#F0EDE8",
            }}
          >
            {title}
          </p>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#504E4A",
              padding: "2px",
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* List */}
        <div style={{ overflowY: "auto", flex: 1 }}>
          {loading ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                padding: "32px",
              }}
            >
              <Loader2
                size={20}
                color="#504E4A"
                style={{ animation: "spin 1s linear infinite" }}
              />
            </div>
          ) : users.length === 0 ? (
            <p
              style={{
                fontFamily: SANS,
                fontSize: "13px",
                color: "#504E4A",
                textAlign: "center",
                padding: "32px",
              }}
            >
              No {type} yet.
            </p>
          ) : (
            users.map((u) => {
              const isFollowing = following.has(u.id);
              const isSelf = u.id === user?.id;
              return (
                <div
                  key={u.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px 20px",
                    borderBottom: "1px solid #1A1A1A",
                  }}
                >
                  <Link
                    href={`/profile/${u.username}`}
                    onClick={onClose}
                    style={{ flexShrink: 0 }}
                  >
                    <Avatar
                      name={u.display_name || u.username}
                      size={38}
                      url={u.avatar_url}
                    />
                  </Link>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Link
                      href={`/profile/${u.username}`}
                      onClick={onClose}
                      style={{ textDecoration: "none" }}
                    >
                      <p
                        style={{
                          fontFamily: SANS,
                          fontSize: "13px",
                          fontWeight: 500,
                          color: "#F0EDE8",
                        }}
                      >
                        {u.display_name || u.username}
                      </p>
                      <p
                        style={{
                          fontFamily: SANS,
                          fontSize: "11px",
                          color: "#504E4A",
                        }}
                      >
                        @{u.username}
                      </p>
                    </Link>
                  </div>
                  {!isSelf && user && (
                    <button
                      onClick={() => toggleFollow(u.id, isFollowing)}
                      disabled={toggling === u.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                        padding: "6px 12px",
                        borderRadius: "8px",
                        fontFamily: SANS,
                        fontSize: "11px",
                        fontWeight: 600,
                        cursor: toggling === u.id ? "not-allowed" : "pointer",
                        border: isFollowing
                          ? "1px solid rgba(200,169,110,0.3)"
                          : "1px solid #2A2A2A",
                        background: isFollowing
                          ? "rgba(200,169,110,0.1)"
                          : "#C8A96E",
                        color: isFollowing ? "#C8A96E" : "#0D0D0D",
                        flexShrink: 0,
                      }}
                    >
                      {toggling === u.id ? (
                        <Loader2
                          size={10}
                          style={{ animation: "spin 1s linear infinite" }}
                        />
                      ) : isFollowing ? (
                        <UserCheck size={10} />
                      ) : (
                        <UserPlus size={10} />
                      )}
                      {isFollowing ? "Following" : "Follow"}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
      <style>{`@keyframes spin { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }`}</style>
    </>
  );
}

// ── Activity Log Card ─────────────────────────────────────────────────────────

function ActivityCard({ log }: { log: any }) {
  const [imgErr, setImgErr] = useState(false);
  const mt = log.media_type === "tv" ? "tv" : "movie";

  return (
    <Link
      href={`/title/${mt}/${log.tmdb_id}`}
      style={{
        display: "flex",
        gap: "10px",
        padding: "10px 12px",
        borderRadius: "8px",
        background: "#0F0F0F",
        border: "1px solid #1A1A1A",
        textDecoration: "none",
        transition: "border-color 0.15s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#2A2A2A")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#1A1A1A")}
    >
      {/* Poster */}
      <div
        style={{
          width: 38,
          height: 56,
          borderRadius: "4px",
          background: "#1A1A1A",
          flexShrink: 0,
          overflow: "hidden",
        }}
      >
        {log.poster_url && !imgErr ? (
          <img
            src={log.poster_url}
            onError={() => setImgErr(true)}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            alt={log.title}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {log.media_type === "tv" ? (
              <Tv size={14} color="#2A2A2A" />
            ) : (
              <Film size={14} color="#2A2A2A" />
            )}
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontFamily: SANS,
            fontSize: "12px",
            fontWeight: 500,
            color: "#F0EDE8",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            marginBottom: "3px",
          }}
        >
          {log.title}
          {log.year && (
            <span
              style={{
                fontFamily: MONO,
                fontSize: "10px",
                color: "#504E4A",
                marginLeft: "6px",
              }}
            >
              {log.year}
            </span>
          )}
        </p>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexWrap: "wrap",
          }}
        >
          {/* Status pill */}
          <span
            style={{
              fontFamily: SANS,
              fontSize: "9px",
              fontWeight: 600,
              padding: "2px 7px",
              borderRadius: "10px",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              background:
                log.status === "watched"
                  ? "rgba(74,158,107,0.15)"
                  : log.status === "watching"
                    ? "rgba(200,169,110,0.15)"
                    : "rgba(138,74,74,0.15)",
              color:
                log.status === "watched"
                  ? "#4A9E6B"
                  : log.status === "watching"
                    ? "#C8A96E"
                    : "#8A4A4A",
            }}
          >
            {log.status}
          </span>

          {log.user_rating && <StarRow rating={log.user_rating} />}
        </div>

        {log.note && (
          <p
            style={{
              fontFamily: SANS,
              fontSize: "11px",
              color: "#8A8780",
              marginTop: "4px",
              fontStyle: "italic",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            "{log.note}"
          </p>
        )}

        <p
          style={{
            fontFamily: SANS,
            fontSize: "10px",
            color: "#2A2A2A",
            marginTop: "4px",
          }}
        >
          {timeAgo(log.watched_at)}
        </p>
      </div>
    </Link>
  );
}

// ── Stat Pill ─────────────────────────────────────────────────────────────────

function StatPill({ val, label }: { val: string | number; label: string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <p
        style={{
          fontFamily: MONO,
          fontSize: "20px",
          fontWeight: 500,
          color: "#C8A96E",
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
          textTransform: "uppercase",
          letterSpacing: "0.1em",
        }}
      >
        {label}
      </p>
    </div>
  );
}

// ── Follow Stats (clickable) ──────────────────────────────────────────────────

function FollowCounts({
  userId,
  followers,
  following,
}: {
  userId: string;
  followers: number;
  following: number;
}) {
  const [modal, setModal] = useState<"followers" | "following" | null>(null);

  return (
    <>
      <div style={{ display: "flex", gap: "20px" }}>
        <button
          onClick={() => setModal("followers")}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            textAlign: "center",
            padding: 0,
          }}
        >
          <p
            style={{
              fontFamily: MONO,
              fontSize: "18px",
              color: "#C8A96E",
              fontWeight: 500,
            }}
          >
            {followers}
          </p>
          <p
            style={{
              fontFamily: SANS,
              fontSize: "10px",
              color: "#504E4A",
              marginTop: "2px",
            }}
          >
            Followers
          </p>
        </button>
        <button
          onClick={() => setModal("following")}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            textAlign: "center",
            padding: 0,
          }}
        >
          <p
            style={{
              fontFamily: MONO,
              fontSize: "18px",
              color: "#C8A96E",
              fontWeight: 500,
            }}
          >
            {following}
          </p>
          <p
            style={{
              fontFamily: SANS,
              fontSize: "10px",
              color: "#504E4A",
              marginTop: "2px",
            }}
          >
            Following
          </p>
        </button>
      </div>

      {modal && (
        <UserListModal
          userId={userId}
          type={modal}
          title={modal === "followers" ? "Followers" : "Following"}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}

// ── Follow Button ─────────────────────────────────────────────────────────────

function FollowBtn({
  targetId,
  initialFollowing,
  onChanged,
}: {
  targetId: string;
  initialFollowing: boolean;
  onChanged: (following: boolean) => void;
}) {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    setIsFollowing(initialFollowing);
  }, [initialFollowing]);

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
      body: JSON.stringify({ target_id: targetId }),
    });
    const data = await res.json();
    setIsFollowing(data.following);
    onChanged(data.following);
    setToggling(false);
  }

  if (!user) return null;

  return (
    <button
      onClick={toggle}
      disabled={toggling}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        padding: "9px 20px",
        borderRadius: "10px",
        fontFamily: SANS,
        fontSize: "13px",
        fontWeight: 600,
        cursor: toggling ? "not-allowed" : "pointer",
        border: isFollowing ? "1px solid rgba(200,169,110,0.35)" : "none",
        background: isFollowing ? "rgba(200,169,110,0.08)" : "#C8A96E",
        color: isFollowing ? "#C8A96E" : "#0D0D0D",
        transition: "all 0.2s ease",
      }}
    >
      {toggling ? (
        <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
      ) : isFollowing ? (
        <UserCheck size={13} />
      ) : (
        <UserPlus size={13} />
      )}
      {isFollowing ? "Following" : "Follow"}
    </button>
  );
}

// ── Message Button ────────────────────────────────────────────────────────────

function MessageBtn({ targetId }: { targetId: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function openDM() {
    if (!user || loading) return;
    setLoading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      setLoading(false);
      return;
    }
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ other_user_id: targetId }),
    });
    const data = await res.json();
    if (data.conversation_id) {
      router.push(`/messages/${data.conversation_id}`);
    }
    setLoading(false);
  }

  if (!user) return null;

  return (
    <button
      onClick={openDM}
      disabled={loading}
      title="Send message"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px",
        padding: "9px 16px",
        borderRadius: "10px",
        fontFamily: "Inter, system-ui, sans-serif",
        fontSize: "13px",
        fontWeight: 600,
        cursor: loading ? "not-allowed" : "pointer",
        border: "1px solid #2A2A2A",
        background: "transparent",
        color: "#8A8780",
        transition: "all 0.2s ease",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "#504E4A";
        (e.currentTarget as HTMLElement).style.color = "#F0EDE8";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "#2A2A2A";
        (e.currentTarget as HTMLElement).style.color = "#8A8780";
      }}
    >
      {loading ? (
        <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
      ) : (
        <MessageCircle size={13} />
      )}
      Message
    </button>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const username = params.username as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [tab, setTab] = useState<"films" | "tv" | "all">("all");

  const load = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const headers: Record<string, string> = {};
    if (session) headers.Authorization = `Bearer ${session.access_token}`;

    const res = await fetch(`/api/users/${username}`, { headers });
    if (res.status === 404) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    const json = await res.json();
    setData(json);
    setFollowerCount(json.social?.followers ?? 0);
    setLoading(false);

    // If this is the viewer's own profile, redirect to /profile
    if (json.social?.is_own_profile) {
      router.replace("/profile");
    }
  }, [username, router]);

  useEffect(() => {
    load();
  }, [load]);

  function handleShare() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  // ── Loading ──
  if (loading) {
    return (
      <div
        style={{ maxWidth: "680px", margin: "0 auto", padding: "48px 24px" }}
      >
        {/* Skeleton header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "20px",
            marginBottom: "32px",
          }}
        >
          <div
            className="skeleton"
            style={{ width: 72, height: 72, borderRadius: "50%" }}
          />
          <div style={{ flex: 1 }}>
            <div
              className="skeleton"
              style={{
                width: "160px",
                height: "22px",
                borderRadius: "6px",
                marginBottom: "10px",
              }}
            />
            <div
              className="skeleton"
              style={{
                width: "100px",
                height: "14px",
                borderRadius: "4px",
                marginBottom: "12px",
              }}
            />
            <div
              className="skeleton"
              style={{ width: "220px", height: "13px", borderRadius: "4px" }}
            />
          </div>
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="skeleton"
            style={{ height: "74px", borderRadius: "8px", marginBottom: "8px" }}
          />
        ))}
      </div>
    );
  }

  // ── Not Found ──
  if (notFound) {
    return (
      <div
        style={{
          maxWidth: "480px",
          margin: "80px auto",
          padding: "0 24px",
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontFamily: SERIF,
            fontSize: "22px",
            color: "#504E4A",
            fontStyle: "italic",
            marginBottom: "8px",
          }}
        >
          User not found.
        </p>
        <p
          style={{
            fontFamily: SANS,
            fontSize: "13px",
            color: "#2A2A2A",
            marginBottom: "24px",
          }}
        >
          @{username} doesn't exist on Taste.
        </p>
        <button
          onClick={() => router.back()}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 18px",
            borderRadius: "8px",
            background: "#141414",
            border: "1px solid #2A2A2A",
            color: "#8A8780",
            fontFamily: SANS,
            fontSize: "13px",
            cursor: "pointer",
          }}
        >
          <ArrowLeft size={13} /> Go back
        </button>
      </div>
    );
  }

  if (!data) return null;

  const { profile, stats, social, recent_activity } = data;
  const displayName = profile.display_name || profile.username;

  const filteredActivity = recent_activity.filter((log: any) => {
    if (tab === "films")
      return log.media_type === "movie" || log.media_type === "film";
    if (tab === "tv") return log.media_type === "tv";
    return true;
  });

  const TABS = [
    { id: "all", label: `All (${recent_activity.length})` },
    {
      id: "films",
      label: `Films (${recent_activity.filter((l: any) => l.media_type === "movie" || l.media_type === "film").length})`,
    },
    {
      id: "tv",
      label: `TV (${recent_activity.filter((l: any) => l.media_type === "tv").length})`,
    },
  ] as const;

  return (
    <div
      style={{ maxWidth: "680px", margin: "0 auto", padding: "0 24px 80px" }}
    >
      {/* ── Back button ── */}
      <div style={{ paddingTop: "24px", marginBottom: "24px" }}>
        <button
          onClick={() => router.back()}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#504E4A",
            fontFamily: SANS,
            fontSize: "12px",
            padding: 0,
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLElement).style.color = "#8A8780")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLElement).style.color = "#504E4A")
          }
        >
          <ArrowLeft size={13} /> Back
        </button>
      </div>

      {/* ── Profile Header ── */}
      <div
        style={{
          background: "#0F0F0F",
          border: "1px solid #1A1A1A",
          borderRadius: "16px",
          padding: "24px",
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "18px",
            flexWrap: "wrap",
          }}
        >
          {/* Avatar */}
          <Avatar name={displayName} size={72} url={profile.avatar_url} />

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                flexWrap: "wrap",
                marginBottom: "4px",
              }}
            >
              <h1
                style={{
                  fontFamily: SERIF,
                  fontSize: "24px",
                  fontWeight: 700,
                  color: "#F0EDE8",
                  fontStyle: "italic",
                }}
              >
                {displayName}
              </h1>
            </div>

            <p
              style={{
                fontFamily: SANS,
                fontSize: "12px",
                color: "#504E4A",
                marginBottom: "10px",
              }}
            >
              @{profile.username}
            </p>

            {profile.bio && (
              <p
                style={{
                  fontFamily: SANS,
                  fontSize: "13px",
                  color: "#8A8780",
                  lineHeight: 1.6,
                  marginBottom: "14px",
                  maxWidth: "440px",
                }}
              >
                {profile.bio}
              </p>
            )}

            {/* Member since */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                marginBottom: "16px",
              }}
            >
              <Calendar size={11} color="#2A2A2A" />
              <span
                style={{ fontFamily: SANS, fontSize: "11px", color: "#2A2A2A" }}
              >
                Member since {formatDate(profile.member_since)}
              </span>
            </div>

            {/* Follow counts + button */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "20px",
                flexWrap: "wrap",
              }}
            >
              <FollowCounts
                userId={profile.id}
                followers={followerCount}
                following={social.following}
              />

              <div
                style={{
                  marginLeft: "auto",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <FollowBtn
                  targetId={profile.id}
                  initialFollowing={social.is_following}
                  onChanged={(f) =>
                    setFollowerCount((prev) => (f ? prev + 1 : prev - 1))
                  }
                />
                <MessageBtn targetId={profile.id} />
                <button
                  onClick={handleShare}
                  title="Copy link"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "38px",
                    height: "38px",
                    borderRadius: "10px",
                    background: "none",
                    border: "1px solid #2A2A2A",
                    color: copied ? "#C8A96E" : "#504E4A",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.borderColor =
                      "#504E4A")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.borderColor =
                      "#2A2A2A")
                  }
                >
                  <Share2 size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stat strip */}
        <div
          style={{
            display: "flex",
            gap: "0",
            marginTop: "20px",
            paddingTop: "20px",
            borderTop: "1px solid #1A1A1A",
            justifyContent: "space-around",
          }}
        >
          <StatPill val={stats.total_films} label="Films" />
          <div style={{ width: "1px", background: "#1A1A1A" }} />
          <StatPill val={stats.total_series} label="Series" />
          <div style={{ width: "1px", background: "#1A1A1A" }} />
          <StatPill val={stats.total_watched} label="Watched" />
          <div style={{ width: "1px", background: "#1A1A1A" }} />
          <StatPill
            val={stats.avg_rating ? `${stats.avg_rating.toFixed(1)}★` : "—"}
            label="Avg ★"
          />
        </div>
      </div>

      {/* ── Recent Activity ── */}
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "14px",
          }}
        >
          <p
            style={{
              fontFamily: SANS,
              fontSize: "10px",
              color: "#504E4A",
              textTransform: "uppercase",
              letterSpacing: "0.14em",
            }}
          >
            Recent activity
          </p>

          {/* Tab filters */}
          <div style={{ display: "flex", gap: "4px" }}>
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id as typeof tab)}
                style={{
                  padding: "4px 10px",
                  borderRadius: "12px",
                  fontFamily: SANS,
                  fontSize: "11px",
                  cursor: "pointer",
                  border:
                    tab === t.id
                      ? "1px solid rgba(200,169,110,0.4)"
                      : "1px solid #1A1A1A",
                  background:
                    tab === t.id ? "rgba(200,169,110,0.1)" : "transparent",
                  color: tab === t.id ? "#C8A96E" : "#504E4A",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {filteredActivity.length === 0 ? (
          <div
            style={{
              padding: "40px 24px",
              textAlign: "center",
              background: "#0F0F0F",
              border: "1px solid #1A1A1A",
              borderRadius: "12px",
            }}
          >
            <p
              style={{
                fontFamily: SERIF,
                fontSize: "16px",
                color: "#504E4A",
                fontStyle: "italic",
              }}
            >
              Nothing logged here yet.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {filteredActivity.map((log: any, i: number) => (
              <div
                key={log.id}
                className="feed-item"
                style={{ "--feed-delay": `${i * 30}ms` } as React.CSSProperties}
              >
                <ActivityCard log={log} />
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }
      `}</style>
    </div>
  );
}
