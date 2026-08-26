import { DIFF_LINES } from "@/features/challenge/data/challenges";
import type { DiffLine } from "../types";

const LINE_STYLES = {
  add: {
    bg: "rgba(34,197,94,0.07)",
    sign: "+",
    signColor: "#22C55E",
    textColor: "#86EFAC",
  },
  ctx: {
    bg: "transparent",
    sign: " ",
    signColor: "transparent",
    textColor: "var(--muted-foreground)",
  },
  del: {
    bg: "rgba(239,68,68,0.07)",
    sign: "−",
    signColor: "#EF4444",
    textColor: "#FCA5A5",
  },
} as const;

interface Props {
  diffLines?: DiffLine[];
}

export function FixPanel({ diffLines = DIFF_LINES }: Props) {
  return (
    <div>
      <p className="mb-3 text-[11.5px] text-muted-foreground leading-relaxed">
        Canonical fix. Your score reflects how closely your explanation matches
        this approach.
      </p>
      <div className="overflow-hidden rounded border border-border bg-inset font-mono text-[11.5px]">
        {diffLines.map((line) => {
          const style = LINE_STYLES[line.type] ?? LINE_STYLES.ctx;
          return (
            <div
              className="flex items-start"
              key={`${line.type}-${line.text}`}
              style={{ backgroundColor: style.bg }}
            >
              <span
                className="w-6 shrink-0 select-none py-[3px] ps-3"
                style={{ color: style.signColor }}
              >
                {style.sign}
              </span>
              <span
                className="whitespace-pre px-2 py-[3px]"
                style={{ color: style.textColor }}
              >
                {line.text || " "}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
