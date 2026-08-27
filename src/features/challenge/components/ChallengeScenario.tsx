import { ChevronDown, ChevronRight, Clock } from "lucide-react";
import { CategoryTag } from "@/components/shared/CategoryTag";
import { DiffBadge } from "@/components/shared/DiffBadge";
import { FormattedMarkdown } from "@/components/shared/FormattedMarkdown";
import type { CategoryConfig } from "@/lib/domain/categories";
import type { Challenge } from "@/lib/domain/types";
import { cn } from "@/lib/utils";
import { FileTree } from "./FileTree";

interface Props {
  cfg: CategoryConfig;
  challenge: Challenge;
  className?: string;
  scenarioParagraphs: string[];
  setTreeOpen: (v: boolean) => void;
  treeOpen: boolean;
}

export function ChallengeScenario({
  challenge,
  cfg,
  treeOpen,
  setTreeOpen,
  scenarioParagraphs,
  className,
}: Props) {
  const scenarioContent = scenarioParagraphs.join("\n\n");
  const fileNode = challenge.filePath ?? challenge.title;

  return (
    <div
      className={cn(
        "flex max-h-[45vh] w-full shrink-0 flex-col overflow-hidden border-border border-b bg-surface lg:max-h-none lg:border-b-0",
        className
      )}
    >
      <div className="border-border border-b px-5 pt-5 pb-4">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <CategoryTag category={challenge.category} />
          <DiffBadge difficulty={challenge.difficulty} />
        </div>
        <h2 className="mt-2.5 font-semibold text-[13px] text-heading leading-snug">
          {challenge.title}
        </h2>
        <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock size={10} /> {challenge.timeLimit ?? "30 min"}
          </span>
          <span className="font-mono">{challenge.points ?? 200} pts max</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 text-[12.5px] leading-relaxed">
        <FormattedMarkdown content={scenarioContent} />

        <div className="mt-5">
          <button
            className="mb-2 flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-widest transition-colors hover:text-foreground"
            onClick={() => setTreeOpen(!treeOpen)}
            type="button"
          >
            {treeOpen ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
            Relevant files
          </button>
          {Boolean(treeOpen) && <FileTree cfg={cfg} fileName={fileNode} />}
        </div>
      </div>
    </div>
  );
}
