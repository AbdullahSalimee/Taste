"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MessageCircle, Film, Tv, Loader2, Heart, Star } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";

const SERIF = "Playfair Display, Georgia, serif";
const SANS = "Inter, system-ui, sans-serif";
const MONO = "JetBrains Mono, Courier New, monospace";

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <span style={{ color: "#C8A96E", fontSize: "11px", letterSpacing: "0.5px" }}>
      {[1,2,3,4,5].map(s => rating >= s ? "★" : rating >= s - 0.5 ? "⯨" : "☆").join("")}
    </span>
  );
}

function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const colors = ["#5C4A8A","#8A2A2A","#2A5C8A","#2A6A5C","#8A7A2A","#8A2A5C"];
  const bg = colors[(name?.charCodeAt(0) || 0) % colors.length];
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", background: bg,
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0, fontFamily: SANS, fontSize: size * 0.38,
      fontWeight: 600, color: "#F0EDE8",
    }}>
      {(name?.[0] || "?").toUpperCase()}
    </div>
  );
}

function ReviewCard({ review, onLike }: { review: any; onLike: (id: string, liked: boolean) => void }) {
  const router = useRouter();
  const [imgErr, setImgErr] = useState(false);
  const [spoilerRevealed, setSpoilerRevealed] = useState(false);
  const mt = review.media_type === "tv" ? "tv" : "movie";

  return (
    <div style={{
      padding: "18px", background: "#0F0F0F",
      border: "1px solid #1A1A1A", borderRadius: "12px",
      marginBottom: "10px", transition: "border-color 0.15s",
    }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = "#2A2A2A")}
      onMouseLeave={e => (e.currentTarget.style.borderColor = "#1A1A1A")}
    >
      <div style={{ display: "flex", gap: "12px" }}>
        {/* Poster */}
        <div
          onClick={() => router.push(`/title/${mt}/${review.tmdb_id}`)}
          style={{
            width: "48px", height: "72px", borderRadius: "5px",
            background: "#1A1A1A", flexShrink: 0, overflow: "hidden",
            cursor: "pointer", border: "1px solid #2A2A2A",
          }}
        >
          {review.poster_url && !imgErr ? (
            <img src={review.poster_url} alt={review.title}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={() => setImgErr(true)}
            />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {review.media_type === "tv" ? <Tv size={14} color="#2A2A2A" /> : <Film size={14} color="#2A2A2A" />}
            </div>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Header row */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "8px" }}>
            <Avatar name={review.author} size={28} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                <Link href={`/profile/${review.author}`} style={{
                  fontFamily: SANS, fontSize: "13px", fontWeight: 500,
                  color: "#F0EDE8", textDecoration: "none",
                }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = "#C8A96E")}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = "#F0EDE8")}
                >
                  {review.author}
                </Link>
                <span style={{ fontFamily: SANS, fontSize: "12px", color: "#504E4A" }}>reviewed</span>
                <Link href={`/title/${mt}/${review.tmdb_id}`} style={{
                  fontFamily: SANS, fontSize: "13px", fontWeight: 500,
                  color: "#C8A96E", textDecoration: "none",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "160px",
                }}>
                  {review.title}
                </Link>
                {review.year && (
                  <span style={{ fontFamily: MONO, fontSize: "10px", color: "#504E4A" }}>
                    {review.year}
                  </span>
                )}
                <span style={{ marginLeft: "auto", fontFamily: SANS, fontSize: "10px", color: "#504E4A", flexShrink: 0 }}>
                  {timeAgo(review.created_at)}
                </span>
              </div>
              {review.rating && (
                <div style={{ marginTop: "3px", display: "flex", alignItems: "center", gap: "5px" }}>
                  <StarDisplay rating={review.rating} />
                  <span style={{ fontFamily: MONO, fontSize: "10px", color: "#504E4A" }}>{review.rating}/5</span>
                </div>
              )}
            </div>
          </div>

          {/* Body */}
          {review.is_spoiler && !spoilerRevealed ? (
            <div style={{
              padding: "10px 14px", background: "#141414",
              border: "1px dashed #2A2A2A", borderRadius: "8px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <span style={{ fontFamily: SANS, fontSize: "12px", color: "#504E4A", fontStyle: "italic" }}>
                ⚠ Spoiler warning
              </span>
              <button onClick={() => setSpoilerRevealed(true)} style={{
                background: "none", border: "none", cursor: "pointer",
                fontFamily: SANS, fontSize: "11px", color: "#C8A96E",
              }}>
                Reveal
              </button>
            </div>
          ) : (
            <p style={{
              fontFamily: SANS, fontSize: "13px", color: "#8A8780",
              lineHeight: 1.7, marginBottom: "10px",
              display: "-webkit-box", WebkitLineClamp: 5,
              WebkitBoxOrient: "vertical", overflow: "hidden",
            }}>
              {review.body}
            </p>
          )}

          {/* Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button
              onClick={() => onLike(review.id, review.is_liked)}
              style={{
                display: "flex", alignItems: "center", gap: "4px",
                background: "none", border: "none", cursor: "pointer",
                fontFamily: SANS, fontSize: "11px",
                color: review.is_liked ? "#C87C2A" : "#504E4A", padding: 0,
                transition: "color 0.15s",
              }}
            >
              <Heart size={12} fill={review.is_liked ? "#C87C2A" : "none"} />
              {review.likes > 0 ? review.likes : "Like"}
            </button>
            <Link href={`/title/${mt}/${review.tmdb_id}`} style={{
              fontFamily: SANS, fontSize: "11px", color: "#504E4A", textDecoration: "none",
            }}>
              View film →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReviewsFeedPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"community" | "following">("community");
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = useRef<HTMLDivElement>(null);

  async function load(p: number, append: boolean, feedType: string) {
    if (p === 1) setLoading(true); else setLoadingMore(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      if (session) headers.Authorization = `Bearer ${session.access_token}`;
      const res = await fetch(`/api/reviews/feed?page=${p}&type=${feedType}`, { headers });
      const data = await res.json();
      const fetched = data.reviews || [];
      if (append) setReviews(prev => [...prev, ...fetched]); else setReviews(fetched);
      setHasMore(data.has_more || false);
      setPage(p);
    } catch {}
    setLoading(false);
    setLoadingMore(false);
  }

  useEffect(() => { load(1, false, tab); }, [tab, user]);

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
        load(page + 1, true, tab);
      }
    }, { threshold: 0.1 });
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, page, tab]);

  async function handleLike(reviewId: string, currentlyLiked: boolean) {
    if (!user) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    // Optimistic update
    setReviews(prev => prev.map(r =>
      r.id === reviewId
        ? { ...r, is_liked: !currentlyLiked, likes: r.likes + (currentlyLiked ? -1 : 1) }
        : r
    ));
    await fetch(`/api/reviews/${reviewId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ review_id: reviewId, action: currentlyLiked ? "unlike" : "like" }),
    });
  }

  return (
    <div style={{ maxWidth: "680px", margin: "0 auto", padding: "24px 20px 80px" }}>
      {/* Header */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
          <MessageCircle size={18} color="#C8A96E" />
          <h1 style={{ fontFamily: SERIF, fontSize: "26px", fontWeight: 700, color: "#F0EDE8", fontStyle: "italic" }}>
            Reviews
          </h1>
        </div>
        <p style={{ fontFamily: SANS, fontSize: "12px", color: "#504E4A" }}>
          What the community is writing
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0", borderBottom: "1px solid #1A1A1A", marginBottom: "20px" }}>
        {(["community", "following"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "10px 20px", background: "none", border: "none",
            borderBottom: tab === t ? "2px solid #C8A96E" : "2px solid transparent",
            color: tab === t ? "#F0EDE8" : "#504E4A",
            fontFamily: SANS, fontSize: "13px", fontWeight: tab === t ? 500 : 400,
            cursor: "pointer", marginBottom: "-1px", textTransform: "capitalize",
          }}>
            {t === "following" && !user ? "Following (sign in)" : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Reviews feed */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: "140px", borderRadius: "12px" }} />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <MessageCircle size={28} color="#2A2A2A" style={{ margin: "0 auto 12px", display: "block" }} />
          <p style={{ fontFamily: SERIF, fontSize: "18px", color: "#2A2A2A", fontStyle: "italic" }}>
            {tab === "following" && !user
              ? "Sign in to see reviews from people you follow."
              : tab === "following"
              ? "No reviews from people you follow yet."
              : "No reviews yet."}
          </p>
          {!user && (
            <Link href="/auth" style={{
              display: "inline-block", marginTop: "16px", padding: "9px 22px",
              borderRadius: "8px", background: "#C8A96E", color: "#0D0D0D",
              fontFamily: SANS, fontSize: "13px", fontWeight: 600, textDecoration: "none",
            }}>
              Sign in
            </Link>
          )}
        </div>
      ) : (
        <>
          {reviews.map(review => (
            <ReviewCard key={review.id} review={review} onLike={handleLike} />
          ))}
          <div ref={loaderRef} style={{ height: "48px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {loadingMore && <Loader2 size={16} color="#504E4A" style={{ animation: "spin 1s linear infinite" }} />}
          </div>
        </>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .skeleton {
          background: linear-gradient(90deg, #0F0F0F 25%, #141414 50%, #0F0F0F 75%);
          background-size: 200% 100%;
          animation: skeleton-loading 1.5s ease-in-out infinite;
        }
        @keyframes skeleton-loading { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
      `}</style>
    </div>
  );
}