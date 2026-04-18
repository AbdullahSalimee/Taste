"use client";
import { useState, useEffect, useRef } from "react";
import { Plus, X, Film, Tv, Dna } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

const SANS = "Inter, system-ui, sans-serif";
const SERIF = "Playfair Display, Georgia, serif";
const MONO = "JetBrains Mono, Courier New, monospace";

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const hrs = Math.floor(diff / 3600000);
  if (hrs < 1) return "just now";
  if (hrs < 24) return `${hrs}h ago`;
  return "23h ago";
}

function Avatar({
  name,
  size = 56,
  ring = false,
  unseen = false,
}: {
  name: string;
  size?: number;
  ring?: boolean;
  unseen?: boolean;
}) {
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
        fontWeight: 600,
        color: "#F0EDE8",
        border: ring ? `2px solid ${unseen ? "#C8A96E" : "#3A3A3A"}` : "none",
        boxShadow:
          ring && unseen ? "0 0 0 2px #0D0D0D, 0 0 0 4px #C8A96E" : "none",
        flexShrink: 0,
      }}
    >
      {(name?.[0] || "?").toUpperCase()}
    </div>
  );
}

// ── Story Viewer Modal ─────────────────────────────────────────────────────────
function StoryViewer({
  group,
  onClose,
  onViewed,
}: {
  group: any;
  onClose: () => void;
  onViewed: (ids: string[]) => void;
}) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<any>(null);
  const DURATION = 5000;

  const story = group.stories[currentIdx];

  useEffect(() => {
    // Mark as viewed
    onViewed(group.stories.map((s: any) => s.id));

    setProgress(0);
    const start = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min((elapsed / DURATION) * 100, 100);
      setProgress(pct);
      if (elapsed >= DURATION) {
        clearInterval(timerRef.current);
        if (currentIdx < group.stories.length - 1) {
          setCurrentIdx((i) => i + 1);
        } else {
          onClose();
        }
      }
    }, 50);
    return () => clearInterval(timerRef.current);
  }, [currentIdx]);

  function prev() {
    clearInterval(timerRef.current);
    if (currentIdx > 0) setCurrentIdx((i) => i - 1);
    else onClose();
  }

  function next() {
    clearInterval(timerRef.current);
    if (currentIdx < group.stories.length - 1) setCurrentIdx((i) => i + 1);
    else onClose();
  }

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 900,
          background: "rgba(0,0,0,0.95)",
          backdropFilter: "blur(20px)",
        }}
      />
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
          zIndex: 901,
          width: "min(400px, 100vw)",
          height: "min(700px, 95vh)",
          borderRadius: "16px",
          overflow: "hidden",
          background: "#0D0D0D",
          border: "1px solid #2A2A2A",
          boxShadow: "0 40px 100px rgba(0,0,0,0.9)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Progress bars */}
        <div
          style={{
            display: "flex",
            gap: "3px",
            padding: "12px 12px 0",
            zIndex: 10,
          }}
        >
          {group.stories.map((_: any, i: number) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: "2px",
                background: "#2A2A2A",
                borderRadius: "1px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  background: "#C8A96E",
                  width:
                    i < currentIdx
                      ? "100%"
                      : i === currentIdx
                        ? `${progress}%`
                        : "0%",
                  transition: i === currentIdx ? "none" : "none",
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "12px 16px",
          }}
        >
          <Avatar name={group.username} size={36} ring />
          <div style={{ flex: 1 }}>
            <p
              style={{
                fontFamily: SANS,
                fontSize: "13px",
                color: "#F0EDE8",
                fontWeight: 600,
              }}
            >
              {group.username}
            </p>
            <p style={{ fontFamily: SANS, fontSize: "10px", color: "#504E4A" }}>
              {timeAgo(story.created_at)}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#504E4A",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Story content */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            position: "relative",
          }}
        >
          {/* Log story */}
          {story.type === "log" && (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "20px",
                gap: "16px",
              }}
            >
              {story.poster_url ? (
                <div
                  style={{
                    width: "160px",
                    height: "240px",
                    borderRadius: "8px",
                    overflow: "hidden",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.8)",
                  }}
                >
                  <img
                    src={story.poster_url}
                    alt={story.title}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </div>
              ) : (
                <div
                  style={{
                    width: "160px",
                    height: "240px",
                    borderRadius: "8px",
                    background: "#1A1A1A",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {story.media_type === "tv" ? (
                    <Tv size={32} color="#504E4A" />
                  ) : (
                    <Film size={32} color="#504E4A" />
                  )}
                </div>
              )}
              <div style={{ textAlign: "center" }}>
                <p
                  style={{
                    fontFamily: SERIF,
                    fontSize: "18px",
                    color: "#F0EDE8",
                    fontWeight: 700,
                    fontStyle: "italic",
                    marginBottom: "4px",
                  }}
                >
                  {story.title}
                </p>
                {story.rating && (
                  <p
                    style={{
                      fontFamily: MONO,
                      fontSize: "14px",
                      color: "#C8A96E",
                    }}
                  >
                    {"★".repeat(Math.floor(story.rating))} {story.rating}/5
                  </p>
                )}
                {story.caption && (
                  <p
                    style={{
                      fontFamily: SANS,
                      fontSize: "13px",
                      color: "#8A8780",
                      fontStyle: "italic",
                      marginTop: "10px",
                      lineHeight: 1.6,
                    }}
                  >
                    "{story.caption}"
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Thought story */}
          {story.type === "thought" && (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "32px",
              }}
            >
              <p
                style={{
                  fontFamily: SERIF,
                  fontSize: "22px",
                  color: "#F0EDE8",
                  fontStyle: "italic",
                  textAlign: "center",
                  lineHeight: 1.6,
                }}
              >
                "{story.caption}"
              </p>
            </div>
          )}

          {/* DNA story — full-height cinematic card */}
          {story.type === "dna" && (
            <div
              style={{
                flex: 1,
                position: "relative",
                display: "flex",
                flexDirection: "column",
                background:
                  "linear-gradient(160deg, #0A0A0A 0%, #111111 40%, #0D0A06 100%)",
                overflow: "hidden",
              }}
            >
              {/* Ambient glow */}
              <div
                style={{
                  position: "absolute",
                  top: "30%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: "300px",
                  height: "300px",
                  borderRadius: "50%",
                  background:
                    "radial-gradient(circle, rgba(200,169,110,0.12) 0%, transparent 70%)",
                  pointerEvents: "none",
                }}
              />

              {/* Film strip top */}
              <div
                style={{
                  display: "flex",
                  height: "18px",
                  borderBottom: "1px solid #1A1A1A",
                  flexShrink: 0,
                }}
              >
                {Array.from({ length: 16 }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      borderRight: "1px solid #1A1A1A",
                      background: "#080808",
                      height: "5px",
                      margin: "4px 0",
                    }}
                  />
                ))}
              </div>

              {/* Main content — centered */}
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "24px 28px",
                  gap: "0",
                }}
              >
                {/* Label */}
                <p
                  style={{
                    fontFamily: SANS,
                    fontSize: "9px",
                    color: "#504E4A",
                    textTransform: "uppercase",
                    letterSpacing: "0.25em",
                    marginBottom: "28px",
                    textAlign: "center",
                  }}
                >
                  TASTE — DNA CARD
                </p>

                {/* Username */}
                <p
                  style={{
                    fontFamily: SANS,
                    fontSize: "13px",
                    color: "#8A8780",
                    marginBottom: "10px",
                    textAlign: "center",
                  }}
                >
                  {group.username}
                </p>

                {/* Archetype — big hero text */}
                <h2
                  style={{
                    fontFamily: SERIF,
                    fontSize: "32px",
                    fontWeight: 700,
                    lineHeight: 1.2,
                    textAlign: "center",
                    marginBottom: "16px",
                    background:
                      "linear-gradient(105deg, #C8A96E 0%, #F0EDE8 45%, #C8A96E 55%, #DFC080 100%)",
                    backgroundSize: "300% auto",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    animation: "goldSweep 3s linear infinite",
                  }}
                >
                  {story.metadata?.archetype || "Cinematic Explorer"}
                </h2>

                {/* Description */}
                <p
                  style={{
                    fontFamily: SANS,
                    fontSize: "14px",
                    color: "#8A8780",
                    fontStyle: "italic",
                    textAlign: "center",
                    lineHeight: 1.65,
                    maxWidth: "280px",
                    marginBottom: "32px",
                  }}
                >
                  {story.metadata?.archetype_desc ||
                    "A cinematic identity shaped by obsessive taste."}
                </p>

                {/* Genre pills */}
                {story.metadata?.top_genres?.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "8px",
                      justifyContent: "center",
                      marginBottom: "28px",
                    }}
                  >
                    {(story.metadata.top_genres as any[])
                      .slice(0, 4)
                      .map((g: any) => (
                        <span
                          key={g.name}
                          style={{
                            padding: "4px 12px",
                            borderRadius: "20px",
                            fontFamily: SANS,
                            fontSize: "11px",
                            fontWeight: 500,
                            background: "rgba(200,169,110,0.12)",
                            border: "1px solid rgba(200,169,110,0.25)",
                            color: "#C8A96E",
                          }}
                        >
                          {g.name} {g.pct}%
                        </span>
                      ))}
                  </div>
                )}

                {/* Stats row */}
                <div
                  style={{
                    display: "flex",
                    gap: "28px",
                    justifyContent: "center",
                  }}
                >
                  {story.metadata?.total_films > 0 && (
                    <div style={{ textAlign: "center" }}>
                      <p
                        style={{
                          fontFamily: "JetBrains Mono, Courier New, monospace",
                          fontSize: "20px",
                          color: "#C8A96E",
                          fontWeight: 500,
                        }}
                      >
                        {story.metadata.total_films}
                      </p>
                      <p
                        style={{
                          fontFamily: SANS,
                          fontSize: "9px",
                          color: "#504E4A",
                          marginTop: "2px",
                          textTransform: "uppercase",
                          letterSpacing: "0.1em",
                        }}
                      >
                        Films
                      </p>
                    </div>
                  )}
                  {story.metadata?.total_series > 0 && (
                    <div style={{ textAlign: "center" }}>
                      <p
                        style={{
                          fontFamily: "JetBrains Mono, Courier New, monospace",
                          fontSize: "20px",
                          color: "#C8A96E",
                          fontWeight: 500,
                        }}
                      >
                        {story.metadata.total_series}
                      </p>
                      <p
                        style={{
                          fontFamily: SANS,
                          fontSize: "9px",
                          color: "#504E4A",
                          marginTop: "2px",
                          textTransform: "uppercase",
                          letterSpacing: "0.1em",
                        }}
                      >
                        Series
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Film strip bottom */}
              <div
                style={{
                  display: "flex",
                  height: "18px",
                  borderTop: "1px solid #1A1A1A",
                  flexShrink: 0,
                }}
              >
                {Array.from({ length: 16 }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      borderRight: "1px solid #1A1A1A",
                      background: "#080808",
                      height: "5px",
                      margin: "4px 0",
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Tap zones */}
          <div style={{ position: "absolute", inset: 0, display: "flex" }}>
            <div onClick={prev} style={{ flex: 1, cursor: "pointer" }} />
            <div onClick={next} style={{ flex: 1, cursor: "pointer" }} />
          </div>
        </div>
      </div>
    </>
  );
}

