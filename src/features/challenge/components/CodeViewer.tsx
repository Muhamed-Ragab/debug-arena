"use client";

import { FileCode, X } from "lucide-react";
import { useExtracted } from "next-intl";
import { Button } from "@/components/ui/button";
import type { CategoryConfig } from "@/lib/domain/categories";
import { tokenizeLine } from "../lib/tokenize";

interface Props {
  cfg: CategoryConfig;
  codeLines: string[];
  fileName: string;
  onClearLines?: () => void;
  onToggleLine: (n: number, isShift?: boolean) => void;
  selectedLine?: number | null;
  selectedLines?: number[];
}

export function CodeViewer({
  cfg,
  selectedLine,
  selectedLines,
  onToggleLine,
  onClearLines,
  codeLines,
  fileName,
}: Props) {
  const t = useExtracted();
  let activeLines: number[] = [];
  if (Array.isArray(selectedLines)) {
    activeLines = selectedLines;
  } else if (selectedLine !== null && selectedLine !== undefined) {
    activeLines = [selectedLine];
  }

  const formatSelectionText = () => {
    if (activeLines.length === 0) {
      return t("Click lines to mark bug location (Shift+click for range)");
    }
    if (activeLines.length === 1) {
      return t("Line {line} marked", { line: String(activeLines[0]) });
    }
    if (activeLines.length <= 4) {
      const sorted = [...activeLines].sort((a, b) => a - b);
      return t("Lines {lines} marked", {
        lines: sorted.join(", "),
      });
    }
    return t("{count} lines marked", { count: String(activeLines.length) });
  };

  return (
    <div className="flex min-h-[50vh] flex-1 flex-col overflow-hidden bg-inset lg:min-h-0">
      <div className="flex items-center justify-between border-border border-b bg-card/60 px-4 py-2">
        <div
          className="flex items-center gap-1.5 border-b-[1.5px] pb-0.5 font-mono text-[12px]"
          style={{ borderBottomColor: cfg.color, color: cfg.color }}
        >
          <FileCode size={13} /> {fileName}
        </div>

        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] text-muted-foreground">
            {formatSelectionText()}
          </span>
          {activeLines.length > 0 && onClearLines ? (
            <Button
              className="h-6 gap-1 rounded bg-white/5 px-2 py-0.5 font-mono text-[10px] text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              onClick={onClearLines}
              size="xs"
              title={t("Clear selected lines")}
              type="button"
              variant="ghost"
            >
              <X size={11} /> {t("Clear")}
            </Button>
          ) : null}
        </div>
      </div>

      <div className="flex-1 overflow-auto py-2">
        <table
          className="w-full border-collapse"
          style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}
        >
          <tbody>
            {codeLines.map((line, i) => {
              const n = i + 1;
              const selected = activeLines.includes(n);
              const tokens = tokenizeLine(line, n);
              return (
                <tr
                  className="group cursor-pointer select-text transition-colors hover:bg-white/5"
                  key={n}
                  onClick={(e) => onToggleLine(n, e.shiftKey)}
                  style={{
                    backgroundColor: selected ? `${cfg.color}18` : undefined,
                  }}
                >
                  <td
                    className="w-12 select-none py-[2.5px] ps-3 pe-4 text-end text-[12px] text-muted-foreground transition-colors"
                    style={{
                      color: selected ? cfg.color : undefined,
                      fontWeight: selected ? 600 : 400,
                    }}
                  >
                    {n}
                  </td>
                  <td className="whitespace-pre py-[2.5px] ps-2 pe-6 text-[12.5px] transition-colors">
                    {tokens.map((token) => (
                      <span
                        key={token.id}
                        style={{ color: selected ? cfg.color : token.color }}
                      >
                        {token.text}
                      </span>
                    ))}
                  </td>
                  <td
                    className="w-6 select-none pe-3 text-end text-[10px]"
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
