import { FileCode } from "lucide-react";
import type { CategoryConfig } from "../../data/categories";
import { CODE_LINES } from "../../data/challenges";
import { tokenizeLine } from "../../lib/tokenize";

interface Props {
  cfg: CategoryConfig;
  selectedLine: number | null;
  onToggleLine: (n: number) => void;
}

export default function CodeViewer({ cfg, selectedLine, onToggleLine }: Props) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: "#0b0b10" }}>
      <div
        className="flex items-center border-b"
        style={{ backgroundColor: "#0f0f15", borderColor: "rgba(255,255,255,0.06)" }}
      >
        <div
          className="flex items-center gap-1.5 px-4 py-2.5 text-[12px] font-mono border-b-[1.5px]"
          style={{ color: cfg.color, borderBottomColor: cfg.color }}
        >
          <FileCode size={12} /> Dashboard.tsx
        </div>
        <div className="ml-auto px-4 py-2.5 text-[11px] text-zinc-700 font-mono">
          {selectedLine ? `Line ${selectedLine} marked` : "Click a line to mark bug location"}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        <table
          className="w-full border-collapse"
          style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}
        >
          <tbody>
            {CODE_LINES.map((line, i) => {
              const n = i + 1;
              const selected = selectedLine === n;
              const tokens = tokenizeLine(line);
              return (
                <tr
                  key={n}
                  onClick={() => onToggleLine(n)}
                  className="cursor-pointer group"
                  style={{ backgroundColor: selected ? `${cfg.color}13` : undefined }}
                >
                  <td
                    className="select-none text-right pr-4 pl-3 py-[2.5px] w-10 text-[12px] transition-colors"
                    style={{ color: selected ? cfg.color : "#3a3a52" }}
                  >
                    {n}
                  </td>
                  <td className="pl-2 pr-6 py-[2.5px] text-[12.5px] group-hover:bg-white/[0.018] transition-colors">
                    {tokens.map((t, j) => (
                      <span key={j} style={{ color: selected ? cfg.color : t.color }}>
                        {t.text}
                      </span>
                    ))}
                  </td>
                  <td className="w-5 pr-2 text-[10px]" style={{ color: cfg.color }}>
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
