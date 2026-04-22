  "use client";
  import { useState, useEffect,useRef } from "react";
  import { useRouter } from "next/navigation";
  import Link from "next/link";
  import {
    Plus,
    BookOpen,
    Globe,
    Lock,
    Film,
    Tv,
    Heart,
    List,
    Star,
  } from "lucide-react";
  import { useAuth } from "@/lib/auth-context";
  import { supabase } from "@/lib/supabase";
  import CreateListModal from "@/components/features/lists/CreateListModal";

  const SERIF = "Playfair Display, Georgia, serif";
  const SANS = "Inter, system-ui, sans-serif";
  const MONO = "JetBrains Mono, Courier New, monospace";

  function timeAgo(date: string) {
    const diff = Date.now() - new Date(date).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "today";
    if (days === 1) return "yesterday";
    if (days < 30) return `${days}d ago`;
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  }

function ListCard({ list }: { list: any }) {
  const router = useRouter();
  const [hovered, setHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const cardRef = useRef<HTMLDivElement>(null);
  const posters = list.preview_posters || [];

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    });
  };

  const tiltX = hovered ? (mousePos.y - 0.5) * -10 : 0;
  const tiltY = hovered ? (mousePos.x - 0.5) * 10 : 0;
  const glowX = mousePos.x * 100;
  const glowY = mousePos.y * 100;

  return (
    <>
      <style>{`
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(400%); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes glitch-clip {
          0%,94%,100% { clip-path: inset(0 0 100% 0); opacity: 0; }
          95% { clip-path: inset(20% 0 60% 0); opacity: 1; transform: translateX(-4px); }
          97% { clip-path: inset(55% 0 10% 0); opacity: 1; transform: translateX(4px); }
          99% { clip-path: inset(80% 0 5% 0); opacity: 1; transform: translateX(-2px); }
        }
      `}</style>

      <div
        ref={cardRef}
        onClick={() => router.push(`/lists/${list.id}`)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => {
          setHovered(false);
          setMousePos({ x: 0.5, y: 0.5 });
        }}
        onMouseMove={handleMouseMove}
        style={{
          position: "relative",
          background: "#0A0A0A",
          borderRadius: "16px",
          overflow: "hidden",
          cursor: "pointer",
          transition: "transform 0.15s ease, box-shadow 0.25s ease",
          transform: `perspective(900px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) ${hovered ? "translateY(-6px)" : "translateY(0)"}`,
          boxShadow: hovered
            ? `0 30px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.08)`
            : `0 4px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03)`,
          willChange: "transform",
        }}
      >
        {/* Mouse-tracked radial glow */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: hovered
              ? `radial-gradient(circle at ${glowX}% ${glowY}%, rgba(255,200,100,0.07) 0%, transparent 60%)`
              : "none",
            zIndex: 20,
            pointerEvents: "none",
            transition: "opacity 0.3s",
          }}
        />

        {/* POSTER ZONE */}
        <div
          style={{
            position: "relative",
            height: "170px",
            background: "#060606",
            overflow: "hidden",
          }}
        >
          {posters.length > 0 ? (
            <>
              {/* Ambient bg */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundImage: `url(${posters[0]})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center top",
                  filter: "blur(30px) saturate(1.6) brightness(0.18)",
                  transform: "scale(1.2)",
                  zIndex: 0,
                }}
              />

              {/* Noise grain */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`,
                  backgroundSize: "128px",
                  zIndex: 1,
                  opacity: 0.6,
                  pointerEvents: "none",
                  mixBlendMode: "screen" as any,
                }}
              />

              {/* Far left poster */}
              {posters[3] && (
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: "50%",
                    zIndex: 2,
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      width: "58px",
                      height: "86px",
                      bottom: "-10px",
                      left: "-112px",
                      borderRadius: "5px",
                      backgroundImage: `url(${posters[3]})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      transform: hovered
                        ? "rotate(-24deg) translate(-14px, 0px)"
                        : "rotate(-18deg) translate(-8px, 6px)",
                      transition:
                        "transform 0.4s cubic-bezier(0.34,1.4,0.64,1)",
                      boxShadow: "0 12px 32px rgba(0,0,0,0.7)",
                      border: "1px solid rgba(255,255,255,0.05)",
                      opacity: 0.55,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        backgroundImage: `url(${posters[3]})`,
                        backgroundSize: "cover",
                        animation: "glitch-clip 6s infinite 1.2s",
                        mixBlendMode: "screen" as any,
                        opacity: 0.6,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Left poster */}
              {posters[2] && (
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: "50%",
                    zIndex: 3,
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      width: "64px",
                      height: "96px",
                      bottom: "-6px",
                      left: "-74px",
                      borderRadius: "6px",
                      backgroundImage: `url(${posters[2]})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      transform: hovered
                        ? "rotate(-11deg) translate(-7px, 0px)"
                        : "rotate(-7deg) translate(-3px, 3px)",
                      transition:
                        "transform 0.4s cubic-bezier(0.34,1.4,0.64,1) 0.04s",
                      boxShadow: "0 14px 36px rgba(0,0,0,0.75)",
                      border: "1px solid rgba(255,255,255,0.07)",
                      opacity: 0.8,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        backgroundImage: `url(${posters[2]})`,
                        backgroundSize: "cover",
                        animation: "glitch-clip 8s infinite 2.5s",
                        mixBlendMode: "screen" as any,
                        opacity: 0.5,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Right poster */}
              {posters[1] && (
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: "50%",
                    zIndex: 3,
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      width: "64px",
                      height: "96px",
                      bottom: "-6px",
                      left: "10px",
                      borderRadius: "6px",
                      backgroundImage: `url(${posters[1]})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      transform: hovered
                        ? "rotate(11deg) translate(7px, 0px)"
                        : "rotate(7deg) translate(3px, 3px)",
                      transition:
                        "transform 0.4s cubic-bezier(0.34,1.4,0.64,1) 0.04s",
                      boxShadow: "0 14px 36px rgba(0,0,0,0.75)",
                      border: "1px solid rgba(255,255,255,0.07)",
                      opacity: 0.8,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        backgroundImage: `url(${posters[1]})`,
                        backgroundSize: "cover",
                        animation: "glitch-clip 7s infinite 0.8s",
                        mixBlendMode: "screen" as any,
                        opacity: 0.5,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Far right poster */}
              {posters[3] && (
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: "50%",
                    zIndex: 2,
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      width: "58px",
                      height: "86px",
                      bottom: "-10px",
                      left: "54px",
                      borderRadius: "5px",
                      backgroundImage: `url(${posters[3]})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      transform: hovered
                        ? "rotate(24deg) translate(14px, 0px)"
                        : "rotate(18deg) translate(8px, 6px)",
                      transition:
                        "transform 0.4s cubic-bezier(0.34,1.4,0.64,1)",
                      boxShadow: "0 12px 32px rgba(0,0,0,0.7)",
                      border: "1px solid rgba(255,255,255,0.05)",
                      opacity: 0.55,
                    }}
                  />
                </div>
              )}

              {/* HERO CENTER POSTER */}
              <div
                style={{
                  position: "absolute",
                  bottom: "-2px",
                  left: "50%",
                  transform: hovered
                    ? "translateX(-50%) translateY(-8px) scale(1.06)"
                    : "translateX(-50%) scale(1)",
                  transition:
                    "transform 0.4s cubic-bezier(0.34,1.4,0.64,1) 0.06s",
                  width: "76px",
                  height: "114px",
                  borderRadius: "8px",
                  backgroundImage: `url(${posters[0]})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  boxShadow: hovered
                    ? "0 24px 60px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.14), 0 0 30px rgba(200,160,80,0.15)"
                    : "0 16px 40px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.09)",
                  zIndex: 5,
                  overflow: "hidden",
                }}
              >
                {/* Scanline sweep */}
                {hovered && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background:
                        "linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.07) 50%, transparent 100%)",
                      height: "40%",
                      top: 0,
                      animation: "scanline 1.4s linear infinite",
                      pointerEvents: "none",
                      zIndex: 2,
                    }}
                  />
                )}
                {/* Glitch layer */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    backgroundImage: `url(${posters[0]})`,
                    backgroundSize: "cover",
                    animation: "glitch-clip 5s infinite 0.3s",
                    mixBlendMode: "screen" as any,
                    opacity: 0.7,
                  }}
                />
                {/* Shine */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 50%)",
                    borderRadius: "8px",
                    pointerEvents: "none",
                  }}
                />
              </div>

              {/* Film perforations */}
              <div
                style={{
                  position: "absolute",
                  top: "7px",
                  left: 0,
                  right: 0,
                  display: "flex",
                  justifyContent: "space-between",
                  paddingInline: "8px",
                  zIndex: 10,
                  pointerEvents: "none",
                }}
              >
                {[...Array(11)].map((_, i) => (
                  <div
                    key={i}
                    style={{
                      width: "8px",
                      height: "6px",
                      borderRadius: "1.5px",
                      background: "rgba(255,255,255,0.12)",
                      boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.5)",
                    }}
                  />
                ))}
              </div>

              {/* Cinematic frame count */}
              <div
                style={{
                  position: "absolute",
                  top: "5px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  fontFamily: "monospace",
                  fontSize: "7px",
                  color: "rgba(255,255,255,0.18)",
                  letterSpacing: "0.15em",
                  zIndex: 11,
                  whiteSpace: "nowrap",
                }}
              >
                {list.entry_count}fr / {list.is_ranked ? "RNK" : "UNR"}
              </div>

              {/* Ranked badge */}
              {list.is_ranked && (
                <div
                  style={{
                    position: "absolute",
                    top: "26px",
                    right: "10px",
                    padding: "3px 8px",
                    borderRadius: "4px",
                    background: "rgba(200,169,110,0.1)",
                    border: "1px solid rgba(200,169,110,0.25)",
                    fontFamily: "monospace",
                    fontSize: "8px",
                    color: "#C8A96E",
                    letterSpacing: "0.12em",
                    zIndex: 10,
                  }}
                >
                  RANKED
                </div>
              )}

              {/* Private badge */}
              {!list.is_public && (
                <div
                  style={{
                    position: "absolute",
                    top: "26px",
                    left: "10px",
                    width: "22px",
                    height: "22px",
                    borderRadius: "50%",
                    background: "rgba(10,10,10,0.85)",
                    border: "1px solid #222",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 10,
                  }}
                >
                  <Lock size={10} color="#504E4A" />
                </div>
              )}
            </>
          ) : (
            <div
              style={{
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, #111, #080808)",
              }}
            >
              <BookOpen size={28} color="#1E1E1E" />
            </div>
          )}

          {/* Bottom gradient */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to bottom, transparent 30%, rgba(10,10,10,0.98) 100%)",
              zIndex: 6,
              pointerEvents: "none",
            }}
          />
        </div>

        {/* CONTENT BODY */}
        <div style={{ padding: "14px 16px 16px", position: "relative" }}>
          <h3
            style={
              {
                fontFamily: SERIF,
                fontSize: "15px",
                fontWeight: 700,
                fontStyle: "italic",
                marginBottom: "5px",
                lineHeight: 1.3,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                background: hovered
                  ? "linear-gradient(90deg, #F0EDE8 0%, #C8A96E 40%, #F0EDE8 60%, #F0EDE8 100%)"
                  : "none",
                backgroundSize: "200% auto",
                WebkitBackgroundClip: hovered ? "text" : undefined,
                WebkitTextFillColor: hovered ? "transparent" : "#F0EDE8",
                animation: hovered ? "shimmer 1.8s linear infinite" : "none",
                color: hovered ? "transparent" : "#F0EDE8",
              } as any
            }
          >
            {list.title}
          </h3>

          {list.description && (
            <p
              style={
                {
                  fontFamily: SANS,
                  fontSize: "11px",
                  color: "#5A5855",
                  lineHeight: 1.55,
                  marginBottom: "12px",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                } as any
              }
            >
              {list.description}
            </p>
          )}

          {/* Hairline divider */}
          <div
            style={{
              height: "1px",
              background: hovered
                ? `linear-gradient(to right, transparent, rgba(200,169,110,0.3), transparent)`
                : `linear-gradient(to right, transparent, rgba(255,255,255,0.05), transparent)`,
              marginBottom: "10px",
              transition: "background 0.3s",
            }}
          />

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <Heart
                size={10}
                color={list.is_liked ? "#C87C2A" : "#333"}
                fill={list.is_liked ? "#C87C2A" : "none"}
              />
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: "10px",
                  color: "#333",
                }}
              >
                {list.like_count}
              </span>
            </div>

            {list.profiles && (
              <span
                style={{ fontFamily: SANS, fontSize: "10px", color: "#333" }}
              >
                by{" "}
                <span style={{ color: "#5A5855" }}>
                  {list.profiles.username}
                </span>
              </span>
            )}

            <span
              style={{
                marginLeft: "auto",
                fontFamily: "monospace",
                fontSize: "9px",
                color: "#222",
                letterSpacing: "0.04em",
              }}
            >
              {timeAgo(list.updated_at)}
            </span>
          </div>

          {list.tags?.length > 0 && (
            <div
              style={{
                display: "flex",
                gap: "4px",
                flexWrap: "wrap",
                marginTop: "10px",
              }}
            >
              {list.tags.slice(0, 3).map((tag: string) => (
                <span
                  key={tag}
                  style={{
                    padding: "2px 7px",
                    borderRadius: "3px",
                    background: "#101010",
                    border: `1px solid ${hovered ? "#252525" : "#1A1A1A"}`,
                    fontFamily: SANS,
                    fontSize: "9px",
                    color: "#333",
                    letterSpacing: "0.05em",
                    transition: "border-color 0.2s",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Corner bracket accents on hover */}
        {hovered && (
          <>
            {[
              {
                top: 8,
                left: 8,
                borderTop: "1px solid rgba(200,169,110,0.4)",
                borderLeft: "1px solid rgba(200,169,110,0.4)",
              },
              {
                top: 8,
                right: 8,
                borderTop: "1px solid rgba(200,169,110,0.4)",
                borderRight: "1px solid rgba(200,169,110,0.4)",
              },
              {
                bottom: 8,
                left: 8,
                borderBottom: "1px solid rgba(200,169,110,0.4)",
                borderLeft: "1px solid rgba(200,169,110,0.4)",
              },
              {
                bottom: 8,
                right: 8,
                borderBottom: "1px solid rgba(200,169,110,0.4)",
                borderRight: "1px solid rgba(200,169,110,0.4)",
              },
            ].map((s, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  width: "10px",
                  height: "10px",
                  pointerEvents: "none",
                  zIndex: 30,
                  ...s,
                }}
              />
            ))}
          </>
        )}
      </div>
    </>
  );
}
  export default function ListsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [myLists, setMyLists] = useState<any[]>([]);
    const [discoverLists, setDiscoverLists] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<"mine" | "discover">("mine");
    const [createOpen, setCreateOpen] = useState(false);

    useEffect(() => {
      load();
    }, [user]);

    async function load() {
      setLoading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      if (session) headers.Authorization = `Bearer ${session.access_token}`;

      const [myRes, discRes] = await Promise.all([
        user
          ? fetch(`/api/lists?user_id=${user.id}`, { headers })
          : Promise.resolve(null),
        fetch("/api/lists?discover=true", { headers }),
      ]);

      const [myData, discData] = await Promise.all([
        myRes?.json() ?? { lists: [] },
        discRes.json(),
      ]);

      setMyLists(myData.lists || []);
      setDiscoverLists(discData.lists || []);
      setLoading(false);
    }

    return (
      <div
        style={{ maxWidth: "960px", margin: "0 auto", padding: "28px 24px 80px" }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            marginBottom: "8px",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "4px",
              }}
            >
              <BookOpen size={20} color="#C8A96E" />
              <h1
                style={{
                  fontFamily: SERIF,
                  fontSize: "28px",
                  fontWeight: 700,
                  color: "#F0EDE8",
                  fontStyle: "italic",
                }}
              >
                Lists
              </h1>
            </div>
            <p style={{ fontFamily: SANS, fontSize: "12px", color: "#504E4A" }}>
              Curate films and series. Share your taste.
            </p>
          </div>
          {user && (
            <button
              onClick={() => setCreateOpen(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "7px",
                padding: "9px 18px",
                borderRadius: "8px",
                background: "#C8A96E",
                color: "#0D0D0D",
                fontFamily: SANS,
                fontSize: "13px",
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                boxShadow: "0 2px 12px rgba(200,169,110,0.2)",
              }}
            >
              <Plus size={14} /> New list
            </button>
          )}
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: "0",
            borderBottom: "1px solid #1A1A1A",
            marginBottom: "24px",
            marginTop: "20px",
          }}
        >
          {(
            [
              {
                id: "mine",
                label: user ? `My Lists (${myLists.length})` : "My Lists",
              },
              { id: "discover", label: "Discover" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: "10px 20px",
                background: "none",
                border: "none",
                borderBottom:
                  tab === t.id ? "2px solid #C8A96E" : "2px solid transparent",
                color: tab === t.id ? "#F0EDE8" : "#504E4A",
                fontFamily: SANS,
                fontSize: "13px",
                fontWeight: tab === t.id ? 500 : 400,
                cursor: "pointer",
                marginBottom: "-1px",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: "16px",
            }}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="skeleton"
                style={{ height: "240px", borderRadius: "12px" }}
              />
            ))}
          </div>
        ) : (
          <>
            {tab === "mine" && (
              <>
                {!user ? (
                  <div style={{ textAlign: "center", padding: "60px 0" }}>
                    <BookOpen
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
                        marginBottom: "16px",
                      }}
                    >
                      Sign in to create lists.
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
                ) : myLists.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "80px 0" }}>
                    <div
                      style={{
                        width: "72px",
                        height: "72px",
                        borderRadius: "16px",
                        background: "rgba(200,169,110,0.08)",
                        border: "1px solid rgba(200,169,110,0.15)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto 20px",
                      }}
                    >
                      <BookOpen size={28} color="#C8A96E" />
                    </div>
                    <h3
                      style={{
                        fontFamily: SERIF,
                        fontSize: "20px",
                        color: "#F0EDE8",
                        fontStyle: "italic",
                        marginBottom: "8px",
                      }}
                    >
                      No lists yet.
                    </h3>
                    <p
                      style={{
                        fontFamily: SANS,
                        fontSize: "13px",
                        color: "#504E4A",
                        marginBottom: "20px",
                      }}
                    >
                      Create your first list — films, series, or both.
                    </p>
                    <button
                      onClick={() => setCreateOpen(true)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "10px 22px",
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
                      <Plus size={14} /> Create a list
                    </button>
                  </div>
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(260px, 1fr))",
                      gap: "16px",
                    }}
                  >
                    {myLists.map((list) => (
                      <ListCard key={list.id} list={list} />
                    ))}
                  </div>
                )}
              </>
            )}

            {tab === "discover" &&
              (discoverLists.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 0" }}>
                  <p
                    style={{
                      fontFamily: SERIF,
                      fontSize: "18px",
                      color: "#2A2A2A",
                      fontStyle: "italic",
                    }}
                  >
                    No public lists yet.
                  </p>
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                    gap: "16px",
                  }}
                >
                  {discoverLists.map((list) => (
                    <ListCard key={list.id} list={list} />
                  ))}
                </div>
              ))}
          </>
        )}

        {createOpen && (
          <CreateListModal
            onClose={() => setCreateOpen(false)}
            onCreated={(id) => {
              setCreateOpen(false);
              router.push(`/lists/${id}`);
            }}
          />
        )}
      </div>
    );
  }
