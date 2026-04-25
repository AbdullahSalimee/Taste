"use client";
import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";
import LetterboxdImport from "@/components/features/LetterboxdImport";
import { useLogs } from "@/lib/hooks";

const SANS = "Inter, system-ui, sans-serif";
const SERIF = "Playfair Display, Georgia, serif";

const DISMISSED_KEY = "taste_lb_import_dismissed";
const DONE_KEY = "taste_lb_import_done";

// ── Banner — shown in dashboard when user has < 20 logs and hasn't dismissed ──
export function LetterboxdImportBanner() {
  const logs = useLogs();
  const [ready, setReady] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [done, setDone] = useState(false);
  const [open, setOpen] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

  // Read localStorage only on client after mount
  useEffect(() => {
    setDismissed(!!localStorage.getItem(DISMISSED_KEY));
    setDone(!!localStorage.getItem(DONE_KEY));
    setReady(true);
  }, []);

  // Don't render anything until we've read localStorage (avoids flash)
  if (!ready) return null;

  // Hide if user dismissed, already imported, or has a real library (≥20 logs)
  if (dismissed || done || logs.length >= 20) return null;

  function handleDismiss() {
    localStorage.setItem(DISMISSED_KEY, "1");
    setDismissed(true);
  }

  function handleComplete(count: number) {
    setImportedCount(count);
    localStorage.setItem(DONE_KEY, "1");
    setDone(true);
    setOpen(false);
    setShowSuccess(true);
  }

  if (showSuccess) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "12px 18px",
          background: "rgba(200,169,110,0.06)",
          border: "1px solid rgba(200,169,110,0.18)",
          borderRadius: "12px",
          marginBottom: "24px",
        }}
      >
        <span style={{ fontSize: "18px" }}>✓</span>
        <p style={{ fontFamily: SANS, fontSize: "13px", color: "#C8A96E" }}>
          <strong>{importedCount.toLocaleString()} films</strong> imported from
          Letterboxd. Welcome home.
        </p>
      </div>
    );
  }

  return (
    <>
      <div
        style={{
          position: "relative",
          background: "#0F0F0F",
          border: "1px solid rgba(200,169,110,0.14)",
          borderRadius: "14px",
          padding: "16px 18px",
          marginBottom: "24px",
          overflow: "hidden",
        }}
      >
        {/* Decorative film-strip edge */}
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: "80px",
            height: "100%",
            background:
              "repeating-linear-gradient(0deg, transparent, transparent 10px, rgba(200,169,110,0.025) 10px, rgba(200,169,110,0.025) 12px)",
            pointerEvents: "none",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: "10px",
              flexShrink: 0,
              background: "rgba(200,169,110,0.09)",
              border: "1px solid rgba(200,169,110,0.18)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
            }}
          >
            🎞
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontFamily: SERIF,
                fontSize: "14px",
                fontWeight: 700,
                color: "#F0EDE8",
                fontStyle: "italic",
                marginBottom: "2px",
              }}
            >
              Coming from Letterboxd?
            </p>
            <p style={{ fontFamily: SANS, fontSize: "12px", color: "#8A8780" }}>
              Import your entire watch history in seconds — ratings included.
            </p>
          </div>

          <button
            onClick={() => setOpen(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              borderRadius: "8px",
              background: "#C8A96E",
              color: "#0D0D0D",
              fontFamily: SANS,
              fontSize: "12px",
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
              flexShrink: 0,
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#D4B57A")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#C8A96E")}
          >
            <Download size={12} /> Import
          </button>

          <button
            onClick={handleDismiss}
            title="Dismiss"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#504E4A",
              padding: "4px",
              flexShrink: 0,
              borderRadius: "4px",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#8A8780")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#504E4A")}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {open && (
        <LetterboxdImport
          onClose={() => setOpen(false)}
          onImportComplete={handleComplete}
        />
      )}
    </>
  );
}

// ── Standalone button — use in Settings / Profile pages ───────────────────────
export function LetterboxdImportButton() {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    setDone(!!localStorage.getItem(DONE_KEY));
  }, []);

  function handleComplete(c: number) {
    setCount(c);
    localStorage.setItem(DONE_KEY, "1");
    setDone(true);
    setOpen(false);
  }

  if (done) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "10px 14px",
          background: "rgba(74,158,107,0.07)",
          border: "1px solid rgba(74,158,107,0.18)",
          borderRadius: "8px",
        }}
      >
        <span>✓</span>
        <span style={{ fontFamily: SANS, fontSize: "12px", color: "#4A9E6B" }}>
          Letterboxd imported
          {count > 0 ? ` · ${count.toLocaleString()} films` : ""}
        </span>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "10px 16px",
          borderRadius: "8px",
          background: "transparent",
          border: "1px solid rgba(200,169,110,0.22)",
          color: "#C8A96E",
          fontFamily: SANS,
          fontSize: "13px",
          cursor: "pointer",
          width: "100%",
          transition: "all 0.15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(200,169,110,0.06)";
          e.currentTarget.style.borderColor = "rgba(200,169,110,0.4)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.borderColor = "rgba(200,169,110,0.22)";
        }}
      >
        <span style={{ fontSize: "16px" }}>🎞</span>
        Import from Letterboxd
      </button>

      {open && (
        <LetterboxdImport
          onClose={() => setOpen(false)}
          onImportComplete={handleComplete}
        />
      )}
    </>
  );
}
