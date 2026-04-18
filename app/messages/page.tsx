"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MessageCircle, Search, Plus, Users, X, Check } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { FollowButton } from "@/components/features/FollowButton";

const SANS = "Inter, system-ui, sans-serif";
const MONO = "JetBrains Mono, Courier New, monospace";
const SERIF = "Playfair Display, Georgia, serif";

function timeAgo(date: string): string {
  if (!date) return "";
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function Avatar({
  name,
  size = 40,
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
            width: size * 0.25,
            height: size * 0.25,
            background: "#25D366",
            borderRadius: "50%",
            border: "2px solid #0D0D0D",
          }}
        />
      )}
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
          background: "rgba(0,0,0,0.75)",
          backdropFilter: "blur(6px)",
        }}
      />
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
          zIndex: 801,
          width: "calc(100% - 32px)",
          maxWidth: "380px",
          background: "#111",
          border: "1px solid #222",
          borderRadius: "20px",
          overflow: "hidden",
          boxShadow: "0 32px 80px rgba(0,0,0,0.9)",
          animation: "modalIn 0.2s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        <style>{`@keyframes modalIn{from{opacity:0;transform:translate(-50%,-48%) scale(0.95)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}`}</style>
        <div
          style={{
            padding: "20px 20px 16px",
            borderBottom: "1px solid #1A1A1A",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
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
            New message
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "#1A1A1A",
              border: "none",
              borderRadius: "50%",
              width: 28,
              height: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#504E4A",
            }}
          >
            <X size={14} />
          </button>
        </div>
        <div style={{ padding: "12px 20px 0" }}>
          <div style={{ position: "relative" }}>
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
              placeholder="Search username or name…"
              autoFocus
              style={{
                width: "100%",
                padding: "10px 12px 10px 34px",
                background: "#0D0D0D",
                border: "1px solid #2A2A2A",
                borderRadius: "12px",
                color: "#F0EDE8",
                fontFamily: SANS,
                fontSize: "13px",
                outline: "none",
              }}
            />
          </div>
        </div>
        <div
          style={{
            padding: "8px 12px 12px",
            minHeight: 60,
            maxHeight: 320,
            overflowY: "auto",
          }}
        >
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
              Searching…
            </p>
          )}
          {users.map((u) => (
            <div
              key={u.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 8px",
                borderRadius: "12px",
                cursor: "pointer",
                transition: "background 0.1s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#1A1A1A")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <div
                onClick={() => startConversation(u.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  flex: 1,
                }}
              >
                <Avatar name={u.username || u.display_name} size={40} />
                <div>
                  <p
                    style={{
                      fontFamily: SANS,
                      fontSize: "14px",
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
                          fontSize: "12px",
                          color: "#504E4A",
                        }}
                      >
                        {u.display_name}
                      </p>
                    )}
                </div>
              </div>
              {/* Follow button next to each user */}
              <FollowButton targetUserId={u.id} size="sm" />
            </div>
          ))}
          {search.trim().length >= 2 && !loading && users.length === 0 && (
            <p
              style={{
                fontFamily: SANS,
                fontSize: "13px",
                color: "#504E4A",
                textAlign: "center",
                padding: "20px",
              }}
            >
              No users found
            </p>
          )}
        </div>
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
  const [search, setSearch] = useState("");

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
            borderRadius: "10px",
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

  const filtered = conversations.filter((c) => {
    const name = c.others?.[0]?.username || c.others?.[0]?.display_name || "";
    return name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div
      style={{ maxWidth: "680px", margin: "0 auto", padding: "24px 20px 80px" }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "20px",
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: SERIF,
              fontSize: "26px",
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
            Share logs, reviews & recommendations
          </p>
        </div>
        <button
          onClick={() => setNewConvOpen(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "9px 16px",
            borderRadius: "10px",
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

      {conversations.length > 2 && (
        <div style={{ position: "relative", marginBottom: "16px" }}>
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
            placeholder="Search conversations…"
            style={{
              width: "100%",
              padding: "10px 12px 10px 34px",
              background: "#111",
              border: "1px solid #1A1A1A",
              borderRadius: "12px",
              color: "#F0EDE8",
              fontFamily: SANS,
              fontSize: "13px",
              outline: "none",
            }}
          />
        </div>
      )}

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="skeleton"
              style={{ height: "72px", borderRadius: "14px" }}
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
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
            {search ? "No results found." : "No conversations yet."}
          </p>
          {!search && (
            <p style={{ fontFamily: SANS, fontSize: "12px", color: "#504E4A" }}>
              Start one by clicking New above.
            </p>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {filtered.map((conv) => {
            const other = conv.others?.[0];
            const name = other?.username || other?.display_name || "Unknown";
            const unread = conv.unread_count || 0;
            return (
              <div
                key={conv.id}
                onClick={() => router.push(`/messages/${conv.id}`)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  padding: "12px 14px",
                  background: "#0F0F0F",
                  border: "1px solid #181818",
                  borderRadius: "14px",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#131313";
                  e.currentTarget.style.borderColor = "#252525";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#0F0F0F";
                  e.currentTarget.style.borderColor = "#181818";
                }}
              >
                <Avatar name={name} size={46} online={Math.random() > 0.6} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "3px",
                    }}
                  >
                    <p
                      style={{
                        fontFamily: SANS,
                        fontSize: "14px",
                        color: "#F0EDE8",
                        fontWeight: unread ? 600 : 500,
                      }}
                    >
                      {name}
                    </p>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    {conv.last_message && (
                      <p
                        style={{
                          fontFamily: SANS,
                          fontSize: "12px",
                          color: unread ? "#8A8780" : "#3A3A3A",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          flex: 1,
                        }}
                      >
                        {conv.last_message}
                      </p>
                    )}
                    {unread > 0 && (
                      <div
                        style={{
                          background: "#C8A96E",
                          color: "#0D0D0D",
                          borderRadius: "50%",
                          minWidth: "18px",
                          height: "18px",
                          fontFamily: MONO,
                          fontSize: "10px",
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          marginLeft: "8px",
                          flexShrink: 0,
                        }}
                      >
                        {unread}
                      </div>
                    )}
                  </div>
                  <span
                    style={{
                      fontFamily: MONO,
                      fontSize: "10px",
                      color: unread ? "#C8A96E" : "#504E4A",
                      height: "18px",
                    }}
                  >
                    {timeAgo(conv.last_message_at)}
                  </span>

                  {/* ✅ Follow Button Added Here - Only change made */}
                </div>
                {other?.id && (
                  <FollowButton targetUserId={other.id} size="sm" />
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
