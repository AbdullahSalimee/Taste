"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Film,
  Tv,
  BookOpen,
  Users,
  Eye,
  Bookmark,
  MessageCircle,
  Star,
  ChevronRight,
  Heart,
  TrendingUp,
} from "lucide-react";

const SERIF = "Playfair Display, Georgia, serif";
const SANS = "Inter, system-ui, sans-serif";
const MONO = "JetBrains Mono, Courier New, monospace";

interface Props {
  tmdbId: number;
  mediaType: "movie" | "tv";
  titleName: string;
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function avatarColor(name: string) {
  const colors = [
    "#5C4A8A",
    "#8A2A2A",
    "#2A5C8A",
    "#2A6A5C",
    "#8A7A2A",
    "#8A2A5C",
  ];
  return colors[(name?.charCodeAt(0) || 0) % colors.length];
}

function AvatarCircle({
  name,
  size = 28,
  url,
}: {
  name: string;
  size?: number;
  url?: string | null;
}) {
  const [err, setErr] = useState(false);
  if (url && !err) {
    return (
      <img
        src={url}
        onError={() => setErr(true)}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          border: "2px solid #0D0D0D",
        }}
        alt={name}
      />
    );
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: avatarColor(name),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: SANS,
        fontSize: size * 0.38,
        fontWeight: 700,
        color: "#F0EDE8",
        border: "2px solid #0D0D0D",
        flexShrink: 0,
      }}
    >
      {(name?.[0] || "?").toUpperCase()}
    </div>
  );
}

function FranchiseCard({ item }: { item: any }) {
  const router = useRouter();
  const [imgErr, setImgErr] = useState(false);
  const mt = item.media_type === "tv" ? "tv" : "movie";
  const [hov, setHov] = useState(false);

  return (
    <div
      onClick={() => router.push(`/title/${mt}/${item.tmdb_id}`)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        flexShrink: 0,
        width: "96px",
        cursor: "pointer",
        transform: hov ? "translateY(-4px)" : "translateY(0)",
        transition: "transform 0.2s ease",
      }}
    >
      <div
        style={{
          width: "96px",
          height: "144px",
          borderRadius: "6px",
          overflow: "hidden",
          background: "#1A1A1A",
          marginBottom: "6px",
          border: `1px solid ${hov ? "rgba(200,169,110,0.5)" : "#2A2A2A"}`,
          transition: "border-color 0.15s",
          position: "relative",
        }}
      >
        {item.poster_url && !imgErr ? (
          <img
            src={item.poster_url}
            alt={item.title}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={() => setImgErr(true)}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {mt === "tv" ? (
              <Tv size={20} color="#2A2A2A" />
            ) : (
              <Film size={20} color="#2A2A2A" />
            )}
          </div>
        )}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to top, rgba(13,13,13,0.9) 0%, transparent 55%)",
          }}
        />
        <div style={{ position: "absolute", bottom: "5px", left: "6px" }}>
          <span style={{ fontFamily: MONO, fontSize: "9px", color: "#C8A96E" }}>
            ★ {item.tmdb_rating_5 || "—"}
          </span>
        </div>
      </div>
      <p
        style={{
          fontFamily: SANS,
          fontSize: "10px",
          color: "#8A8780",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          lineHeight: 1.3,
        }}
      >
        {item.title}
      </p>
      <p
        style={{
          fontFamily: MONO,
          fontSize: "9px",
          color: "#504E4A",
          marginTop: "1px",
        }}
      >
        {item.year || "—"}
      </p>
    </div>
  );
}

