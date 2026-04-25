"use client";
import { useState, useRef } from "react";
import {
  X,
  Upload,
  Film,
  Check,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Download,
} from "lucide-react";
import { addLog, getLogs } from "@/lib/store";

const SERIF = "Playfair Display, Georgia, serif";
const SANS = "Inter, system-ui, sans-serif";
const MONO = "JetBrains Mono, Courier New, monospace";

// ─────────────────────────────────────────────────────────────────────────────
// Letterboxd CSV column formats:
//
// watched.csv  → Date, Name, Year, Letterboxd URI, Rating
// diary.csv    → Date, Name, Year, Letterboxd URI, Rating, Rewatch, Tags, Watched Date
// ratings.csv  → Date, Name, Year, Letterboxd URI, Rating
//
// All files always have: Name, Year. Rating may be empty.
// ─────────────────────────────────────────────────────────────────────────────

interface LetterboxdRow {
  title: string;
  year: number;
  rating: number | null; // Letterboxd uses 0.5–5.0 scale already
  watchedDate: string;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function parseLetterboxdCSV(text: string): LetterboxdRow[] {
  const lines = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim()
    .split("\n");
  if (lines.length < 2) return [];

  // Build column index map from header — case-insensitive
  const headerCells = parseCSVLine(lines[0]);
  const col: Record<string, number> = {};
  headerCells.forEach((h, i) => {
    col[h.toLowerCase().trim()] = i;
  });

  // "Name" column is required
  const nameIdx = col["name"] ?? -1;
  if (nameIdx === -1) return [];

  const yearIdx = col["year"] ?? -1;
  const ratingIdx = col["rating"] ?? -1;
  // diary.csv has "Watched Date"; watched.csv and ratings.csv have "Date"
  const dateIdx = col["watched date"] ?? col["date"] ?? -1;

  const rows: LetterboxdRow[] = [];
  const seen = new Set<string>(); // deduplicate (diary has one row per watch)

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cells = parseCSVLine(line);
    const title = (nameIdx >= 0 ? cells[nameIdx] : "").trim();
    if (!title) continue;

    const year = yearIdx >= 0 ? parseInt(cells[yearIdx]) || 0 : 0;
    const rawRating = ratingIdx >= 0 ? cells[ratingIdx]?.trim() : "";
    const rating = rawRating ? parseFloat(rawRating) || null : null;
    const dateRaw = dateIdx >= 0 ? cells[dateIdx]?.trim() : "";
    const watchedDate = dateRaw || new Date().toISOString().split("T")[0];

    // Dedup by title+year — keep only the first entry (most recent in diary)
    const key = `${title.toLowerCase()}||${year}`;
    if (seen.has(key)) continue;
    seen.add(key);

    rows.push({ title, year, rating, watchedDate });
  }

  return rows;
}

