"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Film,
  Tv,
  BookOpen,
  Loader2,
  Filter,
  StickyNote,
  RotateCcw,
  Calendar,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";

const SERIF = "Playfair Display, Georgia, serif";
const SANS = "Inter, system-ui, sans-serif";
const MONO = "JetBrains Mono, Courier New, monospace";

const STATUS_LABELS: Record<string, string> = {
  watched: "Watched",
  watching: "Watching",
  dropped: "Dropped",
  on_hold: "On Hold",
};

const STATUS_COLORS: Record<string, string> = {
  watched: "#4A8A5C",
  watching: "#5C7A8A",
  dropped: "#8A4A4A",
  on_hold: "#8A7A4A",
};

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function Avatar({ name, size = 30 }: { name: string; size?: number }) {
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
        fontSize: size * 0.4,
        fontWeight: 600,
        color: "#F0EDE8",
        border: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      {(name?.[0] || "?").toUpperCase()}
    </div>
  );
}

function LogItem({ item }: { item: any }) {
  const router = useRouter();
  const [imgErr, setImgErr] = useState(false);
  const mt = item.media_type === "tv" ? "tv" : "movie";

  return (
    <div
      className="log-item"
      style={{
        padding: "14px 16px",
        background: "#0F0F0F",
        border: "1px solid #1A1A1A",
        borderRadius: "10px",
        marginBottom: "8px",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#2A2A2A")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#1A1A1A")}
    >
      <div style={{ display: "flex", gap: "12px" }}>
        {/* Poster */}
        {item.poster_url && (
          <div
            onClick={() => router.push(`/title/${mt}/${item.tmdb_id}`)}
            style={{
              width: "50px",
              height: "75px",
              borderRadius: "4px",
              overflow: "hidden",
              background: "#1A1A1A",
              flexShrink: 0,
              cursor: "pointer",
            }}
          >
            {!imgErr ? (
              <img
                src={item.poster_url}
                alt={item.title}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={() => setImgErr(true)}
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
                {item.media_type === "tv" ? (
                  <Tv size={16} color="#2A2A2A" />
                ) : (
                  <Film size={16} color="#2A2A2A" />
                )}
              </div>
            )}
          </div>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Title & Date */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: "8px",
              marginBottom: "6px",
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <Link
                href={`/title/${mt}/${item.tmdb_id}`}
                style={{
                  fontFamily: SANS,
                  fontSize: "14px",
                  color: "#F0EDE8",
                  textDecoration: "none",
                  fontWeight: 500,
                  display: "block",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {item.title}
              </Link>
              {item.episode_title && (
                <p
                  style={{
                    fontFamily: SANS,
                    fontSize: "12px",
                    color: "#8A8780",
                    marginTop: "2px",
                  }}
                >
                  {item.episode_title}
                </p>
              )}
            </div>
            <span
              style={{
                fontFamily: MONO,
                fontSize: "10px",
                color: "#504E4A",
                flexShrink: 0,
              }}
            >
              {timeAgo(item.watched_at)}
            </span>
          </div>

          {/* Status & Metadata */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flexWrap: "wrap",
              marginBottom: item.note ? "8px" : "0",
            }}
          >
            <span
              style={{
                fontFamily: SANS,
                fontSize: "11px",
                color: STATUS_COLORS[item.status] || "#8A8780",
                background: `${STATUS_COLORS[item.status] || "#8A8780"}15`,
                padding: "2px 8px",
                borderRadius: "4px",
                fontWeight: 500,
              }}
            >
              {STATUS_LABELS[item.status] || item.status}
            </span>

            {item.rewatch && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontFamily: SANS,
                  fontSize: "11px",
                  color: "#C8A96E",
                }}
              >
                <RotateCcw size={11} />
                <span>
                  Rewatch{" "}
                  {item.rewatch_count > 1 ? `(${item.rewatch_count})` : ""}
                </span>
              </div>
            )}

            {item.year && (
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: "10px",
                  color: "#504E4A",
                }}
              >
                {item.year}
              </span>
            )}
          </div>

          {/* Note */}
          {item.note && (
            <div
              style={{
                marginTop: "8px",
                padding: "8px 10px",
                background: "#141414",
                border: "1px solid #1A1A1A",
                borderRadius: "6px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  marginBottom: "4px",
                }}
              >
                <StickyNote size={11} color="#8A8780" />
                <span
                  style={{
                    fontFamily: SANS,
                    fontSize: "10px",
                    color: "#504E4A",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Note
                </span>
              </div>
              <p
                style={{
                  fontFamily: SANS,
                  fontSize: "12px",
                  color: "#8A8780",
                  lineHeight: 1.5,
                  fontStyle: "italic",
                }}
              >
                "{item.note}"
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LogbookPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const loaderRef = useRef<HTMLDivElement>(null);

  async function loadLogs(p: number, append: boolean, statusFilter: string) {
    if (p === 1) setLoading(true);
    else setLoadingMore(true);
    try {
      const params = new URLSearchParams({ page: p.toString() });
      if (statusFilter !== "all") params.set("status", statusFilter);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const res = await fetch(`/api/logbook?${params}`, {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });
      const data = await res.json();
      const fetched = data.logs || [];
      if (append) setItems((prev) => [...prev, ...fetched]);
      else setItems(fetched);
      setHasMore(data.has_more || false);
      setPage(p);
    } catch {
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    if (!user) {
      router.push("/auth");
      return;
    }
    loadLogs(1, false, filter);
  }, [user, filter]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          loadLogs(page + 1, true, filter);
        }
      },
      { threshold: 0.1 },
    );
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, page, filter]);

  if (!user) return null;

  return (
    <div
      style={{ maxWidth: "720px", margin: "0 auto", padding: "24px 20px 80px" }}
    >
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "4px",
          }}
        >
          <BookOpen size={20} color="#C8A96E" />
          <h1
            style={{
              fontFamily: SERIF,
              fontSize: "28px",
              fontWeight: 700,
              color: "#F0EDE8",
              fontStyle: "italic",
            }}
          >
            Logbook
          </h1>
        </div>
        <p style={{ fontFamily: SANS, fontSize: "13px", color: "#504E4A" }}>
          Your complete watch history
        </p>
      </div>

      {/* Filter Pills */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "20px",
          flexWrap: "wrap",
        }}
      >
        {["all", "watched", "watching", "on_hold", "dropped"].map((status) => {
          const active = filter === status;
          return (
            <button
              key={status}
              onClick={() => setFilter(status)}
              style={{
                padding: "6px 14px",
                borderRadius: "20px",
                background: active ? "#C8A96E" : "#141414",
                border: `1px solid ${active ? "#C8A96E" : "#2A2A2A"}`,
                color: active ? "#0D0D0D" : "#8A8780",
                fontFamily: SANS,
                fontSize: "12px",
                fontWeight: active ? 600 : 500,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = "#1A1A1A";
                  e.currentTarget.style.borderColor = "#3A3A3A";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background = "#141414";
                  e.currentTarget.style.borderColor = "#2A2A2A";
                }
              }}
            >
              {status === "all"
                ? "All"
                : STATUS_LABELS[status] || status.replace("_", " ")}
            </button>
          );
        })}
      </div>

      {/* Feed */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="skeleton"
              style={{ height: "110px", borderRadius: "10px" }}
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <BookOpen
            size={32}
            color="#2A2A2A"
            style={{ margin: "0 auto 12px", display: "block" }}
          />
          <p
            style={{
              fontFamily: SERIF,
              fontSize: "20px",
              color: "#2A2A2A",
              fontStyle: "italic",
            }}
          >
            {filter === "all"
              ? "No logs yet."
              : `No ${STATUS_LABELS[filter]?.toLowerCase() || filter} entries.`}
          </p>
          <p
            style={{
              fontFamily: SANS,
              fontSize: "13px",
              color: "#504E4A",
              marginTop: "8px",
            }}
          >
            Start tracking from{" "}
            <Link
              href="/discover"
              style={{ color: "#C8A96E", textDecoration: "none" }}
            >
              Discover
            </Link>
          </p>
        </div>
      ) : (
        <>
          {items.map((item) => (
            <LogItem key={item.id} item={item} />
          ))}
          <div
            ref={loaderRef}
            style={{
              height: "48px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {loadingMore && (
              <Loader2
                size={16}
                color="#504E4A"
                style={{ animation: "spin 1s linear infinite" }}
              />
            )}
          </div>
        </>
      )}

      <style>{`
        @keyframes spin { 
          from { transform: rotate(0deg); } 
          to { transform: rotate(360deg); } 
        }
        .skeleton {
          background: linear-gradient(90deg, #0F0F0F 25%, #141414 50%, #0F0F0F 75%);
          background-size: 200% 100%;
          animation: skeleton-loading 1.5s ease-in-out infinite;
        }
        @keyframes skeleton-loading {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
