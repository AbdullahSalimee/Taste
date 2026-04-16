"use client";
import { useState, useEffect, useCallback } from "react";
import { Heart, AlertTriangle, Send, ChevronDown } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";

const SANS = "Inter, system-ui, sans-serif";
const MONO = "JetBrains Mono, Courier New, monospace";
const SERIF = "Playfair Display, Georgia, serif";

const LS_KEY = (tmdbId: number) => `taste_local_reviews_${tmdbId}`;

function getLocalReviews(tmdbId: number): any[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(LS_KEY(tmdbId)) || "[]");
  } catch {
    return [];
  }
}
function saveLocalReview(tmdbId: number, review: any) {
  const list = getLocalReviews(tmdbId);
  list.unshift(review);
  try {
    localStorage.setItem(LS_KEY(tmdbId), JSON.stringify(list.slice(0, 50)));
  } catch {}
}

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

function StarInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: "flex", gap: "2px", alignItems: "center" }}>
      {[1, 2, 3, 4, 5].map((star) => {
        const active = (hovered || value) >= star;
        const half = !active && (hovered || value) >= star - 0.5;
        return (
          <button
            key={star}
            type="button"
            onMouseDown={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              onChange(
                e.clientX < rect.left + rect.width / 2 ? star - 0.5 : star,
              );
            }}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setHovered(
                e.clientX < rect.left + rect.width / 2 ? star - 0.5 : star,
              );
            }}
            onMouseLeave={() => setHovered(0)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "20px",
              color: active || half ? "#C8A96E" : "#2A2A2A",
              padding: "1px",
              lineHeight: 1,
              transition: "transform 0.1s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.transform = "scale(1.15)")
            }
          >
            {active ? "★" : half ? "⯨" : "☆"}
          </button>
        );
      })}
      {value > 0 && (
        <span
          style={{
            fontFamily: MONO,
            fontSize: "12px",
            color: "#C8A96E",
            marginLeft: "4px",
          }}
        >
          {value}/5
        </span>
      )}
    </div>
  );
}

function StarDisplay({ rating, size = 13 }: { rating: number; size?: number }) {
  return (
    <span
      style={{
        color: "#C8A96E",
        fontSize: `${size}px`,
        letterSpacing: "0.5px",
      }}
    >
      {[1, 2, 3, 4, 5]
        .map((s) => (rating >= s ? "★" : rating >= s - 0.5 ? "⯨" : "☆"))
        .join("")}
    </span>
  );
}

function Avatar({ name, size = 28 }: { name: string; size?: number }) {
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
      }}
    >
      {(name?.[0] || "?").toUpperCase()}
    </div>
  );
}

interface ReviewCardProps {
  review: any;
  onLike: (id: string, liked: boolean) => void;
  likedIds: Set<string>;
}

function ReviewCard({ review, onLike, likedIds }: ReviewCardProps) {
  const [spoilerRevealed, setSpoilerRevealed] = useState(false);
  const liked = likedIds.has(review.id);

  return (
    <div
      style={{
        padding: "16px",
        background: "#0F0F0F",
        border: "1px solid #1A1A1A",
        borderRadius: "10px",
        marginBottom: "10px",
        animation: "feedFadeUp 0.35s ease forwards",
        opacity: 0,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "10px",
        }}
      >
        <Avatar name={review.author} size={28} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontFamily: SANS,
              fontSize: "13px",
              color: "#F0EDE8",
              fontWeight: 500,
            }}
          >
            {review.author}
          </p>
          {review.rating && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <StarDisplay rating={review.rating} size={11} />
              <span
                style={{ fontFamily: MONO, fontSize: "10px", color: "#504E4A" }}
              >
                {review.rating}/5
              </span>
            </div>
          )}
        </div>
        <span
          style={{
            fontFamily: SANS,
            fontSize: "10px",
            color: "#504E4A",
            flexShrink: 0,
          }}
        >
          {timeAgo(review.created_at)}
        </span>
      </div>

      {/* Spoiler warning */}
      {review.is_spoiler && !spoilerRevealed ? (
        <div
          style={{
            padding: "12px",
            borderRadius: "6px",
            background: "rgba(200,124,42,0.08)",
            border: "1px solid rgba(200,124,42,0.2)",
            marginBottom: "10px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            cursor: "pointer",
          }}
          onClick={() => setSpoilerRevealed(true)}
        >
          <AlertTriangle size={13} color="#C87C2A" />
          <span
            style={{ fontFamily: SANS, fontSize: "12px", color: "#C87C2A" }}
          >
            Spoiler warning — click to reveal
          </span>
        </div>
      ) : (
        <p
          style={{
            fontFamily: SANS,
            fontSize: "13px",
            color: "#8A8780",
            lineHeight: 1.7,
            marginBottom: "10px",
          }}
        >
          {review.body}
        </p>
      )}

      {/* Footer */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          paddingTop: "8px",
          borderTop: "1px solid #141414",
        }}
      >
        <button
          onClick={() => onLike(review.id, liked)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
            fontFamily: SANS,
            fontSize: "12px",
            color: liked ? "#C87C2A" : "#504E4A",
          }}
        >
          <Heart
            size={12}
            fill={liked ? "#C87C2A" : "none"}
            stroke={liked ? "#C87C2A" : "#504E4A"}
          />
          {review.likes + (liked ? 1 : 0)}
        </button>
        {review.is_spoiler && spoilerRevealed && (
          <span
            style={{
              fontFamily: SANS,
              fontSize: "10px",
              color: "#504E4A",
              marginLeft: "auto",
              background: "rgba(200,124,42,0.08)",
              padding: "2px 6px",
              borderRadius: "3px",
            }}
          >
            spoiler
          </span>
        )}
      </div>
    </div>
  );
}

