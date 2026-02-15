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
    },
  },
  plugins: [],
} satisfies Config;
