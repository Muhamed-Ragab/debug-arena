import { FileCode, Folder } from "lucide-react";
import { FILE_TREE } from "@/features/challenge/data/challenges";
import type { CategoryConfig } from "@/lib/domain/categories";

export function FileTree({ cfg }: { cfg: CategoryConfig }) {
  return (
    <div className="space-y-0.5 font-mono text-[11.5px]">
      {FILE_TREE.map((node) => {
        const indent = { paddingLeft: node.depth * 16 } as const;
        const nodeKey = `${node.type}-${node.name}-${node.depth}`;
        if (node.type === "folder") {
          return (
            <div
              className="flex items-center gap-1.5 text-muted-foreground"
              key={nodeKey}
              style={indent}
            >
              <Folder size={11} /> {node.name}
            </div>
          );
        }
        const highlighted = node.highlight;
        return (
          <div
            className="flex cursor-default items-center gap-1.5 rounded-sm py-0.5"
            key={nodeKey}
            style={{
              ...indent,
              backgroundColor: highlighted ? cfg.bg : "transparent",
              color: highlighted ? cfg.color : undefined,
            }}
          >
            <FileCode size={11} /> {node.name}
          </div>
        );
      })}
    </div>
  );
}
