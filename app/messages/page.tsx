"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MessageCircle, Search, Plus, Users } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";

const SERIF = "Playfair Display, Georgia, serif";
const SANS = "Inter, system-ui, sans-serif";
const MONO = "JetBrains Mono, Courier New, monospace";

function timeAgo(date: string): string {
  if (!date) return "";
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
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

function NewConversationModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (search.trim().length < 2) {
      setUsers([]);
      return;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      const { data } = await supabase
        .from("profiles")
        .select("id, username, display_name")
        .or(`username.ilike.%${search}%,display_name.ilike.%${search}%`)
        .neq("id", user?.id || "")
        .limit(8);
      setUsers(data || []);
      setLoading(false);
    }, 300);
    return () => clearTimeout(t);
  }, [search, user]);

  async function startConversation(otherUserId: string) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ other_user_id: otherUserId }),
    });
    const data = await res.json();
    if (data.conversation_id) {
      onCreated(data.conversation_id);
      onClose();
    }
  }

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 800,
          background: "rgba(0,0,0,0.7)",
          backdropFilter: "blur(4px)",
        }}
      />
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
          zIndex: 801,
          width: "100%",
          maxWidth: "360px",
          margin: "0 16px",
          background: "#141414",
          border: "1px solid #2A2A2A",
          borderRadius: "14px",
          padding: "20px",
          boxShadow: "0 24px 60px rgba(0,0,0,0.8)",
          animation: "slideUp 0.2s ease",
        }}
      >
        <h3
          style={{
            fontFamily: SERIF,
            fontSize: "18px",
            color: "#F0EDE8",
            fontStyle: "italic",
            marginBottom: "16px",
          }}
        >
          New message
        </h3>
        <div style={{ position: "relative", marginBottom: "12px" }}>
          <Search
            size={13}
            color="#504E4A"
            style={{
              position: "absolute",
              left: "10px",
              top: "50%",
              transform: "translateY(-50%)",
            }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by username…"
            autoFocus
            style={{
              width: "100%",
              padding: "9px 10px 9px 30px",
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
        {loading && (
          <p
            style={{
              fontFamily: SANS,
              fontSize: "12px",
              color: "#504E4A",
              textAlign: "center",
              padding: "8px",
            }}
          >
            Searching…
          </p>
        )}
        {users.map((u) => (
          <div
            key={u.id}
            onClick={() => startConversation(u.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px",
              borderRadius: "8px",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#1A1A1A")}
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            <Avatar name={u.username || u.display_name} size={36} />
            <div>
              <p
                style={{
                  fontFamily: SANS,
                  fontSize: "13px",
                  color: "#F0EDE8",
                  fontWeight: 500,
                }}
              >
                {u.username || u.display_name}
              </p>
              {u.username &&
                u.display_name &&
                u.username !== u.display_name && (
                  <p
                    style={{
                      fontFamily: SANS,
                      fontSize: "11px",
                      color: "#504E4A",
                    }}
                  >
                    {u.display_name}
                  </p>
                )}
            </div>
          </div>
        ))}
        {search.trim().length >= 2 && !loading && users.length === 0 && (
          <p
            style={{
              fontFamily: SANS,
              fontSize: "12px",
              color: "#504E4A",
              textAlign: "center",
              padding: "16px",
            }}
          >
            No users found
          </p>
        )}
      </div>
    </>
  );
}

export default function MessagesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newConvOpen, setNewConvOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadConversations();
  }, [user]);

  async function loadConversations() {
    setLoading(true);
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

  if (!authLoading && !user) {
    return (
      <div
        style={{
          maxWidth: "480px",
          margin: "80px auto",
          padding: "0 24px",
          textAlign: "center",
        }}
      >
        <MessageCircle
          size={32}
          color="#2A2A2A"
          style={{ margin: "0 auto 12px", display: "block" }}
        />
        <p
          style={{
            fontFamily: SERIF,
            fontSize: "20px",
            color: "#504E4A",
            fontStyle: "italic",
            marginBottom: "16px",
          }}
        >
          Sign in to message people.
        </p>
        <Link
          href="/auth"
          style={{
            display: "inline-block",
            padding: "10px 24px",
            borderRadius: "8px",
            background: "#C8A96E",
            color: "#0D0D0D",
            fontFamily: SANS,
            fontSize: "13px",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div
      style={{ maxWidth: "680px", margin: "0 auto", padding: "24px 20px 80px" }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "24px",
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: SERIF,
              fontSize: "24px",
              fontWeight: 700,
              color: "#F0EDE8",
              fontStyle: "italic",
            }}
          >
            Messages
          </h1>
          <p
            style={{
              fontFamily: SANS,
              fontSize: "12px",
              color: "#504E4A",
              marginTop: "2px",
            }}
          >
            Share logs, reviews, and recommendations
          </p>
        </div>
        <button
          onClick={() => setNewConvOpen(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "9px 14px",
            borderRadius: "8px",
            background: "#C8A96E",
            color: "#0D0D0D",
            fontFamily: SANS,
            fontSize: "13px",
            fontWeight: 600,
            border: "none",
            cursor: "pointer",
          }}
        >
          <Plus size={14} /> New
        </button>
      </div>

      {/* Conversations */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="skeleton"
              style={{ height: "68px", borderRadius: "10px" }}
            />
          ))}
        </div>
      ) : conversations.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <Users
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
              marginBottom: "6px",
            }}
          >
            No conversations yet.
          </p>
          <p style={{ fontFamily: SANS, fontSize: "12px", color: "#504E4A" }}>
            Start one by clicking New above.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {conversations.map((conv) => {
            const other = conv.others?.[0];
            const name = other?.username || other?.display_name || "Unknown";
            return (
              <div
                key={conv.id}
                onClick={() => router.push(`/messages/${conv.id}`)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px 14px",
                  background: "#0F0F0F",
                  border: "1px solid #1A1A1A",
                  borderRadius: "10px",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.borderColor = "#2A2A2A")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.borderColor = "#1A1A1A")
                }
              >
                <Avatar name={name} size={42} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontFamily: SANS,
                      fontSize: "14px",
                      color: "#F0EDE8",
                      fontWeight: 500,
                    }}
                  >
                    {name}
                  </p>
                  {conv.last_message && (
                    <p
                      style={{
                        fontFamily: SANS,
                        fontSize: "12px",
                        color: "#504E4A",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        marginTop: "2px",
                      }}
                    >
                      {conv.last_message}
                    </p>
                  )}
                </div>
                {conv.last_message_at && (
                  <span
                    style={{
                      fontFamily: MONO,
                      fontSize: "10px",
                      color: "#504E4A",
                      flexShrink: 0,
                    }}
                  >
                    {timeAgo(conv.last_message_at)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {newConvOpen && (
        <NewConversationModal
          onClose={() => setNewConvOpen(false)}
          onCreated={(id) => router.push(`/messages/${id}`)}
        />
      )}
    </div>
  );
}
