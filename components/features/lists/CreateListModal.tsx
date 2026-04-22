"use client";
import { useState } from "react";
import { X, BookOpen, List, Star, Globe, Lock } from "lucide-react";
import { supabase } from "@/lib/supabase";

const SERIF = "Playfair Display, Georgia, serif";
const SANS = "Inter, system-ui, sans-serif";

interface Props {
  onClose: () => void;
  onCreated: (id: string) => void;
}

export default function CreateListModal({ onClose, onCreated }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isRanked, setIsRanked] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [tags, setTags] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    setSubmitting(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      setSubmitting(false);
      return;
    }

    const tagArr = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const res = await fetch("/api/lists", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        title: title.trim(),
        description,
        is_ranked: isRanked,
        is_public: isPublic,
        tags: tagArr,
      }),
    });
    const data = await res.json();
    if (data.ok) {
      onCreated(data.list.id);
    } else {
      setError(data.error || "Failed to create list.");
      setSubmitting(false);
    }
  }

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 800,
          background: "rgba(0,0,0,0.8)",
          backdropFilter: "blur(8px)",
        }}
      />
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
          zIndex: 801,
          width: "min(480px, 92vw)",
          background: "#141414",
          border: "1px solid #2A2A2A",
          borderRadius: "16px",
          overflow: "hidden",
          boxShadow: "0 32px 80px rgba(0,0,0,0.9)",
        }}
      >
        {/* Gold accent */}
        <div
          style={{
            height: "3px",
            background: "linear-gradient(90deg, #C8A96E, #DFC080, #C8A96E)",
          }}
        />

        <div style={{ padding: "24px 26px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "20px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <BookOpen size={16} color="#C8A96E" />
              <h3
                style={{
                  fontFamily: SERIF,
                  fontSize: "19px",
                  color: "#F0EDE8",
                  fontStyle: "italic",
                  fontWeight: 700,
                }}
              >
                Create a list
              </h3>
            </div>
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#504E4A",
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Title */}
          <div style={{ marginBottom: "14px" }}>
            <label
              style={{
                display: "block",
                fontFamily: SANS,
                fontSize: "10px",
                color: "#504E4A",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                marginBottom: "6px",
              }}
            >
              Title *
            </label>
            <input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setError("");
              }}
              placeholder="Films I watched in a single sitting"
              style={{
                width: "100%",
                background: "#0D0D0D",
                border: `1px solid ${error ? "rgba(138,42,42,0.5)" : "#2A2A2A"}`,
                borderRadius: "8px",
                padding: "10px 14px",
                color: "#F0EDE8",
                fontFamily: SANS,
                fontSize: "14px",
                outline: "none",
              }}
              onFocus={(e) =>
                (e.target.style.borderColor = "rgba(200,169,110,0.4)")
              }
              onBlur={(e) =>
                (e.target.style.borderColor = error
                  ? "rgba(138,42,42,0.5)"
                  : "#2A2A2A")
              }
            />
            {error && (
              <p
                style={{
                  fontFamily: SANS,
                  fontSize: "11px",
                  color: "#C87C2A",
                  marginTop: "4px",
                }}
              >
                {error}
              </p>
            )}
          </div>

          {/* Description */}
          <div style={{ marginBottom: "14px" }}>
            <label
              style={{
                display: "block",
                fontFamily: SANS,
                fontSize: "10px",
                color: "#504E4A",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                marginBottom: "6px",
              }}
            >
              Description <span style={{ color: "#2A2A2A" }}>(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this list about?"
              rows={3}
              style={{
                width: "100%",
                background: "#0D0D0D",
                border: "1px solid #2A2A2A",
                borderRadius: "8px",
                padding: "10px 14px",
                color: "#F0EDE8",
                fontFamily: SANS,
                fontSize: "13px",
                resize: "none",
                outline: "none",
              }}
              onFocus={(e) =>
                (e.target.style.borderColor = "rgba(200,169,110,0.4)")
              }
              onBlur={(e) => (e.target.style.borderColor = "#2A2A2A")}
            />
          </div>

          {/* Tags */}
          <div style={{ marginBottom: "18px" }}>
            <label
              style={{
                display: "block",
                fontFamily: SANS,
                fontSize: "10px",
                color: "#504E4A",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                marginBottom: "6px",
              }}
            >
              Tags <span style={{ color: "#2A2A2A" }}>(comma-separated)</span>
            </label>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="horror, 70s, rewatched"
              style={{
                width: "100%",
                background: "#0D0D0D",
                border: "1px solid #2A2A2A",
                borderRadius: "8px",
                padding: "10px 14px",
                color: "#F0EDE8",
                fontFamily: SANS,
                fontSize: "13px",
                outline: "none",
              }}
              onFocus={(e) =>
                (e.target.style.borderColor = "rgba(200,169,110,0.4)")
              }
              onBlur={(e) => (e.target.style.borderColor = "#2A2A2A")}
            />
          </div>

          {/* Toggles */}
          <div style={{ display: "flex", gap: "10px", marginBottom: "22px" }}>
            {/* Ranked toggle */}
            <button
              onClick={() => setIsRanked(!isRanked)}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 14px",
                borderRadius: "8px",
                border: `1px solid ${isRanked ? "rgba(200,169,110,0.4)" : "#2A2A2A"}`,
                background: isRanked ? "rgba(200,169,110,0.08)" : "transparent",
                color: isRanked ? "#C8A96E" : "#504E4A",
                fontFamily: SANS,
                fontSize: "13px",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              <Star size={13} />
              <div style={{ textAlign: "left" }}>
                <div style={{ fontWeight: 500, fontSize: "12px" }}>Ranked</div>
                <div
                  style={{ fontSize: "10px", opacity: 0.7, marginTop: "1px" }}
                >
                  Shows position numbers
                </div>
              </div>
            </button>

            {/* Visibility toggle */}
            <button
              onClick={() => setIsPublic(!isPublic)}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 14px",
                borderRadius: "8px",
                border: `1px solid ${isPublic ? "rgba(74,158,107,0.35)" : "#2A2A2A"}`,
                background: isPublic ? "rgba(74,158,107,0.08)" : "transparent",
                color: isPublic ? "#4A9E6B" : "#504E4A",
                fontFamily: SANS,
                fontSize: "13px",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {isPublic ? <Globe size={13} /> : <Lock size={13} />}
              <div style={{ textAlign: "left" }}>
                <div style={{ fontWeight: 500, fontSize: "12px" }}>
                  {isPublic ? "Public" : "Private"}
                </div>
                <div
                  style={{ fontSize: "10px", opacity: 0.7, marginTop: "1px" }}
                >
                  {isPublic ? "Visible to everyone" : "Only you can see"}
                </div>
              </div>
            </button>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={onClose}
              style={{
                flex: 1,
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
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={submitting}
              style={{
                flex: 2,
                padding: "11px",
                borderRadius: "8px",
                background: submitting ? "#8A7A5A" : "#C8A96E",
                color: "#0D0D0D",
                fontFamily: SANS,
                fontSize: "13px",
                fontWeight: 600,
                border: "none",
                cursor: submitting ? "not-allowed" : "pointer",
              }}
            >
              {submitting ? "Creating…" : "Create list"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
