"use client";
import { useState } from "react";

const MONO = "JetBrains Mono, Courier New, monospace";

export function StarRating({ value, onChange, readonly = false, size = "md" }: {
  value?: number | null; onChange?: (v: number) => void;
  readonly?: boolean; size?: "sm" | "md" | "lg";
}) {
  const [hover, setHover] = useState<number|null>(null);
  const px = { sm: 12, md: 16, lg: 20 }[size];
  const display = hover ?? value ?? 0;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "2px", cursor: readonly ? "default" : "pointer" }}
      onMouseLeave={() => !readonly && setHover(null)}>
      {[1,2,3,4,5].map(star => {
        const full = display >= star;
        const half = !full && display >= star - 0.5;
        return (
          <div key={star} style={{ position: "relative", width: px, height: px }}
            onMouseMove={e => {
              if (readonly) return;
              const r = e.currentTarget.getBoundingClientRect();
              setHover(e.clientX - r.left < r.width / 2 ? star - 0.5 : star);
            }}
            onClick={() => { if (!readonly && onChange) onChange(hover ?? star); }}>
            <svg width={px} height={px} viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#2A2A2A" />
            </svg>
            {(full || half) && (
              <div style={{ position: "absolute", inset: 0, overflow: "hidden", width: half ? "50%" : "100%" }}>
                <svg width={px} height={px} viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#C8A96E" />
                </svg>
              </div>
            )}
          </div>
        );
      })}
      {value && !readonly && (
        <span style={{ fontFamily: MONO, fontSize: "10px", color: "#8A8780", marginLeft: "4px" }}>{value.toFixed(1)}</span>
      )}
    </div>
  );
}