// ─────────────────────────────────────────────────────────────────────────────
// TMDB lookup via our own /api/search endpoint
// Filters to movies only (Letterboxd is film-focused)
// Returns best match or null
// ─────────────────────────────────────────────────────────────────────────────
async function findMovie(title: string, year: number): Promise<any | null> {
  try {
    const res = await fetch(
      `/api/search?q=${encodeURIComponent(title)}&type=movie`,
    );
    if (!res.ok) return null;
    const data = await res.json();

    // Filter to movies only — no TV
    const results: any[] = (data.results || []).filter(
      (r: any) => r.media_type === "movie" || r.type === "film",
    );
    if (!results.length) return null;

    // Priority 1: exact title + exact year
    if (year) {
      const exact = results.find(
        (r) =>
          r.title?.toLowerCase() === title.toLowerCase() && r.year === year,
      );
      if (exact) return exact;

      // Priority 2: exact title + ±1 year (theatrical vs release year gaps)
      const nearYear = results.find(
        (r) =>
          r.title?.toLowerCase() === title.toLowerCase() &&
          Math.abs((r.year || 0) - year) <= 1,
      );
      if (nearYear) return nearYear;
    }

    // Priority 3: title match, any year
    const titleOnly = results.find(
      (r) => r.title?.toLowerCase() === title.toLowerCase(),
    );
    if (titleOnly) return titleOnly;

    // Priority 4: first result
    return results[0];
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  onClose: () => void;
  onImportComplete: (count: number) => void;
}

type Step = "upload" | "preview" | "importing" | "done";

export default function LetterboxdImport({ onClose, onImportComplete }: Props) {
  const [step, setStep] = useState<Step>("upload");
  const [dragOver, setDragOver] = useState(false);
  const [rows, setRows] = useState<LetterboxdRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [showAll, setShowAll] = useState(false);

  const [progress, setProgress] = useState(0);
  const [imported, setImported] = useState(0);
  const [skippedDup, setSkippedDup] = useState(0);
  const [skippedMiss, setSkippedMiss] = useState(0);

  const fileRef = useRef<HTMLInputElement>(null);

  // ── File handling ──────────────────────────────────────────────────────────
  function handleFile(file: File) {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError(
        "Please upload a .csv file — use diary.csv, watched.csv, or ratings.csv from your Letterboxd export.",
      );
      return;
    }
    setError("");
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseLetterboxdCSV(text);
      if (!parsed.length) {
        setError(
          "No films found. Make sure you're uploading diary.csv, watched.csv, or ratings.csv from your Letterboxd data export.",
        );
        return;
      }
      setRows(parsed);
      setStep("preview");
    };
    reader.readAsText(file, "utf-8");
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  // ── Import loop ────────────────────────────────────────────────────────────
  async function runImport() {
    setStep("importing");

    let done = 0;
    let dups = 0;
    let misses = 0;

    // Snapshot of already-logged tmdb_ids — anything in here gets skipped
    const existingIds = new Set(getLogs().map((l) => l.tmdb_id));

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      try {
        const match = await findMovie(row.title, row.year);

        if (!match) {
          misses++;
        } else {
          const tmdbId = match.tmdb_id ?? match.id;

          if (existingIds.has(tmdbId)) {
            dups++;
          } else {
            await addLog({
              tmdb_id: tmdbId,
              type: "film",
              media_type: "movie",
              title: match.title || row.title,
              poster_url: match.poster_url || null,
              year: match.year || row.year,
              tmdb_rating: match.tmdb_rating || 0,
              user_rating: row.rating,
              note: null,
              status: "watched",
              genres: match.genres || [],
              director: match.director || undefined,
            });
            existingIds.add(tmdbId); // prevent re-adding if CSV had duplicates
            done++;
          }
        }
      } catch {
        misses++;
      }

      setProgress(Math.round(((i + 1) / rows.length) * 100));
      setImported(done);
      setSkippedDup(dups);
      setSkippedMiss(misses);

      // Throttle every 5 items to avoid overwhelming the search API
      if ((i + 1) % 5 === 0) {
        await new Promise((r) => setTimeout(r, 250));
      }
    }

    setStep("done");
    onImportComplete(done);
  }

  const previewRows = showAll ? rows : rows.slice(0, 10);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => step !== "importing" && onClose()}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 500,
          background: "rgba(0,0,0,0.88)",
          backdropFilter: "blur(12px)",
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 501,
          width: "min(580px, 95vw)",
          maxHeight: "90vh",
          background: "#0D0D0D",
          border: "1px solid #2A2A2A",
          borderRadius: "18px",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 40px 120px rgba(0,0,0,0.95)",
        }}
      >
        {/* Gold top line */}
        <div
          style={{
            height: "3px",
            flexShrink: 0,
            background:
              "linear-gradient(90deg, #6A4A1A, #C8A96E, #F0D080, #C8A96E, #6A4A1A)",
          }}
        />

        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 24px 16px",
            borderBottom: "1px solid #1A1A1A",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: "8px",
                background: "rgba(200,169,110,0.1)",
                border: "1px solid rgba(200,169,110,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
              }}
            >
              🎞
            </div>
            <div>
              <h3
                style={{
                  fontFamily: SERIF,
                  fontSize: "19px",
                  fontWeight: 700,
                  color: "#F0EDE8",
                  fontStyle: "italic",
                }}
              >
                Import from Letterboxd
              </h3>
              <p
                style={{
                  fontFamily: SANS,
                  fontSize: "11px",
                  color: "#504E4A",
                  marginTop: "1px",
                }}
              >
                Bring your entire watch history over — ratings included
              </p>
            </div>
          </div>
          {step !== "importing" && (
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#504E4A",
                padding: "4px",
                borderRadius: "6px",
              }}
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
          {/* ══ UPLOAD ══════════════════════════════════════════════════════ */}
          {step === "upload" && (
            <>
              <div
                style={{
                  background: "#111",
                  border: "1px solid #1A1A1A",
                  borderLeft: "3px solid rgba(200,169,110,0.4)",
                  borderRadius: "0 8px 8px 0",
                  padding: "14px 16px",
                  marginBottom: "20px",
                }}
              >
                <p
                  style={{
                    fontFamily: SANS,
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#C8A96E",
                    marginBottom: "10px",
                  }}
                >
                  How to export from Letterboxd:
                </p>
                {[
                  "Go to letterboxd.com → Settings → Data",
                  'Click "Export Your Data" — you\'ll get a zip by email',
                  "Unzip it. You'll see diary.csv, watched.csv, ratings.csv",
                  "Upload any of those here (diary.csv is the most complete)",
                ].map((s, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      gap: "10px",
                      marginBottom: "7px",
                      alignItems: "flex-start",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: MONO,
                        fontSize: "10px",
                        color: "#C8A96E",
                        background: "rgba(200,169,110,0.1)",
                        border: "1px solid rgba(200,169,110,0.2)",
                        borderRadius: "3px",
                        padding: "1px 6px",
                        flexShrink: 0,
                        marginTop: "1px",
                      }}
                    >
                      {i + 1}
                    </span>
                    <p
                      style={{
                        fontFamily: SANS,
                        fontSize: "12px",
                        color: "#8A8780",
                        lineHeight: 1.5,
                      }}
                    >
                      {s}
                    </p>
                  </div>
                ))}
                <a
                  href="https://letterboxd.com/settings/data/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    marginTop: "6px",
                    fontFamily: SANS,
                    fontSize: "11px",
                    color: "#4A9E6B",
                    textDecoration: "none",
                  }}
                >
                  <Download size={11} /> Open Letterboxd export page →
                </a>
              </div>

              {/* Drop zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                style={{
                  border: `2px dashed ${dragOver ? "rgba(200,169,110,0.7)" : "#2A2A2A"}`,
                  borderRadius: "12px",
                  padding: "44px 24px",
                  textAlign: "center",
                  cursor: "pointer",
                  background: dragOver
                    ? "rgba(200,169,110,0.05)"
                    : "transparent",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor =
                    "rgba(200,169,110,0.35)";
                  (e.currentTarget as HTMLElement).style.background =
                    "rgba(200,169,110,0.02)";
                }}
                onMouseLeave={(e) => {
                  if (!dragOver) {
                    (e.currentTarget as HTMLElement).style.borderColor =
                      "#2A2A2A";
                    (e.currentTarget as HTMLElement).style.background =
                      "transparent";
                  }
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "12px",
                    background: "rgba(200,169,110,0.08)",
                    border: "1px solid rgba(200,169,110,0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 16px",
                  }}
                >
                  <Upload size={22} color="#C8A96E" />
                </div>
                <p
                  style={{
                    fontFamily: SERIF,
                    fontSize: "18px",
                    color: "#F0EDE8",
                    fontStyle: "italic",
                    marginBottom: "6px",
                  }}
                >
                  Drop your CSV file here
                </p>
                <p
                  style={{
                    fontFamily: SANS,
                    fontSize: "12px",
                    color: "#504E4A",
                  }}
                >
                  or click to browse — diary.csv, watched.csv, or ratings.csv
                </p>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                    e.target.value = "";
                  }}
                />
              </div>

              {error && (
                <div
                  style={{
                    marginTop: "14px",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    padding: "12px 14px",
                    background: "rgba(138,42,42,0.1)",
                    border: "1px solid rgba(138,42,42,0.3)",
                    borderRadius: "8px",
                  }}
                >
                  <AlertCircle
                    size={15}
                    color="#C87C2A"
                    style={{ flexShrink: 0, marginTop: "1px" }}
                  />
                  <p
                    style={{
                      fontFamily: SANS,
                      fontSize: "12px",
                      color: "#C87C2A",
                      lineHeight: 1.5,
                    }}
                  >
                    {error}
                  </p>
                </div>
              )}
            </>
          )}

          {/* ══ PREVIEW ══════════════════════════════════════════════════════ */}
          {step === "preview" && (
            <>
              <div
                style={{
                  background: "rgba(74,158,107,0.07)",
                  border: "1px solid rgba(74,158,107,0.18)",
                  borderRadius: "10px",
                  padding: "14px 18px",
                  marginBottom: "20px",
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: "rgba(74,158,107,0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Film size={17} color="#4A9E6B" />
                </div>
                <div>
                  <p
                    style={{
                      fontFamily: SANS,
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "#4A9E6B",
                      marginBottom: "2px",
                    }}
                  >
                    {rows.length.toLocaleString()} films found in{" "}
                    <span style={{ color: "#8A8780", fontWeight: 400 }}>
                      {fileName}
                    </span>
                  </p>
                  <p
                    style={{
                      fontFamily: SANS,
                      fontSize: "11px",
                      color: "#504E4A",
                    }}
                  >
                    Films already in your log will be skipped automatically
                  </p>
                </div>
              </div>

              <p
                style={{
                  fontFamily: SANS,
                  fontSize: "10px",
                  color: "#504E4A",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  marginBottom: "10px",
                }}
              >
                Preview — first {Math.min(rows.length, 10)} of {rows.length}
              </p>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "3px",
                  marginBottom: "10px",
                }}
              >
                {previewRows.map((row, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "9px 12px",
                      background: "#111",
                      border: "1px solid #1A1A1A",
                      borderRadius: "8px",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: MONO,
                        fontSize: "10px",
                        color: "#2A2A2A",
                        width: "22px",
                        textAlign: "right",
                        flexShrink: 0,
                      }}
                    >
                      {i + 1}
                    </span>
                    <p
                      style={{
                        flex: 1,
                        fontFamily: SANS,
                        fontSize: "13px",
                        color: "#F0EDE8",
                        fontWeight: 500,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {row.title}
                    </p>
                    <span
                      style={{
                        fontFamily: MONO,
                        fontSize: "10px",
                        color: "#504E4A",
                        flexShrink: 0,
                      }}
                    >
                      {row.year || "—"}
                    </span>
                    {row.rating != null && (
                      <span
                        style={{
                          fontFamily: MONO,
                          fontSize: "10px",
                          color: "#C8A96E",
                          flexShrink: 0,
                        }}
                      >
                        ★ {row.rating}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {rows.length > 10 && (
                <button
                  onClick={() => setShowAll((v) => !v)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: SANS,
                    fontSize: "11px",
                    color: "#504E4A",
                    padding: 0,
                    marginBottom: "16px",
                  }}
                >
                  {showAll ? (
                    <>
                      <ChevronUp size={12} /> Show less
                    </>
                  ) : (
                    <>
                      <ChevronDown size={12} /> Show all {rows.length} films
                    </>
                  )}
                </button>
              )}

              <div
                style={{
                  background: "#111",
                  border: "1px solid #1A1A1A",
                  borderRadius: "8px",
                  padding: "12px 14px",
                }}
              >
                <p
                  style={{
                    fontFamily: SANS,
                    fontSize: "11px",
                    color: "#504E4A",
                    lineHeight: 1.65,
                  }}
                >
                  <strong style={{ color: "#8A8780" }}>
                    What gets imported:
                  </strong>{" "}
                  film title, year, and your star rating. Films already in your
                  log are automatically skipped. Notes/reviews aren't included
                  in Letterboxd exports.
                </p>
              </div>
            </>
          )}

          {/* ══ IMPORTING ════════════════════════════════════════════════════ */}
          {step === "importing" && (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <div style={{ marginBottom: "28px" }}>
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: "50%",
                    border: "3px solid #1A1A1A",
                    borderTopColor: "#C8A96E",
                    animation: "spinReel 1s linear infinite",
                    margin: "0 auto 20px",
                    position: "relative",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%,-50%)",
                      fontSize: "26px",
                      pointerEvents: "none",
                    }}
                  >
                    🎞
                  </span>
                </div>
                <h3
                  style={{
                    fontFamily: SERIF,
                    fontSize: "22px",
                    color: "#F0EDE8",
                    fontStyle: "italic",
                    marginBottom: "6px",
                  }}
                >
                  Importing your films…
                </h3>
                <p
                  style={{
                    fontFamily: SANS,
                    fontSize: "12px",
                    color: "#504E4A",
                  }}
                >
                  Matching each title to our database of 176,000+ films
                </p>
              </div>

              <div
                style={{
                  background: "#1A1A1A",
                  borderRadius: "8px",
                  height: "8px",
                  overflow: "hidden",
                  marginBottom: "16px",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${progress}%`,
                    background: "linear-gradient(90deg, #C8A96E, #F0D080)",
                    borderRadius: "8px",
                    transition: "width 0.4s ease",
                  }}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "8px",
                }}
              >
                <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
                  <span
                    style={{
                      fontFamily: MONO,
                      fontSize: "11px",
                      color: "#C8A96E",
                    }}
                  >
                    ✓ {imported} added
                  </span>
                  {skippedDup > 0 && (
                    <span
                      style={{
                        fontFamily: MONO,
                        fontSize: "11px",
                        color: "#504E4A",
                      }}
                    >
                      = {skippedDup} already logged
                    </span>
                  )}
                  {skippedMiss > 0 && (
                    <span
                      style={{
                        fontFamily: MONO,
                        fontSize: "11px",
                        color: "#504E4A",
                      }}
                    >
                      ? {skippedMiss} not found
                    </span>
                  )}
                </div>
                <span
                  style={{
                    fontFamily: MONO,
                    fontSize: "11px",
                    color: "#504E4A",
                  }}
                >
                  {progress}%
                </span>
              </div>

              <p
                style={{
                  fontFamily: SANS,
                  fontSize: "11px",
                  color: "#2A2A2A",
                  marginTop: "24px",
                }}
              >
                Don't close this window
              </p>
            </div>
          )}

          {/* ══ DONE ═════════════════════════════════════════════════════════ */}
          {step === "done" && (
            <div style={{ textAlign: "center", padding: "10px 0" }}>
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  background: "rgba(200,169,110,0.1)",
                  border: "2px solid rgba(200,169,110,0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px",
                }}
              >
                <Check size={32} color="#C8A96E" strokeWidth={2.5} />
              </div>

              <h3
                style={{
                  fontFamily: SERIF,
                  fontSize: "26px",
                  fontWeight: 700,
                  color: "#F0EDE8",
                  fontStyle: "italic",
                  marginBottom: "10px",
                }}
              >
                Import complete!
              </h3>
              <p
                style={{
                  fontFamily: SANS,
                  fontSize: "13px",
                  color: "#8A8780",
                  marginBottom: "28px",
                  lineHeight: 1.7,
                }}
              >
                {imported > 0 && (
                  <>
                    <strong style={{ color: "#C8A96E" }}>
                      {imported.toLocaleString()} films
                    </strong>{" "}
                    added to your log.{" "}
                  </>
                )}
                {skippedDup > 0 && (
                  <>{skippedDup} were already in your log and skipped. </>
                )}
                {skippedMiss > 0 && (
                  <>{skippedMiss} couldn't be matched and were left out.</>
                )}
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: "2px",
                  background: "#1A1A1A",
                  borderRadius: "12px",
                  overflow: "hidden",
                  marginBottom: "24px",
                }}
              >
                {[
                  { val: imported, label: "Added", color: "#C8A96E" },
                  {
                    val: skippedDup,
                    label: "Already logged",
                    color: "#504E4A",
                  },
                  { val: skippedMiss, label: "Not found", color: "#504E4A" },
                ].map(({ val, label, color }, i) => (
                  <div
                    key={i}
                    style={{
                      background: "#111",
                      padding: "16px 8px",
                      textAlign: "center",
                    }}
                  >
                    <p
                      style={{
                        fontFamily: MONO,
                        fontSize: "24px",
                        color,
                        fontWeight: 500,
                        lineHeight: 1,
                      }}
                    >
                      {val.toLocaleString()}
                    </p>
                    <p
                      style={{
                        fontFamily: SANS,
                        fontSize: "10px",
                        color: "#504E4A",
                        marginTop: "4px",
                      }}
                    >
                      {label}
                    </p>
                  </div>
                ))}
              </div>

              <button
                onClick={onClose}
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: "10px",
                  background: "#C8A96E",
                  color: "#0D0D0D",
                  fontFamily: SANS,
                  fontSize: "14px",
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#D4B57A")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "#C8A96E")
                }
              >
                View my library →
              </button>
            </div>
          )}
        </div>

        {/* Footer — upload/preview only */}
        {(step === "upload" || step === "preview") && (
          <div
            style={{
              padding: "16px 24px 20px",
              borderTop: "1px solid #1A1A1A",
              flexShrink: 0,
              display: "flex",
              gap: "10px",
            }}
          >
            {step === "preview" && (
              <>
                <button
                  onClick={() => {
                    setStep("upload");
                    setRows([]);
                    setFileName("");
                    setShowAll(false);
                  }}
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
                  ← Back
                </button>
                <button
                  onClick={runImport}
                  style={{
                    flex: 2,
                    padding: "12px",
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
                    (e.currentTarget.style.background = "#D4B57A")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "#C8A96E")
                  }
                >
                  Import {rows.length.toLocaleString()} films →
                </button>
              </>
            )}
          </div>
        )}

        <style>{`
          @keyframes spinReel {
            from { transform: rotate(0deg); }
            to   { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </>
  );
}
