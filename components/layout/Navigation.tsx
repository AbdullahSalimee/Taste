"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Compass,
  PenLine,
  User,
  Bell,
  Calendar,
  ListVideo,
  Search,
  LogOut,
  Settings,
} from "lucide-react";
import { QuickLog } from "@/components/features/QuickLog";
import { useAuth } from "@/lib/auth-context";

const SERIF = "Playfair Display, Georgia, serif";
const SANS = "Inter, system-ui, sans-serif";

const ALL_NAV = [
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/discover", icon: Compass, label: "Discover" },
  { href: "/calendar", icon: Calendar, label: "Calendar" },
  { href: "/lists", icon: ListVideo, label: "Lists" },
  { href: "/profile", icon: User, label: "Profile" },
];

const BOTTOM_NAV = [
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/discover", icon: Compass, label: "Discover" },
  { href: "/calendar", icon: Calendar, label: "Calendar" },
  { href: "/profile", icon: User, label: "Profile" },
];

function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const colors = [
    "#5C4A8A",
    "#8A2A2A",
    "#2A5C8A",
    "#2A6A5C",
    "#8A7A2A",
    "#8A2A5C",
  ];
  const bg = colors[name.charCodeAt(0) % colors.length];
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
        border: "2px solid rgba(200,169,110,0.3)",
        fontFamily: SANS,
        fontSize: size * 0.38 + "px",
        fontWeight: 600,
        color: "#F0EDE8",
        cursor: "pointer",
      }}
    >
      {name[0].toUpperCase()}
    </div>
  );
}

