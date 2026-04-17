"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Send, Film, Tv, Star, MessageCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";

const SERIF = "Playfair Display, Georgia, serif";
const SANS = "Inter, system-ui, sans-serif";
const MONO = "JetBrains Mono, Courier New, monospace";

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
        fontSize: size * 0.38,
        fontWeight: 600,
        color: "#F0EDE8",
      }}
    >
      {(name?.[0] || "?").toUpperCase()}
    </div>
  );
}

function timeStr(date: string): string {
  const d = new Date(date);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

// Render different message content types
function MessageContent({ msg }: { msg: any }) {
  const router = useRouter();

  // Shared log
  if (msg.content_type === "log_share" && msg.metadata) {
    const m = msg.metadata;
    const mt = m.media_type === "tv" ? "tv" : "movie";
    return (
      <div
        onClick={() => router.push(`/title/${mt}/${m.tmdb_id}`)}
        style={{
          background: "rgba(200,169,110,0.08)",
          border: "1px solid rgba(200,169,110,0.2)",
          borderRadius: "8px",
          padding: "10px",
          cursor: "pointer",
          marginBottom: "4px",
        }}
      >
        <p
          style={{
            fontFamily: SANS,
            fontSize: "10px",
            color: "#C8A96E",
            marginBottom: "6px",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          📽 Shared a log
        </p>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {m.poster_url && (
            <img
              src={m.poster_url}
              alt={m.title}
              style={{
                width: "36px",
                height: "54px",
                objectFit: "cover",
                borderRadius: "3px",
                flexShrink: 0,
              }}
            />
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
              {m.title}
            </p>
            <p style={{ fontFamily: MONO, fontSize: "10px", color: "#504E4A" }}>
              {m.year}
            </p>
            {m.user_rating && (
              <p
                style={{ fontFamily: MONO, fontSize: "11px", color: "#C8A96E" }}
              >
                ★ {m.user_rating}/5
              </p>
            )}
            {m.note && (
              <p
                style={{
                  fontFamily: SANS,
                  fontSize: "11px",
                  color: "#8A8780",
                  fontStyle: "italic",
                  marginTop: "4px",
                }}
              >
                "{m.note}"
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Shared review
  if (msg.content_type === "review_share" && msg.metadata) {
    const m = msg.metadata;
    const mt = m.media_type === "tv" ? "tv" : "movie";
    return (
      <div
        onClick={() => router.push(`/title/${mt}/${m.tmdb_id}`)}
        style={{
          background: "rgba(92,74,138,0.08)",
          border: "1px solid rgba(92,74,138,0.2)",
          borderRadius: "8px",
          padding: "10px",
          cursor: "pointer",
          marginBottom: "4px",
        }}
      >
        <p
          style={{
            fontFamily: SANS,
            fontSize: "10px",
            color: "#9A8AC0",
            marginBottom: "6px",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          ✍ Shared a review
        </p>
        <p
          style={{
            fontFamily: SANS,
            fontSize: "13px",
            color: "#F0EDE8",
            fontWeight: 500,
            marginBottom: "4px",
          }}
        >
          {m.title}
        </p>
        {m.rating && (
          <p
            style={{
              fontFamily: MONO,
              fontSize: "11px",
              color: "#C8A96E",
              marginBottom: "4px",
            }}
          >
            ★ {m.rating}/5
          </p>
        )}
        <p
          style={{
            fontFamily: SANS,
            fontSize: "12px",
            color: "#8A8780",
            fontStyle: "italic",
          }}
        >
          "{m.body}"
        </p>
      </div>
    );
  }

  // Title recommendation
  if (msg.content_type === "title_rec" && msg.metadata) {
    const m = msg.metadata;
    const mt = m.media_type === "tv" ? "tv" : "movie";
    return (
      <div
        onClick={() => router.push(`/title/${mt}/${m.tmdb_id}`)}
        style={{
          background: "rgba(74,158,107,0.08)",
          border: "1px solid rgba(74,158,107,0.2)",
          borderRadius: "8px",
          padding: "10px",
          cursor: "pointer",
          marginBottom: "4px",
        }}
      >
        <p
          style={{
            fontFamily: SANS,
            fontSize: "10px",
            color: "#4A9E6B",
            marginBottom: "6px",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          🎬 Recommended
        </p>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {m.poster_url && (
            <img
              src={m.poster_url}
              alt={m.title}
              style={{
                width: "36px",
                height: "54px",
                objectFit: "cover",
                borderRadius: "3px",
                flexShrink: 0,
              }}
            />
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
              {m.title}
            </p>
            <p style={{ fontFamily: MONO, fontSize: "10px", color: "#504E4A" }}>
              {m.year} · ★ {m.tmdb_rating_5}/5
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Plain text
  return (
    <p
      style={{
        fontFamily: SANS,
        fontSize: "14px",
        color: "#F0EDE8",
        lineHeight: 1.55,
      }}
    >
      {msg.content}
    </p>
  );
}

export default function ChatPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [otherUser, setOtherUser] = useState<any>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    loadMessages();
    loadOtherUser();

    // Poll for new messages every 5s
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [user, conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function getSession() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session;
  }

  async function loadMessages() {
    const session = await getSession();
    if (!session) return;
    const res = await fetch(`/api/messages/${conversationId}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    const data = await res.json();
    setMessages(data.messages || []);
    setLoading(false);
  }

  async function loadOtherUser() {
    const session = await getSession();
    if (!session) return;
    const res = await fetch("/api/conversations", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    const data = await res.json();
    const conv = (data.conversations || []).find(
      (c: any) => c.id === conversationId,
    );
    if (conv?.others?.[0]) setOtherUser(conv.others[0]);
  }

  async function send() {
    if (!text.trim() || sending) return;
    const session = await getSession();
    if (!session) return;
    setSending(true);
    const res = await fetch(`/api/messages/${conversationId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ content: text.trim(), content_type: "text" }),
    });
    const data = await res.json();
    if (data.ok) {
      setMessages((prev) => [...prev, data.message]);
      setText("");
    }
    setSending(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  const otherName = otherUser?.username || otherUser?.display_name || "Chat";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        maxWidth: "680px",
        margin: "0 auto",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid #1A1A1A",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          background: "rgba(13,13,13,0.95)",
          backdropFilter: "blur(10px)",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <button
          onClick={() => router.push("/messages")}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#504E4A",
            padding: "4px",
          }}
        >
          <ArrowLeft size={18} />
        </button>
        {otherUser && <Avatar name={otherName} size={36} />}
        <div>
          <p
            style={{
              fontFamily: SANS,
              fontSize: "14px",
              color: "#F0EDE8",
              fontWeight: 600,
            }}
          >
            {otherName}
          </p>
          <p style={{ fontFamily: SANS, fontSize: "11px", color: "#504E4A" }}>
            @{otherUser?.username || "…"}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px 20px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="skeleton"
              style={{
                height: "44px",
                borderRadius: "10px",
                width: i % 2 === 0 ? "60%" : "45%",
                alignSelf: i % 2 === 0 ? "flex-start" : "flex-end",
              }}
            />
          ))
        ) : messages.length === 0 ? (
          <div
            style={{ textAlign: "center", margin: "auto", padding: "40px 0" }}
          >
            <MessageCircle
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
              Start the conversation.
            </p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMine = msg.is_mine;
            const showAvatar = !isMine && (i === 0 || messages[i - 1]?.is_mine);
            return (
              <div
                key={msg.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: isMine ? "flex-end" : "flex-start",
                  gap: "2px",
                }}
              >
                {showAvatar && !isMine && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      marginBottom: "2px",
                    }}
                  >
                    <Avatar name={otherName} size={20} />
                    <span
                      style={{
                        fontFamily: SANS,
                        fontSize: "11px",
                        color: "#504E4A",
                      }}
                    >
                      {otherName}
                    </span>
                  </div>
                )}
                <div
                  style={{
                    maxWidth: "75%",
                    padding: "10px 14px",
                    borderRadius: isMine
                      ? "14px 14px 4px 14px"
                      : "14px 14px 14px 4px",
                    background: isMine ? "#C8A96E" : "#141414",
                    border: isMine ? "none" : "1px solid #2A2A2A",
                  }}
                >
                  {/* Override text color for mine */}
                  <div style={{ color: isMine ? "#0D0D0D" : "inherit" }}>
                    <MessageContent msg={msg} />
                  </div>
                </div>
                <span
                  style={{
                    fontFamily: MONO,
                    fontSize: "9px",
                    color: "#504E4A",
                  }}
                >
                  {timeStr(msg.created_at)}
                </span>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        style={{
          padding: "12px 16px",
          borderTop: "1px solid #1A1A1A",
          background: "#0D0D0D",
          display: "flex",
          gap: "8px",
          alignItems: "flex-end",
        }}
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Message…"
          rows={1}
          style={{
            flex: 1,
            background: "#141414",
            border: "1px solid #2A2A2A",
            borderRadius: "10px",
            padding: "10px 14px",
            color: "#F0EDE8",
            fontFamily: SANS,
            fontSize: "14px",
            resize: "none",
            outline: "none",
            maxHeight: "120px",
            lineHeight: 1.4,
          }}
          onFocus={(e) =>
            (e.target.style.borderColor = "rgba(200,169,110,0.3)")
          }
          onBlur={(e) => (e.target.style.borderColor = "#2A2A2A")}
          onInput={(e) => {
            const t = e.target as HTMLTextAreaElement;
            t.style.height = "auto";
            t.style.height = Math.min(t.scrollHeight, 120) + "px";
          }}
        />
        <button
          onClick={send}
          disabled={!text.trim() || sending}
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "10px",
            background: text.trim() ? "#C8A96E" : "#1A1A1A",
            border: "none",
            cursor: text.trim() ? "pointer" : "default",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            transition: "background 0.15s ease",
          }}
        >
          <Send size={15} color={text.trim() ? "#0D0D0D" : "#2A2A2A"} />
        </button>
      </div>
    </div>
  );
}
