import { FileCode } from "lucide-react";
import { CODE_LINES } from "@/features/challenge/data/challenges";
import type { CategoryConfig } from "@/lib/domain/categories";
import { tokenizeLine } from "../lib/tokenize";

interface Props {
  cfg: CategoryConfig;
  codeLines?: string[];
  fileName?: string;
  onToggleLine: (n: number) => void;
  selectedLine: number | null;
}

export function CodeViewer({
  cfg,
  selectedLine,
  onToggleLine,
  codeLines = CODE_LINES,
  fileName = "Dashboard.tsx",
}: Props) {
  return (
    <div className="flex min-h-[50vh] flex-1 flex-col overflow-hidden bg-inset lg:min-h-0">
      <div className="flex items-center border-border border-b bg-card/60">
        <div
          className="flex items-center gap-1.5 border-b-[1.5px] px-4 py-2.5 font-mono text-[12px]"
          style={{ borderBottomColor: cfg.color, color: cfg.color }}
        >
          <FileCode size={12} /> {fileName}
        </div>
        <div className="ms-auto px-4 py-2.5 font-mono text-[11px] text-muted-foreground">
          {selectedLine
            ? `Line ${selectedLine} marked`
            : "Click a line to mark bug location"}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        <table
          className="w-full border-collapse"
          style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}
        >
          <tbody>
            {codeLines.map((line, i) => {
              const n = i + 1;
              const selected = selectedLine === n;
              const tokens = tokenizeLine(line, n);
              return (
                <tr
                  className="group cursor-pointer hover:bg-white/[0.02]"
                  key={n}
                  onClick={() => onToggleLine(n)}
                  style={{
                    backgroundColor: selected ? `${cfg.color}18` : undefined,
                  }}
                >
                  <td
                    className="w-10 select-none py-[2.5px] ps-3 pe-4 text-end text-[12px] text-muted-foreground transition-colors"
                    style={{ color: selected ? cfg.color : undefined }}
                  >
                    {n}
                  </td>
                  <td className="py-[2.5px] ps-2 pe-6 text-[12.5px] transition-colors">
                    {tokens.map((t) => (
                      <span
                        key={t.id}
                        style={{ color: selected ? cfg.color : t.color }}
                      >
                        {t.text}
                      </span>
                    ))}
                  </td>
                  <td
                    className="w-5 pe-2 text-[10px]"
                    style={{ color: cfg.color }}
                  >
                    {selected ? "●" : ""}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
