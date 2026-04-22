"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Compass,
  PenLine,
  User,
  Bell,
  Search,
  LogOut,
  TrendingUp,
  Users,
  MessageCircle,
  BookOpen,
  Plus,
} from "lucide-react";
import { QuickLog } from "@/components/features/QuickLog";
import { GlobalSearch } from "@/components/features/GlobalSearch";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";

// ─── DESIGN TOKENS ───────────────────────────────────────────
// Changing SANS from Inter → DM Sans. This is the line that
// actually changes the font across the whole nav.
const SERIF = "Playfair Display, Georgia, serif";
const SANS = "'DM Sans', system-ui, sans-serif";
const MONO = "'DM Mono', 'Courier New', monospace";

// Colors as constants so they're easy to find and change.
// Previously these were scattered inline everywhere.
const C = {
  base: "#0A0A0A",
  surface: "#111111",
  surface2: "#181818",
  border: "#1E1E1E",
  borderMid: "#282828",
  amber: "#C9AA72",
  amberDim: "#A8894E",
  amberGlow: "rgba(201,170,114,0.10)",
  amberGlowMd: "rgba(201,170,114,0.18)",
  textPrimary: "#F2EEE8",
  textSec: "#8C8884",
  textTert: "#524F4B",
  textGhost: "#302E2C",
};

// ─── NAV ITEMS ───────────────────────────────────────────────
const ALL_NAV = [
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/discover", icon: Compass, label: "Discover" },
  { href: "/logbook", icon: BookOpen, label: "Logbook" },
  { href: "/activity", icon: TrendingUp, label: "Community" },
  { href: "/twins", icon: Users, label: "Twins" },
  { href: "/messages", icon: MessageCircle, label: "Messages" },
  { href: "/notifications", icon: Bell, label: "Notifications" },
  { href: "/profile", icon: User, label: "Profile" },
  { href: "/lists", icon: BookOpen, label: "Lists" },
];

const BOTTOM_NAV = [
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/discover", icon: Compass, label: "Discover" },
  { href: "/activity", icon: TrendingUp, label: "Activity" },
  { href: "/profile", icon: User, label: "Profile" },
];

// ─── AVATAR ──────────────────────────────────────────────────
function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const palette = [
    "#4A3D6E",
    "#6E3D3D",
    "#2A4E6E",
    "#2A5C54",
    "#6E5E2A",
    "#6E3D56",
  ];
  const bg = palette[(name?.charCodeAt(0) || 0) % palette.length];
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
        border: `1.5px solid rgba(201,170,114,0.25)`,
        fontFamily: SANS,
        fontSize: size * 0.38,
        fontWeight: 600,
        color: C.textPrimary,
        cursor: "pointer",
        letterSpacing: "0.02em",
      }}
    >
      {(name?.[0] || "?").toUpperCase()}
    </div>
  );
}