function ListMiniCard({ list }: { list: any }) {
  const [hov, setHov] = useState(false);
  return (
    <Link
      href={`/lists/${list.id}`}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex",
        gap: "12px",
        alignItems: "center",
        padding: "10px 14px",
        background: hov ? "#141414" : "#0F0F0F",
        border: `1px solid ${hov ? "#2A2A2A" : "#1A1A1A"}`,
        borderRadius: "10px",
        textDecoration: "none",
        transition: "all 0.15s",
      }}
    >
      {/* Preview posters stack */}
      <div
        style={{
          position: "relative",
          width: "48px",
          height: "64px",
          flexShrink: 0,
        }}
      >
        {(list.preview_posters || [])
          .slice(0, 3)
          .map((p: string, i: number) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: `${i * 8}px`,
                top: `${i * 4}px`,
                width: "36px",
                height: "54px",
                borderRadius: "3px",
                overflow: "hidden",
                border: "1px solid #2A2A2A",
                background: "#1A1A1A",
                zIndex: 3 - i,
                boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
              }}
            >
              <img
                src={p}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
          ))}
        {!list.preview_posters?.length && (
          <div
            style={{
              width: "36px",
              height: "54px",
              borderRadius: "3px",
              background: "#1A1A1A",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <BookOpen size={12} color="#2A2A2A" />
          </div>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontFamily: SANS,
            fontSize: "13px",
            fontWeight: 500,
            color: "#F0EDE8",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            marginBottom: "3px",
          }}
        >
          {list.title}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{ fontFamily: SANS, fontSize: "10px", color: "#504E4A" }}
          >
            by {list.author}
          </span>
          <span
            style={{ fontFamily: MONO, fontSize: "10px", color: "#2A2A2A" }}
          >
            ·
          </span>
          <span
            style={{ fontFamily: MONO, fontSize: "10px", color: "#504E4A" }}
          >
            {list.entry_count} titles
          </span>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: "4px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
          <Heart size={10} color="#504E4A" />
          <span
            style={{ fontFamily: MONO, fontSize: "10px", color: "#504E4A" }}
          >
            {list.like_count || 0}
          </span>
        </div>
        {list.is_ranked && (
          <span
            style={{
              fontFamily: SANS,
              fontSize: "8px",
              color: "#9A8AC0",
              background: "rgba(92,74,138,0.12)",
              padding: "1px 5px",
              borderRadius: "3px",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Ranked
          </span>
        )}
      </div>
    </Link>
  );
}

function SectionLabel({
  children,
  icon: Icon,
}: {
  children: React.ReactNode;
  icon?: any;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        marginBottom: "16px",
      }}
    >
      {Icon && <Icon size={14} color="#504E4A" />}
      <p
        style={{
          fontFamily: SANS,
          fontSize: "10px",
          color: "#504E4A",
          textTransform: "uppercase",
          letterSpacing: "0.14em",
        }}
      >
        {children}
      </p>
    </div>
  );
}

function Divider() {
  return (
    <div
      style={{
        height: "1px",
        background:
          "linear-gradient(to right, transparent, #1A1A1A, transparent)",
        margin: "32px 0",
      }}
    />
  );
}

