import { FileCode } from "lucide-react";
import type { CategoryConfig } from "@/lib/domain/categories";

interface Props {
  cfg: CategoryConfig;
  fileName: string;
}

export function FileTree({ cfg, fileName }: Props) {
  return (
    <div className="space-y-0.5 font-mono text-[11.5px]">
      <div
        className="flex cursor-default items-center gap-1.5 rounded-sm py-0.5"
        style={{
          backgroundColor: cfg.bg,
          color: cfg.color,
        }}
      >
        <FileCode size={11} /> {fileName}
      </div>
    </div>
  );
}