// ─── USER MENU (popup above avatar) ──────────────────────────
function UserMenu({ onClose }: { onClose: () => void }) {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const name =
    user?.user_metadata?.username || user?.email?.split("@")[0] || "";

  async function handleSignOut() {
    await signOut();
    onClose();
    router.push("/");
  }

  return (
    <div
      style={{
        position: "absolute",
        bottom: "calc(100% + 10px)",
        left: "8px",
        right: "8px",
        background: C.surface2,
        border: `1px solid ${C.borderMid}`,
        borderRadius: "10px",
        padding: "6px",
        zIndex: 100,
        boxShadow:
          "0 -12px 40px rgba(0,0,0,0.7), 0 0 0 1px rgba(201,170,114,0.05)",
      }}
    >
      {/* User info row */}
      <div
        style={{
          padding: "10px 12px 12px",
          borderBottom: `1px solid ${C.border}`,
          marginBottom: "4px",
        }}
      >
        <p
          style={{
            fontFamily: SANS,
            fontSize: "13px",
            fontWeight: 600,
            color: C.textPrimary,
          }}
        >
          {name}
        </p>
        <p
          style={{
            fontFamily: SANS,
            fontSize: "11px",
            color: C.textTert,
            marginTop: "2px",
          }}
        >
          {user?.email}
        </p>
      </div>

      {/* Menu items */}
      {[
        { label: "Your profile", href: "/profile" },
        { label: "Settings", href: "/settings" },
      ].map(({ label, href }) => (
        <Link
          key={href}
          href={href}
          onClick={onClose}
          style={{
            display: "block",
            padding: "9px 12px",
            borderRadius: "6px",
            fontFamily: SANS,
            fontSize: "13px",
            color: C.textSec,
            textDecoration: "none",
            transition: "background 0.12s, color 0.12s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = C.surface;
            (e.currentTarget as HTMLElement).style.color = C.textPrimary;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "transparent";
            (e.currentTarget as HTMLElement).style.color = C.textSec;
          }}
        >
          {label}
        </Link>
      ))}

      <button
        onClick={handleSignOut}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "9px 12px",
          borderRadius: "6px",
          background: "none",
          border: "none",
          fontFamily: SANS,
          fontSize: "13px",
          color: "#7A3A3A",
          cursor: "pointer",
          transition: "background 0.12s",
          marginTop: "2px",
          borderTop: `1px solid ${C.border}`,
          paddingTop: "10px",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.background = "rgba(139,61,61,0.1)")
        }
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <LogOut size={13} /> Sign out
      </button>
    </div>
  );
}

