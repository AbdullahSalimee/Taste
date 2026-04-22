"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { Send, Heart, Trash2, Star } from "lucide-react";

const SERIF = "Playfair Display, Georgia, serif";
const SANS = "Inter, system-ui, sans-serif";
const MONO = "JetBrains Mono, Courier New, monospace";

interface Props {
  listId: string;
  listTitle: string;
}

function StarInput({
  value,
  onChange,
  size = 18,
}: {
  value: number;
  onChange: (v: number) => void;
  size?: number;
}) {
  const [hov, setHov] = useState(0);
  return (
    <div style={{ display: "flex", gap: "3px" }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          onMouseEnter={() => setHov(s)}
          onMouseLeave={() => setHov(0)}
          onMouseDown={() => onChange(s)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "1px",
            color: (hov || value) >= s ? "#C8A96E" : "#2A2A2A",
            fontSize: `${size}px`,
            lineHeight: 1,
            transition: "color 0.1s",
          }}
        >
          {(hov || value) >= s ? "★" : "☆"}
        </button>
      ))}
    </div>
  );
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function AvatarMini({ name, size = 28 }: { name: string; size?: number }) {
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
        fontFamily: SANS,
        fontSize: size * 0.38,
        fontWeight: 700,
        color: "#F0EDE8",
        flexShrink: 0,
      }}
    >
      {(name?.[0] || "?").toUpperCase()}
    </div>
  );
}

