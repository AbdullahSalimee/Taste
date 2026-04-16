"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, ArrowLeft, Film } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

const SERIF = "Playfair Display, Georgia, serif";
const SANS = "Inter, system-ui, sans-serif";
const MONO = "JetBrains Mono, Courier New, monospace";

// Cinematic posters for background
const POSTERS = [
  "https://image.tmdb.org/t/p/w300/sF1U4EUQS8YHUYjNl3pMGNIQyr0.jpg",
  "https://image.tmdb.org/t/p/w300/3bhkrj58Vtu7enYsLeMMovruo8P.jpg",
  "https://image.tmdb.org/t/p/w300/kvCHVBd4xSObFPnLs6JrzJhAlqe.jpg",
  "https://image.tmdb.org/t/p/w300/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
  "https://image.tmdb.org/t/p/w300/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg",
  "https://image.tmdb.org/t/p/w300/gcpOrBQGNhfwmEFbgb0EMjHlPyX.jpg",
  "https://image.tmdb.org/t/p/w300/l1a0WCx4LOsbTJoqnSr2WJCOWEF.jpg",
  "https://image.tmdb.org/t/p/w300/mbBBHO4M3NsYbpTERlyBirNrFqA.jpg",
  "https://image.tmdb.org/t/p/w300/4lsJ4ELFOmh2oJADzwCN4Rm3c3N.jpg",
  "https://image.tmdb.org/t/p/w300/lKoGMkLuEMHBQiPxBFqFQnKGnCr.jpg",
  "https://image.tmdb.org/t/p/w300/kCGlIMHnOm8JPXIHTp0QOi7VNYo.jpg",
  "https://image.tmdb.org/t/p/w300/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
];

function Input({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  error,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
}) {
  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState(false);
  const isPassword = type === "password";

  return (
    <div style={{ marginBottom: "16px" }}>
      <label
        style={{
          display: "block",
          fontFamily: SANS,
          fontSize: "11px",
          color: "#504E4A",
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          marginBottom: "6px",
        }}
      >
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <input
          type={isPassword && show ? "text" : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: "100%",
            padding: "11px 14px",
            paddingRight: isPassword ? "42px" : "14px",
            background: "#0D0D0D",
            border: `1px solid ${error ? "#8A2A2A" : focused ? "rgba(200,169,110,0.4)" : "#2A2A2A"}`,
            borderRadius: "8px",
            color: "#F0EDE8",
            fontFamily: SANS,
            fontSize: "14px",
            outline: "none",
            transition: "border-color 0.15s ease",
          }}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow(!show)}
            style={{
              position: "absolute",
              right: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#504E4A",
              padding: "2px",
            }}
          >
            {show ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        )}
      </div>
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
  );
}

