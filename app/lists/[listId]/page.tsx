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
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import AddToListSearch from "@/components/features/lists/AddToListSearch";
import EditListModal from "@/components/features/lists/EditListModal";

const SERIF = "Playfair Display, Georgia, serif";
const SANS = "Inter, system-ui, sans-serif";
const MONO = "JetBrains Mono, Courier New, monospace";

function EntryCard({
  entry,
  position,
  isRanked,
  isOwner,
  onRemove,
  dragging,
}: {
  entry: any;
  position: number;
  isRanked: boolean;
  isOwner: boolean;
  onRemove: (id: string) => void;
  dragging?: boolean;
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
        display: "flex",
        alignItems: "flex-start",
        gap: "16px",
        padding: "14px 16px",
        background: dragging
          ? "rgba(200,169,110,0.06)"
          : hovered
            ? "#111111"
            : "transparent",
        border: `1px solid ${dragging ? "rgba(200,169,110,0.2)" : hovered ? "#2A2A2A" : "#1A1A1A"}`,
        borderRadius: "10px",
        marginBottom: "6px",
        transition: "all 0.15s ease",
        cursor: "default",
      }}
    >
      {/* Rank number */}
      {isRanked && (
        <div
          style={{
            width: "32px",
            flexShrink: 0,
            textAlign: "center",
            paddingTop: "12px",
          }}
        >
          <span
            style={{
              fontFamily: MONO,
              fontSize: position < 10 ? "22px" : "16px",
              fontWeight: 500,
              color:
                position === 0
                  ? "#C8A96E"
                  : position === 1
                    ? "#8A8780"
                    : position === 2
                      ? "#C87C2A"
                      : "#2A2A2A",
              lineHeight: 1,
            }}
          >
            {position + 1}
          </span>
        </div>
      )}

      {/* Drag handle */}
      {isOwner && (
        <div
          style={{
            paddingTop: "14px",
            color: hovered ? "#504E4A" : "#1A1A1A",
            cursor: "grab",
            transition: "color 0.15s",
            flexShrink: 0,
          }}
        >
          <GripVertical size={14} />
        </div>
      )}

      {/* Poster */}
      <div
        onClick={() => router.push(`/title/${mt}/${entry.tmdb_id}`)}
        style={{
          width: "48px",
          height: "72px",
          borderRadius: "5px",
          overflow: "hidden",
          background: "#1A1A1A",
          flexShrink: 0,
          cursor: "pointer",
          border: "1px solid #2A2A2A",
        }}
      >
        {entry.poster_url && !imgErr ? (
          <img
            src={entry.poster_url}
            alt={entry.title}
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
            {entry.media_type === "tv" ? (
              <Tv size={16} color="#2A2A2A" />
            ) : (
              <Film size={16} color="#2A2A2A" />
            )}
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "8px",
            marginBottom: "4px",
          }}
        >
          <Link
            href={`/title/${mt}/${entry.tmdb_id}`}
            style={{
              fontFamily: SANS,
              fontSize: "14px",
              fontWeight: 500,
              color: "#F0EDE8",
              textDecoration: "none",
              lineHeight: 1.3,
              flex: 1,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#C8A96E")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#F0EDE8")}
          >
            {entry.title}
          </Link>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "6px",
          }}
        >
          <span
            style={{ fontFamily: MONO, fontSize: "10px", color: "#504E4A" }}
          >
            {entry.year || "—"}
          </span>
          <span
            style={{
              fontFamily: SANS,
              fontSize: "9px",
              padding: "1px 5px",
              borderRadius: "3px",
              background:
                entry.media_type === "tv"
                  ? "rgba(74,158,107,0.12)"
                  : "rgba(92,74,138,0.12)",
              color: entry.media_type === "tv" ? "#4A9E6B" : "#9A8AC0",
            }}
          >
            {entry.media_type === "tv" ? "TV" : "Film"}
          </span>
          {entry.tmdb_rating_5 > 0 && (
            <span
              style={{ fontFamily: MONO, fontSize: "10px", color: "#C8A96E" }}
            >
              ★ {entry.tmdb_rating_5}
            </span>
          )}
        </div>

        {entry.note && (
          <p
            style={{
              fontFamily: SANS,
              fontSize: "12px",
              color: "#8A8780",
              fontStyle: "italic",
              lineHeight: 1.5,
            }}
          >
            "{entry.note}"
          </p>
        )}
      </div>

      {/* Remove button */}
      {isOwner && hovered && (
        <button
          onClick={() => onRemove(entry.id)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#504E4A",
            padding: "4px",
            borderRadius: "4px",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLElement).style.color = "#C87C2A")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLElement).style.color = "#504E4A")
          }
        >
          <X size={13} />
        </button>
      )}
    </div>
  );
}


// ─── POSTER CELL ────────────────────────────────────────────────────────────
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
      {/* Poster image */}
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

      {/* Hover overlay with title */}
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
            style={
              {
                fontFamily: SERIF,
                fontSize: "11px",
                fontStyle: "italic",
                color: "#F0EDE8",
                lineHeight: 1.3,
                marginBottom: "2px",
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
              } as any
            }
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

      {/* Remove button */}
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

      {/* Note indicator */}
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

// ─── MAIN PAGE ───────────────────────────────────────────────────────────────
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
      <style>{`
        @keyframes slideDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div
        style={{ maxWidth: "900px", margin: "0 auto", padding: "0 24px 100px" }}
      >
        {/* Back */}
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
          {/* Badges row */}
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
                <Heart size={12} fill={liked ? "#C87C2A" : "none"} />{" "}
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
                {copied ? <Check size={12} /> : <Share2 size={12} />}{" "}
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

        {/* ── ADD PANEL (persistent, stays open) ── */}
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
              // Inline persistent panel — stays open after each add
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
                      display: "flex",
                      padding: "2px",
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
                {/* AddToListSearch rendered inline, onAdd does NOT close panel */}
                <AddToListSearch
                  listId={listId as string}
                  existingTmdbIds={entries.map((e) => e.tmdb_id)}
                  onAdd={(entry) => {
                    // Add the entry but keep panel open for rapid adding
                    setEntries((prev) => [...prev, entry]);
                    // DO NOT call setAddOpen(false) here
                  }}
                  onClose={() => setAddOpen(false)}
                
                />
              </div>
            )}
          </div>
        )}

        {/* ── POSTER GRID ── */}
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
              {list.is_ranked ? "Ranking" : "Entries"} — {entries.length} title
              {entries.length !== 1 ? "s" : ""}
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))",
                gap: "6px",
              }}
            >
              {entries.map((entry, i) => (
                <PosterCell
                  key={entry.id}
                  entry={entry}
                  position={i}
                  isRanked={list.is_ranked}
                  isOwner={list.is_owner}
                  onRemove={handleRemove}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Edit modal */}
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