export function ListReviews({ listId, listTitle }: Props) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [rating, setRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const headers: Record<string, string> = {};
    if (session) headers.Authorization = `Bearer ${session.access_token}`;
    const res = await fetch(`/api/lists/${listId}/reviews`, { headers });
    const data = await res.json();
    setReviews(data.reviews || []);
    setTotal(data.total || 0);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [listId]);

  async function submit() {
    if (!text.trim() || text.trim().length < 10) {
      setError("Review must be at least 10 characters");
      return;
    }
    setSubmitting(true);
    setError("");
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      setSubmitting(false);
      return;
    }

    const res = await fetch(`/api/lists/${listId}/reviews`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ text: text.trim(), rating: rating || null }),
    });
    const data = await res.json();
    if (data.ok) {
      setReviews((prev) => [data.review, ...prev.filter((r) => !r.is_own)]);
      setTotal((prev) => prev + 1);
      setText("");
      setRating(0);
    } else {
      setError(data.error || "Failed to post review");
    }
    setSubmitting(false);
  }

  async function handleLike(reviewId: string, currentlyLiked: boolean) {
    if (!user) return;
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;

    await fetch(`/api/lists/${listId}/reviews`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        review_id: reviewId,
        action: currentlyLiked ? "unlike" : "like",
      }),
    });

    setReviews((prev) =>
      prev.map((r) =>
        r.id === reviewId
          ? {
              ...r,
              is_liked: !currentlyLiked,
              likes: r.likes + (currentlyLiked ? -1 : 1),
            }
          : r,
      ),
    );
  }

  async function handleDelete(reviewId: string) {
    if (!confirm("Delete your review?")) return;
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;

    await fetch(`/api/lists/${listId}/reviews`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ review_id: reviewId }),
    });
    setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    setTotal((prev) => prev - 1);
  }

  return (
    <div>
      {/* Write review */}
      {user ? (
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
              fontSize: "10px",
              color: "#504E4A",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              marginBottom: "12px",
            }}
          >
            Review this list
          </p>
          <div style={{ marginBottom: "12px" }}>
            <StarInput value={rating} onChange={setRating} />
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <textarea
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setError("");
              }}
              placeholder={`Share your thoughts on "${listTitle}"…`}
              rows={3}
              style={{
                flex: 1,
                background: "#0D0D0D",
                border: `1px solid ${error ? "rgba(138,42,42,0.5)" : "#2A2A2A"}`,
                borderRadius: "8px",
                padding: "10px 12px",
                color: "#F0EDE8",
                fontFamily: SANS,
                fontSize: "13px",
                resize: "none",
                outline: "none",
              }}
              onFocus={(e) =>
                (e.target.style.borderColor = "rgba(200,169,110,0.3)")
              }
              onBlur={(e) =>
                (e.target.style.borderColor = error
                  ? "rgba(138,42,42,0.5)"
                  : "#2A2A2A")
              }
            />
            <button
              onClick={submit}
              disabled={submitting || !text.trim()}
              style={{
                padding: "0 14px",
                background: submitting || !text.trim() ? "#2A2A2A" : "#C8A96E",
                border: "none",
                borderRadius: "8px",
                cursor: submitting || !text.trim() ? "not-allowed" : "pointer",
                flexShrink: 0,
              }}
            >
              <Send
                size={14}
                color={submitting || !text.trim() ? "#504E4A" : "#0D0D0D"}
              />
            </button>
          </div>
          {error && (
            <p
              style={{
                fontFamily: SANS,
                fontSize: "11px",
                color: "#C87C2A",
                marginTop: "6px",
              }}
            >
              {error}
            </p>
          )}
        </div>
      ) : (
        <div
          style={{
            background: "#0F0F0F",
            border: "1px dashed #2A2A2A",
            borderRadius: "12px",
            padding: "20px",
            textAlign: "center",
            marginBottom: "24px",
          }}
        >
          <p
            style={{
              fontFamily: SANS,
              fontSize: "13px",
              color: "#504E4A",
              marginBottom: "10px",
            }}
          >
            Sign in to review this list
          </p>
          <a
            href="/auth"
            style={{
              display: "inline-block",
              padding: "8px 18px",
              borderRadius: "8px",
              background: "#C8A96E",
              color: "#0D0D0D",
              fontFamily: SANS,
              fontSize: "12px",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Sign in
          </a>
        </div>
      )}

      {/* Review count header */}
      <p
        style={{
          fontFamily: SANS,
          fontSize: "10px",
          color: "#504E4A",
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          marginBottom: "14px",
        }}
      >
        {total} {total === 1 ? "review" : "reviews"}
      </p>

      {/* Reviews list */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="skeleton"
              style={{ height: "80px", borderRadius: "10px" }}
            />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#2A2A2A" }}>
          <p
            style={{ fontFamily: SERIF, fontSize: "16px", fontStyle: "italic" }}
          >
            No reviews yet. Be the first.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {reviews.map((review) => (
            <div
              key={review.id}
              style={{
                padding: "16px",
                background: "#0F0F0F",
                border: `1px solid ${review.is_own ? "rgba(200,169,110,0.15)" : "#1A1A1A"}`,
                borderRadius: "10px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  marginBottom: "10px",
                }}
              >
                <AvatarMini name={review.author} size={30} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: SANS,
                        fontSize: "13px",
                        fontWeight: 500,
                        color: "#F0EDE8",
                      }}
                    >
                      {review.author}
                    </span>
                    {review.is_own && (
                      <span
                        style={{
                          fontFamily: SANS,
                          fontSize: "9px",
                          color: "#C8A96E",
                          background: "rgba(200,169,110,0.1)",
                          padding: "1px 6px",
                          borderRadius: "3px",
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                        }}
                      >
                        You
                      </span>
                    )}
                    <span
                      style={{
                        marginLeft: "auto",
                        fontFamily: SANS,
                        fontSize: "10px",
                        color: "#504E4A",
                      }}
                    >
                      {timeAgo(review.created_at)}
                    </span>
                  </div>
                  {review.rating && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        marginTop: "3px",
                      }}
                    >
                      {[1, 2, 3, 4, 5].map((s) => (
                        <span
                          key={s}
                          style={{
                            color: review.rating >= s ? "#C8A96E" : "#2A2A2A",
                            fontSize: "11px",
                          }}
                        >
                          ★
                        </span>
                      ))}
                      <span
                        style={{
                          fontFamily: MONO,
                          fontSize: "10px",
                          color: "#504E4A",
                        }}
                      >
                        {review.rating}/5
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <p
                style={{
                  fontFamily: SANS,
                  fontSize: "13px",
                  color: "#8A8780",
                  lineHeight: 1.65,
                  marginBottom: "10px",
                }}
              >
                {review.body}
              </p>

              <div
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                <button
                  onClick={() => handleLike(review.id, review.is_liked)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: SANS,
                    fontSize: "11px",
                    color: review.is_liked ? "#C87C2A" : "#504E4A",
                    padding: 0,
                  }}
                >
                  <Heart
                    size={11}
                    fill={review.is_liked ? "#C87C2A" : "none"}
                  />
                  {review.likes > 0 ? review.likes : "Like"}
                </button>
                {review.is_own && (
                  <button
                    onClick={() => handleDelete(review.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontFamily: SANS,
                      fontSize: "11px",
                      color: "#504E4A",
                      padding: 0,
                    }}
                  >
                    <Trash2 size={11} /> Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
