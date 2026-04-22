"use client";
import { useState } from "react";
import { X, Star, Globe, Lock } from "lucide-react";
import { supabase } from "@/lib/supabase";

const SERIF = "Playfair Display, Georgia, serif";
const SANS = "Inter, system-ui, sans-serif";

interface Props {
  list: any;
  onClose: () => void;
  onSaved: () => void;
}

export default function EditListModal({ list, onClose, onSaved }: Props) {
  const [title, setTitle] = useState(list.title);
  const [description, setDescription] = useState(list.description || "");
  const [isRanked, setIsRanked] = useState(list.is_ranked);
  const [isPublic, setIsPublic] = useState(list.is_public);
  const [tags, setTags] = useState((list.tags || []).join(", "));
  const [submitting, setSubmitting] = useState(false);

  async function save() {
    if (!title.trim()) return;
    setSubmitting(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setSubmitting(false); return; }

    const tagArr = tags.split(",").map((t) => t.trim()).filter(Boolean);
    await fetch(`/api/lists/${list.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ title: title.trim(), description, is_ranked: isRanked, is_public: isPublic, tags: tagArr }),
    });
    setSubmitting(false);
    onSaved();
    onClose();
  }

  return (
    <>
      <div onClick={onClose} style={{
        position: "fixed", inset: 0, zIndex: 800,
        background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)",
      }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%",
        transform: "translate(-50%,-50%)",
        zIndex: 801,
        width: "min(480px, 92vw)",
        background: "#141414",
        border: "1px solid #2A2A2A",
        borderRadius: "16px",
        overflow: "hidden",
        boxShadow: "0 32px 80px rgba(0,0,0,0.9)",
      }}>
        <div style={{ height: "3px", background: "linear-gradient(90deg, #C8A96E, #DFC080, #C8A96E)" }} />
        <div style={{ padding: "24px 26px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
            <h3 style={{ fontFamily: SERIF, fontSize: "19px", color: "#F0EDE8", fontStyle: "italic", fontWeight: 700 }}>
              Edit list
            </h3>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#504E4A" }}>
              <X size={16} />
            </button>
          </div>

          {[
            { label: "Title", value: title, setValue: setTitle, placeholder: "List title" },
          ].map(({ label, value, setValue, placeholder }) => (
            <div key={label} style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", fontFamily: SANS, fontSize: "10px", color: "#504E4A", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "6px" }}>
                {label}
              </label>
              <input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={placeholder}
                style={{
                  width: "100%", background: "#0D0D0D", border: "1px solid #2A2A2A",
                  borderRadius: "8px", padding: "10px 14px", color: "#F0EDE8",
                  fontFamily: SANS, fontSize: "13px", outline: "none",
                }}
                onFocus={(e) => (e.target.style.borderColor = "rgba(200,169,110,0.4)")}
                onBlur={(e) => (e.target.style.borderColor = "#2A2A2A")}
              />
            </div>
          ))}

          <div style={{ marginBottom: "14px" }}>
            <label style={{ display: "block", fontFamily: SANS, fontSize: "10px", color: "#504E4A", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "6px" }}>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              style={{
                width: "100%", background: "#0D0D0D", border: "1px solid #2A2A2A",
                borderRadius: "8px", padding: "10px 14px", color: "#F0EDE8",
                fontFamily: SANS, fontSize: "13px", resize: "none", outline: "none",
              }}
              onFocus={(e) => (e.target.style.borderColor = "rgba(200,169,110,0.4)")}
              onBlur={(e) => (e.target.style.borderColor = "#2A2A2A")}
            />
          </div>

          <div style={{ marginBottom: "18px" }}>
            <label style={{ display: "block", fontFamily: SANS, fontSize: "10px", color: "#504E4A", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "6px" }}>
              Tags
            </label>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="horror, 70s"
              style={{
                width: "100%", background: "#0D0D0D", border: "1px solid #2A2A2A",
                borderRadius: "8px", padding: "10px 14px", color: "#F0EDE8",
                fontFamily: SANS, fontSize: "13px", outline: "none",
              }}
              onFocus={(e) => (e.target.style.borderColor = "rgba(200,169,110,0.4)")}
              onBlur={(e) => (e.target.style.borderColor = "#2A2A2A")}
            />
          </div>

          <div style={{ display: "flex", gap: "10px", marginBottom: "22px" }}>
            <button onClick={() => setIsRanked(!isRanked)} style={{
              flex: 1, display: "flex", alignItems: "center", gap: "8px",
              padding: "10px 12px", borderRadius: "8px",
              border: `1px solid ${isRanked ? "rgba(200,169,110,0.4)" : "#2A2A2A"}`,
              background: isRanked ? "rgba(200,169,110,0.08)" : "transparent",
              color: isRanked ? "#C8A96E" : "#504E4A",
              fontFamily: SANS, fontSize: "12px", cursor: "pointer",
            }}>
              <Star size={12} /> {isRanked ? "Ranked ✓" : "Ranked"}
            </button>
            <button onClick={() => setIsPublic(!isPublic)} style={{
              flex: 1, display: "flex", alignItems: "center", gap: "8px",
              padding: "10px 12px", borderRadius: "8px",
              border: `1px solid ${isPublic ? "rgba(74,158,107,0.35)" : "#2A2A2A"}`,
              background: isPublic ? "rgba(74,158,107,0.08)" : "transparent",
              color: isPublic ? "#4A9E6B" : "#504E4A",
              fontFamily: SANS, fontSize: "12px", cursor: "pointer",
            }}>
              {isPublic ? <Globe size={12} /> : <Lock size={12} />}
              {isPublic ? "Public" : "Private"}
            </button>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={onClose} style={{
              flex: 1, padding: "11px", borderRadius: "8px",
              background: "transparent", border: "1px solid #2A2A2A",
              color: "#8A8780", fontFamily: SANS, fontSize: "13px", cursor: "pointer",
            }}>
              Cancel
            </button>
            <button onClick={save} disabled={submitting} style={{
              flex: 2, padding: "11px", borderRadius: "8px",
              background: submitting ? "#8A7A5A" : "#C8A96E",
              color: "#0D0D0D", fontFamily: SANS, fontSize: "13px", fontWeight: 600,
              border: "none", cursor: submitting ? "not-allowed" : "pointer",
            }}>
              {submitting ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}