export default function AuthPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Redirect if already signed in
  useEffect(() => {
    if (user) router.push("/dashboard");
  }, [user, router]);

  function validate() {
    const errors: Record<string, string> = {};
    if (!email.includes("@")) errors.email = "Enter a valid email";
    if (password.length < 6)
      errors.password = "Password must be at least 6 characters";
    if (mode === "signup" && username.trim().length < 2)
      errors.username = "Username must be at least 2 characters";
    if (mode === "signup" && !/^[a-zA-Z0-9_]+$/.test(username))
      errors.username = "Only letters, numbers and underscores";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!validate()) return;
    setLoading(true);

    try {
      if (mode === "signin") {
        const { error: err } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (err) throw err;
        router.push("/dashboard");
      } else {
        const { error: err } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { username: username.toLowerCase() } },
        });
        if (err) throw err;
        setSuccess("Account created! You can now sign in.");
        setMode("signin");
      }
    } catch (err: any) {
      // Make errors human readable
      const msg = err.message || "";
      if (msg.includes("Invalid login")) setError("Wrong email or password.");
      else if (msg.includes("already registered"))
        setError("This email is already registered. Sign in instead.");
      else if (msg.includes("Email not confirmed"))
        setError("Please confirm your email first, or check your inbox.");
      else setError(msg || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0D0D0D",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Poster background */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
        <div
          style={{
            position: "absolute",
            inset: "-10%",
            display: "grid",
            gridTemplateColumns: "repeat(6, 1fr)",
            gap: "6px",
            transform: "rotate(3deg) scale(1.15)",
            opacity: 0.08,
          }}
        >
          {[...POSTERS, ...POSTERS].map((p, i) => (
            <div
              key={i}
              style={{
                aspectRatio: "2/3",
                overflow: "hidden",
                borderRadius: "3px",
              }}
            >
              <img
                src={p}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            </div>
          ))}
        </div>
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at center, rgba(13,13,13,0.6) 0%, rgba(13,13,13,0.95) 70%)",
          }}
        />
      </div>

      {/* Back to home */}
      <div style={{ position: "fixed", top: "20px", left: "20px", zIndex: 10 }}>
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontFamily: SANS,
            fontSize: "12px",
            color: "#504E4A",
            textDecoration: "none",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#8A8780")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#504E4A")}
        >
          <ArrowLeft size={13} /> Home
        </Link>
      </div>

      {/* Card */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: "400px",
          margin: "0 24px",
          background: "rgba(20,20,20,0.95)",
          border: "1px solid #2A2A2A",
          borderRadius: "16px",
          padding: "36px 32px",
          backdropFilter: "blur(20px)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.8)",
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <h1
              style={{
                fontFamily: SERIF,
                fontSize: "32px",
                fontWeight: 700,
                color: "#C8A96E",
                fontStyle: "italic",
                letterSpacing: "-0.02em",
              }}
            >
              taste
            </h1>
          </Link>
          <p
            style={{
              fontFamily: SANS,
              fontSize: "13px",
              color: "#504E4A",
              marginTop: "4px",
            }}
          >
            {mode === "signin"
              ? "Welcome back."
              : "Start your cinematic identity."}
          </p>
        </div>

        {/* Mode toggle */}
        <div
          style={{
            display: "flex",
            background: "#0D0D0D",
            borderRadius: "8px",
            padding: "3px",
            marginBottom: "24px",
            border: "1px solid #1A1A1A",
          }}
        >
          {(["signin", "signup"] as const).map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setError("");
                setSuccess("");
                setFieldErrors({});
              }}
              style={{
                flex: 1,
                padding: "8px",
                borderRadius: "6px",
                fontFamily: SANS,
                fontSize: "13px",
                cursor: "pointer",
                border: "none",
                background: mode === m ? "#1A1A1A" : "transparent",
                color: mode === m ? "#F0EDE8" : "#504E4A",
                fontWeight: mode === m ? 500 : 400,
                transition: "all 0.15s ease",
              }}
            >
              {m === "signin" ? "Sign in" : "Sign up"}
            </button>
          ))}
        </div>

        {/* Success message */}
        {success && (
          <div
            style={{
              padding: "12px 14px",
              borderRadius: "8px",
              marginBottom: "16px",
              background: "rgba(74,158,107,0.1)",
              border: "1px solid rgba(74,158,107,0.3)",
            }}
          >
            <p style={{ fontFamily: SANS, fontSize: "13px", color: "#4A9E6B" }}>
              {success}
            </p>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div
            style={{
              padding: "12px 14px",
              borderRadius: "8px",
              marginBottom: "16px",
              background: "rgba(138,42,42,0.1)",
              border: "1px solid rgba(138,42,42,0.3)",
            }}
          >
            <p style={{ fontFamily: SANS, fontSize: "13px", color: "#C87C2A" }}>
              {error}
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {mode === "signup" && (
            <Input
              label="Username"
              value={username}
              onChange={setUsername}
              placeholder="cinephile_92"
              error={fieldErrors.username}
            />
          )}
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="you@example.com"
            error={fieldErrors.email}
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder={
              mode === "signup" ? "At least 6 characters" : "Your password"
            }
            error={fieldErrors.password}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "13px",
              borderRadius: "8px",
              background: loading ? "#8A7A5A" : "#C8A96E",
              color: "#0D0D0D",
              fontFamily: SANS,
              fontSize: "14px",
              fontWeight: 600,
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              marginTop: "8px",
              transition: "background 0.15s ease",
            }}
          >
            {loading
              ? mode === "signin"
                ? "Signing in…"
                : "Creating account…"
              : mode === "signin"
                ? "Sign in"
                : "Create account"}
          </button>
        </form>

        {/* Footer note */}
        <p
          style={{
            fontFamily: SANS,
            fontSize: "11px",
            color: "#504E4A",
            textAlign: "center",
            marginTop: "20px",
            lineHeight: 1.6,
          }}
        >
          {mode === "signin" ? (
            <>
              No account?{" "}
              <button
                onClick={() => setMode("signup")}
                style={{
                  background: "none",
                  border: "none",
                  color: "#C8A96E",
                  cursor: "pointer",
                  fontFamily: SANS,
                  fontSize: "11px",
                }}
              >
                Sign up free
              </button>
            </>
          ) : (
            <>
              By signing up you agree to our{" "}
              <a href="#" style={{ color: "#504E4A" }}>
                terms
              </a>
              . No spam, ever.
            </>
          )}
        </p>
      </div>
    </div>
  );
}
