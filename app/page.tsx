"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Play, Layers, Star, BarChart2, Users, Import, ChevronDown } from "lucide-react";

const SERIF = "Playfair Display, Georgia, serif";
const SANS  = "Inter, system-ui, sans-serif";
const MONO  = "JetBrains Mono, Courier New, monospace";

const POSTERS = [
  "https://image.tmdb.org/t/p/w300/sF1U4EUQS8YHUYjNl3pMGNIQyr0.jpg",
  "https://image.tmdb.org/t/p/w300/l1a0WCx4LOsbTJoqnSr2WJCOWEF.jpg",
  "https://image.tmdb.org/t/p/w300/gcpOrBQGNhfwmEFbgb0EMjHlPyX.jpg",
  "https://image.tmdb.org/t/p/w300/mbBBHO4M3NsYbpTERlyBirNrFqA.jpg",
  "https://image.tmdb.org/t/p/w300/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
  "https://image.tmdb.org/t/p/w300/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg",
  "https://image.tmdb.org/t/p/w300/3bhkrj58Vtu7enYsLeMMovruo8P.jpg",
  "https://image.tmdb.org/t/p/w300/kvCHVBd4xSObFPnLs6JrzJhAlqe.jpg",
  "https://image.tmdb.org/t/p/w300/4lsJ4ELFOmh2oJADzwCN4Rm3c3N.jpg",
  "https://image.tmdb.org/t/p/w300/lKoGMkLuEMHBQiPxBFqFQnKGnCr.jpg",
  "https://image.tmdb.org/t/p/w300/kCGlIMHnOm8JPXIHTp0QOi7VNYo.jpg",
  "https://image.tmdb.org/t/p/w300/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
];

const FEATURES = [
  { icon: Layers,   title: "Films & TV. One place.",  desc: "Your full watch history unified in a single timeline. No more switching apps.", color: "#5C4A8A" },
  { icon: Star,     title: "Your Taste DNA",           desc: "An AI-generated archetype capturing your cinematic identity. Shareable as a card.", color: "#C8A96E" },
  { icon: BarChart2,title: "Episode Heatmaps",         desc: "Color-coded quality maps of every episode. See where a show peaks before you commit.", color: "#2A5C8A" },
  { icon: Users,    title: "Taste Twins",              desc: "Matched by actual watch history overlap — not generic genre tags.", color: "#4A9E6B" },
  { icon: Play,     title: "Where to Watch",           desc: "Streaming availability built in for everyone, free.", color: "#C87C2A" },
  { icon: Import,   title: "Bring Your History",       desc: "One-click import from Letterboxd, Trakt, IMDB, and TV Time.", color: "#8A4A3A" },
];

const COMPARISON = [
  { feature: "Movies + TV unified",     taste: true,  letterboxd: false, trakt: true,  tvtime: false },
  { feature: "Taste DNA card",          taste: true,  letterboxd: false, trakt: false, tvtime: false },
  { feature: "Episode heatmaps",        taste: true,  letterboxd: false, trakt: false, tvtime: false },
  { feature: "Taste twin matching",     taste: true,  letterboxd: false, trakt: false, tvtime: false },
  { feature: "Streaming info (free)",   taste: true,  letterboxd: false, trakt: false, tvtime: false },
  { feature: "Full data export",        taste: true,  letterboxd: true,  trakt: true,  tvtime: false },
  { feature: "Chapter system",          taste: true,  letterboxd: false, trakt: false, tvtime: false },
  { feature: "No ads, ever",            taste: true,  letterboxd: true,  trakt: false, tvtime: false },
];

const FREE_FEATURES = ["Unlimited logging", "Full watchlist", "Streaming availability", "Basic stats", "Feed & social", "Import & export", "Taste DNA card", "Episode heatmaps"];
const PLUS_FEATURES = ["Everything in Free", "Animated DNA card", "Chapter system", "Weekly insight cards", "Annual Taste Wrapped", "Full advanced stats", "Emotional arc previews", "Full taste twin matching", "Custom profile themes"];

function Tick({ yes }: { yes: boolean }) {
  return (
    <div style={{
      width: "20px", height: "20px", borderRadius: "2px", margin: "0 auto",
      display: "flex", alignItems: "center", justifyContent: "center",
      background: yes ? "rgba(200,169,110,0.15)" : "#1A1A1A",
      color: yes ? "#C8A96E" : "#2A2A2A", fontSize: "11px",
    }}>{yes ? "✓" : "—"}</div>
  );
}

