"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, PenLine, User, Bell, Calendar, ListVideo, Search } from "lucide-react";
import { QuickLog } from "@/components/features/QuickLog";

const SERIF = "Playfair Display, Georgia, serif";
const SANS  = "Inter, system-ui, sans-serif";

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

export function BottomNav() {
  const pathname = usePathname();
  const [logOpen, setLogOpen] = useState(false);

  return (
    <>
      <nav style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 40,
        borderTop: "1px solid #2A2A2A",
        background: "rgba(13,13,13,0.96)",
        backdropFilter: "blur(12px)",
        display: "none",
      }} className="mobile-bottom-nav">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around", padding: "8px 8px" }}>
          {BOTTOM_NAV.slice(0, 2).map(({ href, icon: Icon, label }) => {
            const active = pathname.startsWith(href);
            return (
              <Link key={href} href={href} style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: "4px",
                padding: "6px 16px", borderRadius: "8px",
                color: active ? "#C8A96E" : "#504E4A",
                textDecoration: "none", fontFamily: SANS, fontSize: "10px",
              }}>
                <Icon size={20} />
                {label}
              </Link>
            );
          })}
          <button onClick={() => setLogOpen(true)} style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: "4px",
            marginTop: "-20px", background: "none", border: "none", cursor: "pointer",
          }}>
            <div style={{
              width: "56px", height: "56px", borderRadius: "50%",
              background: "#C8A96E", display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 20px rgba(200,169,110,0.3)",
            }}>
              <PenLine size={22} color="#0D0D0D" />
            </div>
            <span style={{ color: "#504E4A", fontFamily: SANS, fontSize: "10px" }}>Log</span>
          </button>
          {BOTTOM_NAV.slice(2).map(({ href, icon: Icon, label }) => {
            const active = pathname.startsWith(href);
            return (
              <Link key={href} href={href} style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: "4px",
                padding: "6px 16px", borderRadius: "8px",
                color: active ? "#C8A96E" : "#504E4A",
                textDecoration: "none", fontFamily: SANS, fontSize: "10px",
              }}>
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

  return (
    <>
      <aside style={{
        display: "none",
        flexDirection: "column",
        position: "fixed",
        left: 0, top: 0, bottom: 0,
        width: "224px",
        borderRight: "1px solid #2A2A2A",
        background: "#0D0D0D",
        zIndex: 40,
        paddingTop: "24px",
        paddingBottom: "24px",
      }} className="desktop-sidebar">
        {/* Logo */}
        <div style={{ padding: "0 24px 32px" }}>
          <h1 style={{ fontFamily: SERIF, fontSize: "24px", fontWeight: 700, color: "#C8A96E", letterSpacing: "-0.02em" }}>
            taste
          </h1>
          <p style={{ fontFamily: SANS, fontSize: "10px", color: "#504E4A", marginTop: "2px", letterSpacing: "0.15em", textTransform: "uppercase" }}>
            Cinema Identity
          </p>
        </div>

        {/* Search */}
        <div style={{ padding: "0 16px 24px" }}>
          <button style={{
            width: "100%", display: "flex", alignItems: "center", gap: "8px",
            padding: "8px 12px", borderRadius: "6px",
            background: "#141414", border: "1px solid #2A2A2A",
            color: "#504E4A", fontFamily: SANS, fontSize: "14px", cursor: "pointer",
          }}>
            <Search size={14} /> Search...
          </button>
        </div>

        {/* Nav links */}
        <nav style={{ flex: 1, padding: "0 8px" }}>
          {ALL_NAV.map(({ href, icon: Icon, label }) => {
            const active = pathname.startsWith(href);
            return (
              <Link key={href} href={href} style={{
                display: "flex", alignItems: "center", gap: "12px",
                padding: "10px 16px", borderRadius: "8px", marginBottom: "2px",
                background: active ? "rgba(200,169,110,0.1)" : "transparent",
                border: active ? "1px solid rgba(200,169,110,0.2)" : "1px solid transparent",
                color: active ? "#C8A96E" : "#8A8780",
                textDecoration: "none", fontFamily: SANS, fontSize: "14px",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = "#141414"; (e.currentTarget as HTMLElement).style.color = "#F0EDE8"; } }}
              onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "#8A8780"; } }}
              >
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Log button */}
        <div style={{ padding: "0 16px 16px" }}>
          <button onClick={() => setLogOpen(true)} style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            padding: "10px", borderRadius: "8px",
            background: "#C8A96E", color: "#0D0D0D",
            fontFamily: SANS, fontSize: "14px", fontWeight: 600,
            border: "none", cursor: "pointer", transition: "background 0.15s ease",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#DFC080"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#C8A96E"; }}>
            <PenLine size={15} />
            Log something
          </button>
        </div>

        {/* Notifications */}
        <div style={{ padding: "0 16px" }}>
          <Link href="/notifications" style={{
            display: "flex", alignItems: "center", gap: "12px",
            padding: "10px 16px", borderRadius: "8px",
            color: "#504E4A", textDecoration: "none", fontFamily: SANS, fontSize: "14px",
          }}>
            <div style={{ position: "relative" }}>
              <Bell size={16} />
              <span style={{
                position: "absolute", top: "-4px", right: "-4px",
                width: "8px", height: "8px", borderRadius: "50%", background: "#C8A96E",
              }} />
            </div>
            Notifications
          </Link>
        </div>
      </aside>

      <style>{`@media (min-width: 640px) { .desktop-sidebar { display: flex !important; } }`}</style>
      <QuickLog isOpen={logOpen} onClose={() => setLogOpen(false)} />
    </>
  );
}
