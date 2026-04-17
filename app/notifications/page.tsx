"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Bell,
  Check,
  Users,
  MessageCircle,
  Heart,
  Star,
  AtSign,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";

const SERIF = "Playfair Display, Georgia, serif";
const SANS = "Inter, system-ui, sans-serif";
const MONO = "JetBrains Mono, Courier New, monospace";

const TYPE_ICON: Record<string, any> = {
  twin_matched: Users,
  message: MessageCircle,
  review_like: Heart,
  review_reply: MessageCircle,
  log_like: Heart,
  tag_mention: AtSign,
};

const TYPE_COLOR: Record<string, string> = {
  twin_matched: "#C8A96E",
  message: "#4A9E6B",
  review_like: "#C87C2A",
  review_reply: "#5C4A8A",
  log_like: "#C87C2A",
  tag_mention: "#2A5C8A",
};

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    loadNotifications();
  }, [user]);

  async function getSession() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session;
  }

  async function loadNotifications() {
    setLoading(true);
    const session = await getSession();
    if (!session) {
      setLoading(false);
      return;
    }
    const res = await fetch("/api/notifications", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    const data = await res.json();
    setNotifications(data.notifications || []);
    setUnreadCount(data.unread_count || 0);
    setLoading(false);
  }

  async function markAllRead() {
    const session = await getSession();
    if (!session) return;
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ mark_all: true }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }

  async function markRead(id: string) {
    const session = await getSession();
    if (!session) return;
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ notification_id: id }),
    });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }

  function handleClick(notif: any) {
    if (!notif.read) markRead(notif.id);
    if (notif.action_url) router.push(notif.action_url);
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
        <Bell
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
          Sign in to see notifications.
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
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "2px",
            }}
          >
            <Bell size={18} color="#C8A96E" />
            <h1
              style={{
                fontFamily: SERIF,
                fontSize: "24px",
                fontWeight: 700,
                color: "#F0EDE8",
                fontStyle: "italic",
              }}
            >
              Notifications
            </h1>
            {unreadCount > 0 && (
              <span
                style={{
                  background: "#C8A96E",
                  color: "#0D0D0D",
                  borderRadius: "10px",
                  padding: "1px 7px",
                  fontFamily: MONO,
                  fontSize: "11px",
                  fontWeight: 700,
                }}
              >
                {unreadCount}
              </span>
            )}
          </div>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
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
            <Check size={12} /> Mark all read
          </button>
        )}
      </div>

      {/* Notifications */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="skeleton"
              style={{ height: "72px", borderRadius: "10px" }}
            />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <Bell
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
            }}
          >
            All caught up.
          </p>
          <p
            style={{
              fontFamily: SANS,
              fontSize: "12px",
              color: "#504E4A",
              marginTop: "6px",
            }}
          >
            Notifications will appear here when someone interacts with your
            activity.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {notifications.map((notif) => {
            const Icon = TYPE_ICON[notif.type] || Bell;
            const color = TYPE_COLOR[notif.type] || "#C8A96E";
            return (
              <div
                key={notif.id}
                onClick={() => handleClick(notif)}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                  padding: "14px 16px",
                  borderRadius: "10px",
                  cursor: notif.action_url ? "pointer" : "default",
                  background: notif.read ? "#0F0F0F" : "rgba(200,169,110,0.05)",
                  border: notif.read
                    ? "1px solid #1A1A1A"
                    : "1px solid rgba(200,169,110,0.15)",
                }}
                onMouseEnter={(e) => {
                  if (notif.action_url)
                    (e.currentTarget as HTMLElement).style.borderColor =
                      "#2A2A2A";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor =
                    notif.read ? "#1A1A1A" : "rgba(200,169,110,0.15)";
                }}
              >
                {/* Icon */}
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: `${color}18`,
                    border: `1px solid ${color}33`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon size={16} color={color} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontFamily: SANS,
                      fontSize: "13px",
                      color: "#F0EDE8",
                      fontWeight: notif.read ? 400 : 600,
                      lineHeight: 1.3,
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
                      lineHeight: 1.5,
                    }}
                  >
                    {notif.body}
                  </p>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    gap: "6px",
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      fontFamily: MONO,
                      fontSize: "10px",
                      color: "#504E4A",
                    }}
                  >
                    {timeAgo(notif.created_at)}
                  </span>
                  {!notif.read && (
                    <div
                      style={{
                        width: "7px",
                        height: "7px",
                        borderRadius: "50%",
                        background: "#C8A96E",
                      }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
