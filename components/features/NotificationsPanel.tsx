"use client";
import { useState, useEffect } from "react";
import { Bell, X, Check, CheckCheck } from "lucide-react";
import Link from "next/link";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  subscribeToNotifications,
  type Notification,
} from "@/lib/notifications";
import { useAuth } from "@/lib/auth-context";

const SERIF = "Playfair Display, Georgia, serif";
const SANS = "Inter, system-ui, sans-serif";
const MONO = "JetBrains Mono, Courier New, monospace";

function NotificationIcon({ type }: { type: string }) {
  const iconStyle = { width: 18, height: 18 };

  switch (type) {
    case "twin_matched":
      return <span style={{ fontSize: "18px" }}>🎬</span>;
    case "message":
      return (
        <svg {...iconStyle} fill="none" stroke="#C8A96E" strokeWidth={2}>
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </svg>
      );
    case "review_like":
    case "log_like":
      return (
        <svg {...iconStyle} fill="none" stroke="#C8A96E" strokeWidth={2}>
          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
        </svg>
      );
    case "tag_mention":
      return (
        <svg {...iconStyle} fill="none" stroke="#C8A96E" strokeWidth={2}>
          <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
        </svg>
      );
    default:
      return <Bell size={18} />;
  }
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

export default function NotificationsPanel() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Load notifications when panel opens
  useEffect(() => {
    if (!user) return;

    getUnreadCount().then(setUnreadCount);

    if (isOpen) {
      loadNotifications();
    }

    // Subscribe to real-time updates
    const unsubscribe = subscribeToNotifications((newNotif) => {
      setNotifications((prev) => [newNotif, ...prev]);
      setUnreadCount((c) => c + 1);
    });

    return unsubscribe;
  }, [user, isOpen]);

  async function loadNotifications() {
    setLoading(true);
    const notifs = await getNotifications();
    setNotifications(notifs);
    setLoading(false);
  }

  async function handleMarkAsRead(id: string) {
    await markAsRead([id]);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  }

  async function handleMarkAllAsRead() {
    await markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }

  if (!user) return null;

  return (
    <div style={{ position: "relative" }}>
      {/* Bell icon button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: "relative",
          background: "transparent",
          border: "1px solid #2A2A2A",
          borderRadius: "8px",
          padding: "8px",
          cursor: "pointer",
          color: "#8A8780",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "#3A3A3A";
          e.currentTarget.style.color = "#C8A96E";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "#2A2A2A";
          e.currentTarget.style.color = "#8A8780";
        }}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-4px",
              right: "-4px",
              background: "#C8A96E",
              color: "#0D0D0D",
              fontSize: "10px",
              fontFamily: MONO,
              fontWeight: 600,
              padding: "2px 5px",
              borderRadius: "10px",
              minWidth: "18px",
              textAlign: "center",
            }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 100,
            }}
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              right: 0,
              width: "360px",
              maxHeight: "480px",
              background: "#141414",
              border: "1px solid #2A2A2A",
              borderRadius: "12px",
              overflow: "hidden",
              zIndex: 101,
              boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "16px",
                borderBottom: "1px solid #2A2A2A",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <h3
                style={{
                  fontFamily: SERIF,
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "#F0EDE8",
                  fontStyle: "italic",
                }}
              >
                Notifications
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#C8A96E",
                    fontFamily: SANS,
                    fontSize: "11px",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "4px 8px",
                  }}
                >
                  <CheckCheck size={14} />
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div
              style={{
                maxHeight: "420px",
                overflowY: "auto",
              }}
            >
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
              ) : notifications.length === 0 ? (
                <div
                  style={{
                    padding: "40px 20px",
                    textAlign: "center",
                  }}
                >
                  <Bell
                    size={32}
                    style={{ color: "#2A2A2A", marginBottom: "12px" }}
                  />
                  <p
                    style={{
                      fontFamily: SANS,
                      fontSize: "13px",
                      color: "#504E4A",
                    }}
                  >
                    No notifications yet
                  </p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    style={{
                      padding: "14px 16px",
                      borderBottom: "1px solid #1A1A1A",
                      background: notif.read
                        ? "transparent"
                        : "rgba(200,169,110,0.05)",
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      if (!notif.read) handleMarkAsRead(notif.id);
                      if (notif.action_url) {
                        window.location.href = notif.action_url;
                      }
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = notif.read
                        ? "rgba(200,169,110,0.03)"
                        : "rgba(200,169,110,0.08)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = notif.read
                        ? "transparent"
                        : "rgba(200,169,110,0.05)";
                    }}
                  >
                    <div style={{ display: "flex", gap: "12px" }}>
                      {/* Icon */}
                      <div
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "50%",
                          background: "rgba(200,169,110,0.1)",
                          border: "1px solid rgba(200,169,110,0.2)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <NotificationIcon type={notif.type} />
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          style={{
                            fontFamily: SANS,
                            fontSize: "13px",
                            fontWeight: 600,
                            color: "#F0EDE8",
                            marginBottom: "2px",
                          }}
                        >
                          {notif.title}
                        </p>
                        <p
                          style={{
                            fontFamily: SANS,
                            fontSize: "12px",
                            color: "#8A8780",
                            lineHeight: 1.4,
                            marginBottom: "4px",
                          }}
                        >
                          {notif.body}
                        </p>
                        <p
                          style={{
                            fontFamily: MONO,
                            fontSize: "10px",
                            color: "#504E4A",
                          }}
                        >
                          {formatTime(notif.created_at)}
                        </p>
                      </div>

                      {/* Read indicator */}
                      {!notif.read && (
                        <div
                          style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            background: "#C8A96E",
                            flexShrink: 0,
                            marginTop: "4px",
                          }}
                        />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