function UserMenu({ onClose }: { onClose: () => void }) {
  const { user, signOut } = useAuth();
  const router = useRouter();
  async function handleSignOut() {
    await signOut();
    onClose();
    router.push("/");
  }
  const name =
    user?.user_metadata?.username || user?.email?.split("@")[0] || "";
  return (
    <div
      style={{
        position: "absolute",
        bottom: "calc(100% + 8px)",
        left: "8px",
        right: "8px",
        background: "#141414",
        border: "1px solid #2A2A2A",
        borderRadius: "10px",
        padding: "8px",
        zIndex: 100,
        boxShadow: "0 -8px 32px rgba(0,0,0,0.6)",
      }}
    >
      <div
        style={{
          padding: "10px 12px",
          borderBottom: "1px solid #1A1A1A",
          marginBottom: "6px",
        }}
      >
        <p
          style={{
            fontFamily: SANS,
            fontSize: "13px",
            color: "#F0EDE8",
            fontWeight: 500,
          }}
        >
          {name}
        </p>
        <p
          style={{
            fontFamily: SANS,
            fontSize: "11px",
            color: "#504E4A",
            marginTop: "2px",
          }}
        >
          {user?.email}
        </p>
      </div>
      {[
        { href: "/profile", icon: User, label: "Profile" },
        { href: "/settings", icon: Settings, label: "Settings" },
      ].map(({ href, icon: Icon, label }) => (
        <Link
          key={href}
          href={href}
          onClick={onClose}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "8px 12px",
            borderRadius: "6px",
            textDecoration: "none",
            color: "#8A8780",
            fontFamily: SANS,
            fontSize: "13px",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#1A1A1A")}
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "transparent")
          }
        >
          <Icon size={14} /> {label}
        </Link>
      ))}
      <button
        onClick={handleSignOut}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "8px 12px",
          borderRadius: "6px",
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "#C87C2A",
          fontFamily: SANS,
          fontSize: "13px",
          textAlign: "left",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.background = "rgba(200,124,42,0.1)")
        }
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <LogOut size={14} /> Sign out
      </button>
    </div>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const [logOpen, setLogOpen] = useState(false);
  const { user } = useAuth();

  return (
    <>
      <nav
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 40,
          borderTop: "1px solid #2A2A2A",
          background: "rgba(13,13,13,0.96)",
          backdropFilter: "blur(12px)",
          display: "none",
        }}
        className="mobile-bottom-nav"
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-around",
            padding: "8px",
          }}
        >
          {BOTTOM_NAV.slice(0, 2).map(({ href, icon: Icon, label }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "4px",
                  padding: "6px 16px",
                  borderRadius: "8px",
                  color: active ? "#C8A96E" : "#504E4A",
                  textDecoration: "none",
                  fontFamily: SANS,
                  fontSize: "10px",
                }}
              >
                <Icon size={20} />
                {label}
              </Link>
            );
          })}

          {user ? (
            <button
              onClick={() => setLogOpen(true)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "4px",
                marginTop: "-20px",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  background: "#C8A96E",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 0 20px rgba(200,169,110,0.3)",
                }}
              >
                <PenLine size={22} color="#0D0D0D" />
              </div>
              <span
                style={{ color: "#504E4A", fontFamily: SANS, fontSize: "10px" }}
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
                gap: "4px",
                marginTop: "-20px",
                textDecoration: "none",
              }}
            >
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  background: "#C8A96E",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 0 20px rgba(200,169,110,0.3)",
                }}
              >
                <User size={22} color="#0D0D0D" />
              </div>
              <span
                style={{ color: "#504E4A", fontFamily: SANS, fontSize: "10px" }}
              >
                Sign in
              </span>
            </Link>
          )}

          {BOTTOM_NAV.slice(2).map(({ href, icon: Icon, label }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "4px",
                  padding: "6px 16px",
                  borderRadius: "8px",
                  color: active ? "#C8A96E" : "#504E4A",
                  textDecoration: "none",
                  fontFamily: SANS,
                  fontSize: "10px",
                }}
              >
                <Icon size={20} />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
      <style>{`@media (max-width: 639px) { .mobile-bottom-nav { display: block !important; } }`}</style>
      <QuickLog isOpen={logOpen} onClose={() => setLogOpen(false)} />
    </>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [logOpen, setLogOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useAuth();

  const displayName =
    user?.user_metadata?.username || user?.email?.split("@")[0] || "";

  return (
    <>
      <aside
        style={{
          display: "none",
          flexDirection: "column",
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
          width: "224px",
          borderRight: "1px solid #2A2A2A",
          background: "#0D0D0D",
          zIndex: 40,
          paddingTop: "24px",
          paddingBottom: "24px",
        }}
        className="desktop-sidebar"
      >
        {/* Logo */}
        <div style={{ padding: "0 24px 32px" }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <h1
              style={{
                fontFamily: SERIF,
                fontSize: "24px",
                fontWeight: 700,
                color: "#C8A96E",
                letterSpacing: "-0.02em",
              }}
            >
              taste
            </h1>
          </Link>
          <p
            style={{
              fontFamily: SANS,
              fontSize: "10px",
              color: "#504E4A",
              marginTop: "2px",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
            }}
          >
            Cinema Identity
          </p>
        </div>

        {/* Search */}
        <div style={{ padding: "0 16px 24px" }}>
          <button
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 12px",
              borderRadius: "6px",
              background: "#141414",
              border: "1px solid #2A2A2A",
              color: "#504E4A",
              fontFamily: SANS,
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            <Search size={14} /> Search...
          </button>
        </div>

        {/* Nav links */}
        <nav style={{ flex: 1, padding: "0 8px" }}>
          {ALL_NAV.map(({ href, icon: Icon, label }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "10px 16px",
                  borderRadius: "8px",
                  marginBottom: "2px",
                  background: active ? "rgba(200,169,110,0.1)" : "transparent",
                  border: active
                    ? "1px solid rgba(200,169,110,0.2)"
                    : "1px solid transparent",
                  color: active ? "#C8A96E" : "#8A8780",
                  textDecoration: "none",
                  fontFamily: SANS,
                  fontSize: "14px",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    (e.currentTarget as HTMLElement).style.background =
                      "#141414";
                    (e.currentTarget as HTMLElement).style.color = "#F0EDE8";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    (e.currentTarget as HTMLElement).style.background =
                      "transparent";
                    (e.currentTarget as HTMLElement).style.color = "#8A8780";
                  }
                }}
              >
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Log button or Sign in */}
        <div style={{ padding: "0 16px 16px" }}>
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
                background: "#C8A96E",
                color: "#0D0D0D",
                fontFamily: SANS,
                fontSize: "14px",
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#DFC080")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "#C8A96E")
              }
            >
              <PenLine size={15} /> Log something
            </button>
          ) : (
            <>
              <Link
                href="/auth"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "10px",
                  borderRadius: "8px",
                  background: "#C8A96E",
                  color: "#0D0D0D",
                  fontFamily: SANS,
                  fontSize: "14px",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                <User size={15} /> Sign in
              </Link>
              <p
                style={{
                  fontFamily: SANS,
                  fontSize: "10px",
                  color: "#504E4A",
                  textAlign: "center",
                  marginTop: "6px",
                }}
              >
                or{" "}
                <Link
                  href="/auth"
                  style={{ color: "#C8A96E", textDecoration: "none" }}
                >
                  create account
                </Link>
              </p>
            </>
          )}
        </div>

        {/* Notifications — signed in only */}
        {user && (
          <div style={{ padding: "0 16px 8px" }}>
            <Link
              href="/notifications"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 16px",
                borderRadius: "8px",
                color: "#504E4A",
                textDecoration: "none",
                fontFamily: SANS,
                fontSize: "14px",
              }}
            >
              <Bell size={16} /> Notifications
            </Link>
          </div>
        )}

        {/* User avatar at bottom — signed in only */}
        {user && (
          <div
            style={{
              padding: "8px 16px 0",
              borderTop: "1px solid #1A1A1A",
              marginTop: "8px",
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
                padding: "8px",
                borderRadius: "8px",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#141414")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <Avatar name={displayName || "U"} size={32} />
              <div style={{ textAlign: "left", flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontFamily: SANS,
                    fontSize: "13px",
                    color: "#F0EDE8",
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
                    color: "#504E4A",
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

      <style>{`@media (min-width: 640px) { .desktop-sidebar { display: flex !important; } }`}</style>
      <QuickLog isOpen={logOpen} onClose={() => setLogOpen(false)} />
    </>
  );
}
