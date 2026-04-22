"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Heart,
  Lock,
  Globe,
  Edit3,
  Plus,
  Trash2,
  Film,
  Tv,
  Star,
  GripVertical,
  X,
  Check,
  BookOpen,
  Share2,
  ChevronLeft,
  ChevronRight,
  Send,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import AddToListSearch from "@/components/features/lists/AddToListSearch";
import EditListModal from "@/components/features/lists/EditListModal";

const SERIF = "Playfair Display, Georgia, serif";
const SANS = "Inter, system-ui, sans-serif";
const MONO = "JetBrains Mono, Courier New, monospace";

const ENTRIES_PER_PAGE = 100;

// ─── TIME ────────────────────────────────────────────────────────────────────
function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── AVATAR ──────────────────────────────────────────────────────────────────
function AvatarMini({ name, size = 30 }: { name: string; size?: number }) {
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

// ─── STAR INPUT ──────────────────────────────────────────────────────────────
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
    <div style={{ display: "flex", gap: "2px" }}>
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

// ─── POSTER CELL ─────────────────────────────────────────────────────────────
function PosterCell({
  entry,
  position,
  isRanked,
  isOwner,
  onRemove,
}: {
  entry: any;
  position: number;
  isRanked: boolean;
  isOwner: boolean;
  onRemove: (id: string) => void;
}) {
  const router = useRouter();
  const [hovered, setHovered] = useState(false);
  const [imgErr, setImgErr] = useState(false);
  const mt = entry.media_type === "tv" ? "tv" : "movie";

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        aspectRatio: "2/3",
        borderRadius: "6px",
        overflow: "hidden",
        cursor: "pointer",
      }}
      onClick={() => router.push(`/title/${mt}/${entry.tmdb_id}`)}
    >
      {entry.poster_url && !imgErr ? (
        <img
          src={entry.poster_url}
          alt={entry.title}
          onError={() => setImgErr(true)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            transition: "transform 0.35s ease",
            transform: hovered ? "scale(1.05)" : "scale(1)",
          }}
        />
      ) : (
        <div
          style={{
            width: "100%",
            height: "100%",
            background: "#111",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {entry.media_type === "tv" ? (
            <Tv size={18} color="#2A2A2A" />
          ) : (
            <Film size={18} color="#2A2A2A" />
          )}
        </div>
      )}

      {/* Hover overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: hovered
            ? "linear-gradient(to top, rgba(0,0,0,0.88) 40%, rgba(0,0,0,0.2) 100%)"
            : "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%)",
          transition: "background 0.25s ease",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "8px",
        }}
      >
        {hovered && (
          <p
            style={{
              fontFamily: SERIF,
              fontSize: "11px",
              fontStyle: "italic",
              color: "#F0EDE8",
              lineHeight: 1.3,
              marginBottom: "2px",
              overflow: "hidden",
              display: "-webkit-box" as any,
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical" as any,
            }}
          >
            {entry.title}
          </p>
        )}
        {hovered && entry.year && (
          <span style={{ fontFamily: MONO, fontSize: "9px", color: "#8A8780" }}>
            {entry.year}
          </span>
        )}
      </div>

      {/* Rank badge */}
      {isRanked && (
        <div
          style={{
            position: "absolute",
            top: "5px",
            left: "5px",
            width: "22px",
            height: "22px",
            borderRadius: "50%",
            background:
              position === 0
                ? "rgba(200,169,110,0.9)"
                : position === 1
                  ? "rgba(138,135,128,0.85)"
                  : position === 2
                    ? "rgba(200,124,42,0.85)"
                    : "rgba(0,0,0,0.75)",
            border: "1px solid rgba(255,255,255,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: MONO,
            fontSize: position < 9 ? "10px" : "8px",
            fontWeight: 700,
            color: position < 3 ? "#0A0A0A" : "#8A8780",
            backdropFilter: "blur(4px)",
            zIndex: 2,
          }}
        >
          {position + 1}
        </div>
      )}

      {/* Remove */}
      {isOwner && hovered && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(entry.id);
          }}
          style={{
            position: "absolute",
            top: "5px",
            right: "5px",
            width: "20px",
            height: "20px",
            borderRadius: "50%",
            background: "rgba(180,40,40,0.85)",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            zIndex: 3,
          }}
        >
          <X size={10} color="#fff" />
        </button>
      )}

      {/* Note dot */}
      {entry.note && (
        <div
          style={{
            position: "absolute",
            bottom: "5px",
            right: "5px",
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: "#C8A96E",
            zIndex: 2,
          }}
        />
      )}
    </div>
  );
}

