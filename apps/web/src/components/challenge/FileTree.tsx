import { Folder, FileCode } from "lucide-react";
import type { CategoryConfig } from "../../data/categories";
import { FILE_TREE } from "../../data/challenges";

export default function FileTree({ cfg }: { cfg: CategoryConfig }) {
  return (
    <div className="font-mono text-[11.5px] space-y-0.5">
      {FILE_TREE.map((node, i) => {
        const indent = { paddingLeft: node.depth * 16 } as const;
        if (node.type === "folder") {
          return (
            <div key={i} className="flex items-center gap-1.5 text-zinc-600" style={indent}>
              <Folder size={11} /> {node.name}
            </div>
          );
        }
        const highlighted = node.highlight;
        return (
          <div
            key={i}
            className="flex items-center gap-1.5 py-0.5 rounded-sm cursor-default"
            style={{
              ...indent,
              color: highlighted ? cfg.color : "#3a3a52",
              backgroundColor: highlighted ? cfg.bg : "transparent",
            }}
          >
            <FileCode size={11} /> {node.name}
          </div>
        );
      })}
    </div>
  );
}