export function TitlePageExtras({ tmdbId, mediaType, titleName }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/title/${mediaType}/${tmdbId}/related`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [tmdbId, mediaType]);

  if (loading) {
    return (
      <div style={{ marginTop: "32px" }}>
        <div
          className="skeleton"
          style={{
            height: "14px",
            width: "160px",
            borderRadius: "4px",
            marginBottom: "16px",
          }}
        />
        <div style={{ display: "flex", gap: "8px", overflowX: "hidden" }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="skeleton"
              style={{
                width: "96px",
                height: "144px",
                borderRadius: "6px",
                flexShrink: 0,
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { franchise, popular_lists, community_stats, recent_loggers } = data;

  return (
    <div>
      {/* ── FRANCHISE / RELATED ─────────────────────────────────────── */}
      {franchise?.titles?.length > 0 && (
        <>
          <Divider />
          <SectionLabel icon={Film}>
            {franchise.name || "More like this"}
          </SectionLabel>
          <div
            style={{
              display: "flex",
              gap: "10px",
              overflowX: "auto",
              paddingBottom: "8px",
              scrollbarWidth: "none",
            }}
          >
            {franchise.titles.map((item: any) => (
              <FranchiseCard
                key={`${item.media_type}-${item.tmdb_id}`}
                item={item}
              />
            ))}
          </div>
        </>
      )}

      {/* ── COMMUNITY STATS ─────────────────────────────────────────── */}
      {(community_stats.total_logged > 0 ||
        community_stats.total_reviews > 0) && (
        <>
          <Divider />
          <SectionLabel icon={Users}>Community activity</SectionLabel>

          {/* Stats row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "8px",
              marginBottom: "20px",
            }}
          >
            {[
              { icon: Eye, val: community_stats.total_logged, label: "Logged" },
              {
                icon: Bookmark,
                val: community_stats.total_watchlisted,
                label: "Watchlisted",
              },
              {
                icon: MessageCircle,
                val: community_stats.total_reviews,
                label: "Reviews",
              },
            ].map(({ icon: Icon, val, label }) => (
              <div
                key={label}
                style={{
                  background: "#141414",
                  border: "1px solid #1A1A1A",
                  borderRadius: "10px",
                  padding: "14px 12px",
                  textAlign: "center",
                }}
              >
                <Icon
                  size={14}
                  color="#504E4A"
                  style={{ margin: "0 auto 6px", display: "block" }}
                />
                <p
                  style={{
                    fontFamily: MONO,
                    fontSize: "18px",
                    color: "#C8A96E",
                    fontWeight: 500,
                  }}
                >
                  {val > 999 ? `${(val / 1000).toFixed(1)}k` : val}
                </p>
                <p
                  style={{
                    fontFamily: SANS,
                    fontSize: "9px",
                    color: "#504E4A",
                    marginTop: "2px",
                  }}
                >
                  {label}
                </p>
              </div>
            ))}
          </div>

          {/* Recent loggers - overlapping avatars */}
          {recent_loggers.length > 0 && (
            <div style={{ marginBottom: "8px" }}>
              <p
                style={{
                  fontFamily: SANS,
                  fontSize: "11px",
                  color: "#504E4A",
                  marginBottom: "10px",
                }}
              >
                Recently watched by
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: "0" }}>
                {recent_loggers.slice(0, 8).map((logger: any, i: number) => (
                  <Link
                    key={i}
                    href={`/profile/${logger.username}`}
                    title={`@${logger.username} — ${logger.status}`}
                    style={{
                      marginLeft: i === 0 ? "0" : "-8px",
                      zIndex: 10 - i,
                      position: "relative",
                      flexShrink: 0,
                    }}
                  >
                    <AvatarCircle
                      name={logger.username}
                      url={logger.avatar_url}
                      size={32}
                    />
                  </Link>
                ))}
                {recent_loggers.length > 8 && (
                  <div
                    style={{
                      marginLeft: "-8px",
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      background: "#2A2A2A",
                      border: "2px solid #0D0D0D",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: SANS,
                      fontSize: "9px",
                      color: "#8A8780",
                      zIndex: 2,
                      flexShrink: 0,
                    }}
                  >
                    +{recent_loggers.length - 8}
                  </div>
                )}
                <p
                  style={{
                    fontFamily: SANS,
                    fontSize: "11px",
                    color: "#504E4A",
                    marginLeft: "12px",
                  }}
                >
                  and others have watched this
                </p>
              </div>
            </div>
          )}

          {/* Join community CTA */}
          <div
            style={{
              marginTop: "16px",
              background:
                "linear-gradient(135deg, rgba(200,169,110,0.06) 0%, rgba(92,74,138,0.06) 100%)",
              border: "1px solid rgba(200,169,110,0.15)",
              borderRadius: "12px",
              padding: "18px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "16px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <p
                style={{
                  fontFamily: SERIF,
                  fontSize: "15px",
                  fontStyle: "italic",
                  color: "#F0EDE8",
                  marginBottom: "4px",
                }}
              >
                Track your watch history
              </p>
              <p
                style={{
                  fontFamily: SANS,
                  fontSize: "12px",
                  color: "#8A8780",
                  lineHeight: 1.5,
                }}
              >
                Join{" "}
                {community_stats.total_logged > 0
                  ? `${community_stats.total_logged}+ people`
                  : "the community"}{" "}
                tracking {titleName}
              </p>
            </div>
            <Link
              href="/auth"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "9px 18px",
                borderRadius: "8px",
                background: "#C8A96E",
                color: "#0D0D0D",
                fontFamily: SANS,
                fontSize: "12px",
                fontWeight: 600,
                textDecoration: "none",
                flexShrink: 0,
                whiteSpace: "nowrap",
              }}
            >
              Join Taste <ChevronRight size={12} />
            </Link>
          </div>
        </>
      )}

      {/* ── POPULAR LISTS ────────────────────────────────────────────── */}
      {popular_lists?.length > 0 && (
        <>
          <Divider />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <TrendingUp size={14} color="#504E4A" />
              <p
                style={{
                  fontFamily: SANS,
                  fontSize: "10px",
                  color: "#504E4A",
                  textTransform: "uppercase",
                  letterSpacing: "0.14em",
                }}
              >
                Featured in popular lists
              </p>
            </div>
            <Link
              href="/lists"
              style={{
                fontFamily: SANS,
                fontSize: "10px",
                color: "#C8A96E",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: "2px",
              }}
            >
              Browse all <ChevronRight size={10} />
            </Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {popular_lists.map((list: any) => (
              <ListMiniCard key={list.id} list={list} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