interface CommunityReviewsProps {
  tmdbId: number;
  mediaType: "movie" | "tv";
  titleName: string;
}

export function CommunityReviews({
  tmdbId,
  mediaType,
  titleName,
}: CommunityReviewsProps) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

  // Form state
  const [text, setText] = useState("");
  const [rating, setRating] = useState(0);
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [anonName, setAnonName] = useState("");
  const [formError, setFormError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const displayName =
    user?.user_metadata?.username || user?.email?.split("@")[0] || "";

  const loadReviews = useCallback(
    async (p: number, append = false) => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/reviews/by-tmdb?tmdb_id=${tmdbId}&media_type=${mediaType}&page=${p}`,
        );
        const data = await res.json();
        const fetched = data.reviews || [];

        // Merge with local reviews on first page
        if (p === 1) {
          const local = getLocalReviews(tmdbId);
          const serverIds = new Set(fetched.map((r: any) => r.id));
          const localOnly = local.filter((r: any) => !serverIds.has(r.id));
          setReviews(
            append
              ? (prev) => [...prev, ...fetched]
              : [...localOnly, ...fetched],
          );
        } else {
          setReviews(append ? (prev) => [...prev, ...fetched] : fetched);
        }

        setTotal(data.total || 0);
        setHasMore(data.total > p * 20);
        setPage(p);
      } catch {
      } finally {
        setLoading(false);
      }
    },
    [tmdbId, mediaType],
  );

  useEffect(() => {
    loadReviews(1);
  }, [loadReviews]);

  async function handleSubmit() {
    setFormError("");
    if (!text.trim()) {
      setFormError("Please write something.");
      return;
    }
    if (!user && !anonName.trim()) {
      setFormError("Please enter a name.");
      return;
    }

    setSubmitting(true);

    // Get auth token if signed in
    let authHeader = "";
    if (user) {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.access_token) authHeader = `Bearer ${session.access_token}`;
    }

    try {
      const res = await fetch("/api/reviews/by-tmdb", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
        body: JSON.stringify({
          text: text.trim(),
          rating: rating || null,
          is_spoiler: isSpoiler,
          tmdb_id: tmdbId,
          media_type: mediaType,
          author: user ? displayName : anonName.trim(),
        }),
      });

      const data = await res.json();
      if (data.ok) {
        const newReview = data.review;
        setReviews((prev) => [newReview, ...prev]);
        if (data.anonymous) saveLocalReview(tmdbId, newReview);
        setText("");
        setRating(0);
        setIsSpoiler(false);
        setAnonName("");
        setSubmitted(true);
        setTimeout(() => setSubmitted(false), 3000);
      } else {
        setFormError(data.error || "Failed to submit.");
      }
    } catch {
      setFormError("Network error. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLike(reviewId: string, alreadyLiked: boolean) {
    // Optimistic toggle
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (alreadyLiked) next.delete(reviewId);
      else next.add(reviewId);
      return next;
    });
    // Persist
    try {
      await fetch("/api/reviews/by-tmdb", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          review_id: reviewId,
          action: alreadyLiked ? "unlike" : "like",
        }),
      });
    } catch {}
  }

  return (
    <div>
      {/* Write review form */}
      <div
        style={{
          background: "#141414",
          border: "1px solid #2A2A2A",
          borderRadius: "12px",
          padding: "16px",
          marginBottom: "24px",
        }}
      >
        <p
          style={{
            fontFamily: SANS,
            fontSize: "11px",
            color: "#504E4A",
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            marginBottom: "12px",
          }}
        >
          {submitted ? "✓ Review posted!" : "Write a review"}
        </p>

        {!submitted && (
          <>
            {/* Star rating */}
            <div style={{ marginBottom: "12px" }}>
              <StarInput value={rating} onChange={setRating} />
            </div>

            {/* Name field for anon users */}
            {!user && (
              <input
                value={anonName}
                onChange={(e) => setAnonName(e.target.value)}
                placeholder="Your name"
                style={{
                  width: "100%",
                  background: "#0D0D0D",
                  border: "1px solid #2A2A2A",
                  borderRadius: "6px",
                  padding: "8px 12px",
                  color: "#F0EDE8",
                  fontFamily: SANS,
                  fontSize: "13px",
                  outline: "none",
                  marginBottom: "8px",
                }}
                onFocus={(e) =>
                  (e.target.style.borderColor = "rgba(200,169,110,0.3)")
                }
                onBlur={(e) => (e.target.style.borderColor = "#2A2A2A")}
              />
            )}

            {/* Review text */}
            <div style={{ display: "flex", gap: "8px" }}>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={`What did you think of ${titleName.length > 24 ? titleName.slice(0, 24) + "…" : titleName}?`}
                style={{
                  flex: 1,
                  background: "#0D0D0D",
                  border: "1px solid #2A2A2A",
                  borderRadius: "6px",
                  padding: "10px 12px",
                  color: "#F0EDE8",
                  fontFamily: SANS,
                  fontSize: "13px",
                  resize: "none",
                  height: "72px",
                  outline: "none",
                }}
                onFocus={(e) =>
                  (e.target.style.borderColor = "rgba(200,169,110,0.3)")
                }
                onBlur={(e) => (e.target.style.borderColor = "#2A2A2A")}
              />
              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  padding: "0 14px",
                  background: submitting ? "#8A7A5A" : "#C8A96E",
                  border: "none",
                  borderRadius: "6px",
                  cursor: submitting ? "not-allowed" : "pointer",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Send size={14} color="#0D0D0D" />
              </button>
            </div>

            {/* Spoiler toggle */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginTop: "8px",
              }}
            >
              <button
                onClick={() => setIsSpoiler(!isSpoiler)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  fontFamily: SANS,
                  fontSize: "11px",
                  color: isSpoiler ? "#C87C2A" : "#504E4A",
                }}
              >
                <AlertTriangle size={11} />
                {isSpoiler ? "Spoiler marked" : "Mark as spoiler"}
              </button>
              {!user && (
                <span
                  style={{
                    fontFamily: SANS,
                    fontSize: "10px",
                    color: "#2A2A2A",
                    marginLeft: "auto",
                  }}
                >
                  Sign in to save reviews to your profile
                </span>
              )}
            </div>

            {formError && (
              <p
                style={{
                  fontFamily: SANS,
                  fontSize: "11px",
                  color: "#C87C2A",
                  marginTop: "6px",
                }}
              >
                {formError}
              </p>
            )}
          </>
        )}
      </div>

      {/* Reviews list */}
      {loading && reviews.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="skeleton"
              style={{ height: "100px", borderRadius: "10px" }}
            />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "32px",
            border: "1px dashed #1A1A1A",
            borderRadius: "10px",
          }}
        >
          <p
            style={{
              fontFamily: SERIF,
              fontSize: "16px",
              color: "#2A2A2A",
              fontStyle: "italic",
            }}
          >
            No reviews yet.
          </p>
          <p
            style={{
              fontFamily: SANS,
              fontSize: "12px",
              color: "#504E4A",
              marginTop: "4px",
            }}
          >
            Be the first to write one.
          </p>
        </div>
      ) : (
        <>
          <p
            style={{
              fontFamily: SANS,
              fontSize: "11px",
              color: "#504E4A",
              marginBottom: "12px",
            }}
          >
            {total > 0
              ? `${total} review${total !== 1 ? "s" : ""}`
              : `${reviews.length} review${reviews.length !== 1 ? "s" : ""}`}
          </p>
          {reviews.map((r) => (
            <ReviewCard
              key={r.id}
              review={r}
              onLike={handleLike}
              likedIds={likedIds}
            />
          ))}
          {hasMore && (
            <button
              onClick={() => loadReviews(page + 1, true)}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "8px",
                background: "transparent",
                border: "1px solid #2A2A2A",
                color: "#8A8780",
                fontFamily: SANS,
                fontSize: "12px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
              }}
            >
              <ChevronDown size={14} /> Load more reviews
            </button>
          )}
        </>
      )}
    </div>
  );
}