// ─── PAGINATION ───────────────────────────────────────────────────────────────
function Pagination({
  currentPage,
  totalPages,
  onPage,
}: {
  currentPage: number;
  totalPages: number;
  onPage: (p: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px",
        marginTop: "24px",
      }}
    >
      <button
        onClick={() => onPage(currentPage - 1)}
        disabled={currentPage === 1}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "4px",
          padding: "8px 14px",
          borderRadius: "8px",
          border: "1px solid #2A2A2A",
          background: "transparent",
          color: currentPage === 1 ? "#2A2A2A" : "#8A8780",
          fontFamily: SANS,
          fontSize: "12px",
          cursor: currentPage === 1 ? "not-allowed" : "pointer",
        }}
      >
        <ChevronLeft size={13} /> Prev
      </button>

      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
        const isActive = p === currentPage;
        const showPage =
          p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1;
        const showEllipsis =
          Math.abs(p - currentPage) === 2 && p !== 1 && p !== totalPages;

        if (showEllipsis) {
          return (
            <span
              key={p}
              style={{ color: "#2A2A2A", fontFamily: MONO, fontSize: "12px" }}
            >
              …
            </span>
          );
        }
        if (!showPage) return null;

        return (
          <button
            key={p}
            onClick={() => onPage(p)}
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              border: isActive
                ? "1px solid rgba(200,169,110,0.5)"
                : "1px solid #2A2A2A",
              background: isActive ? "rgba(200,169,110,0.1)" : "transparent",
              color: isActive ? "#C8A96E" : "#8A8780",
              fontFamily: MONO,
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            {p}
          </button>
        );
      })}

      <button
        onClick={() => onPage(currentPage + 1)}
        disabled={currentPage === totalPages}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "4px",
          padding: "8px 14px",
          borderRadius: "8px",
          border: "1px solid #2A2A2A",
          background: "transparent",
          color: currentPage === totalPages ? "#2A2A2A" : "#8A8780",
          fontFamily: SANS,
          fontSize: "12px",
          cursor: currentPage === totalPages ? "not-allowed" : "pointer",
        }}
      >
        Next <ChevronRight size={13} />
      </button>
    </div>
  );
}

