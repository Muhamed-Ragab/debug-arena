import type { ScorePart } from "../../lib/types";

export default function ScoreBreakdown({ parts }: { parts: ScorePart[] }) {
  return (
    <div>
      <p className="text-[11px] text-zinc-600 uppercase tracking-widest mb-3 font-mono">Score breakdown</p>
      <div className="grid grid-cols-4 gap-3">
        {parts.map((part) => {
          const pct = (part.score / part.max) * 100;
          const color = pct >= 80 ? "#22C55E" : pct >= 60 ? "#F59E0B" : "#EF4444";
          return (
            <div
              key={part.label}
              className="rounded-lg p-4"
              style={{ backgroundColor: "var(--card)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <p className="text-[11px] text-zinc-600 mb-2 font-mono uppercase tracking-wide">{part.label}</p>
              <p className="text-2xl font-semibold font-mono tabular-nums" style={{ color }}>
                {part.score}
                <span className="text-zinc-700 text-sm font-normal"> / {part.max}</span>
              </p>
              <div className="mt-3 h-[3px] rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, backgroundColor: color, opacity: 0.7 }}
                />
              </div>
              <p className="text-[11px] text-zinc-700 mt-2 leading-snug">{part.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
