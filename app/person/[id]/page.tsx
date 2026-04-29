"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Film, Tv, Star, Eye, Calendar, MapPin, Award } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

const SERIF = "Playfair Display, Georgia, serif";
const SANS = "Inter, system-ui, sans-serif";
const MONO = "JetBrains Mono, Courier New, monospace";

function toFive(r: number) {
  return Math.round((r / 2) * 10) / 10;
}

function StarDisplay({ rating, size = 11 }: { rating: number; size?: number }) {
  return (
    <span style={{ color: "#C8A96E", fontSize: `${size}px`, letterSpacing: "0.5px" }}>
      {[1, 2, 3, 4, 5].map(s =>
        rating >= s ? "★" : rating >= s - 0.5 ? "⯨" : "☆"
      ).join("")}
    </span>
  );
}

function FilmPoster({ item, watched, userRating, onClick }: {
  item: any; watched: boolean; userRating?: number; onClick: () => void;
}) {
  const [imgErr, setImgErr] = useState(false);
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "2/3",
        borderRadius: "6px",
        overflow: "hidden",
        cursor: "pointer",
        background: "#1A1A1A",
        border: `1px solid ${watched ? "rgba(200,169,110,0.3)" : "#1A1A1A"}`,
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        transform: hovered ? "translateY(-3px)" : "none",
        boxShadow: hovered ? "0 12px 32px rgba(0,0,0,0.6)" : "none",
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
        <div style={{
          width: "100%", height: "100%", display: "flex",
          alignItems: "center", justifyContent: "center",
        }}>
          {item.media_type === "tv" ? <Tv size={16} color="#2A2A2A" /> : <Film size={16} color="#2A2A2A" />}
        </div>
      )}

      {/* Overlay gradient */}
      <div style={{
        position: "absolute", inset: 0,
        background: hovered
          ? "linear-gradient(to top, rgba(13,13,13,0.98) 0%, rgba(13,13,13,0.4) 50%, transparent 100%)"
          : "linear-gradient(to top, rgba(13,13,13,0.85) 0%, transparent 55%)",
        transition: "background 0.2s ease",
      }} />

      {/* Watched overlay */}
      {watched && (
        <div style={{
          position: "absolute", top: "5px", left: "5px",
          width: "18px", height: "18px", borderRadius: "3px",
          background: "rgba(200,169,110,0.9)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Eye size={10} color="#0D0D0D" />
        </div>
      )}

      {/* Rating badge */}
      {userRating && (
        <div style={{
          position: "absolute", top: "5px", right: "5px",
          background: "rgba(13,13,13,0.9)", border: "1px solid rgba(200,169,110,0.4)",
          borderRadius: "4px", padding: "1px 5px",
          fontFamily: MONO, fontSize: "9px", color: "#C8A96E",
        }}>
          ★{userRating}
        </div>
      )}

      {/* Bottom info */}
      <div style={{ position: "absolute", bottom: "6px", left: "6px", right: "6px" }}>
        {hovered && (
          <p style={{
            fontFamily: SANS, fontSize: "10px", fontWeight: 500,
            color: "#F0EDE8", lineHeight: 1.3, marginBottom: "2px",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {item.title}
          </p>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          {item.year > 0 && (
            <span style={{ fontFamily: MONO, fontSize: "9px", color: "#8A8780" }}>
              {item.year}
            </span>
          )}
          {item.tmdb_rating_5 > 0 && (
            <span style={{ fontFamily: MONO, fontSize: "9px", color: "#C8A96E" }}>
              ★{item.tmdb_rating_5}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function StatBadge({ val, label, accent }: { val: string | number; label: string; accent?: boolean }) {
  return (
    <div style={{ textAlign: "center" }}>
      <p style={{
        fontFamily: MONO, fontSize: "22px", fontWeight: 500,
        color: accent ? "#C8A96E" : "#F0EDE8", lineHeight: 1,
      }}>
        {val}
      </p>
      <p style={{ fontFamily: SANS, fontSize: "10px", color: "#504E4A", marginTop: "3px" }}>
        {label}
      </p>
    </div>
  );
}

export default function PersonPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"acting" | "directing" | "tv">("acting");
  const [bioExpanded, setBioExpanded] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      if (session) headers.Authorization = `Bearer ${session.access_token}`;
      const res = await fetch(`/api/person/${id}`, { headers });
      if (!res.ok) { setLoading(false); return; }
      const json = await res.json();
      setData(json);
      // Auto-select best tab
      if (json.movie_directed?.length > 0) setTab("directing");
      else if (json.movie_cast?.length > 0) setTab("acting");
      else if (json.tv_cast?.length > 0) setTab("tv");
      setLoading(false);
    }
    load();
  }, [id]);

  function navigateTitle(item: any) {
    const mt = item.media_type === "tv" ? "tv" : "movie";
    router.push(`/title/${mt}/${item.tmdb_id}`);
  }

  if (loading) {
    return (
      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "48px 24px" }}>
        <div style={{ display: "flex", gap: "24px", marginBottom: "32px" }}>
          <div className="skeleton" style={{ width: 160, height: 240, borderRadius: "10px", flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div className="skeleton" style={{ width: "200px", height: "28px", borderRadius: "6px", marginBottom: "12px" }} />
            <div className="skeleton" style={{ width: "120px", height: "14px", borderRadius: "4px", marginBottom: "20px" }} />
            <div className="skeleton" style={{ width: "100%", height: "80px", borderRadius: "6px" }} />
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ maxWidth: "480px", margin: "80px auto", textAlign: "center", padding: "0 24px" }}>
        <p style={{ fontFamily: SERIF, fontSize: "22px", color: "#504E4A", fontStyle: "italic" }}>Person not found.</p>
        <button onClick={() => router.back()} style={{
          marginTop: "16px", padding: "8px 18px", borderRadius: "8px",
          background: "#141414", border: "1px solid #2A2A2A", color: "#8A8780",
          fontFamily: SANS, fontSize: "13px", cursor: "pointer",
        }}>← Go back</button>
      </div>
    );
  }

  const { person, movie_cast, movie_directed, tv_cast, user_stats } = data;

  const watchedSet = new Set<number>(user_stats?.watched_tmdb_ids || []);
  const ratingsMap: Record<number, number> = user_stats?.ratings_by_tmdb_id || {};

  const shortBio = person.biography?.slice(0, 400);
  const longBio = person.biography?.length > 400;

  const TABS = [
    ...(movie_directed?.length > 0 ? [{ id: "directing", label: `Directed (${movie_directed.length})` }] : []),
    ...(movie_cast?.length > 0 ? [{ id: "acting", label: `Films (${movie_cast.length})` }] : []),
    ...(tv_cast?.length > 0 ? [{ id: "tv", label: `TV (${tv_cast.length})` }] : []),
  ] as const;

  const currentItems =
    tab === "directing" ? movie_directed :
    tab === "tv" ? tv_cast : movie_cast;

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "0 24px 80px" }}>
      {/* Back */}
      <div style={{ paddingTop: "24px", marginBottom: "24px" }}>
        <button onClick={() => router.back()} style={{
          display: "inline-flex", alignItems: "center", gap: "5px",
          background: "none", border: "none", cursor: "pointer",
          color: "#504E4A", fontFamily: SANS, fontSize: "12px", padding: 0,
        }}>
          <ArrowLeft size={13} /> Back
        </button>
      </div>

      {/* Header */}
      <div style={{
        display: "flex", gap: "28px", marginBottom: "32px", flexWrap: "wrap",
        background: "#0F0F0F", border: "1px solid #1A1A1A", borderRadius: "16px", padding: "24px",
      }}>
        {/* Portrait */}
        <div style={{ flexShrink: 0 }}>
          {person.profile_url ? (
            <img
              src={person.profile_url}
              alt={person.name}
              style={{
                width: "140px", height: "210px", objectFit: "cover",
                borderRadius: "10px", border: "1px solid #2A2A2A",
                boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
              }}
            />
          ) : (
            <div style={{
              width: "140px", height: "210px", borderRadius: "10px",
              background: "#1A1A1A", border: "1px solid #2A2A2A",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontFamily: SERIF, fontSize: "40px", color: "#504E4A" }}>
                {person.name?.[0] || "?"}
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {person.known_for_department && (
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "5px",
              padding: "3px 10px", borderRadius: "4px", marginBottom: "10px",
              background: "rgba(200,169,110,0.08)", border: "1px solid rgba(200,169,110,0.2)",
            }}>
              <span style={{ fontFamily: SANS, fontSize: "10px", color: "#C8A96E", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                {person.known_for_department}
              </span>
            </div>
          )}

          <h1 style={{
            fontFamily: SERIF, fontSize: "clamp(24px, 4vw, 36px)",
            fontWeight: 700, color: "#F0EDE8", fontStyle: "italic",
            lineHeight: 1.1, marginBottom: "10px",
          }}>
            {person.name}
          </h1>

          {/* Meta */}
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "14px" }}>
            {person.birthday && (
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <Calendar size={11} color="#504E4A" />
                <span style={{ fontFamily: SANS, fontSize: "12px", color: "#504E4A" }}>
                  b. {new Date(person.birthday).getFullYear()}
                  {person.deathday ? ` — d. ${new Date(person.deathday).getFullYear()}` : ""}
                </span>
              </div>
            )}
            {person.place_of_birth && (
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <MapPin size={11} color="#504E4A" />
                <span style={{ fontFamily: SANS, fontSize: "12px", color: "#504E4A" }}>
                  {person.place_of_birth.split(",").slice(-2).join(",").trim()}
                </span>
              </div>
            )}
          </div>

          {/* Bio */}
          {person.biography && (
            <div style={{ marginBottom: "16px" }}>
              <p style={{
                fontFamily: SANS, fontSize: "13px", color: "#8A8780",
                lineHeight: 1.7,
                display: bioExpanded ? "block" : "-webkit-box",
                WebkitLineClamp: bioExpanded ? undefined : 4,
                WebkitBoxOrient: "vertical",
                overflow: bioExpanded ? "visible" : "hidden",
              }}>
                {person.biography}
              </p>
              {longBio && (
                <button onClick={() => setBioExpanded(!bioExpanded)} style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "#C8A96E", fontFamily: SANS, fontSize: "12px",
                  padding: 0, marginTop: "6px",
                }}>
                  {bioExpanded ? "Show less" : "Read more"}
                </button>
              )}
            </div>
          )}

          {/* User stats strip */}
          {user_stats && (
            <div style={{
              display: "flex", gap: "24px", paddingTop: "14px",
              borderTop: "1px solid #1A1A1A", flexWrap: "wrap",
            }}>
              <StatBadge
                val={`${user_stats.watched_count}/${user_stats.total_titles}`}
                label="Seen"
                accent
              />
              {user_stats.avg_rating && (
                <StatBadge
                  val={`${user_stats.avg_rating}★`}
                  label="Avg rating"
                  accent
                />
              )}
              <StatBadge
                val={user_stats.total_titles}
                label="Total titles"
              />
            </div>
          )}

          {!user && (
            <p style={{ fontFamily: SANS, fontSize: "12px", color: "#504E4A", marginTop: "10px" }}>
              <Link href="/auth" style={{ color: "#C8A96E", textDecoration: "none" }}>Sign in</Link> to see which you've watched
            </p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: "flex", gap: "0",
        borderBottom: "1px solid #1A1A1A", marginBottom: "24px",
      }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            style={{
              padding: "10px 20px", background: "none", border: "none",
              borderBottom: tab === t.id ? "2px solid #C8A96E" : "2px solid transparent",
              color: tab === t.id ? "#F0EDE8" : "#504E4A",
              fontFamily: SANS, fontSize: "13px",
              fontWeight: tab === t.id ? 500 : 400,
              cursor: "pointer", marginBottom: "-1px",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Progress bar for watched */}
      {user_stats && currentItems.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
            <span style={{ fontFamily: SANS, fontSize: "11px", color: "#504E4A" }}>
              {currentItems.filter((m: any) => watchedSet.has(m.tmdb_id)).length} of {currentItems.length} watched
            </span>
            <span style={{ fontFamily: MONO, fontSize: "11px", color: "#C8A96E" }}>
              {Math.round(currentItems.filter((m: any) => watchedSet.has(m.tmdb_id)).length / currentItems.length * 100)}%
            </span>
          </div>
          <div style={{ height: "3px", background: "#1A1A1A", borderRadius: "2px", overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: `${currentItems.filter((m: any) => watchedSet.has(m.tmdb_id)).length / currentItems.length * 100}%`,
              background: "linear-gradient(90deg, #C8A96E, #F0D080)",
              borderRadius: "2px",
              transition: "width 0.6s ease",
            }} />
          </div>
        </div>
      )}

      {/* Film Grid */}
      {currentItems.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <p style={{ fontFamily: SERIF, fontSize: "18px", color: "#2A2A2A", fontStyle: "italic" }}>
            Nothing to show here.
          </p>
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
          gap: "10px",
        }}>
          {currentItems.map((item: any, i: number) => (
            <div key={`${item.tmdb_id}-${i}`} style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <FilmPoster
                item={item}
                watched={watchedSet.has(item.tmdb_id)}
                userRating={ratingsMap[item.tmdb_id]}
                onClick={() => navigateTitle(item)}
              />
              {item.character && (
                <p style={{
                  fontFamily: SANS, fontSize: "9px", color: "#504E4A",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  textAlign: "center", fontStyle: "italic",
                }}>
                  {item.character}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <style>{`
        .skeleton {
          background: linear-gradient(90deg, #0F0F0F 25%, #141414 50%, #0F0F0F 75%);
          background-size: 200% 100%;
          animation: skeleton-loading 1.5s ease-in-out infinite;
        }
        @keyframes skeleton-loading {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}