// ── Create Story Modal ─────────────────────────────────────────────────────────
function CreateStoryModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const { user } = useAuth();
  const [type, setType] = useState<"thought" | "dna">("thought");
  const [caption, setCaption] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!caption.trim() && type === "thought") return;
    setSubmitting(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      setSubmitting(false);
      return;
    }

    await fetch("/api/stories", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ type, caption: caption.trim() }),
    });
    setSubmitting(false);
    onCreated();
    onClose();
  }

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 800,
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
          zIndex: 801,
          width: "min(380px, 90vw)",
          background: "#141414",
          border: "1px solid #2A2A2A",
          borderRadius: "16px",
          padding: "24px",
          boxShadow: "0 32px 80px rgba(0,0,0,0.9)",
        }}
      >
        <h3
          style={{
            fontFamily: SERIF,
            fontSize: "20px",
            color: "#F0EDE8",
            fontStyle: "italic",
            marginBottom: "20px",
          }}
        >
          Post a Story
        </h3>

        {/* Type toggle */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
          {(["thought", "dna"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              style={{
                flex: 1,
                padding: "8px",
                borderRadius: "6px",
                cursor: "pointer",
                border:
                  type === t
                    ? "1px solid rgba(200,169,110,0.4)"
                    : "1px solid #2A2A2A",
                background:
                  type === t ? "rgba(200,169,110,0.1)" : "transparent",
                color: type === t ? "#C8A96E" : "#504E4A",
                fontFamily: SANS,
                fontSize: "12px",
              }}
            >
              {t === "thought" ? "💭 Thought" : "🧬 DNA Card"}
            </button>
          ))}
        </div>

        {type === "thought" && (
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="What's on your mind cinematically?"
            maxLength={280}
            style={{
              width: "100%",
              background: "#0D0D0D",
              border: "1px solid #2A2A2A",
              borderRadius: "8px",
              padding: "12px",
              color: "#F0EDE8",
              fontFamily: SERIF,
              fontSize: "14px",
              fontStyle: "italic",
              resize: "none",
              height: "120px",
              outline: "none",
              marginBottom: "4px",
            }}
            onFocus={(e) =>
              (e.target.style.borderColor = "rgba(200,169,110,0.4)")
            }
            onBlur={(e) => (e.target.style.borderColor = "#2A2A2A")}
          />
        )}

        {type === "dna" && (
          <div
            style={{
              padding: "16px",
              background: "#0D0D0D",
              border: "1px solid rgba(200,169,110,0.15)",
              borderRadius: "8px",
              marginBottom: "12px",
              textAlign: "center",
            }}
          >
            <p style={{ fontFamily: SANS, fontSize: "12px", color: "#504E4A" }}>
              Your current Taste DNA card will be shared as a 24h story.
            </p>
          </div>
        )}

        <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: "8px",
              background: "transparent",
              border: "1px solid #2A2A2A",
              color: "#8A8780",
              fontFamily: SANS,
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={submitting || (type === "thought" && !caption.trim())}
            style={{
              flex: 2,
              padding: "10px",
              borderRadius: "8px",
              background: submitting ? "#8A7A5A" : "#C8A96E",
              color: "#0D0D0D",
              fontFamily: SANS,
              fontSize: "13px",
              fontWeight: 600,
              border: "none",
              cursor: submitting ? "not-allowed" : "pointer",
            }}
          >
            {submitting ? "Posting…" : "Share Story"}
          </button>
        </div>
      </div>
    </>
  );
}

