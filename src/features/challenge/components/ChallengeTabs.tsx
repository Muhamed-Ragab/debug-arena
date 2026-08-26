import { cn } from "@/lib/utils";
import type { DiffLine, RightTab } from "../types";
import { ExplainPanel } from "./ExplainPanel";
import { FixPanel } from "./FixPanel";
import { type HintItem, HintsPanel } from "./HintsPanel";

interface Props {
  diffLines?: DiffLine[];
  explanation: string;
  hints?: HintItem[];
  hintsOpen: number[];
  rightTab: RightTab;
  setExplanation: (v: string) => void;
  setRightTab: (t: RightTab) => void;
  toggleHint: (i: number) => void;
}

const TABS: RightTab[] = ["explain", "fix", "hints"];

export function ChallengeTabs({
  rightTab,
  setRightTab,
  explanation,
  setExplanation,
  hintsOpen,
  toggleHint,
  hints,
  diffLines,
}: Props) {
  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-surface">
      <div className="flex border-border border-b">
        {TABS.map((tab) => (
          <button
            className={cn(
              "border-b-2 px-4 py-3 font-medium text-[12px] capitalize transition-colors",
              rightTab === tab
                ? "border-primary font-semibold text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
            key={tab}
            onClick={() => setRightTab(tab)}
            type="button"
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {rightTab === "explain" && (
          <ExplainPanel
            explanation={explanation}
            setExplanation={setExplanation}
          />
        )}
        {rightTab === "fix" && <FixPanel diffLines={diffLines} />}
        {rightTab === "hints" && (
          <HintsPanel
            hints={hints}
            hintsOpen={hintsOpen}
            toggleHint={toggleHint}
          />
        )}
      </div>
    </div>
  );
}
