"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Film,
  Star,
  BookmarkPlus,
  MessageCircle,
  PenLine,
} from "lucide-react";

const SERIF = "Playfair Display, Georgia, serif";
const SANS = "Inter, system-ui, sans-serif";
const MONO = "JetBrains Mono, Courier New, monospace";

const ACTION_COPY: Record<string, { title: string; desc: string; icon: any }> =
  {
    log: {
      title: "Sign up to log this",
      desc: "Track every film and series you watch. Build your cinematic history.",
      icon: PenLine,
    },
    rate: {
      title: "Sign up to rate",
      desc: "Rate out of 5 stars. Your ratings shape the community score.",
      icon: Star,
    },
    watchlist: {
      title: "Sign up to save",
      desc: "Build your watchlist. Never forget what you want to watch next.",
      icon: BookmarkPlus,
    },
    review: {
      title: "Sign up to review",
      desc: "Write reviews others can read. Build your reputation as a critic.",
      icon: MessageCircle,
    },
    dm: {
      title: "Sign up to message",
      desc: "Send messages, share logs, and tag friends.",
      icon: MessageCircle,
    },
    default: {
      title: "Sign up to continue",
      desc: "Create a free account to unlock logging, ratings, reviews and more.",
      icon: Film,
    },
  };

const PERKS = [
  "Log every film and series you watch",
  "Rate out of 5 stars",
  "Write reviews the community can see",
  "Build your watchlist",
  "Find your Taste Twins",
  "Message other cinephiles",
];

interface AuthGateProps {
  isOpen: boolean;
  onClose: () => void;
  action?: keyof typeof ACTION_COPY;
}

export function AuthGate({
  isOpen,
  onClose,
  action = "default",
}: AuthGateProps) {
  const router = useRouter();
  const copy = ACTION_COPY[action] || ACTION_COPY.default;
  const Icon = copy.icon;

  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 800,
          background: "rgba(0,0,0,0.75)",
          backdropFilter: "blur(6px)",
          animation: "fadeIn 0.15s ease",
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 801,
          width: "100%",
          maxWidth: "400px",
          margin: "0 16px",
          background: "#141414",
          border: "1px solid #2A2A2A",
          borderRadius: "16px",
          overflow: "hidden",
          boxShadow: "0 32px 80px rgba(0,0,0,0.9)",
          animation: "slideUp 0.25s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        {/* Gold top bar */}
        <div
          style={{
            height: "3px",
            background: "linear-gradient(90deg, #C8A96E, #DFC080, #C8A96E)",
          }}
        />

        <div style={{ padding: "28px 28px 24px" }}>
          {/* Close */}
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: "16px",
              right: "16px",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#504E4A",
              padding: "4px",
            }}
          >
            <X size={16} />
          </button>

          {/* Icon */}
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "rgba(200,169,110,0.12)",
              border: "1px solid rgba(200,169,110,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "16px",
            }}
          >
            <Icon size={22} color="#C8A96E" />
          </div>

          {/* Heading */}
          <h2
            style={{
              fontFamily: SERIF,
              fontSize: "22px",
              fontWeight: 700,
              color: "#F0EDE8",
              fontStyle: "italic",
              marginBottom: "8px",
              lineHeight: 1.2,
            }}
          >
            {copy.title}
          </h2>
          <p
            style={{
              fontFamily: SANS,
              fontSize: "13px",
              color: "#8A8780",
              lineHeight: 1.6,
              marginBottom: "20px",
            }}
          >
            {copy.desc}
          </p>

          {/* Perks */}
          <div
            style={{
              background: "#0F0F0F",
              borderRadius: "10px",
              padding: "14px",
              marginBottom: "20px",
            }}
          >
            {PERKS.map((perk, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: i < PERKS.length - 1 ? "8px" : "0",
                }}
              >
                <span
                  style={{ color: "#C8A96E", fontSize: "12px", flexShrink: 0 }}
                >
                  ✓
                </span>
                <span
                  style={{
                    fontFamily: SANS,
                    fontSize: "12px",
                    color: "#8A8780",
                  }}
                >
                  {perk}
                </span>
              </div>
            ))}
          </div>

          {/* CTA buttons */}
          <button
            onClick={() => {
              onClose();
              router.push("/auth");
            }}
            style={{
              width: "100%",
              padding: "13px",
              borderRadius: "8px",
              background: "#C8A96E",
              color: "#0D0D0D",
              fontFamily: SANS,
              fontSize: "14px",
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
              marginBottom: "8px",
            }}
          >
            Create free account
          </button>
          <button
            onClick={() => {
              onClose();
              router.push("/auth");
            }}
            style={{
              width: "100%",
              padding: "11px",
              borderRadius: "8px",
              background: "transparent",
              border: "1px solid #2A2A2A",
              color: "#8A8780",
              fontFamily: SANS,
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            Sign in
          </button>

          <p
            style={{
              fontFamily: SANS,
              fontSize: "10px",
              color: "#504E4A",
              textAlign: "center",
              marginTop: "12px",
            }}
          >
            Free forever · No credit card · No ads
          </p>
        </div>
      </div>
    </>
  );
}

// Hook for easy use anywhere
import { useCallback } from "react";
import { useAuth } from "@/lib/auth-context";

export function useAuthGate() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState<keyof typeof ACTION_COPY>("default");

  // Returns true if user is authed, false + opens gate if not
  const requireAuth = useCallback(
    (a: keyof typeof ACTION_COPY = "default"): boolean => {
      if (user) return true;
      setAction(a);
      setOpen(true);
      return false;
    },
    [user],
  );

  const gate = (
    <AuthGate isOpen={open} onClose={() => setOpen(false)} action={action} />
  );

  return { requireAuth, gate };
}
