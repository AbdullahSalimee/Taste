"use client";
import { X } from "lucide-react";
import Link from "next/link";

const SERIF = "Playfair Display, Georgia, serif";
const SANS = "Inter, system-ui, sans-serif";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  action: string; // e.g. "add a log", "post a review", "like this"
}

export default function AuthModal({ isOpen, onClose, action }: AuthModalProps) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 300,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      {/* Backdrop */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.85)",
          backdropFilter: "blur(8px)",
        }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "420px",
          background: "#141414",
          borderRadius: "16px",
          border: "1px solid #2A2A2A",
          padding: "32px 28px",
          zIndex: 1,
        }}
      >
        {/* Close button */}
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
          <X size={20} />
        </button>

        {/* Icon */}
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            background: "rgba(200,169,110,0.1)",
            border: "2px solid rgba(200,169,110,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
          }}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#C8A96E"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>

        {/* Title */}
        <h3
          style={{
            fontFamily: SERIF,
            fontSize: "22px",
            fontWeight: 700,
            color: "#F0EDE8",
            textAlign: "center",
            marginBottom: "10px",
            fontStyle: "italic",
          }}
        >
          Sign up to continue
        </h3>

        {/* Description */}
        <p
          style={{
            fontFamily: SANS,
            fontSize: "14px",
            color: "#8A8780",
            textAlign: "center",
            marginBottom: "28px",
            lineHeight: 1.5,
          }}
        >
          You need an account to {action}. Join Taste to track your films, share
          reviews, and connect with others.
        </p>

        {/* CTA Button */}
        <Link
          href="/auth"
          style={{
            display: "block",
            width: "100%",
            padding: "14px",
            borderRadius: "10px",
            background: "#C8A96E",
            color: "#0D0D0D",
            fontFamily: SANS,
            fontSize: "15px",
            fontWeight: 600,
            textAlign: "center",
            textDecoration: "none",
            marginBottom: "12px",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#D4B57A";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#C8A96E";
          }}
        >
          Sign up for free
        </Link>

        {/* Secondary */}
        <p
          style={{
            fontFamily: SANS,
            fontSize: "13px",
            color: "#504E4A",
            textAlign: "center",
          }}
        >
          Already have an account?{" "}
          <Link
            href="/auth"
            style={{
              color: "#C8A96E",
              textDecoration: "none",
            }}
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
