"use client";

import { useExtracted } from "next-intl";
import type { ScorePart } from "../types";

function getScoreColor(pct: number): string {
  if (pct >= 80) {
    return "#22C55E";
  }
  if (pct >= 60) {
    return "#F59E0B";
  }
  return "#EF4444";
}

export function ScoreBreakdown({ parts }: { parts: ScorePart[] }) {
  const t = useExtracted();
  return (
    <div>
      <p className="mb-3 font-mono text-[11px] text-muted-foreground uppercase tracking-widest">
        {t("Score breakdown")}
      </p>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {parts.map((part) => {
          const pct = (part.score / part.max) * 100;
          const color = getScoreColor(pct);
          return (
            <div
              className="rounded-lg border border-border bg-card p-4"
              key={part.label}
            >
              <p className="mb-2 font-mono text-[11px] text-muted-foreground uppercase tracking-wide">
                {part.label}
              </p>
              <p
                className="font-mono font-semibold text-2xl tabular-nums"
                style={{ color }}
              >
                {part.score}
                <span className="font-normal text-muted-foreground text-sm">
                  {" "}
                  / {part.max}
                </span>
              </p>
              <div className="mt-3 h-[3px] overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    backgroundColor: color,
                    opacity: 0.7,
                    width: `${pct}%`,
                  }}
                />
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground leading-snug">
                {part.desc}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