// ─── SIDEBAR ─────────────────────────────────────────────────
export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [logOpen, setLogOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  const displayName =
    user?.user_metadata?.username || user?.email?.split("@")[0] || "";

  useEffect(() => {
    if (!user) return;
    async function fetchCount() {
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .eq("read", false);
      setUnread(count || 0);
    }
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <>
      <aside
        className="desktop-sidebar"
        style={{
          display: "none",
          flexDirection: "column",
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
          width: "220px",
          // KEY CHANGE: sidebar is a distinct surface, not the same as the page bg.
          // A very subtle gradient from surface → base gives it depth.
          background: `linear-gradient(180deg, #131313 0%, #0E0E0E 100%)`,
          borderRight: `1px solid ${C.border}`,
          zIndex: 40,
          paddingTop: "28px",
          paddingBottom: "20px",
        }}
      >
        {/* ── Logo ── */}
        <div style={{ padding: "0 22px 28px" }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            {/* CHANGE: "taste" in Playfair italic — more editorial, less logo */}
            <h1
              style={{
                fontFamily: SERIF,
                fontStyle: "italic",
                fontSize: "26px",
                fontWeight: 700,
                color: C.amber,
                letterSpacing: "-0.03em",
                lineHeight: 1,
              }}
            >
              taste
            </h1>
          </Link>
          <p
            style={{
              fontFamily: SANS,
              fontSize: "9px",
              color: C.textGhost,
              marginTop: "5px",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              fontWeight: 500,
            }}
          >
            Cinema Identity
          </p>
        </div>

        {/* ── Search ── */}
        <div style={{ padding: "0 12px 20px" }}>
          <button
            onClick={() => setSearchOpen(true)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 12px",
              borderRadius: "6px",
              background: C.surface,
              border: `1px solid ${C.border}`,
              color: C.textTert,
              fontFamily: SANS,
              fontSize: "13px",
              cursor: "pointer",
              justifyContent: "space-between",
              transition: "border-color 0.15s, color 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = C.borderMid;
              (e.currentTarget as HTMLElement).style.color = C.textSec;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = C.border;
              (e.currentTarget as HTMLElement).style.color = C.textTert;
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Search size={13} />
              Search…
            </div>
            <kbd
              style={{
                fontFamily: MONO,
                fontSize: "9px",
                border: `1px solid ${C.border}`,
                borderRadius: "3px",
                padding: "1px 5px",
                color: C.textGhost,
              }}
            >
              ⌘K
            </kbd>
          </button>
        </div>

        {/* ── Nav links ── */}
        <nav style={{ flex: 1, padding: "0 8px", overflowY: "auto" }}>
          {ALL_NAV.map(({ href, icon: Icon, label }) => {
            const active =
              pathname === href ||
              (href !== "/dashboard" && pathname.startsWith(href));
            const isNotif = href === "/notifications";
            return (
              <Link
                key={href}
                href={href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "11px",
                  padding: "9px 14px",
                  borderRadius: "7px",
                  marginBottom: "1px",
                  textDecoration: "none",
                  fontFamily: SANS,
                  fontSize: "13.5px",
                  fontWeight: active ? 500 : 400,
                  // KEY CHANGE: active state has amber left-border accent
                  // and a more visible amber tint. Inactive is truly invisible.
                  background: active ? C.amberGlow : "transparent",
                  color: active ? C.amber : C.textTert,
                  // The left border is the main active signal — cleaner than a box
                  borderLeft: active
                    ? `2px solid ${C.amber}`
                    : "2px solid transparent",
                  paddingLeft: active ? "12px" : "14px",
                  transition:
                    "background 0.12s, color 0.12s, border-color 0.12s",
                  position: "relative",
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    (e.currentTarget as HTMLElement).style.background =
                      `rgba(242,238,232,0.03)`;
                    (e.currentTarget as HTMLElement).style.color = C.textSec;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    (e.currentTarget as HTMLElement).style.background =
                      "transparent";
                    (e.currentTarget as HTMLElement).style.color = C.textTert;
                  }
                }}
              >
                <Icon size={15} strokeWidth={active ? 2 : 1.5} />
                {label}
                {isNotif && unread > 0 && (
                  <span
                    style={{
                      marginLeft: "auto",
                      background: C.amber,
                      color: C.base,
                      borderRadius: "10px",
                      padding: "0 6px",
                      fontFamily: MONO,
                      fontSize: "10px",
                      fontWeight: 700,
                      lineHeight: "18px",
                    }}
                  >
                    {unread > 99 ? "99+" : unread}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* ── Log button ── */}
        <div style={{ padding: "12px 12px 16px" }}>
          {user ? (
            <button
              onClick={() => setLogOpen(true)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "10px",
                borderRadius: "8px",
                // KEY CHANGE: amber button with subtle glow, not just flat fill
                background: C.amber,
                color: C.base,
                fontFamily: SANS,
                fontSize: "13px",
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                boxShadow: `0 2px 12px rgba(201,170,114,0.2)`,
                transition:
                  "background 0.15s, box-shadow 0.15s, transform 0.1s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "#D4B87A";
                (e.currentTarget as HTMLElement).style.boxShadow =
                  "0 4px 20px rgba(201,170,114,0.35)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = C.amber;
                (e.currentTarget as HTMLElement).style.boxShadow =
                  "0 2px 12px rgba(201,170,114,0.2)";
              }}
            >
              <Plus size={15} strokeWidth={2.5} /> Log something
            </button>
          ) : (
            <Link
              href="/auth"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "10px",
                borderRadius: "8px",
                background: C.amber,
                color: C.base,
                fontFamily: SANS,
                fontSize: "13px",
                fontWeight: 600,
                textDecoration: "none",
                boxShadow: `0 2px 12px rgba(201,170,114,0.2)`,
              }}
            >
              <User size={15} /> Sign in
            </Link>
          )}
        </div>

        {/* ── User row at bottom ── */}
        {user && (
          <div
            style={{
              padding: "12px 12px 0",
              borderTop: `1px solid ${C.border}`,
              position: "relative",
            }}
          >
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "8px 10px",
                borderRadius: "8px",
                background: "none",
                border: "none",
                cursor: "pointer",
                transition: "background 0.12s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = C.surface)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <Avatar name={displayName || "U"} size={30} />
              <div style={{ textAlign: "left", flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontFamily: SANS,
                    fontSize: "13px",
                    color: C.textPrimary,
                    fontWeight: 500,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {displayName}
                </p>
                <p
                  style={{
                    fontFamily: SANS,
                    fontSize: "10px",
                    color: C.textTert,
                  }}
                >
                  View profile
                </p>
              </div>
            </button>
            {menuOpen && <UserMenu onClose={() => setMenuOpen(false)} />}
          </div>
        )}
      </aside>

      <style>{`
        @media (min-width: 640px) { .desktop-sidebar { display: flex !important; } }
      `}</style>
      <QuickLog isOpen={logOpen} onClose={() => setLogOpen(false)} />
      <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

// ─── BOTTOM NAV (mobile) ──────────────────────────────────────
export function BottomNav() {
  const pathname = usePathname();
  const [logOpen, setLogOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { user } = useAuth();

  return (
    <>
      <nav
        className="mobile-bottom-nav"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 40,
          // KEY CHANGE: slightly more opaque, warmer border
          background: "rgba(10,10,10,0.97)",
          borderTop: `1px solid ${C.border}`,
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          display: "none",
          // Safe area inset for notched phones
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-around",
            height: "60px",
            padding: "0 4px",
            maxWidth: "480px",
            margin: "0 auto",
          }}
        >
          {/* Left 2 nav items */}
          {BOTTOM_NAV.slice(0, 2).map(({ href, icon: Icon, label }) => {
            const active =
              pathname === href ||
              (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "3px",
                  padding: "6px 14px",
                  textDecoration: "none",
                  color: active ? C.amber : C.textGhost,
                  fontFamily: SANS,
                  fontSize: "10px",
                  fontWeight: active ? 500 : 400,
                  position: "relative",
                  transition: "color 0.12s",
                }}
              >
                <Icon size={20} strokeWidth={active ? 2 : 1.5} />
                {label}
                {/* KEY CHANGE: amber dot below active icon instead of just color change */}
                {active && (
                  <span
                    style={{
                      position: "absolute",
                      bottom: "2px",
                      width: "3px",
                      height: "3px",
                      borderRadius: "50%",
                      background: C.amber,
                    }}
                  />
                )}
              </Link>
            );
          })}

          {/* Center LOG button — physically raised, dominant */}
          {user ? (
            <button
              onClick={() => setLogOpen(true)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "3px",
                background: "none",
                border: "none",
                cursor: "pointer",
                marginBottom: "8px", // lifts it above the nav bar
              }}
            >
              {/* KEY CHANGE: distinct circular amber button, not just another icon */}
              <div
                style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "50%",
                  background: C.amber,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: `0 0 0 3px rgba(201,170,114,0.15), 0 4px 20px rgba(201,170,114,0.3)`,
                  transition:
                    "transform 0.15s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.15s",
                }}
              >
                <Plus size={22} color={C.base} strokeWidth={2.5} />
              </div>
              <span
                style={{
                  color: C.textGhost,
                  fontFamily: SANS,
                  fontSize: "10px",
                }}
              >
                Log
              </span>
            </button>
          ) : (
            <Link
              href="/auth"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "3px",
                textDecoration: "none",
                marginBottom: "8px",
              }}
            >
              <div
                style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "50%",
                  background: C.amber,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: `0 0 0 3px rgba(201,170,114,0.15), 0 4px 20px rgba(201,170,114,0.3)`,
                }}
              >
                <User size={22} color={C.base} />
              </div>
              <span
                style={{
                  color: C.textGhost,
                  fontFamily: SANS,
                  fontSize: "10px",
                }}
              >
                Sign in
              </span>
            </Link>
          )}

          {/* Right 2 nav items */}
          {BOTTOM_NAV.slice(2).map(({ href, icon: Icon, label }) => {
            const active =
              pathname === href ||
              (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "3px",
                  padding: "6px 14px",
                  textDecoration: "none",
                  color: active ? C.amber : C.textGhost,
                  fontFamily: SANS,
                  fontSize: "10px",
                  fontWeight: active ? 500 : 400,
                  position: "relative",
                  transition: "color 0.12s",
                }}
              >
                <Icon size={20} strokeWidth={active ? 2 : 1.5} />
                {label}
                {active && (
                  <span
                    style={{
                      position: "absolute",
                      bottom: "2px",
                      width: "3px",
                      height: "3px",
                      borderRadius: "50%",
                      background: C.amber,
                    }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      <style>{`
        @media (max-width: 639px) { .mobile-bottom-nav { display: block !important; } }
      `}</style>
      <QuickLog isOpen={logOpen} onClose={() => setLogOpen(false)} />
      <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
