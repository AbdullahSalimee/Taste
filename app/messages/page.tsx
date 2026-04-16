"use client";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import {
  getConversations,
  getMessages,
  sendTextMessage,
  shareLog,
  shareReview,
  markMessagesAsRead,
  subscribeToMessages,
  searchUsers,
  getOrCreateConversation,
  type Conversation,
  type Message,
} from "@/lib/messages";
import {
  Send,
  ArrowLeft,
  Search,
  Share2,
  User,
  Film,
  Star,
} from "lucide-react";
import Link from "next/link";

const SERIF = "Playfair Display, Georgia, serif";
const SANS = "Inter, system-ui, sans-serif";
const MONO = "JetBrains Mono, Courier New, monospace";

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString();
}

function MessageBubble({
  message,
  isOwn,
}: {
  message: Message;
  isOwn: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: isOwn ? "flex-end" : "flex-start",
        marginBottom: "12px",
      }}
    >
      <div
        style={{
          maxWidth: "75%",
          background: isOwn ? "#C8A96E" : "#1A1A1A",
          color: isOwn ? "#0D0D0D" : "#F0EDE8",
          padding: "10px 14px",
          borderRadius: "16px",
          fontFamily: SANS,
          fontSize: "14px",
          lineHeight: 1.4,
        }}
      >
        {message.content_type === "text" && <p>{message.content}</p>}

        {message.content_type === "log_share" && message.metadata && (
          <div>
            <div
              style={{
                display: "flex",
                gap: "10px",
                alignItems: "center",
                marginBottom: "8px",
              }}
            >
              <Film size={16} style={{ opacity: 0.7 }} />
              <span style={{ fontWeight: 600, fontSize: "13px" }}>
                Shared a log
              </span>
            </div>
            <div
              style={{
                background: isOwn ? "rgba(0,0,0,0.1)" : "rgba(200,169,110,0.1)",
                padding: "10px",
                borderRadius: "8px",
                fontSize: "12px",
              }}
            >
              <p style={{ fontWeight: 600, marginBottom: "4px" }}>
                {message.metadata.title}
              </p>
              {message.metadata.user_rating && (
                <div
                  style={{ display: "flex", gap: "4px", marginBottom: "4px" }}
                >
                  <Star size={12} fill="#C8A96E" stroke="#C8A96E" />
                  <span>{message.metadata.user_rating}/5</span>
                </div>
              )}
              {message.metadata.note && (
                <p style={{ opacity: 0.8, fontSize: "11px" }}>
                  "{message.metadata.note}"
                </p>
              )}
            </div>
          </div>
        )}

        {message.content_type === "review_share" && message.metadata && (
          <div>
            <div
              style={{
                display: "flex",
                gap: "10px",
                alignItems: "center",
                marginBottom: "8px",
              }}
            >
              <Share2 size={16} style={{ opacity: 0.7 }} />
              <span style={{ fontWeight: 600, fontSize: "13px" }}>
                Shared a review
              </span>
            </div>
            <div
              style={{
                background: isOwn ? "rgba(0,0,0,0.1)" : "rgba(200,169,110,0.1)",
                padding: "10px",
                borderRadius: "8px",
                fontSize: "12px",
              }}
            >
              <p style={{ fontWeight: 600, marginBottom: "4px" }}>
                {message.metadata.title}
              </p>
              <p style={{ opacity: 0.8, fontSize: "11px" }}>
                "{message.metadata.review_body}"
              </p>
            </div>
          </div>
        )}
      </div>
      <span
        style={{
          fontFamily: MONO,
          fontSize: "10px",
          color: "#504E4A",
          marginTop: "4px",
        }}
      >
        {formatTime(message.created_at)}
      </span>
    </div>
  );
}

