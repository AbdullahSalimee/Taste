"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Send,
  Smile,
  Paperclip,
  Mic,
  Phone,
  Video,
  MoreVertical,
  Check,
  CheckCheck,
  Reply,
  Trash2,
  X,
  Film,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";

const SANS = "Inter, system-ui, sans-serif";
const MONO = "JetBrains Mono, Courier New, monospace";
const SERIF = "Playfair Display, Georgia, serif";

const REACTIONS = ["❤️", "😂", "😮", "😢", "🔥", "👍"];

// ─── Avatar ──────────────────────────────────────────────────────────────────
function Avatar({
  name,
  size = 36,
  online = false,
}: {
  name: string;
  size?: number;
  online?: boolean;
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
    <div style={{ position: "relative", flexShrink: 0 }}>
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
        }}
      >
        {(name?.[0] || "?").toUpperCase()}
      </div>
      {online && (
        <div
          style={{
            position: "absolute",
            bottom: 1,
            right: 1,
            width: Math.max(8, size * 0.22),
            height: Math.max(8, size * 0.22),
            background: "#25D366",
            borderRadius: "50%",
            border: "2px solid #0D0D0D",
          }}
        />
      )}
    </div>
  );
}

// ─── Time ────────────────────────────────────────────────────────────────────
function timeStr(date: string) {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

// ─── Tick (read receipts) ─────────────────────────────────────────────────────
function Ticks({
  status,
  mine,
}: {
  status: "sending" | "sent" | "delivered" | "read";
  mine: boolean;
}) {
  if (!mine) return null;
  const color = status === "read" ? "#34B7F1" : "rgba(13,13,13,0.45)";
  if (status === "sending") return <Check size={12} color={color} />;
  if (status === "sent") return <Check size={12} color={color} />;
  return <CheckCheck size={12} color={color} />;
}

// ─── Special message cards ────────────────────────────────────────────────────
function MessageContent({ msg, isMine }: { msg: any; isMine: boolean }) {
  const router = useRouter();

  if (msg.content_type === "log_share" && msg.metadata) {
    const m = msg.metadata;
    const mt = m.media_type === "tv" ? "tv" : "movie";
    return (
      <div
        onClick={() => router.push(`/title/${mt}/${m.tmdb_id}`)}
        style={{
          background: isMine ? "rgba(0,0,0,0.15)" : "rgba(200,169,110,0.08)",
          border: `1px solid ${isMine ? "rgba(0,0,0,0.2)" : "rgba(200,169,110,0.2)"}`,
          borderRadius: "10px",
          padding: "10px",
          cursor: "pointer",
        }}
      >
        <p
          style={{
            fontFamily: SANS,
            fontSize: "10px",
            color: isMine ? "rgba(13,13,13,0.7)" : "#C8A96E",
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
                width: 34,
                height: 50,
                objectFit: "cover",
                borderRadius: 3,
                flexShrink: 0,
              }}
            />
          )}
          <div>
            <p
              style={{
                fontFamily: SANS,
                fontSize: "13px",
                color: isMine ? "#0D0D0D" : "#F0EDE8",
                fontWeight: 500,
              }}
            >
              {m.title}
            </p>
            <p
              style={{
                fontFamily: MONO,
                fontSize: "10px",
                color: isMine ? "rgba(13,13,13,0.5)" : "#504E4A",
              }}
            >
              {m.year}
            </p>
            {m.user_rating && (
              <p
                style={{
                  fontFamily: MONO,
                  fontSize: "11px",
                  color: isMine ? "rgba(13,13,13,0.7)" : "#C8A96E",
                }}
              >
                ★ {m.user_rating}/5
              </p>
            )}
            {m.note && (
              <p
                style={{
                  fontFamily: SANS,
                  fontSize: "11px",
                  color: isMine ? "rgba(13,13,13,0.6)" : "#8A8780",
                  fontStyle: "italic",
                  marginTop: 3,
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

  if (msg.content_type === "review_share" && msg.metadata) {
    const m = msg.metadata;
    const mt = m.media_type === "tv" ? "tv" : "movie";
    return (
      <div
        onClick={() => router.push(`/title/${mt}/${m.tmdb_id}`)}
        style={{
          background: isMine ? "rgba(0,0,0,0.15)" : "rgba(92,74,138,0.1)",
          border: `1px solid ${isMine ? "rgba(0,0,0,0.2)" : "rgba(92,74,138,0.25)"}`,
          borderRadius: "10px",
          padding: "10px",
          cursor: "pointer",
        }}
      >
        <p
          style={{
            fontFamily: SANS,
            fontSize: "10px",
            color: isMine ? "rgba(13,13,13,0.7)" : "#9A8AC0",
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
            color: isMine ? "#0D0D0D" : "#F0EDE8",
            fontWeight: 500,
            marginBottom: 4,
          }}
        >
          {m.title}
        </p>
        {m.rating && (
          <p
            style={{
              fontFamily: MONO,
              fontSize: "11px",
              color: isMine ? "rgba(13,13,13,0.7)" : "#C8A96E",
              marginBottom: 4,
            }}
          >
            ★ {m.rating}/5
          </p>
        )}
        <p
          style={{
            fontFamily: SANS,
            fontSize: "12px",
            color: isMine ? "rgba(13,13,13,0.6)" : "#8A8780",
            fontStyle: "italic",
          }}
        >
          "{m.body?.slice(0, 100)}
          {m.body?.length > 100 ? "…" : ""}"
        </p>
      </div>
    );
  }

  if (msg.content_type === "title_rec" && msg.metadata) {
    const m = msg.metadata;
    const mt = m.media_type === "tv" ? "tv" : "movie";
    return (
      <div
        onClick={() => router.push(`/title/${mt}/${m.tmdb_id}`)}
        style={{
          background: isMine ? "rgba(0,0,0,0.15)" : "rgba(74,158,107,0.08)",
          border: `1px solid ${isMine ? "rgba(0,0,0,0.2)" : "rgba(74,158,107,0.2)"}`,
          borderRadius: "10px",
          padding: "10px",
          cursor: "pointer",
        }}
      >
        <p
          style={{
            fontFamily: SANS,
            fontSize: "10px",
            color: isMine ? "rgba(13,13,13,0.7)" : "#4A9E6B",
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
                width: 34,
                height: 50,
                objectFit: "cover",
                borderRadius: 3,
                flexShrink: 0,
              }}
            />
          )}
          <div>
            <p
              style={{
                fontFamily: SANS,
                fontSize: "13px",
                color: isMine ? "#0D0D0D" : "#F0EDE8",
                fontWeight: 500,
              }}
            >
              {m.title}
            </p>
            <p
              style={{
                fontFamily: MONO,
                fontSize: "10px",
                color: isMine ? "rgba(13,13,13,0.5)" : "#504E4A",
              }}
            >
              {m.year} · ★ {m.tmdb_rating_5}/5
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <p
      style={{
        fontFamily: SANS,
        fontSize: "14px",
        color: isMine ? "#0D0D0D" : "#F0EDE8",
        lineHeight: 1.55,
        wordBreak: "break-word",
      }}
    >
      {msg.content}
    </p>
  );
}

// ─── Reaction Picker ──────────────────────────────────────────────────────────
function ReactionPicker({
  onPick,
  onClose,
}: {
  onPick: (emoji: string) => void;
  onClose: () => void;
}) {
  return (
    <>
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, zIndex: 50 }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "calc(100% + 8px)",
          left: "50%",
          transform: "translateX(-50%)",
          background: "#1A1A1A",
          border: "1px solid #2A2A2A",
          borderRadius: "30px",
          padding: "8px 12px",
          display: "flex",
          gap: "8px",
          zIndex: 51,
          boxShadow: "0 8px 30px rgba(0,0,0,0.6)",
          animation: "popIn 0.15s cubic-bezier(0.34,1.56,0.64,1)",
          whiteSpace: "nowrap",
        }}
      >
        {REACTIONS.map((e) => (
          <span
            key={e}
            onClick={() => onPick(e)}
            style={{
              fontSize: "20px",
              cursor: "pointer",
              transition: "transform 0.1s",
              display: "inline-block",
            }}
            onMouseEnter={(el) =>
              (el.currentTarget.style.transform = "scale(1.35)")
            }
            onMouseLeave={(el) =>
              (el.currentTarget.style.transform = "scale(1)")
            }
          >
            {e}
          </span>
        ))}
      </div>
      <style>{`@keyframes popIn{from{opacity:0;transform:translateX(-50%) scale(0.7)}to{opacity:1;transform:translateX(-50%) scale(1)}}`}</style>
    </>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────
function MessageBubble({
  msg,
  isMine,
  otherName,
  onReact,
  onReply,
  onDelete,
  showAvatar,
}: {
  msg: any;
  isMine: boolean;
  otherName: string;
  onReact: (msgId: string, emoji: string) => void;
  onReply: (msg: any) => void;
  onDelete: (msgId: string) => void;
  showAvatar: boolean;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const bubbleRef = useRef<HTMLDivElement>(null);

  const reactions = msg.reactions || {};
  const reactionEntries = Object.entries(reactions) as [string, number][];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: isMine ? "flex-end" : "flex-start",
        gap: "2px",
        marginBottom: "2px",
      }}
    >
      {/* Sender name for group clarity */}
      {!isMine && showAvatar && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            marginBottom: "2px",
            paddingLeft: "2px",
          }}
        >
          <Avatar name={otherName} size={18} />
          <span
            style={{ fontFamily: SANS, fontSize: "11px", color: "#504E4A" }}
          >
            {otherName}
          </span>
        </div>
      )}

      {/* Bubble + action buttons */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          flexDirection: isMine ? "row-reverse" : "row",
        }}
      >
        {/* Quick action: reply */}
        <button
          onClick={() => onReply(msg)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#2A2A2A",
            padding: "4px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: 0,
            transition: "opacity 0.15s",
          }}
          className="msg-action-btn"
        >
          <Reply size={14} />
        </button>

        <div ref={bubbleRef} style={{ position: "relative" }}>
          <div
            onDoubleClick={() => setShowPicker(true)}
            onContextMenu={(e) => {
              e.preventDefault();
              setShowActions(true);
            }}
            style={{
              maxWidth: "280px",
              padding: "9px 13px",
              borderRadius: isMine
                ? "18px 18px 4px 18px"
                : "18px 18px 18px 4px",
              background: isMine ? "#C8A96E" : "#141414",
              border: isMine ? "none" : "1px solid #222",
              cursor: "pointer",
              position: "relative",
              transition: "filter 0.1s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.filter = "brightness(1.06)";
              const btns = e.currentTarget
                .closest("[data-msgrow]")
                ?.querySelectorAll(
                  ".msg-action-btn",
                ) as NodeListOf<HTMLElement>;
              btns?.forEach((b) => (b.style.opacity = "1"));
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.filter = "brightness(1)";
              const btns = e.currentTarget
                .closest("[data-msgrow]")
                ?.querySelectorAll(
                  ".msg-action-btn",
                ) as NodeListOf<HTMLElement>;
              btns?.forEach((b) => (b.style.opacity = "0"));
            }}
          >
            {/* Reply preview — inside the bubble like WhatsApp */}
            {msg.reply_to && (
              <div
                style={{
                  background: isMine
                    ? "rgba(0,0,0,0.18)"
                    : "rgba(255,255,255,0.06)",
                  borderLeft: `3px solid ${isMine ? "rgba(0,0,0,0.5)" : "#C8A96E"}`,
                  borderRadius: "6px",
                  padding: "5px 9px",
                  marginBottom: "7px",
                  overflow: "hidden",
                }}
              >
                <p
                  style={{
                    fontFamily: SANS,
                    fontSize: "11px",
                    fontWeight: 600,
                    color: isMine ? "rgba(0,0,0,0.65)" : "#C8A96E",
                    marginBottom: "2px",
                  }}
                >
                  {msg.reply_to.sender_name || otherName}
                </p>
                <p
                  style={{
                    fontFamily: SANS,
                    fontSize: "11px",
                    color: isMine ? "rgba(0,0,0,0.5)" : "#7A7875",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    maxWidth: "220px",
                  }}
                >
                  {msg.reply_to.content?.slice(0, 60)}
                </p>
              </div>
            )}
            <MessageContent msg={msg} isMine={isMine} />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: "4px",
                marginTop: "4px",
              }}
            >
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: "10px",
                  color: isMine ? "rgba(13,13,13,0.45)" : "#3A3A3A",
                }}
              >
                {timeStr(msg.created_at)}
              </span>
              <Ticks status={msg.status || "read"} mine={isMine} />
            </div>

            {showPicker && (
              <ReactionPicker
                onPick={(e) => {
                  onReact(msg.id, e);
                  setShowPicker(false);
                }}
                onClose={() => setShowPicker(false)}
              />
            )}
          </div>

          {/* Context menu */}
          {showActions && (
            <>
              <div
                onClick={() => setShowActions(false)}
                style={{ position: "fixed", inset: 0, zIndex: 50 }}
              />
              <div
                style={{
                  position: "absolute",
                  [isMine ? "right" : "left"]: 0,
                  bottom: "calc(100% + 6px)",
                  zIndex: 51,
                  background: "#1A1A1A",
                  border: "1px solid #2A2A2A",
                  borderRadius: "12px",
                  overflow: "hidden",
                  minWidth: "140px",
                  boxShadow: "0 8px 30px rgba(0,0,0,0.6)",
                }}
              >
                {[
                  {
                    icon: <Smile size={13} />,
                    label: "React",
                    action: () => {
                      setShowPicker(true);
                      setShowActions(false);
                    },
                  },
                  {
                    icon: <Reply size={13} />,
                    label: "Reply",
                    action: () => {
                      onReply(msg);
                      setShowActions(false);
                    },
                  },
                  ...(isMine
                    ? [
                        {
                          icon: <Trash2 size={13} />,
                          label: "Delete",
                          action: () => {
                            onDelete(msg.id);
                            setShowActions(false);
                          },
                          danger: true,
                        },
                      ]
                    : []),
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={item.action}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      width: "100%",
                      padding: "10px 14px",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: (item as any).danger ? "#E05C5C" : "#C8C4BC",
                      fontFamily: SANS,
                      fontSize: "13px",
                      textAlign: "left",
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#222")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "none")
                    }
                  >
                    {item.icon} {item.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Delete quick btn for mine */}
        {isMine && (
          <button
            onClick={() => onDelete(msg.id)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#2A2A2A",
              padding: "4px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: 0,
              transition: "opacity 0.15s",
            }}
            className="msg-action-btn"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>

      {/* Reactions row */}
      {reactionEntries.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: "4px",
            flexWrap: "wrap",
            justifyContent: isMine ? "flex-end" : "flex-start",
            marginTop: "2px",
          }}
        >
          {reactionEntries.map(([emoji, count]) => (
            <div
              key={emoji}
              onClick={() => onReact(msg.id, emoji)}
              style={{
                background: "#1A1A1A",
                border: "1px solid #2A2A2A",
                borderRadius: "20px",
                padding: "2px 8px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                cursor: "pointer",
                transition: "background 0.1s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#252525")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "#1A1A1A")
              }
            >
              <span style={{ fontSize: "13px" }}>{emoji}</span>
              <span
                style={{ fontFamily: MONO, fontSize: "10px", color: "#504E4A" }}
              >
                {count}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main chat page ───────────────────────────────────────────────────────────
export default function ChatPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { user } = useAuth();
  const router = useRouter();

  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [isTyping, setIsTyping] = useState(false); // other person typing
  const [replyTo, setReplyTo] = useState<any>(null);
  const [online, setOnline] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<any>(null);
  const channelRef = useRef<any>(null);

  // ── Auth helper ──────────────────────────────────────────────────────────
  async function getSession() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session;
  }

  // ── Load messages ────────────────────────────────────────────────────────
  const loadMessages = useCallback(async () => {
    const session = await getSession();
    if (!session) return;
    const res = await fetch(`/api/messages/${conversationId}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    const data = await res.json();
    setMessages(data.messages || []);
    setLoading(false);
  }, [conversationId]);

  // ── Load other user ──────────────────────────────────────────────────────
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

  // ── Realtime subscription ────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    loadMessages();
    loadOtherUser();

    // Realtime: new messages
    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as any;
          if (newMsg.sender_id === user.id) return; // already added optimistically
          setMessages((prev) => [
            ...prev,
            { ...newMsg, is_mine: false, status: "read" },
          ]);
        },
      )
      // Typing presence
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState() as any;
        const others = Object.values(state)
          .flat()
          .filter((p: any) => p.user_id !== user.id);
        setIsTyping(others.some((p: any) => p.typing));
        setOnline(others.length > 0);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ user_id: user.id, typing: false });
        }
      });

    channelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, conversationId]);

  // ── Scroll to bottom ─────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: messages.length < 5 ? "instant" : "smooth",
    } as any);
  }, [messages, isTyping]);

  // ── Send message ─────────────────────────────────────────────────────────
  async function send() {
    if (!text.trim() || sending) return;
    const session = await getSession();
    if (!session) return;

    const tempId = `temp-${Date.now()}`;
    const optimistic: any = {
      id: tempId,
      content: text.trim(),
      content_type: "text",
      created_at: new Date().toISOString(),
      is_mine: true,
      sender_id: user!.id,
      status: "sending",
      reply_to: replyTo || null,
      reactions: {},
    };
    setMessages((prev) => [...prev, optimistic]);
    setText("");
    setReplyTo(null);
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }
    setSending(true);

    // Stop typing indicator
    channelRef.current?.track({ user_id: user!.id, typing: false });

    const res = await fetch(`/api/messages/${conversationId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        content: optimistic.content,
        content_type: "text",
        reply_to_id: replyTo?.id || null,
      }),
    });
    const data = await res.json();

    setMessages((prev) =>
      prev.map((m) =>
        m.id === tempId
          ? { ...data.message, is_mine: true, status: "sent", reactions: {} }
          : m,
      ),
    );

    // Simulate delivered → read for demo
    setTimeout(
      () =>
        setMessages((prev) =>
          prev.map((m) =>
            m.id === data.message?.id ? { ...m, status: "delivered" } : m,
          ),
        ),
      800,
    );
    setTimeout(
      () =>
        setMessages((prev) =>
          prev.map((m) =>
            m.id === data.message?.id ? { ...m, status: "read" } : m,
          ),
        ),
      2000,
    );
    setSending(false);
  }

  // ── Typing broadcast ─────────────────────────────────────────────────────
  function onInput(e: React.FormEvent<HTMLTextAreaElement>) {
    const t = e.currentTarget;
    t.style.height = "auto";
    t.style.height = Math.min(t.scrollHeight, 130) + "px";
    setText(t.value);

    channelRef.current?.track({ user_id: user?.id, typing: true });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      channelRef.current?.track({ user_id: user?.id, typing: false });
    }, 2000);
  }

  // ── React to message ─────────────────────────────────────────────────────
  function handleReact(msgId: string, emoji: string) {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== msgId) return m;
        const reactions = { ...(m.reactions || {}) };
        reactions[emoji] = (reactions[emoji] || 0) + 1;
        return { ...m, reactions };
      }),
    );
    // TODO: persist to DB — POST /api/reactions { message_id, emoji }
  }

  // ── Delete message ───────────────────────────────────────────────────────
  function handleDelete(msgId: string) {
    setMessages((prev) => prev.filter((m) => m.id !== msgId));
    // TODO: DELETE /api/messages/[conversationId]/[msgId]
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
      className="chat-shell"
      style={{
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        background: "#0D0D0D",
      }}
    >
      <style>{`
        .msg-action-btn { opacity: 0; }
        [data-msgrow]:hover .msg-action-btn { opacity: 1; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .msg-in { animation: fadeUp 0.2s ease; }
        @media (min-width: 640px) { .chat-shell { left: 224px !important; } }
      `}</style>

      {/* ── Header ── */}
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid #181818",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          background: "rgba(11,11,11,0.97)",
          backdropFilter: "blur(12px)",
          position: "sticky",
          top: 0,
          zIndex: 20,
        }}
      >
        <button
          onClick={() => router.push("/messages")}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#C8A96E",
            padding: "4px 8px 4px 0",
          }}
        >
          <ArrowLeft size={18} />
        </button>
        {otherUser && <Avatar name={otherName} size={38} online={online} />}
        <div style={{ flex: 1 }}>
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
          <p
            style={{
              fontFamily: SANS,
              fontSize: "11px",
              color: isTyping ? "#C8A96E" : online ? "#25D366" : "#504E4A",
              transition: "color 0.3s",
            }}
          >
            {isTyping
              ? "typing…"
              : online
                ? "online"
                : `@${otherUser?.username || "…"}`}
          </p>
        </div>
        <div style={{ display: "flex", gap: "12px", color: "#504E4A" }}>
          <button
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#504E4A",
              display: "flex",
            }}
            title="Voice call"
          >
            <Phone size={17} />
          </button>
          <button
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#504E4A",
              display: "flex",
            }}
            title="Video call"
          >
            <Video size={17} />
          </button>
        </div>
      </div>

      {/* ── Messages ── */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px 16px 8px",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          background: "#0A0A0A",
        }}
      >
        {loading ? (
          [58, 42, 65, 38, 55, 44].map((w, i) => (
            <div
              key={`skel-${i}`}
              style={{
                display: "flex",
                justifyContent: i % 2 === 0 ? "flex-start" : "flex-end",
              }}
            >
              <div
                className="skeleton"
                style={{ height: "44px", borderRadius: "14px", width: `${w}%` }}
              />
            </div>
          ))
        ) : messages.length === 0 ? (
          <div
            style={{ textAlign: "center", margin: "auto", padding: "40px 0" }}
          >
            <Film
              size={28}
              color="#1E1E1E"
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
            <p
              style={{
                fontFamily: SANS,
                fontSize: "12px",
                color: "#1E1E1E",
                marginTop: "6px",
              }}
            >
              Share logs, reviews, or a recommendation
            </p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMine = msg.is_mine;
            const prevMsg = messages[i - 1];
            const showAvatar = !isMine && (!prevMsg || prevMsg.is_mine);

            // Date divider
            const msgDate = new Date(msg.created_at).toDateString();
            const prevDate = prevMsg
              ? new Date(prevMsg.created_at).toDateString()
              : null;
            const showDate = msgDate !== prevDate;

            return (
              <div key={msg.id} data-msgrow="1">
                {showDate && (
                  <div style={{ textAlign: "center", margin: "12px 0 8px" }}>
                    <span
                      style={{
                        fontFamily: MONO,
                        fontSize: "10px",
                        color: "#3A3A3A",
                        background: "#111",
                        padding: "3px 10px",
                        borderRadius: "20px",
                        border: "1px solid #1E1E1E",
                      }}
                    >
                      {new Date(msg.created_at).toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                )}
                <div className="msg-in">
                  <MessageBubble
                    msg={msg}
                    isMine={isMine}
                    otherName={otherName}
                    showAvatar={showAvatar}
                    onReact={handleReact}
                    onReply={setReplyTo}
                    onDelete={handleDelete}
                  />
                </div>
              </div>
            );
          })
        )}

        {/* Typing indicator */}
        {isTyping && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Avatar name={otherName} size={20} />
            <div
              style={{
                background: "#141414",
                border: "1px solid #222",
                borderRadius: "14px 14px 14px 4px",
                padding: "10px 14px",
                display: "flex",
                gap: "4px",
                alignItems: "center",
              }}
            >
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#504E4A",
                    animation: "typingBounce 1.2s infinite",
                    animationDelay: `${i * 0.18}s`,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
        <style>{`@keyframes typingBounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}`}</style>
      </div>

      {/* ── Reply bar ── */}
      {replyTo && (
        <div
          style={{
            padding: "8px 16px",
            background: "#0E0E0E",
            borderTop: "1px solid #1A1A1A",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <Reply size={14} color="#C8A96E" style={{ flexShrink: 0 }} />
          <div
            style={{
              flex: 1,
              borderLeft: "2px solid #C8A96E",
              paddingLeft: "10px",
            }}
          >
            <p
              style={{
                fontFamily: SANS,
                fontSize: "11px",
                color: "#C8A96E",
                marginBottom: "1px",
              }}
            >
              {replyTo.is_mine ? "You" : otherName}
            </p>
            <p
              style={{
                fontFamily: SANS,
                fontSize: "12px",
                color: "#504E4A",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {replyTo.content?.slice(0, 80)}
            </p>
          </div>
          <button
            onClick={() => setReplyTo(null)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#504E4A",
              display: "flex",
              padding: "4px",
            }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Input area ── */}
      <div
        style={{
          padding: "10px 14px",
          borderTop: "1px solid #181818",
          background: "#0D0D0D",
          display: "flex",
          gap: "8px",
          alignItems: "flex-end",
        }}
      >
        <button
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "#141414",
            border: "1px solid #222",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "#504E4A",
            flexShrink: 0,
          }}
          title="Attach"
        >
          <Paperclip size={15} />
        </button>

        <textarea
          ref={inputRef}
          value={text}
          onInput={onInput}
          onKeyDown={onKeyDown}
          placeholder="Message…"
          rows={1}
          style={{
            flex: 1,
            background: "#141414",
            border: "1px solid #222",
            borderRadius: "20px",
            padding: "9px 16px",
            color: "#F0EDE8",
            fontFamily: SANS,
            fontSize: "14px",
            resize: "none",
            outline: "none",
            maxHeight: "130px",
            lineHeight: 1.45,
            transition: "border-color 0.15s",
          }}
          onFocus={(e) =>
            (e.target.style.borderColor = "rgba(200,169,110,0.4)")
          }
          onBlur={(e) => (e.target.style.borderColor = "#222")}
        />

        {text.trim() ? (
          <button
            onClick={send}
            disabled={sending}
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              background: sending ? "#1A1A1A" : "#C8A96E",
              border: "none",
              cursor: sending ? "default" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              transition: "background 0.15s, transform 0.1s",
            }}
            onMouseEnter={(e) =>
              !sending && (e.currentTarget.style.transform = "scale(1.05)")
            }
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <Send size={15} color={sending ? "#2A2A2A" : "#0D0D0D"} />
          </button>
        ) : (
          <button
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              background: "#141414",
              border: "1px solid #222",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#504E4A",
              flexShrink: 0,
            }}
            title="Voice message"
          >
            <Mic size={15} />
          </button>
        )}
      </div>
    </div>
  );
}