// ── Main StoriesBar ────────────────────────────────────────────────────────────
interface StoriesBarProps {
  onRefresh?: () => void;
}

export function StoriesBar({ onRefresh }: StoriesBarProps) {
  const { user } = useAuth();
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeGroup, setActiveGroup] = useState<any>(null);
  const [createOpen, setCreateOpen] = useState(false);

  async function load() {
    setLoading(true);
    const headers: Record<string, string> = {};
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session) headers.Authorization = `Bearer ${session.access_token}`;
    const res = await fetch("/api/stories", { headers });
    const data = await res.json();
    setGroups(data.story_groups || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [user]);

  async function markViewed(storyIds: string[]) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;
    await fetch("/api/stories", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ story_ids: storyIds }),
    });
    // Update local state
    setGroups((prev) =>
      prev.map((g) => ({
        ...g,
        has_unseen: storyIds.some((id: string) =>
          g.stories.some((s: any) => s.id === id),
        )
          ? false
          : g.has_unseen,
      })),
    );
  }

  const displayName =
    user?.user_metadata?.username || user?.email?.split("@")[0] || "me";

  if (!loading && groups.length === 0 && !user) return null;

  return (
    <>
      <div
        style={{
          display: "flex",
          gap: "16px",
          overflowX: "auto",
          padding: "0 0 8px",
          scrollbarWidth: "none",
        }}
      >
        {/* Your story / add */}
        {user && (
          <div
            onClick={() => setCreateOpen(true)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "6px",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <div style={{ position: "relative" }}>
              <Avatar name={displayName} size={56} ring={false} />
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  width: "18px",
                  height: "18px",
                  borderRadius: "50%",
                  background: "#C8A96E",
                  border: "2px solid #0D0D0D",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Plus size={10} color="#0D0D0D" strokeWidth={3} />
              </div>
            </div>
            <p
              style={{
                fontFamily: SANS,
                fontSize: "10px",
                color: "#504E4A",
                textAlign: "center",
                maxWidth: "56px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              Your story
            </p>
          </div>
        )}

        {/* Loading skeletons */}
        {loading &&
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "6px",
                flexShrink: 0,
              }}
            >
              <div
                className="skeleton"
                style={{ width: "56px", height: "56px", borderRadius: "50%" }}
              />
              <div
                className="skeleton"
                style={{ width: "40px", height: "8px", borderRadius: "4px" }}
              />
            </div>
          ))}

        {/* Story groups */}
        {!loading &&
          groups.map((group) => (
            <div
              key={group.user_id}
              onClick={() => setActiveGroup(group)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "6px",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              <Avatar
                name={group.username}
                size={56}
                ring
                unseen={group.has_unseen}
              />
              <p
                style={{
                  fontFamily: SANS,
                  fontSize: "10px",
                  color: group.has_unseen ? "#C8A96E" : "#504E4A",
                  fontWeight: group.has_unseen ? 600 : 400,
                  textAlign: "center",
                  maxWidth: "56px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {group.username}
              </p>
            </div>
          ))}
      </div>

      {/* Story viewer */}
      {activeGroup && (
        <StoryViewer
          group={activeGroup}
          onClose={() => setActiveGroup(null)}
          onViewed={markViewed}
        />
      )}

      {/* Create story modal */}
      {createOpen && (
        <CreateStoryModal
          onClose={() => setCreateOpen(false)}
          onCreated={() => {
            load();
            onRefresh?.();
          }}
        />
      )}
    </>
  );
}
