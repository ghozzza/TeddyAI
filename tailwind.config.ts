import type { Config } from "tailwindcss";

/**
 * Neobrutalism GOLD design system (ported from the WallCup frontend).
 * Themeable tokens come from CSS variables in globals.css (light + dark);
 * accent colors are theme-aware via the same vars.
 */
const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // ── neobrutalism core ──
        main: "var(--main)",
        "main-foreground": "var(--main-foreground)",
        background: "var(--background)",
        "secondary-background": "var(--secondary-background)",
        foreground: "var(--foreground)",
        border: "var(--border)",
        ring: "var(--ring)",
        overlay: "var(--overlay)",
        // ── aliases kept so not-yet-migrated components still compile ──
        card: {
          DEFAULT: "var(--secondary-background)",
          foreground: "var(--foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        primary: {
          DEFAULT: "var(--main)",
          foreground: "var(--main-foreground)",
        },
        accent: {
          DEFAULT: "var(--muted)",
          foreground: "var(--foreground)",
        },
        input: "var(--border)",
        // ── accents (theme-aware) ──
        success: "var(--success)",
        warning: "var(--warning)",
        danger: "var(--danger)",
        cyan: "var(--cyan)",
      },
      borderRadius: {
        base: "6px",
        lg: "6px",
        md: "4px",
        sm: "3px",
      },
      boxShadow: {
        shadow: "var(--shadow)",
      },
      translate: {
        boxShadowX: "4px",
        boxShadowY: "4px",
        reverseBoxShadowX: "-4px",
        reverseBoxShadowY: "-4px",
      },
      fontWeight: {
        base: "600",
        heading: "800",
      },
      fontFamily: {
        mono: [
          "var(--font-mono)",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "Liberation Mono",
          "monospace",
        ],
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.25s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
