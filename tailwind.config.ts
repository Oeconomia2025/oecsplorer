import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        oec: {
          gold: "#C9A84C",
          dark: "#0b0f16",
          navy: "#1a1f2e",
          cyan: "#00d4ff",
        },
        th: {
          page: "var(--th-page)",
          surface: "var(--th-surface)",
          elevated: "var(--th-elevated)",
          header: "var(--th-header)",
          subnav: "var(--th-subnav)",
        },
        tx: {
          primary: "var(--tx-primary)",
          secondary: "var(--tx-secondary)",
          tertiary: "var(--tx-tertiary)",
          muted: "var(--tx-muted)",
          faint: "var(--tx-faint)",
        },
        bd: {
          primary: "var(--bd-primary)",
          secondary: "var(--bd-secondary)",
          subtle: "var(--bd-subtle)",
        },
        accent: {
          link: "var(--accent-link)",
          "link-hover": "var(--accent-link-hover)",
          gold: "var(--accent-gold)",
        },
        status: {
          success: "var(--status-success)",
          error: "var(--status-error)",
          live: "var(--status-live)",
        },
        input: {
          bg: "var(--input-bg)",
          border: "var(--input-border)",
          placeholder: "var(--input-placeholder)",
        },
        btn: {
          "primary-bg": "var(--btn-primary-bg)",
          "primary-text": "var(--btn-primary-text)",
          "primary-border": "var(--btn-primary-border)",
          "secondary-bg": "var(--btn-secondary-bg)",
          "secondary-text": "var(--btn-secondary-text)",
          "hover-bg": "var(--btn-hover-bg)",
        },
        code: {
          bg: "var(--code-bg)",
        },
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Fira Code", "SF Mono", "monospace"],
      },
      borderRadius: {
        none: "0",
        sm: "0.063rem",   // 1px (was 2px → 3px, reduced by 2)
        DEFAULT: "0.125rem", // 2px (was 4px, reduced by 2)
        md: "0.25rem",    // 4px (was 6px, reduced by 2)
        lg: "0.375rem",   // 6px (was 8px, reduced by 2)
        xl: "0.625rem",   // 10px (was 12px, reduced by 2)
        "2xl": "0.75rem", // 12px (was 16px, reduced by ~4 but keeping proportional)
        full: "9999px",
      },
    },
  },
  plugins: [],
} satisfies Config;