// ─── LIST REVIEWS ─────────────────────────────────────────────────────────────
function ListReviews({
  listId,
  listTitle,
}: {
  listId: string;
  listTitle: string;
}) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [rating, setRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function loadReviews() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const headers: Record<string, string> = {};
    if (session) headers.Authorization = `Bearer ${session.access_token}`;
    try {
      const res = await fetch(`/api/lists/${listId}/reviews`, { headers });
      const data = await res.json();
      setReviews(data.reviews || []);
      setTotal(data.total || 0);
    } catch {}
    setLoading(false);
  }

  useEffect(() => {
    loadReviews();
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
      setError(data.error || "Failed to post");
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
    setTotal((prev) => Math.max(0, prev - 1));
  }

  return (
    <div
      style={{
        marginTop: "40px",
        paddingTop: "32px",
        borderTop: "1px solid #1A1A1A",
      }}
    >
      {/* Section header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "20px",
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
          Reviews
        </p>
        {total > 0 && (
          <span
            style={{
              fontFamily: MONO,
              fontSize: "10px",
              color: "#504E4A",
              background: "#1A1A1A",
              padding: "2px 7px",
              borderRadius: "10px",
            }}
          >
            {total}
          </span>
        )}
      </div>

      {/* Write box */}
      {user ? (
        <div
          style={{
            background: "#141414",
            border: "1px solid #2A2A2A",
            borderRadius: "12px",
            padding: "16px",
            marginBottom: "20px",
          }}
        >
          <div style={{ marginBottom: "10px" }}>
            <StarInput value={rating} onChange={setRating} />
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <textarea
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setError("");
              }}
              placeholder={`What did you think of "${listTitle}"?`}
              rows={2}
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
                background: submitting || !text.trim() ? "#1A1A1A" : "#C8A96E",
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
            borderRadius: "10px",
            padding: "16px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
            flexWrap: "wrap",
            marginBottom: "20px",
          }}
        >
          <p style={{ fontFamily: SANS, fontSize: "13px", color: "#504E4A" }}>
            Sign in to review this list
          </p>
          <Link
            href="/auth"
            style={{
              padding: "7px 16px",
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
          </Link>
        </div>
      )}

      {/* Reviews */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {[1, 2].map((i) => (
            <div
              key={i}
              className="skeleton"
              style={{ height: "80px", borderRadius: "10px" }}
            />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <p
          style={{
            fontFamily: SERIF,
            fontSize: "14px",
            color: "#2A2A2A",
            fontStyle: "italic",
            textAlign: "center",
            padding: "24px 0",
          }}
        >
          No reviews yet.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {reviews.map((review) => (
            <div
              key={review.id}
              style={{
                padding: "14px 16px",
                background: "#0F0F0F",
                border: `1px solid ${review.is_own ? "rgba(200,169,110,0.12)" : "#1A1A1A"}`,
                borderRadius: "10px",
              }}
            >
              <div
                style={{ display: "flex", gap: "10px", marginBottom: "8px" }}
              >
                <AvatarMini name={review.author} size={28} />
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
                        fontSize: "12px",
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
                          padding: "1px 5px",
                          borderRadius: "3px",
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                        }}
                      >
                        You
                      </span>
                    )}
                    {review.rating && (
                      <div style={{ display: "flex", gap: "1px" }}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <span
                            key={s}
                            style={{
                              color: review.rating >= s ? "#C8A96E" : "#2A2A2A",
                              fontSize: "10px",
                            }}
                          >
                            ★
                          </span>
                        ))}
                      </div>
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

              <div style={{ display: "flex", gap: "14px" }}>
                <button
                  onClick={() => handleLike(review.id, review.is_liked)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    background: "none",
                    border: "none",
                    cursor: user ? "pointer" : "default",
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

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function ListDetailPage() {
  const { listId } = useParams<{ listId: string }>();
  const { user } = useAuth();
  const router = useRouter();

  const [list, setList] = useState<any>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  const load = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const headers: Record<string, string> = {};
    if (session) headers.Authorization = `Bearer ${session.access_token}`;
    const res = await fetch(`/api/lists/${listId}`, { headers });
    if (res.status === 404 || res.status === 403) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    const data = await res.json();
    setList(data.list);
    setEntries(data.entries || []);
    setLiked(data.list.is_liked);
    setLikeCount(data.list.like_count);
    setLoading(false);
  }, [listId]);

  useEffect(() => {
    load();
  }, [load]);

  // Reset to page 1 whenever entries change
  useEffect(() => {
    setCurrentPage(1);
  }, [entries.length]);

  // Scroll to top of entries when page changes
  function handlePageChange(p: number) {
    setCurrentPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const totalPages = Math.ceil(entries.length / ENTRIES_PER_PAGE);
  const pagedEntries = entries.slice(
    (currentPage - 1) * ENTRIES_PER_PAGE,
    currentPage * ENTRIES_PER_PAGE,
  );

  async function handleLike() {
    if (!user) return;
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;
    const res = await fetch(`/api/lists/${listId}/like`, {
      method: "POST",
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    const data = await res.json();
    setLiked(data.liked);
    setLikeCount((prev) => (data.liked ? prev + 1 : prev - 1));
  }

  async function handleRemove(entryId: string) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;
    await fetch(`/api/lists/${listId}/entries`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ entry_id: entryId }),
    });
    setEntries((prev) => prev.filter((e) => e.id !== entryId));
  }

  async function handleDelete() {
    if (!confirm("Delete this list? This cannot be undone.")) return;
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;
    await fetch(`/api/lists/${listId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    router.push("/lists");
  }

  function handleShare() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ── Loading skeleton ──
  if (loading) {
    return (
      <div
        style={{ maxWidth: "900px", margin: "0 auto", padding: "32px 24px" }}
      >
        <div
          className="skeleton"
          style={{
            width: "80px",
            height: "14px",
            borderRadius: "4px",
            marginBottom: "32px",
          }}
        />
        <div
          className="skeleton"
          style={{
            width: "300px",
            height: "28px",
            borderRadius: "6px",
            marginBottom: "24px",
          }}
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))",
            gap: "6px",
          }}
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="skeleton"
              style={{ aspectRatio: "2/3", borderRadius: "6px" }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (notFound || !list) {
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
          List not found.
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

  const profile = list.profiles;
  const filmCount = entries.filter((e) => e.media_type === "movie").length;
  const tvCount = entries.filter((e) => e.media_type === "tv").length;

  return (
    <>
      <style>{`@keyframes slideDown { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }`}</style>

      <div
        style={{ maxWidth: "900px", margin: "0 auto", padding: "0 24px 100px" }}
      >
        {/* ── Back ── */}
        <div style={{ paddingTop: "24px", marginBottom: "24px" }}>
          <button
            onClick={() => router.back()}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
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

        {/* ── HEADER ── */}
        <div style={{ marginBottom: "28px" }}>
          {/* Badges */}
          <div
            style={{
              display: "flex",
              gap: "6px",
              marginBottom: "10px",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "3px 8px",
                borderRadius: "4px",
                background: "rgba(200,169,110,0.08)",
                border: "1px solid rgba(200,169,110,0.15)",
              }}
            >
              <BookOpen size={9} color="#C8A96E" />
              <span
                style={{
                  fontFamily: SANS,
                  fontSize: "9px",
                  color: "#C8A96E",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                List
              </span>
            </div>
            {list.is_ranked && (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "3px 8px",
                  borderRadius: "4px",
                  background: "rgba(92,74,138,0.12)",
                  border: "1px solid rgba(92,74,138,0.25)",
                }}
              >
                <Star size={9} color="#9A8AC0" />
                <span
                  style={{
                    fontFamily: SANS,
                    fontSize: "9px",
                    color: "#9A8AC0",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                  }}
                >
                  Ranked
                </span>
              </div>
            )}
            {!list.is_public && (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "3px 8px",
                  borderRadius: "4px",
                  background: "#141414",
                  border: "1px solid #2A2A2A",
                }}
              >
                <Lock size={9} color="#504E4A" />
                <span
                  style={{
                    fontFamily: SANS,
                    fontSize: "9px",
                    color: "#504E4A",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                  }}
                >
                  Private
                </span>
              </div>
            )}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: "16px",
              flexWrap: "wrap",
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1
                style={{
                  fontFamily: SERIF,
                  fontSize: "clamp(22px, 4vw, 30px)",
                  fontWeight: 700,
                  color: "#F0EDE8",
                  fontStyle: "italic",
                  lineHeight: 1.2,
                  marginBottom: "8px",
                }}
              >
                {list.title}
              </h1>
              {list.description && (
                <p
                  style={{
                    fontFamily: SANS,
                    fontSize: "13px",
                    color: "#8A8780",
                    lineHeight: 1.65,
                    marginBottom: "10px",
                    maxWidth: "520px",
                  }}
                >
                  {list.description}
                </p>
              )}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    fontFamily: MONO,
                    fontSize: "11px",
                    color: "#504E4A",
                  }}
                >
                  {entries.length} title{entries.length !== 1 ? "s" : ""}
                  {totalPages > 1 && ` · page ${currentPage} of ${totalPages}`}
                </span>
                {filmCount > 0 && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "3px",
                    }}
                  >
                    <Film size={10} color="#504E4A" />
                    <span
                      style={{
                        fontFamily: MONO,
                        fontSize: "10px",
                        color: "#504E4A",
                      }}
                    >
                      {filmCount}
                    </span>
                  </div>
                )}
                {tvCount > 0 && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "3px",
                    }}
                  >
                    <Tv size={10} color="#504E4A" />
                    <span
                      style={{
                        fontFamily: MONO,
                        fontSize: "10px",
                        color: "#504E4A",
                      }}
                    >
                      {tvCount}
                    </span>
                  </div>
                )}
                {profile && (
                  <span
                    style={{
                      fontFamily: SANS,
                      fontSize: "11px",
                      color: "#504E4A",
                    }}
                  >
                    by{" "}
                    <Link
                      href={`/profile/${profile.username}`}
                      style={{ color: "#8A8780", textDecoration: "none" }}
                      onMouseEnter={(e) =>
                        ((e.currentTarget as HTMLElement).style.color =
                          "#C8A96E")
                      }
                      onMouseLeave={(e) =>
                        ((e.currentTarget as HTMLElement).style.color =
                          "#8A8780")
                      }
                    >
                      {profile.username}
                    </Link>
                  </span>
                )}
              </div>

              {list.tags?.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    gap: "5px",
                    flexWrap: "wrap",
                    marginTop: "10px",
                  }}
                >
                  {list.tags.map((tag: string) => (
                    <span
                      key={tag}
                      style={{
                        padding: "3px 9px",
                        borderRadius: "4px",
                        background: "#141414",
                        border: "1px solid #2A2A2A",
                        fontFamily: SANS,
                        fontSize: "10px",
                        color: "#504E4A",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div
              style={{
                display: "flex",
                gap: "6px",
                flexShrink: 0,
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={handleLike}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  padding: "7px 12px",
                  borderRadius: "7px",
                  border: liked
                    ? "1px solid rgba(200,124,42,0.35)"
                    : "1px solid #2A2A2A",
                  background: liked ? "rgba(200,124,42,0.1)" : "transparent",
                  color: liked ? "#C87C2A" : "#8A8780",
                  fontFamily: SANS,
                  fontSize: "12px",
                  cursor: user ? "pointer" : "default",
                  transition: "all 0.15s",
                }}
              >
                <Heart size={12} fill={liked ? "#C87C2A" : "none"} />
                {likeCount > 0 ? likeCount : "Like"}
              </button>

              <button
                onClick={handleShare}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  padding: "7px 12px",
                  borderRadius: "7px",
                  border: "1px solid #2A2A2A",
                  background: "transparent",
                  color: copied ? "#4A9E6B" : "#8A8780",
                  fontFamily: SANS,
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                {copied ? <Check size={12} /> : <Share2 size={12} />}
                {copied ? "Copied!" : "Share"}
              </button>

              {list.is_owner && (
                <>
                  <button
                    onClick={() => setEditOpen(true)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      padding: "7px 12px",
                      borderRadius: "7px",
                      border: "1px solid #2A2A2A",
                      background: "transparent",
                      color: "#8A8780",
                      fontFamily: SANS,
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                  >
                    <Edit3 size={12} /> Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      padding: "7px 12px",
                      borderRadius: "7px",
                      border: "1px solid rgba(138,42,42,0.3)",
                      background: "transparent",
                      color: "#8A4A4A",
                      fontFamily: SANS,
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── ADD PANEL ── */}
        {list.is_owner && (
          <div style={{ marginBottom: "24px" }}>
            {!addOpen ? (
              <button
                onClick={() => setAddOpen(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 18px",
                  borderRadius: "8px",
                  border: "1px dashed rgba(200,169,110,0.3)",
                  background: "rgba(200,169,110,0.04)",
                  color: "#C8A96E",
                  fontFamily: SANS,
                  fontSize: "13px",
                  cursor: "pointer",
                  width: "100%",
                  justifyContent: "center",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background =
                    "rgba(200,169,110,0.08)";
                  (e.currentTarget as HTMLElement).style.borderColor =
                    "rgba(200,169,110,0.5)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background =
                    "rgba(200,169,110,0.04)";
                  (e.currentTarget as HTMLElement).style.borderColor =
                    "rgba(200,169,110,0.3)";
                }}
              >
                <Plus size={15} /> Add films or series
              </button>
            ) : (
              <div
                style={{
                  border: "1px solid #2A2A2A",
                  borderRadius: "12px",
                  background: "#0E0E0E",
                  overflow: "hidden",
                  animation: "slideDown 0.2s ease",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 16px",
                    borderBottom: "1px solid #1A1A1A",
                  }}
                >
                  <span
                    style={{
                      fontFamily: SANS,
                      fontSize: "12px",
                      color: "#8A8780",
                    }}
                  >
                    Add to list —{" "}
                    <span style={{ color: "#C8A96E" }}>
                      {entries.length} added
                    </span>
                  </span>
                  <button
                    onClick={() => setAddOpen(false)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#504E4A",
                      padding: "2px",
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
                <AddToListSearch
                  listId={listId as string}
                  existingTmdbIds={entries.map((e) => e.tmdb_id)}
                  onAdd={(entry) => setEntries((prev) => [...prev, entry])}
                  onClose={() => setAddOpen(false)}
                />
              </div>
            )}
          </div>
        )}

        {/* ── PAGE INDICATOR (top) — only when multiple pages ── */}
        {totalPages > 1 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "16px",
            }}
          >
            <p
              style={{
                fontFamily: SANS,
                fontSize: "10px",
                color: "#504E4A",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
              }}
            >
              {list.is_ranked ? "Ranking" : "Entries"} — showing{" "}
              {(currentPage - 1) * ENTRIES_PER_PAGE + 1}–
              {Math.min(currentPage * ENTRIES_PER_PAGE, entries.length)} of{" "}
              {entries.length}
            </p>
            <div style={{ display: "flex", gap: "4px" }}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => handlePageChange(p)}
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "6px",
                    border:
                      p === currentPage
                        ? "1px solid rgba(200,169,110,0.5)"
                        : "1px solid #2A2A2A",
                    background:
                      p === currentPage
                        ? "rgba(200,169,110,0.1)"
                        : "transparent",
                    color: p === currentPage ? "#C8A96E" : "#504E4A",
                    fontFamily: MONO,
                    fontSize: "11px",
                    cursor: "pointer",
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── ENTRIES GRID ── */}
        {entries.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "60px 24px",
              border: "1px dashed #1A1A1A",
              borderRadius: "12px",
            }}
          >
            <Film
              size={28}
              color="#2A2A2A"
              style={{ margin: "0 auto 12px", display: "block" }}
            />
            <p
              style={{
                fontFamily: SERIF,
                fontSize: "16px",
                color: "#2A2A2A",
                fontStyle: "italic",
              }}
            >
              This list is empty.
            </p>
            {list.is_owner && (
              <p
                style={{
                  fontFamily: SANS,
                  fontSize: "12px",
                  color: "#504E4A",
                  marginTop: "6px",
                }}
              >
                Click "Add films or series" to get started.
              </p>
            )}
          </div>
        ) : (
          <>
            {/* Single label line — only when one page */}
            {totalPages === 1 && (
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
                {list.is_ranked ? "Ranking" : "Entries"} — {entries.length}{" "}
                title{entries.length !== 1 ? "s" : ""}
              </p>
            )}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))",
                gap: "6px",
              }}
            >
              {pagedEntries.map((entry, i) => (
                <PosterCell
                  key={entry.id}
                  entry={entry}
                  position={(currentPage - 1) * ENTRIES_PER_PAGE + i}
                  isRanked={list.is_ranked}
                  isOwner={list.is_owner}
                  onRemove={handleRemove}
                />
              ))}
            </div>

            {/* ── PAGINATION (bottom) ── */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPage={handlePageChange}
            />
          </>
        )}

        {/* ── REVIEWS — always visible below entries ── */}
        {list && (
          <ListReviews listId={listId as string} listTitle={list.title} />
        )}
      </div>

      {editOpen && list && (
        <EditListModal
          list={list}
          onClose={() => setEditOpen(false)}
          onSaved={load}
        />
      )}
    </>
  );
}
