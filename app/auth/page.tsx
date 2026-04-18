"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, ArrowLeft, Mail, CheckCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

const SERIF = "Playfair Display, Georgia, serif";
const SANS = "Inter, system-ui, sans-serif";

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

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  );
}

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
            boxSizing: "border-box",
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

// ── Email Verification Sent Screen ────────────────────────────────────────────
function VerificationSent({
  email,
  onBack,
}: {
  email: string;
  onBack: () => void;
}) {
  const [resent, setResent] = useState(false);
  const [resending, setResending] = useState(false);

  async function resend() {
    setResending(true);
    await supabase.auth.resend({ type: "signup", email });
    setResending(false);
    setResent(true);
    setTimeout(() => setResent(false), 4000);
  }

  return (
    <div style={{ textAlign: "center" }}>
      {/* Icon */}
      <div
        style={{
          width: "64px",
          height: "64px",
          borderRadius: "50%",
          background: "rgba(200,169,110,0.12)",
          border: "1px solid rgba(200,169,110,0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 20px",
        }}
      >
        <Mail size={28} color="#C8A96E" />
      </div>

      <h2
        style={{
          fontFamily: SERIF,
          fontSize: "22px",
          fontWeight: 700,
          color: "#F0EDE8",
          fontStyle: "italic",
          marginBottom: "10px",
        }}
      >
        Check your inbox
      </h2>
      <p
        style={{
          fontFamily: SANS,
          fontSize: "13px",
          color: "#8A8780",
          lineHeight: 1.6,
          marginBottom: "8px",
        }}
      >
        We sent a verification link to
      </p>
      <p
        style={{
          fontFamily: SANS,
          fontSize: "14px",
          color: "#C8A96E",
          fontWeight: 600,
          marginBottom: "24px",
          wordBreak: "break-all",
        }}
      >
        {email}
      </p>
      <p
        style={{
          fontFamily: SANS,
          fontSize: "12px",
          color: "#504E4A",
          lineHeight: 1.6,
          marginBottom: "24px",
        }}
      >
        Click the link in the email to verify your account. Check your spam
        folder if you don't see it.
      </p>

      {/* Divider */}
      <div style={{ borderTop: "1px solid #1A1A1A", margin: "20px 0" }} />

      <p
        style={{
          fontFamily: SANS,
          fontSize: "12px",
          color: "#504E4A",
          marginBottom: "10px",
        }}
      >
        Didn't get the email?
      </p>
      <button
        onClick={resend}
        disabled={resending || resent}
        style={{
          width: "100%",
          padding: "11px",
          borderRadius: "8px",
          background: "transparent",
          border: "1px solid #2A2A2A",
          color: resent ? "#4A9E6B" : "#8A8780",
          fontFamily: SANS,
          fontSize: "13px",
          cursor: resent || resending ? "default" : "pointer",
          marginBottom: "10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "6px",
        }}
      >
        {resent ? (
          <>
            <CheckCircle size={14} /> Sent!
          </>
        ) : resending ? (
          "Sending…"
        ) : (
          "Resend verification email"
        )}
      </button>

      <button
        onClick={onBack}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          fontFamily: SANS,
          fontSize: "12px",
          color: "#504E4A",
          display: "flex",
          alignItems: "center",
          gap: "4px",
          margin: "0 auto",
        }}
      >
        <ArrowLeft size={12} /> Back to sign in
      </button>
    </div>
  );
}

// ── Main Auth Page ─────────────────────────────────────────────────────────────
export default function AuthPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [verificationSent, setVerificationSent] = useState(false);

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

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    setError("");
    try {
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (err) throw err;
      // Redirect handled by Supabase OAuth flow
    } catch (err: any) {
      setError(err.message || "Google sign-in failed. Try again.");
      setGoogleLoading(false);
    }
  }

async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  setError("");
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
      // Check username availability BEFORE creating the auth user
      const { data: existing } = await supabase
        .from("profiles")
        .select("username")
        .eq("username", username.toLowerCase())
        .maybeSingle();

      if (existing) {
        setError("That username is already taken. Try another one.");
        setLoading(false);
        return;
      }

      const { data, error: err } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username: username.toLowerCase() },
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (err) throw err;

      // Supabase doesn't error on duplicate email when confirmation is on —
      // it silently resends. Empty identities array = email already exists.
      if (data.user?.identities?.length === 0) {
        setError("This email is already registered. Sign in instead.");
        setLoading(false);
        return;
      }

      setVerificationSent(true);
    }
  } catch (err: any) {
    const msg = err.message || "";
    if (msg.includes("Invalid login")) setError("Wrong email or password.");
    else if (msg.includes("already registered"))
      setError("This email is already registered. Sign in instead.");
    else if (msg.includes("Email not confirmed"))
      setError("Please verify your email first — check your inbox.");
    else if (
      msg.includes("duplicate") ||
      msg.includes("unique") ||
      msg.includes("username")
    )
      setError("That username is already taken. Try another one.");
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
        {verificationSent ? (
          <VerificationSent
            email={email}
            onBack={() => {
              setVerificationSent(false);
              setMode("signin");
            }}
          />
        ) : (
          <>
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
                marginBottom: "20px",
                border: "1px solid #1A1A1A",
              }}
            >
              {(["signin", "signup"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setMode(m);
                    setError("");
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

            {/* Google OAuth Button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              style={{
                width: "100%",
                padding: "11px 14px",
                borderRadius: "8px",
                background: "#111",
                border: "1px solid #2A2A2A",
                color: "#F0EDE8",
                fontFamily: SANS,
                fontSize: "14px",
                cursor: googleLoading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                marginBottom: "16px",
                transition: "border-color 0.15s ease, background 0.15s ease",
                opacity: googleLoading ? 0.7 : 1,
              }}
              onMouseEnter={(e) => {
                if (!googleLoading)
                  e.currentTarget.style.borderColor = "#3A3A3A";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#2A2A2A";
              }}
            >
              <GoogleIcon />
              {googleLoading
                ? "Redirecting…"
                : `${mode === "signin" ? "Sign in" : "Sign up"} with Google`}
            </button>

            {/* Divider */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "16px",
              }}
            >
              <div style={{ flex: 1, height: "1px", background: "#1A1A1A" }} />
              <span
                style={{ fontFamily: SANS, fontSize: "11px", color: "#3A3A3A" }}
              >
                or continue with email
              </span>
              <div style={{ flex: 1, height: "1px", background: "#1A1A1A" }} />
            </div>

            {/* Error */}
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
                <p
                  style={{
                    fontFamily: SANS,
                    fontSize: "13px",
                    color: "#C87C2A",
                  }}
                >
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

              {/* Verification note for signup */}
              {mode === "signup" && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "8px",
                    padding: "10px 12px",
                    borderRadius: "7px",
                    background: "rgba(200,169,110,0.06)",
                    border: "1px solid rgba(200,169,110,0.12)",
                    marginBottom: "14px",
                  }}
                >
                  <Mail
                    size={13}
                    color="#C8A96E"
                    style={{ marginTop: "1px", flexShrink: 0 }}
                  />
                  <p
                    style={{
                      fontFamily: SANS,
                      fontSize: "11px",
                      color: "#8A8780",
                      lineHeight: 1.5,
                      margin: 0,
                    }}
                  >
                    We'll send a verification link to your email. No
                    verification = no access.
                  </p>
                </div>
              )}

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
                  marginTop: "4px",
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
          </>
        )}
      </div>
    </div>
  );
}
