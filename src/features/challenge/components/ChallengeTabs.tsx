"use client";

import { useExtracted } from "next-intl";
import { Button } from "@/components/ui/button";
import type { HintItem } from "@/features/challenge/types";
import { cn } from "@/lib/utils";
import type { DiffLine, RightTab } from "../types";
import { ExplainPanel } from "./ExplainPanel";
import { FixPanel } from "./FixPanel";
import { HintsPanel } from "./HintsPanel";

interface Props {
  diffLines: DiffLine[];
  explanation: string;
  fieldErrors?: {
    rootCauseExplanation?: string[];
  } | null;
  hints: HintItem[];
  hintsOpen: number[];
  rightTab: RightTab;
  setExplanation: (v: string) => void;
  setRightTab: (t: RightTab) => void;
  setSolution?: (v: string) => void;
  solution?: string;
  toggleHint: (i: number) => void;
}

const TABS: RightTab[] = ["explain", "fix", "hints"];

export function ChallengeTabs({
  diffLines,
  explanation,
  fieldErrors,
  hints,
  hintsOpen,
  rightTab,
  setExplanation,
  setRightTab,
  setSolution,
  solution,
  toggleHint,
}: Props) {
  const t = useExtracted();
  const getTabLabel = (tab: RightTab): string => {
    switch (tab) {
      case "explain":
        return t("explain");
      case "fix":
        return t("fix");
      case "hints":
        return t("hints");
      default:
        return tab;
    }
  };
  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-surface">
      <div className="flex border-border border-b">
        {TABS.map((tab) => (
          <Button
            className={cn(
              "rounded-none border-b-2 px-4 py-3 font-medium text-[12px] capitalize transition-colors",
              rightTab === tab
                ? "border-primary font-semibold text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
            key={tab}
            onClick={() => setRightTab(tab)}
            size="sm"
            type="button"
            variant="ghost"
          >
            {getTabLabel(tab)}
          </Button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {rightTab === "explain" && (
          <ExplainPanel
            explanation={explanation}
            fieldErrors={fieldErrors}
            setExplanation={setExplanation}
            setSolution={setSolution}
            solution={solution}
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
