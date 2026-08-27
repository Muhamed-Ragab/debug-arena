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
  diffLines: DiffLine[];
}

export function FixPanel({ diffLines }: Props) {
  return (
    <div className="flex h-full flex-col">
      <p className="mb-3 text-[11.5px] text-muted-foreground leading-relaxed">
        Canonical fix. Your score reflects how closely your diagnosis and
        solution match this approach.
      </p>
      <div className="w-full flex-1 overflow-x-auto rounded-md border border-border bg-inset font-mono text-[12px]">
        <div className="min-w-max p-1">
          {diffLines.map((line) => {
            const style = LINE_STYLES[line.type] ?? LINE_STYLES.ctx;
            const lineKey = `${line.line ?? ""}:${line.type}:${line.text}`;
            return (
              <div
                className="flex items-start rounded-sm py-0.5"
                key={lineKey}
                style={{ backgroundColor: style.bg }}
              >
                <span
                  className="w-7 shrink-0 select-none ps-2 font-bold font-mono text-[12px]"
                  style={{ color: style.signColor }}
                >
                  {style.sign}
                </span>
                <span
                  className="pe-4 font-mono text-[12px] leading-relaxed"
                  style={{ color: style.textColor, whiteSpace: "pre" }}
                >
                  {line.text || " "}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
