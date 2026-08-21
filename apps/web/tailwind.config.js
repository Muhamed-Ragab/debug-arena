/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        surface: "var(--surface)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        inset: "var(--inset)",
        foreground: "var(--foreground)",
        heading: "var(--heading)",
        body: "var(--body)",
        muted: {
          foreground: "var(--muted-foreground)",
          secondary: "var(--muted-foreground-2)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        border: "var(--border)",
        "border-soft": "var(--border-soft)",
        "border-faint": "var(--border-faint)",
        header: "var(--header-bg)",
        success: {
          DEFAULT: "var(--success)",
          strong: "var(--success-strong)",
        },
        danger: {
          DEFAULT: "var(--danger)",
          soft: "var(--danger-soft)",
        },
        warning: {
          DEFAULT: "var(--warning)",
          strong: "var(--warning-strong)",
        },
        cat: {
          react: "var(--cat-react)",
          "react-dim": "var(--cat-react-dim)",
          concurrency: "var(--cat-concurrency)",
          "concurrency-dim": "var(--cat-concurrency-dim)",
          distributed: "var(--cat-distributed)",
          "distributed-dim": "var(--cat-distributed-dim)",
          memory: "var(--cat-memory)",
          "memory-dim": "var(--cat-memory-dim)",
        },
        diff: {
          easy: "var(--diff-easy)",
          medium: "var(--diff-medium)",
          hard: "var(--diff-hard)",
          expert: "var(--diff-expert)",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "'Cascadia Code'", "monospace"],
      },
      borderRadius: {
        lg: "var(--radius-lg)",
        md: "var(--radius-sm)",
        sm: "calc(var(--radius-sm) - 2px)",
      },
    },
  },
  plugins: [],
};
