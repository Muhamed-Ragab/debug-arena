import { SITE_CONFIG } from "./config";

export interface SocialCardProps {
  badge?: string;
  description?: string;
  domain?: string;
  subtitle?: string;
  title?: string;
}

export function SocialCard({
  badge = "Interactive Code Sandboxes",
  description = "Learn diagnostic engineering through realistic full-stack scenarios, AI-generated challenge variations, and comprehensive skill radar analytics.",
  domain = "debug-arena-ai.vercel.app",
  subtitle = "Fix Real Bugs in Real Time.",
  title = "Master Software Debugging.",
}: SocialCardProps = {}) {
  return (
    <div
      style={{
        backgroundColor: "#090d16",
        display: "flex",
        flexDirection: "column",
        fontFamily: "system-ui, -apple-system, sans-serif",
        height: "100%",
        justifyContent: "space-between",
        padding: "60px 80px",
        position: "relative",
        width: "100%",
      }}
    >
      {/* Background Decorative Glows */}
      <div
        style={{
          background:
            "radial-gradient(circle, rgba(99, 102, 241, 0.28) 0%, rgba(99, 102, 241, 0) 70%)",
          borderRadius: "50%",
          height: "550px",
          position: "absolute",
          right: "-80px",
          top: "-120px",
          width: "550px",
        }}
      />
      <div
        style={{
          background:
            "radial-gradient(circle, rgba(168, 85, 247, 0.22) 0%, rgba(168, 85, 247, 0) 70%)",
          borderRadius: "50%",
          bottom: "-120px",
          height: "500px",
          left: "-80px",
          position: "absolute",
          width: "500px",
        }}
      />

      {/* Top Header: Logo + Brand + Category Pill */}
      <div
        style={{
          alignItems: "center",
          display: "flex",
          justifyContent: "space-between",
          width: "100%",
        }}
      >
        <div style={{ alignItems: "center", display: "flex" }}>
          {/* Logo Mark */}
          <div
            style={{
              alignItems: "center",
              backgroundColor: "#4f46e5",
              borderRadius: "14px",
              display: "flex",
              height: "54px",
              justifyContent: "center",
              width: "54px",
            }}
          >
            <svg
              fill="none"
              height="30"
              stroke="#ffffff"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.2"
              viewBox="0 0 24 24"
              width="30"
            >
              <title>{SITE_CONFIG.name}</title>
              <path d="m8 2 1.88 1.88" />
              <path d="M14.12 3.88 16 2" />
              <path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1" />
              <path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6" />
              <path d="M12 20v-9" />
              <path d="M6.53 9C4.6 8.8 3 7.1 3 5" />
              <path d="M6 13H2" />
              <path d="M3 21c0-2.1 1.7-3.9 3.8-4" />
              <path d="M20.97 5c0 2.1-1.6 3.8-3.5 4" />
              <path d="M22 13h-4" />
              <path d="M17.2 17c2.1.1 3.8 1.9 3.8 4" />
            </svg>
          </div>
          <span
            style={{
              color: "#ffffff",
              fontSize: "30px",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              marginLeft: "16px",
            }}
          >
            {SITE_CONFIG.name}
          </span>
        </div>

        <div
          style={{
            alignItems: "center",
            backgroundColor: "rgba(99, 102, 241, 0.12)",
            border: "1px solid rgba(99, 102, 241, 0.35)",
            borderRadius: "9999px",
            color: "#a5b4fc",
            display: "flex",
            fontSize: "14px",
            fontWeight: 600,
            letterSpacing: "0.06em",
            padding: "8px 18px",
            textTransform: "uppercase",
          }}
        >
          {badge}
        </div>
      </div>

      {/* Main Copy / Tagline */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          maxWidth: "960px",
        }}
      >
        <h1
          style={{
            color: "#ffffff",
            fontSize: "58px",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            lineHeight: 1.15,
            margin: "0 0 16px 0",
          }}
        >
          {title}
          <br />
          <span style={{ color: "#818cf8" }}>{subtitle}</span>
        </h1>
        <p
          style={{
            color: "#94a3b8",
            fontSize: "22px",
            lineHeight: 1.45,
            margin: 0,
          }}
        >
          {description}
        </p>
      </div>

      {/* Bottom Highlights & URL */}
      <div
        style={{
          alignItems: "center",
          borderTop: "1px solid #1e293b",
          display: "flex",
          justifyContent: "space-between",
          paddingTop: "24px",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", gap: "14px" }}>
          {[
            "AI Bug Injection",
            "Real-World Scenarios",
            "Diagnostic Radar",
            "Live Evaluation",
          ].map((feature) => (
            <div
              key={feature}
              style={{
                alignItems: "center",
                backgroundColor: "#111827",
                border: "1px solid #1f2937",
                borderRadius: "8px",
                color: "#e2e8f0",
                display: "flex",
                fontSize: "14px",
                fontWeight: 600,
                padding: "8px 14px",
              }}
            >
              {feature}
            </div>
          ))}
        </div>

        <span
          style={{
            color: "#64748b",
            fontSize: "16px",
            fontWeight: 500,
          }}
        >
          {domain}
        </span>
      </div>
    </div>
  );
}
