"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Users, RefreshCw, MessageCircle, Film } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";

const SERIF = "Playfair Display, Georgia, serif";
const SANS = "Inter, system-ui, sans-serif";
const MONO = "JetBrains Mono, Courier New, monospace";

function Avatar({ name, size = 48 }: { name: string; size?: number }) {
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
        border: "2px solid rgba(200,169,110,0.2)",
      }}
    >
      {(name?.[0] || "?").toUpperCase()}
    </div>
  );
}

function MatchBar({ pct }: { pct: number }) {
  const color = pct >= 50 ? "#C8A96E" : pct >= 30 ? "#4A9E6B" : "#2A5C8A";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <div
        style={{
          flex: 1,
          height: "4px",
          background: "#1A1A1A",
          borderRadius: "2px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: color,
            borderRadius: "2px",
            transition: "width 0.8s ease",
          }}
        />
      </div>
      <span
        style={{ fontFamily: MONO, fontSize: "11px", color, flexShrink: 0 }}
      >
        {pct}%
      </span>
    </div>
  );
}

export default function TwinsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [twins, setTwins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [runMsg, setRunMsg] = useState("");

  useEffect(() => {
    if (!user) return;
    loadTwins();
  }, [user]);

  async function getSession() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session;
  }

  async function loadTwins() {
    setLoading(true);
    const session = await getSession();
    if (!session) {
      setLoading(false);
      return;
    }
    const res = await fetch("/api/twins", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    const data = await res.json();
    setTwins(data.twins || []);
    setLoading(false);
  }

  async function runMatch() {
    setRunning(true);
    setRunMsg("");
    const session = await getSession();
    if (!session) {
      setRunning(false);
      return;
    }
    const res = await fetch("/api/twins", {
      method: "POST",
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    const data = await res.json();
    setRunMsg(data.message || "Done!");
    await loadTwins();
    setRunning(false);
  }

  async function openDM(twinUserId: string) {
    const session = await getSession();
    if (!session) return;
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ other_user_id: twinUserId }),
    });
    const data = await res.json();
    if (data.conversation_id) router.push(`/messages/${data.conversation_id}`);
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
        <Users
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
          Sign in to find your Taste Twins.
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
      <div style={{ marginBottom: "28px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "4px",
          }}
        >
          <Users size={20} color="#C8A96E" />
          <h1
            style={{
              fontFamily: SERIF,
              fontSize: "26px",
              fontWeight: 700,
              color: "#F0EDE8",
              fontStyle: "italic",
            }}
          >
            Taste Twins
          </h1>
        </div>
        <p style={{ fontFamily: SANS, fontSize: "13px", color: "#504E4A" }}>
          People whose watch history overlaps the most with yours. Minimum 5
          films in common.
        </p>
      </div>

      {/* Run matching */}
      <div
        style={{
          background: "#141414",
          border: "1px solid #2A2A2A",
          borderRadius: "12px",
          padding: "16px",
          marginBottom: "24px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <div style={{ flex: 1 }}>
          <p
            style={{
              fontFamily: SANS,
              fontSize: "13px",
              color: "#F0EDE8",
              fontWeight: 500,
              marginBottom: "2px",
            }}
          >
            Find your twins
          </p>
          <p style={{ fontFamily: SANS, fontSize: "11px", color: "#504E4A" }}>
            {runMsg || "Compares your watch history against all other users."}
          </p>
        </div>
        <button
          onClick={runMatch}
          disabled={running}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "9px 16px",
            borderRadius: "8px",
            background: running ? "rgba(200,169,110,0.1)" : "#C8A96E",
            color: running ? "#C8A96E" : "#0D0D0D",
            border: running ? "1px solid rgba(200,169,110,0.3)" : "none",
            fontFamily: SANS,
            fontSize: "13px",
            fontWeight: 600,
            cursor: running ? "not-allowed" : "pointer",
            flexShrink: 0,
          }}
        >
          <RefreshCw
            size={13}
            style={{ animation: running ? "spin 1s linear infinite" : "none" }}
          />
          {running ? "Matching…" : "Run match"}
        </button>
      </div>

      {/* Twins list */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="skeleton"
              style={{ height: "88px", borderRadius: "12px" }}
            />
          ))}
        </div>
      ) : twins.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <Film
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
            No twins found yet.
          </p>
          <p
            style={{
              fontFamily: SANS,
              fontSize: "12px",
              color: "#504E4A",
              maxWidth: "300px",
              margin: "0 auto",
            }}
          >
            Log at least 5 films and run the match. As more people join, twins
            will appear.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {twins.map((twin, i) => {
            const name =
              twin.user?.username || twin.user?.display_name || "Unknown";
            return (
              <div
                key={twin.id}
                style={{
                  padding: "16px",
                  background: "#0F0F0F",
                  border: "1px solid #1A1A1A",
                  borderRadius: "12px",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.borderColor = "#2A2A2A")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.borderColor = "#1A1A1A")
                }
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    marginBottom: "12px",
                  }}
                >
                  {/* Rank */}
                  <div
                    style={{
                      width: "24px",
                      flexShrink: 0,
                      textAlign: "center",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: MONO,
                        fontSize: "12px",
                        color: i === 0 ? "#C8A96E" : "#504E4A",
                      }}
                    >
                      #{i + 1}
                    </span>
                  </div>
                  <Avatar name={name} size={44} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontFamily: SANS,
                        fontSize: "14px",
                        color: "#F0EDE8",
                        fontWeight: 600,
                      }}
                    >
                      {name}
                    </p>
                    <div
                      style={{ display: "flex", gap: "10px", marginTop: "2px" }}
                    >
                      <span
                        style={{
                          fontFamily: MONO,
                          fontSize: "10px",
                          color: "#C8A96E",
                        }}
                      >
                        {twin.match_count} films in common
                      </span>
                      {twin.user?.total_films > 0 && (
                        <span
                          style={{
                            fontFamily: SANS,
                            fontSize: "10px",
                            color: "#504E4A",
                          }}
                        >
                          {twin.user.total_films} total
                        </span>
                      )}
                    </div>
                    {twin.user?.archetype && (
                      <p
                        style={{
                          fontFamily: SANS,
                          fontSize: "11px",
                          color: "#8A8780",
                          fontStyle: "italic",
                          marginTop: "2px",
                        }}
                      >
                        {twin.user.archetype}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => openDM(twin.user.id)}
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
                      fontSize: "11px",
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor =
                        "rgba(200,169,110,0.3)";
                      (e.currentTarget as HTMLElement).style.color = "#C8A96E";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor =
                        "#2A2A2A";
                      (e.currentTarget as HTMLElement).style.color = "#8A8780";
                    }}
                  >
                    <MessageCircle size={12} /> Message
                  </button>
                </div>
                <MatchBar pct={twin.match_percentage} />
              </div>
            );
          })}
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