function Section({ id, children, bg }: { id?: string; children: React.ReactNode; bg?: string }) {
  return (
    <section id={id} style={{
      borderTop: "1px solid #1A1A1A",
      background: bg || "#0D0D0D",
      padding: "80px 0",
    }}>
      {children}
    </section>
  );
}

function Container({ children, narrow }: { children: React.ReactNode; narrow?: boolean }) {
  return (
    <div style={{ maxWidth: narrow ? "680px" : "1100px", margin: "0 auto", padding: "0 24px" }}>
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p style={{ fontFamily: SANS, fontSize: "10px", color: "#504E4A", textTransform: "uppercase", letterSpacing: "0.2em", textAlign: "center", marginBottom: "12px" }}>{children}</p>;
}

function SectionHeading({ children, center }: { children: React.ReactNode; center?: boolean }) {
  return (
    <h2 style={{ fontFamily: SERIF, fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 700, color: "#F0EDE8", fontStyle: "italic", lineHeight: 1.2, textAlign: center ? "center" : "left", marginBottom: "16px" }}>
      {children}
    </h2>
  );
}

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const fn = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <div style={{ background: "#0D0D0D", minHeight: "100vh", overflowX: "hidden", fontFamily: SANS }}>

      {/* ── NAV ── */}
      <header style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        height: "56px", borderBottom: "1px solid rgba(42,42,42,0.6)",
        background: "rgba(13,13,13,0.88)",
        backdropFilter: "blur(12px)",
        display: "flex", alignItems: "center",
      }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 24px", width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h1 style={{ fontFamily: SERIF, fontSize: "22px", fontWeight: 700, color: "#C8A96E" }}>taste</h1>
          <nav style={{ display: "flex", alignItems: "center", gap: "32px" }}>
            {["Features", "Compare", "Pricing"].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`} style={{ fontFamily: SANS, fontSize: "13px", color: "#8A8780", textDecoration: "none" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#F0EDE8")}
                onMouseLeave={e => (e.currentTarget.style.color = "#8A8780")}>
                {item}
              </a>
            ))}
          </nav>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Link href="/dashboard" style={{ fontFamily: SANS, fontSize: "13px", color: "#8A8780", textDecoration: "none" }}>Sign in</Link>
            <Link href="/dashboard" style={{
              padding: "7px 16px", borderRadius: "6px", background: "#C8A96E",
              color: "#0D0D0D", fontFamily: SANS, fontSize: "13px", fontWeight: 600, textDecoration: "none",
            }}>Get started</Link>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <div style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", paddingTop: "56px" }}>
        {/* Poster background — absolutely positioned, clipped to hero */}
        <div style={{
          position: "absolute", inset: 0, overflow: "hidden", zIndex: 0,
        }}>
          <div style={{
            position: "absolute", inset: "-10%",
            display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "6px",
            transform: `rotate(3deg) scale(1.15) translateY(${scrollY * 0.25}px)`,
            opacity: 0.12,
          }}>
            {[...POSTERS, ...POSTERS].map((p, i) => (
              <div key={i} style={{ aspectRatio: "2/3", overflow: "hidden", borderRadius: "3px" }}>
                <img src={p} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={e => (e.currentTarget.style.display = "none")} />
              </div>
            ))}
          </div>
          {/* Gradient fade */}
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(to bottom, rgba(13,13,13,0.5) 0%, rgba(13,13,13,0.75) 60%, #0D0D0D 100%)",
          }} />
        </div>

        {/* Hero content */}
        <div style={{ position: "relative", zIndex: 1, textAlign: "center", padding: "0 24px", maxWidth: "860px", width: "100%" }}>
          {/* Badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            padding: "6px 16px", borderRadius: "20px",
            border: "1px solid rgba(200,169,110,0.3)", background: "rgba(200,169,110,0.08)",
            marginBottom: "32px",
          }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#C8A96E", animation: "pulse 2s infinite" }} />
            <span style={{ fontFamily: SANS, fontSize: "12px", color: "#C8A96E" }}>Replacing 5 apps with one</span>
          </div>

          {/* Headline */}
          <h2 style={{
            fontFamily: SERIF, fontWeight: 700, color: "#F0EDE8",
            fontSize: "clamp(44px, 8vw, 80px)", lineHeight: 0.95,
            letterSpacing: "-0.02em", marginBottom: "24px",
          }}>
            Watching is<br />
            <span className="archetype-shimmer">identity.</span>
          </h2>

          <p style={{ fontFamily: SANS, fontSize: "clamp(15px, 2vw, 18px)", color: "#8A8780", lineHeight: 1.7, marginBottom: "36px", maxWidth: "560px", margin: "0 auto 36px" }}>
            Track every film and series in one place. Discover your cinematic DNA. Find people who watch like you.
          </p>

          {/* CTAs */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", flexWrap: "wrap", marginBottom: "20px" }}>
            <Link href="/dashboard" style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              padding: "14px 28px", borderRadius: "8px", background: "#C8A96E",
              color: "#0D0D0D", fontFamily: SANS, fontSize: "15px", fontWeight: 600,
              textDecoration: "none", boxShadow: "0 0 32px rgba(200,169,110,0.2)",
            }}>
              Start for free <ArrowRight size={16} />
            </Link>
            <Link href="/dashboard" style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              padding: "14px 28px", borderRadius: "8px",
              border: "1px solid #2A2A2A", color: "#8A8780",
              fontFamily: SANS, fontSize: "15px", textDecoration: "none",
            }}>
              Explore the app <Play size={14} />
            </Link>
          </div>
          <p style={{ fontFamily: SANS, fontSize: "11px", color: "#504E4A" }}>
            Import from Letterboxd, Trakt, IMDB, or TV Time · No card required
          </p>

          {/* Scroll cue */}
          <div style={{ marginTop: "60px", display: "flex", justifyContent: "center", animation: "bounce 1s infinite" }}>
            <ChevronDown size={16} color="#504E4A" />
          </div>
        </div>
      </div>

      {/* ── PROBLEM ── */}
      <Section>
        <Container narrow>
          <Label>The problem</Label>
          <SectionHeading center>You already use 5 apps to do what one should.</SectionHeading>
          <p style={{ fontFamily: SANS, fontSize: "15px", color: "#8A8780", lineHeight: 1.7, textAlign: "center", marginBottom: "40px" }}>
            Letterboxd for films. Trakt for TV. JustWatch to find where it streams. SeriesGraph for episode quality. IMDB for cast info. Every serious watcher tolerates this fragmentation because nothing better exists. Until now.
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", flexWrap: "wrap" }}>
            {["Letterboxd", "Trakt", "JustWatch", "SeriesGraph", "IMDB"].map(app => (
              <div key={app} style={{ padding: "8px 14px", borderRadius: "8px", background: "#141414", border: "1px solid #2A2A2A", color: "#504E4A", fontFamily: SANS, fontSize: "12px", opacity: 0.6 }}>{app}</div>
            ))}
            <span style={{ color: "#2A2A2A", fontSize: "20px" }}>→</span>
            <div style={{ padding: "8px 16px", borderRadius: "8px", background: "rgba(200,169,110,0.1)", border: "1px solid rgba(200,169,110,0.3)", color: "#C8A96E", fontFamily: SERIF, fontSize: "16px", fontWeight: 700 }}>taste</div>
          </div>
        </Container>
      </Section>

      {/* ── FEATURES ── */}
      <Section id="features">
        <Container>
          <Label>Features</Label>
          <SectionHeading center>Every screen should make you feel something.</SectionHeading>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "14px", marginTop: "40px" }}>
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} style={{
                  padding: "24px", borderRadius: "12px", background: "#141414",
                  border: "1px solid #2A2A2A", cursor: "default",
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = "#3A3A3A")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = "#2A2A2A")}>
                  <div style={{
                    width: "40px", height: "40px", borderRadius: "8px", marginBottom: "16px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: `${f.color}22`, border: `1px solid ${f.color}44`,
                  }}>
                    <Icon size={18} color={f.color} />
                  </div>
                  <p style={{ fontFamily: SANS, fontSize: "14px", color: "#F0EDE8", fontWeight: 600, marginBottom: "8px" }}>{f.title}</p>
                  <p style={{ fontFamily: SANS, fontSize: "13px", color: "#8A8780", lineHeight: 1.6 }}>{f.desc}</p>
                </div>
              );
            })}
          </div>
        </Container>
      </Section>

      {/* ── DNA SHOWCASE ── */}
      <Section bg="#0A0A0A">
        <Container>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "64px", alignItems: "center" }}>
            <div>
              <Label>Your identity</Label>
              <SectionHeading>Not what you watched.<br />Who you are.</SectionHeading>
              <p style={{ fontFamily: SANS, fontSize: "14px", color: "#8A8780", lineHeight: 1.7, marginBottom: "24px" }}>
                Your Taste DNA card synthesizes years of watch history into an archetype that says something real about who you are. Share it. Let it evolve.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {["Melancholic Formalist", "Chaos Romantic", "Suburban Existentialist", "Quiet Observer"].map(a => (
                  <div key={a} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: "3px", height: "18px", borderRadius: "2px", background: "rgba(200,169,110,0.4)", flexShrink: 0 }} />
                    <span style={{ fontFamily: SANS, fontSize: "14px", color: "#8A8780", fontStyle: "italic", fontWeight: 500 }}>{a}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Mini DNA card preview */}
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", inset: 0, background: "rgba(200,169,110,0.04)", filter: "blur(40px)", borderRadius: "50%" }} />
              <div className="taste-dna-card" style={{
                position: "relative", borderRadius: "12px", overflow: "hidden",
                border: "1px solid #2A2A2A",
                background: "linear-gradient(135deg, #141414, #111111, #0D0D0D)",
              }}>
                <div style={{ display: "flex", height: "20px", borderBottom: "1px solid #1A1A1A" }}>
                  {Array.from({ length: 14 }).map((_, i) => (
                    <div key={i} style={{ flex: 1, borderRight: "1px solid #1A1A1A", background: "#0A0A0A", height: "5px", margin: "5px 0" }} />
                  ))}
                </div>
                <div style={{ padding: "20px" }}>
                  <p style={{ fontFamily: SANS, fontSize: "9px", color: "#504E4A", textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: "10px" }}>TASTE — DNA CARD</p>
                  <p style={{ fontFamily: SANS, fontSize: "12px", color: "#8A8780", marginBottom: "4px" }}>Alex</p>
                  <h3 className="archetype-shimmer" style={{ fontFamily: SERIF, fontSize: "24px", fontWeight: 700, marginBottom: "6px" }}>Melancholic Formalist</h3>
                  <p style={{ fontFamily: SANS, fontSize: "11px", color: "#8A8780", fontStyle: "italic", marginBottom: "16px" }}>Haunted by 70s European cinema, soft spot for unreliable narrators</p>
                  {[{ name: "Drama", pct: 42, color: "#5C4A8A" }, { name: "Thriller", pct: 28, color: "#8A2A2A" }, { name: "Doc", pct: 18, color: "#2A5C8A" }].map((g, i) => (
                    <div key={g.name} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                      <span style={{ fontFamily: SANS, fontSize: "10px", color: g.color, width: "60px" }}>{g.name}</span>
                      <div style={{ flex: 1, height: "3px", background: "#1A1A1A", borderRadius: "2px", overflow: "hidden" }}>
                        <div className="decade-bar" style={{ height: "100%", background: g.color, width: `${g.pct}%`, "--bar-delay": `${i * 80}ms` } as React.CSSProperties} />
                      </div>
                      <span style={{ fontFamily: MONO, fontSize: "9px", color: "#504E4A" }}>{g.pct}%</span>
                    </div>
                  ))}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginTop: "16px", paddingTop: "14px", borderTop: "1px solid #1A1A1A" }}>
                    {[["847", "Films"], ["63", "Series"], ["89d", "Watched"]].map(([v, l]) => (
                      <div key={l}>
                        <p style={{ fontFamily: MONO, color: "#C8A96E", fontSize: "16px", fontWeight: 500 }}>{v}</p>
                        <p style={{ fontFamily: SANS, color: "#504E4A", fontSize: "9px", marginTop: "2px" }}>{l}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ display: "flex", height: "20px", borderTop: "1px solid #1A1A1A" }}>
                  {Array.from({ length: 14 }).map((_, i) => (
                    <div key={i} style={{ flex: 1, borderRight: "1px solid #1A1A1A", background: "#0A0A0A", height: "5px", margin: "5px 0" }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
          {/* Responsive collapse */}
          <style>{`@media (max-width: 700px) { .dna-grid { grid-template-columns: 1fr !important; } }`}</style>
        </Container>
      </Section>

      {/* ── COMPARISON ── */}
      <Section id="compare">
        <Container>
          <Label>Compare</Label>
          <SectionHeading center>Everything in one place. Finally.</SectionHeading>
          <div style={{ overflowX: "auto", borderRadius: "12px", border: "1px solid #2A2A2A", marginTop: "36px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #2A2A2A" }}>
                  <th style={{ textAlign: "left", padding: "14px 16px", fontFamily: SANS, fontSize: "11px", color: "#504E4A", fontWeight: 500 }}>Feature</th>
                  {["taste", "Letterboxd", "Trakt", "TV Time"].map((app, i) => (
                    <th key={app} style={{ padding: "14px 16px", textAlign: "center", fontFamily: SANS, fontSize: "11px", fontWeight: 500, color: i === 0 ? "#C8A96E" : "#504E4A" }}>
                      {i === 0 ? <span style={{ fontFamily: SERIF }}>{app}</span> : app}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #1A1A1A", background: i % 2 === 0 ? "#141414" : "transparent" }}>
                    <td style={{ padding: "12px 16px", fontFamily: SANS, fontSize: "12px", color: "#8A8780" }}>{row.feature}</td>
                    <td style={{ padding: "12px 16px" }}><Tick yes={row.taste} /></td>
                    <td style={{ padding: "12px 16px" }}><Tick yes={row.letterboxd} /></td>
                    <td style={{ padding: "12px 16px" }}><Tick yes={row.trakt} /></td>
                    <td style={{ padding: "12px 16px" }}><Tick yes={row.tvtime} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Container>
      </Section>

      {/* ── PRICING ── */}
      <Section id="pricing" bg="#0A0A0A">
        <Container>
          <Label>Pricing</Label>
          <SectionHeading center>Generous free. Powerful paid.</SectionHeading>
          <p style={{ fontFamily: SANS, fontSize: "14px", color: "#8A8780", textAlign: "center", marginBottom: "40px" }}>
            The free tier is genuinely good. No crippled experience.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", maxWidth: "720px", margin: "0 auto" }}>
            {/* Free */}
            <div style={{ padding: "28px", borderRadius: "12px", background: "#141414", border: "1px solid #2A2A2A" }}>
              <p style={{ fontFamily: SANS, fontSize: "13px", color: "#8A8780", fontWeight: 600, marginBottom: "4px" }}>Free</p>
              <p style={{ fontFamily: MONO, fontSize: "36px", fontWeight: 500, color: "#F0EDE8", marginBottom: "4px" }}>$0</p>
              <p style={{ fontFamily: SANS, fontSize: "11px", color: "#504E4A", marginBottom: "24px" }}>Always free, no card</p>
              <ul style={{ listStyle: "none", marginBottom: "24px", display: "flex", flexDirection: "column", gap: "8px" }}>
                {FREE_FEATURES.map(f => (
                  <li key={f} style={{ display: "flex", alignItems: "center", gap: "8px", fontFamily: SANS, fontSize: "12px", color: "#8A8780" }}>
                    <span style={{ color: "#4A9E6B" }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link href="/dashboard" style={{
                display: "block", textAlign: "center", padding: "10px",
                borderRadius: "6px", border: "1px solid #2A2A2A", color: "#8A8780",
                fontFamily: SANS, fontSize: "13px", textDecoration: "none",
              }}>Start free</Link>
            </div>
            {/* Taste+ */}
            <div style={{ padding: "28px", borderRadius: "12px", background: "linear-gradient(135deg, #1A1510, #141414)", border: "1px solid rgba(200,169,110,0.3)", position: "relative" }}>
              <div style={{
                position: "absolute", top: "14px", right: "14px",
                padding: "2px 10px", borderRadius: "20px",
                background: "rgba(200,169,110,0.15)", border: "1px solid rgba(200,169,110,0.3)",
                fontFamily: SANS, fontSize: "9px", color: "#C8A96E",
              }}>Most popular</div>
              <p style={{ fontFamily: SANS, fontSize: "13px", color: "#C8A96E", fontWeight: 600, marginBottom: "4px" }}>Taste+</p>
              <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", marginBottom: "4px" }}>
                <p style={{ fontFamily: MONO, fontSize: "36px", fontWeight: 500, color: "#F0EDE8" }}>$40</p>
                <p style={{ fontFamily: SANS, fontSize: "13px", color: "#8A8780", marginBottom: "6px" }}>/year</p>
              </div>
              <p style={{ fontFamily: SANS, fontSize: "11px", color: "#504E4A", marginBottom: "24px" }}>or $5/month</p>
              <ul style={{ listStyle: "none", marginBottom: "24px", display: "flex", flexDirection: "column", gap: "8px" }}>
                {PLUS_FEATURES.map(f => (
                  <li key={f} style={{ display: "flex", alignItems: "center", gap: "8px", fontFamily: SANS, fontSize: "12px", color: "#8A8780" }}>
                    <span style={{ color: "#C8A96E" }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link href="/dashboard" style={{
                display: "block", textAlign: "center", padding: "10px",
                borderRadius: "6px", background: "#C8A96E", color: "#0D0D0D",
                fontFamily: SANS, fontSize: "13px", fontWeight: 600, textDecoration: "none",
              }}>Start with Taste+</Link>
              <p style={{ fontFamily: SANS, fontSize: "10px", color: "#504E4A", textAlign: "center", marginTop: "8px" }}>
                Replaces Trakt ($60/yr) + Letterboxd Pro ($19/yr)
              </p>
            </div>
          </div>
          <style>{`@media (max-width: 560px) { .price-grid { grid-template-columns: 1fr !important; } }`}</style>
        </Container>
      </Section>

      {/* ── FINAL CTA ── */}
      <Section>
        <Container narrow>
          <SectionHeading center>Your watch history<br />belongs to you.</SectionHeading>
          <p style={{ fontFamily: SANS, fontSize: "14px", color: "#8A8780", textAlign: "center", marginBottom: "32px" }}>
            Import from anywhere. Export whenever you want. No data hostage-taking.
          </p>
          {!submitted ? (
            <form onSubmit={e => { e.preventDefault(); if (email) setSubmitted(true); }}
              style={{ display: "flex", gap: "10px", maxWidth: "440px", margin: "0 auto 16px" }}>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com" required
                style={{
                  flex: 1, padding: "12px 16px", borderRadius: "8px",
                  background: "#141414", border: "1px solid #2A2A2A",
                  color: "#F0EDE8", fontFamily: SANS, fontSize: "13px", outline: "none",
                }}
                onFocus={e => (e.target.style.borderColor = "rgba(200,169,110,0.4)")}
                onBlur={e => (e.target.style.borderColor = "#2A2A2A")}
              />
              <button type="submit" style={{
                padding: "12px 20px", borderRadius: "8px", background: "#C8A96E",
                color: "#0D0D0D", fontFamily: SANS, fontSize: "13px", fontWeight: 600,
                border: "none", cursor: "pointer", flexShrink: 0,
              }}>Join waitlist</button>
            </form>
          ) : (
            <p style={{ fontFamily: SANS, fontSize: "14px", color: "#4A9E6B", textAlign: "center", marginBottom: "16px" }}>
              ✓ You&apos;re on the list. We&apos;ll be in touch.
            </p>
          )}
          <p style={{ fontFamily: SANS, fontSize: "11px", color: "#504E4A", textAlign: "center" }}>
            Or{" "}
            <Link href="/dashboard" style={{ color: "#C8A96E", textDecoration: "none" }}>go straight to the app →</Link>
          </p>
        </Container>
      </Section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: "1px solid #1A1A1A", padding: "28px 24px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontFamily: SERIF, fontSize: "18px", fontWeight: 700, color: "#C8A96E" }}>taste</span>
            <span style={{ color: "#2A2A2A" }}>·</span>
            <span style={{ fontFamily: SANS, fontSize: "11px", color: "#504E4A" }}>No ads. Ever.</span>
          </div>
          <div style={{ display: "flex", gap: "24px" }}>
            {["Privacy", "Terms", "Export your data"].map(link => (
              <a key={link} href="#" style={{ fontFamily: SANS, fontSize: "11px", color: "#504E4A", textDecoration: "none" }}>{link}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
