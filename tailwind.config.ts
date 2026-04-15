import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Backgrounds
        base: "#0D0D0D",
        surface: "#141414",
        surface2: "#1A1A1A",
        border: "#2A2A2A",
        // Typography
        "text-primary": "#F0EDE8",
        "text-secondary": "#8A8780",
        "text-tertiary": "#504E4A",
        // Accent
        gold: "#C8A96E",
        "gold-hover": "#DFC080",
        // Semantic
        success: "#4A9E6B",
        warning: "#C87C2A",
        // Genre chips
        drama: "#5C4A8A",
        thriller: "#8A2A2A",
        comedy: "#8A7A2A",
        documentary: "#2A5C8A",
        romance: "#8A2A5C",
        scifi: "#2A6A5C",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        display: ["var(--font-playfair)", "Georgia", "serif"],
        mono: ["var(--font-jetbrains)", "monospace"],
      },
      fontSize: {
        "display": ["32px", { lineHeight: "1.2", fontWeight: "700" }],
        "h1": ["24px", { lineHeight: "1.3", fontWeight: "600" }],
        "h2": ["18px", { lineHeight: "1.4", fontWeight: "600" }],
        "h3": ["15px", { lineHeight: "1.4", fontWeight: "500" }],
        "body": ["14px", { lineHeight: "1.6", fontWeight: "400" }],
        "caption": ["12px", { lineHeight: "1.5", fontWeight: "400" }],
        "stat": ["28px", { lineHeight: "1.1", fontWeight: "500" }],
      },
      borderRadius: {
        card: "4px",
        sm: "2px",
        DEFAULT: "6px",
        lg: "10px",
        xl: "14px",
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease forwards",
        "slide-up": "slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "shimmer": "shimmer 1.8s ease-in-out infinite",
        "pulse-gold": "pulseGold 2s ease-in-out infinite",
        "float": "float 6s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center" },
        },
        pulseGold: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(200,169,110,0)" },
          "50%": { boxShadow: "0 0 0 6px rgba(200,169,110,0.15)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
      backgroundImage: {
        "grain": "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")",
        "gold-shimmer": "linear-gradient(105deg, transparent 40%, rgba(200,169,110,0.3) 50%, transparent 60%)",
        "poster-gradient": "linear-gradient(to top, rgba(13,13,13,0.95) 0%, rgba(13,13,13,0.5) 50%, transparent 100%)",
        "card-hover": "linear-gradient(135deg, rgba(200,169,110,0.05) 0%, transparent 100%)",
      },
      boxShadow: {
        "card": "0 2px 8px rgba(0,0,0,0.4)",
        "card-hover": "0 8px 32px rgba(0,0,0,0.6)",
        "gold": "0 0 20px rgba(200,169,110,0.2)",
        "modal": "0 24px 80px rgba(0,0,0,0.8)",
        "inner-top": "inset 0 1px 0 rgba(240,237,232,0.05)",
      },
    },
  },
  plugins: [],
};

export default config;