export default function MessagesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
    } else if (user) {
      loadConversations();
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (activeConvId) {
      loadMessages();
      markMessagesAsRead(activeConvId);

      // Subscribe to new messages
      const unsubscribe = subscribeToMessages(activeConvId, (newMessage) => {
        setMessages((prev) => [...prev, newMessage]);
        markMessagesAsRead(activeConvId);
      });

      return unsubscribe;
    }
  }, [activeConvId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (searchQuery.trim()) {
      searchUsers(searchQuery).then(setSearchResults);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  async function loadConversations() {
    setLoading(true);
    const convs = await getConversations();
    setConversations(convs);
    setLoading(false);
  }

  async function loadMessages() {
    if (!activeConvId) return;
    const msgs = await getMessages(activeConvId);
    setMessages(msgs);
  }

  async function handleSendMessage() {
    if (!messageInput.trim() || !activeConvId) return;

    await sendTextMessage(activeConvId, messageInput);
    setMessageInput("");
  }

  async function handleStartConversation(userId: string) {
    const convId = await getOrCreateConversation(userId);
    if (convId) {
      await loadConversations();
      setActiveConvId(convId);
      setSearchQuery("");
    }
  }

  const activeConv = conversations.find((c) => c.id === activeConvId);

  if (!user) return null;

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        background: "#0D0D0D",
        color: "#F0EDE8",
      }}
    >
      {/* Sidebar - Conversations list */}
      <div
        style={{
          width: "320px",
          borderRight: "1px solid #2A2A2A",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px",
            borderBottom: "1px solid #2A2A2A",
          }}
        >
          <h1
            style={{
              fontFamily: SERIF,
              fontSize: "24px",
              fontWeight: 700,
              fontStyle: "italic",
              marginBottom: "16px",
            }}
          >
            Messages
          </h1>

          {/* Search */}
          <div style={{ position: "relative" }}>
            <Search
              size={16}
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#504E4A",
              }}
            />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px 10px 36px",
                background: "#1A1A1A",
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
        </div>

        {/* Search results */}
        {searchResults.length > 0 && (
          <div
            style={{
              borderBottom: "1px solid #2A2A2A",
              maxHeight: "200px",
              overflowY: "auto",
            }}
          >
            {searchResults.map((u) => (
              <button
                key={u.id}
                onClick={() => handleStartConversation(u.id)}
                style={{
                  width: "100%",
                  padding: "12px 20px",
                  display: "flex",
                  gap: "12px",
                  alignItems: "center",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#F0EDE8",
                  textAlign: "left",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#1A1A1A";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "none";
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    background: "rgba(200,169,110,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <User size={20} style={{ color: "#C8A96E" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <p
                    style={{
                      fontFamily: SANS,
                      fontSize: "14px",
                      fontWeight: 600,
                      marginBottom: "2px",
                    }}
                  >
                    {u.display_name}
                  </p>
                  <p
                    style={{
                      fontFamily: MONO,
                      fontSize: "11px",
                      color: "#504E4A",
                    }}
                  >
                    @{u.username}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Conversations list */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {loading ? (
            <div
              style={{
                padding: "40px 20px",
                textAlign: "center",
                color: "#504E4A",
                fontFamily: SANS,
                fontSize: "13px",
              }}
            >
              Loading...
            </div>
          ) : conversations.length === 0 ? (
            <div
              style={{
                padding: "40px 20px",
                textAlign: "center",
              }}
            >
              <p
                style={{
                  fontFamily: SANS,
                  fontSize: "13px",
                  color: "#504E4A",
                }}
              >
                No conversations yet
              </p>
            </div>
          ) : (
            conversations.map((conv) => {
              const otherUser = conv.participants?.[0];
              return (
                <button
                  key={conv.id}
                  onClick={() => setActiveConvId(conv.id)}
                  style={{
                    width: "100%",
                    padding: "16px 20px",
                    display: "flex",
                    gap: "12px",
                    alignItems: "flex-start",
                    background: activeConvId === conv.id ? "#1A1A1A" : "none",
                    border: "none",
                    borderBottom: "1px solid #1A1A1A",
                    cursor: "pointer",
                    color: "#F0EDE8",
                    textAlign: "left",
                  }}
                  onMouseEnter={(e) => {
                    if (activeConvId !== conv.id) {
                      e.currentTarget.style.background = "#141414";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeConvId !== conv.id) {
                      e.currentTarget.style.background = "none";
                    }
                  }}
                >
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "50%",
                      background: "rgba(200,169,110,0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <User size={24} style={{ color: "#C8A96E" }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontFamily: SANS,
                        fontSize: "14px",
                        fontWeight: 600,
                        marginBottom: "4px",
                      }}
                    >
                      {otherUser?.display_name || "Unknown"}
                    </p>
                    <p
                      style={{
                        fontFamily: SANS,
                        fontSize: "12px",
                        color: "#8A8780",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {conv.last_message || "No messages yet"}
                    </p>
                  </div>
                  {conv.last_message_at && (
                    <span
                      style={{
                        fontFamily: MONO,
                        fontSize: "10px",
                        color: "#504E4A",
                      }}
                    >
                      {formatTime(conv.last_message_at)}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main chat area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {activeConv ? (
          <>
            {/* Chat header */}
            <div
              style={{
                padding: "20px",
                borderBottom: "1px solid #2A2A2A",
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <button
                onClick={() => setActiveConvId(null)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#8A8780",
                  padding: "8px",
                  display: "none", // Show on mobile only
                }}
              >
                <ArrowLeft size={20} />
              </button>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background: "rgba(200,169,110,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <User size={20} style={{ color: "#C8A96E" }} />
              </div>
              <div>
                <p
                  style={{
                    fontFamily: SANS,
                    fontSize: "16px",
                    fontWeight: 600,
                  }}
                >
                  {activeConv.participants?.[0]?.display_name || "Unknown"}
                </p>
                <p
                  style={{
                    fontFamily: MONO,
                    fontSize: "11px",
                    color: "#504E4A",
                  }}
                >
                  @{activeConv.participants?.[0]?.username || "unknown"}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div
              style={{
                flex: 1,
                padding: "20px",
                overflowY: "auto",
              }}
            >
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isOwn={msg.sender_id === user.id}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div
              style={{
                padding: "20px",
                borderTop: "1px solid #2A2A2A",
                display: "flex",
                gap: "12px",
              }}
            >
              <input
                type="text"
                placeholder="Type a message..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  background: "#1A1A1A",
                  border: "1px solid #2A2A2A",
                  borderRadius: "24px",
                  color: "#F0EDE8",
                  fontFamily: SANS,
                  fontSize: "14px",
                  outline: "none",
                }}
                onFocus={(e) =>
                  (e.target.style.borderColor = "rgba(200,169,110,0.3)")
                }
                onBlur={(e) => (e.target.style.borderColor = "#2A2A2A")}
              />
              <button
                onClick={handleSendMessage}
                disabled={!messageInput.trim()}
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  background: messageInput.trim() ? "#C8A96E" : "#2A2A2A",
                  border: "none",
                  cursor: messageInput.trim() ? "pointer" : "not-allowed",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#0D0D0D",
                }}
              >
                <Send size={18} />
              </button>
            </div>
          </>
        ) : (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              color: "#504E4A",
            }}
          >
            <div
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                background: "rgba(200,169,110,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "16px",
              }}
            >
              <Send size={36} style={{ color: "#C8A96E" }} />
            </div>
            <p
              style={{
                fontFamily: SERIF,
                fontSize: "18px",
                fontStyle: "italic",
                marginBottom: "8px",
              }}
            >
              Your Messages
            </p>
            <p
              style={{
                fontFamily: SANS,
                fontSize: "13px",
                maxWidth: "280px",
                textAlign: "center",
              }}
            >
              Send logs, reviews, and recommendations to your friends
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
