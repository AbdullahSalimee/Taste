"use client";
import { useState, useEffect } from "react";
import { Search, Send, X, Check, Film, Tv } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

const SANS = "Inter, system-ui, sans-serif";
const SERIF = "Playfair Display, Georgia, serif";
const MONO = "JetBrains Mono, Courier New, monospace";

interface SendToFriendProps {
  mode: "title" | "dna";
  // For title mode
  titleData?: {
    tmdb_id: number;
    media_type: string;
    title: string;
    poster_url: string | null;
    year: number;
    tmdb_rating_5: number;
    overview?: string;
  };
  // For DNA mode
  dnaData?: {
    archetype: string;
    archetype_desc: string;
    top_genres?: any[];
    total_films?: number;
    total_series?: number;
  };
  onClose: () => void;
}

function Avatar({ name, size = 40 }: { name: string; size?: number }) {
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
        fontSize: size * 0.38,
        fontWeight: 600,
        color: "#F0EDE8",
      }}
    >
      {(name?.[0] || "?").toUpperCase()}
    </div>
  );
}

export function SendToFriend({
  mode,
  titleData,
  dnaData,
  onClose,
}: SendToFriendProps) {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [conversations, setConversations] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sent, setSent] = useState<Record<string, boolean>>({});
  const [sending, setSending] = useState<string | null>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (search.trim().length < 2) {
      setUsers([]);
      return;
    }
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, username, display_name")
        .or(`username.ilike.%${search}%,display_name.ilike.%${search}%`)
        .neq("id", user?.id || "")
        .limit(8);
      setUsers(data || []);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  async function loadConversations() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      setLoading(false);
      return;
    }
    const res = await fetch("/api/conversations", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    const data = await res.json();
    setConversations(data.conversations || []);
    setLoading(false);
  }

  async function sendTo(targetUserId: string, displayName: string) {
    if (sending) return;
    setSending(targetUserId);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      setSending(null);
      return;
    }

    // Get or create conversation
    const convRes = await fetch("/api/conversations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ other_user_id: targetUserId }),
    });
    const convData = await convRes.json();
    const convId = convData.conversation_id;

    // Send message
    let body: any = {};
    if (mode === "title" && titleData) {
      body = {
        content: `Check out ${titleData.title}`,
        content_type: "title_rec",
        metadata: {
          tmdb_id: titleData.tmdb_id,
          media_type: titleData.media_type,
          title: titleData.title,
          poster_url: titleData.poster_url,
          year: titleData.year,
          tmdb_rating_5: titleData.tmdb_rating_5,
          overview: titleData.overview,
        },
      };
    } else if (mode === "dna" && dnaData) {
      body = {
        content: `Shared Taste DNA: ${dnaData.archetype}`,
        content_type: "dna_share",
        metadata: {
          archetype: dnaData.archetype,
          archetype_desc: dnaData.archetype_desc,
          top_genres: dnaData.top_genres || [],
          total_films: dnaData.total_films || 0,
          total_series: dnaData.total_series || 0,
        },
      };
    }

    await fetch(`/api/messages/${convId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(body),
    });

    setSent((prev) => ({ ...prev, [targetUserId]: true }));
    setSending(null);
  }

  const allRecipients =
    search.trim().length >= 2
      ? users
      : conversations.map((c) => c.others?.[0]).filter(Boolean);

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
          width: "min(400px, 90vw)",
          background: "#141414",
          border: "1px solid #2A2A2A",
          borderRadius: "16px",
          overflow: "hidden",
          boxShadow: "0 32px 80px rgba(0,0,0,0.9)",
        }}
      >
        {/* Gold top bar */}
        <div
          style={{
            height: "3px",
            background: "linear-gradient(90deg, #C8A96E, #DFC080, #C8A96E)",
          }}
        />

        <div style={{ padding: "20px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "16px",
            }}
          >
            <h3
              style={{
                fontFamily: SERIF,
                fontSize: "18px",
                color: "#F0EDE8",
                fontStyle: "italic",
              }}
            >
              {mode === "title"
                ? `Send "${titleData?.title?.slice(0, 20)}${(titleData?.title?.length || 0) > 20 ? "…" : ""}"`
                : "Share your Taste DNA"}
            </h3>
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#504E4A",
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Preview card */}
          {mode === "title" && titleData && (
            <div
              style={{
                display: "flex",
                gap: "12px",
                padding: "12px",
                background: "#0F0F0F",
                border: "1px solid #1A1A1A",
                borderRadius: "8px",
                marginBottom: "16px",
              }}
            >
              {titleData.poster_url ? (
                <img
                  src={titleData.poster_url}
                  alt={titleData.title}
                  style={{
                    width: "40px",
                    height: "60px",
                    objectFit: "cover",
                    borderRadius: "4px",
                    flexShrink: 0,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "40px",
                    height: "60px",
                    background: "#1A1A1A",
                    borderRadius: "4px",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {titleData.media_type === "tv" ? (
                    <Tv size={14} color="#504E4A" />
                  ) : (
                    <Film size={14} color="#504E4A" />
                  )}
                </div>
              )}
              <div>
                <p
                  style={{
                    fontFamily: SANS,
                    fontSize: "13px",
                    color: "#F0EDE8",
                    fontWeight: 500,
                  }}
                >
                  {titleData.title}
                </p>
                <p
                  style={{
                    fontFamily: MONO,
                    fontSize: "10px",
                    color: "#504E4A",
                    marginTop: "2px",
                  }}
                >
                  {titleData.year} · ★ {titleData.tmdb_rating_5}/5
                </p>
              </div>
            </div>
          )}

          {mode === "dna" && dnaData && (
            <div
              style={{
                padding: "12px",
                background: "linear-gradient(135deg, #141414, #0D0D0D)",
                border: "1px solid rgba(200,169,110,0.2)",
                borderRadius: "8px",
                marginBottom: "16px",
              }}
            >
              <p
                style={{
                  fontFamily: SANS,
                  fontSize: "9px",
                  color: "#504E4A",
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                  marginBottom: "4px",
                }}
              >
                TASTE DNA
              </p>
              <p
                style={{
                  fontFamily: SERIF,
                  fontSize: "16px",
                  color: "#C8A96E",
                  fontStyle: "italic",
                  fontWeight: 700,
                }}
              >
                {dnaData.archetype}
              </p>
              <p
                style={{
                  fontFamily: SANS,
                  fontSize: "11px",
                  color: "#8A8780",
                  fontStyle: "italic",
                  marginTop: "3px",
                }}
              >
                {dnaData.archetype_desc}
              </p>
            </div>
          )}

          {/* Search */}
          <div style={{ position: "relative", marginBottom: "12px" }}>
            <Search
              size={13}
              color="#504E4A"
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
              }}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search friends…"
              autoFocus
              style={{
                width: "100%",
                padding: "9px 12px 9px 32px",
                background: "#0D0D0D",
                border: "1px solid #2A2A2A",
                borderRadius: "8px",
                color: "#F0EDE8",
                fontFamily: SANS,
                fontSize: "13px",
                outline: "none",
              }}
              onFocus={(e) =>
                (e.target.style.borderColor = "rgba(200,169,110,0.3)")
              }
              onBlur={(e) => (e.target.style.borderColor = "#2A2A2A")}
            />
          </div>

          {/* Recipients */}
          <div style={{ maxHeight: "260px", overflowY: "auto" }}>
            {loading && (
              <p
                style={{
                  fontFamily: SANS,
                  fontSize: "12px",
                  color: "#504E4A",
                  textAlign: "center",
                  padding: "16px",
                }}
              >
                Loading…
              </p>
            )}
            {!loading && allRecipients.length === 0 && (
              <p
                style={{
                  fontFamily: SANS,
                  fontSize: "12px",
                  color: "#504E4A",
                  textAlign: "center",
                  padding: "16px",
                }}
              >
                {search.trim().length >= 2
                  ? "No users found"
                  : "Search for someone to send to"}
              </p>
            )}
            {allRecipients.map((person) => {
              const name =
                person?.username || person?.display_name || "Unknown";
              const id = person?.id;
              const wasSent = sent[id];
              const isSending = sending === id;
              return (
                <div
                  key={id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "10px 8px",
                    borderRadius: "8px",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#1A1A1A")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <Avatar name={name} size={38} />
                  <div style={{ flex: 1 }}>
                    <p
                      style={{
                        fontFamily: SANS,
                        fontSize: "13px",
                        color: "#F0EDE8",
                        fontWeight: 500,
                      }}
                    >
                      {name}
                    </p>
                    {person.display_name &&
                      person.username &&
                      person.display_name !== person.username && (
                        <p
                          style={{
                            fontFamily: SANS,
                            fontSize: "11px",
                            color: "#504E4A",
                          }}
                        >
                          {person.display_name}
                        </p>
                      )}
                  </div>
                  <button
                    onClick={() => !wasSent && sendTo(id, name)}
                    disabled={isSending || wasSent}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      padding: "6px 12px",
                      borderRadius: "6px",
                      cursor: wasSent ? "default" : "pointer",
                      border: wasSent
                        ? "1px solid rgba(74,158,107,0.3)"
                        : "1px solid #2A2A2A",
                      background: wasSent
                        ? "rgba(74,158,107,0.1)"
                        : "transparent",
                      color: wasSent ? "#4A9E6B" : "#8A8780",
                      fontFamily: SANS,
                      fontSize: "12px",
                    }}
                  >
                    {wasSent ? (
                      <>
                        <Check size={12} /> Sent
                      </>
                    ) : isSending ? (
                      "…"
                    ) : (
                      <>
                        <Send size={12} /> Send
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
