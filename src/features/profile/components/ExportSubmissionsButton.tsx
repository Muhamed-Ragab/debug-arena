import { Download, FileJson, FileSpreadsheet, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ExportFormat } from "../types";

export interface ExportSubmissionsButtonProps {
  disabled?: boolean;
  isExporting?: boolean;
  onExport: (format: ExportFormat) => void;
}

export function ExportSubmissionsButton({
  disabled = false,
  isExporting = false,
  onExport,
}: ExportSubmissionsButtonProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Export submissions"
        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 font-medium text-foreground text-xs transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
        disabled={disabled || isExporting}
      >
        {isExporting ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Download className="size-3.5" />
        )}
        <span className="font-mono text-xs">{"Export"}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          className="flex cursor-pointer items-center gap-2"
          onClick={() => onExport("csv")}
        >
          <FileSpreadsheet className="size-4 text-emerald-500" />
          <div className="flex flex-col">
            <span className="font-medium text-xs">{"Export as CSV"}</span>
            <span className="text-[10px] text-muted-foreground">
              {"Compatible with Excel, Sheets"}
            </span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="flex cursor-pointer items-center gap-2"
          onClick={() => onExport("json")}
        >
          <FileJson className="size-4 text-amber-500" />
          <div className="flex flex-col">
            <span className="font-medium text-xs">{"Export as JSON"}</span>
            <span className="text-[10px] text-muted-foreground">
              {"Full structured data"}
            </span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
