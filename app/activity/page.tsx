"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Film,
  Tv,
  Star,
  MessageCircle,
  Loader2,
  TrendingUp,
} from "lucide-react";
import { StoriesBar } from "@/components/features/StoriesBar";

const SERIF = "Playfair Display, Georgia, serif";
const SANS = "Inter, system-ui, sans-serif";
const MONO = "JetBrains Mono, Courier New, monospace";

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function StarDisplay({ rating }: { rating: number }) {
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

function ActivityItem({ item }: { item: any }) {
  const router = useRouter();
  const [imgErr, setImgErr] = useState(false);
  const mt = item.media_type === "tv" ? "tv" : "movie";

  return (
    <div
      className="feed-item"
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
        <Avatar name={item.author} size={32} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginBottom: "8px",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontFamily: SANS,
                fontSize: "13px",
                color: "#F0EDE8",
                fontWeight: 500,
              }}
            >
              {item.author}
            </span>
            <span
              style={{ fontFamily: SANS, fontSize: "12px", color: "#504E4A" }}
            >
              {item.type === "review" ? "reviewed" : "rated"}
            </span>
            <Link
              href={`/title/${mt}/${item.tmdb_id}`}
              style={{
                fontFamily: SANS,
                fontSize: "13px",
                color: "#C8A96E",
                textDecoration: "none",
                fontWeight: 500,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: "200px",
              }}
            >
              {item.title}
            </Link>
            <span
              style={{ fontFamily: MONO, fontSize: "10px", color: "#504E4A" }}
            >
              {item.year || ""}
            </span>
            <span
              style={{
                marginLeft: "auto",
                fontFamily: SANS,
                fontSize: "10px",
                color: "#504E4A",
                flexShrink: 0,
              }}
            >
              {timeAgo(item.date)}
            </span>
          </div>
          {item.rating && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                marginBottom: item.body ? "6px" : "0",
              }}
            >
              <StarDisplay rating={item.rating} />
              <span
                style={{ fontFamily: MONO, fontSize: "10px", color: "#504E4A" }}
              >
                {item.rating}/5
              </span>
            </div>
          )}
          {item.body && (
            <p
              style={
                {
                  fontFamily: SANS,
                  fontSize: "13px",
                  color: "#8A8780",
                  lineHeight: 1.65,
                  fontStyle: "italic",
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                } as React.CSSProperties
              }
            >
              "{item.body}"
            </p>
          )}
        </div>
        {item.poster_url && (
          <div
            onClick={() => router.push(`/title/${mt}/${item.tmdb_id}`)}
            style={{
              width: "40px",
              height: "60px",
              borderRadius: "3px",
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
                  <Tv size={12} color="#2A2A2A" />
                ) : (
                  <Film size={12} color="#2A2A2A" />
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ActivityPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = useRef<HTMLDivElement>(null);

  async function loadActivity(p: number, append: boolean) {
    if (p === 1) setLoading(true);
    else setLoadingMore(true);
    try {
      const res = await fetch(`/api/activity?page=${p}`);
      const data = await res.json();
      const fetched = data.activity || [];
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
    loadActivity(1, false);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          loadActivity(page + 1, true);
        }
      },
      { threshold: 0.1 },
    );
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, page]);

  return (
    <div
      style={{ maxWidth: "680px", margin: "0 auto", padding: "24px 20px 80px" }}
    >
      {/* Header */}
      <div style={{ marginBottom: "20px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "4px",
          }}
        >
          <TrendingUp size={18} color="#C8A96E" />
          <h1
            style={{
              fontFamily: SERIF,
              fontSize: "24px",
              fontWeight: 700,
              color: "#F0EDE8",
              fontStyle: "italic",
            }}
          >
            Community
          </h1>
        </div>
        <p style={{ fontFamily: SANS, fontSize: "12px", color: "#504E4A" }}>
          What people are watching and reviewing right now
        </p>
      </div>

      {/* ── Stories Bar ── */}
      <div style={{ marginBottom: "20px" }}>
        <StoriesBar />
      </div>
      <div
        style={{ borderBottom: "1px solid #1A1A1A", marginBottom: "20px" }}
      />

      {/* Feed */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="skeleton"
              style={{ height: "90px", borderRadius: "10px" }}
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <MessageCircle
            size={28}
            color="#2A2A2A"
            style={{ margin: "0 auto 12px", display: "block" }}
          />
          <p
            style={{
              fontFamily: SERIF,
              fontSize: "18px",
              color: "#2A2A2A",
              fontStyle: "italic",
            }}
          >
            No activity yet.
          </p>
          <p
            style={{
              fontFamily: SANS,
              fontSize: "12px",
              color: "#504E4A",
              marginTop: "6px",
            }}
          >
            Be the first — log something from{" "}
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
            <ActivityItem key={item.id} item={item} />
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
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
