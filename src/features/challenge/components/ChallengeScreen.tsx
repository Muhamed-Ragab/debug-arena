"use client";

import { TopBar } from "@/components/layout/TopBar";
import { CATEGORY_CONFIG } from "@/lib/domain/categories";
import type { Challenge } from "@/lib/domain/types";
import { useChallengeWorkspace } from "../hooks/useChallengeWorkspace";
import type { DiffLine } from "../types";
import { ChallengeScenario } from "./ChallengeScenario";
import { ChallengeTabs } from "./ChallengeTabs";
import { CodeViewer } from "./CodeViewer";
import type { HintItem } from "./HintsPanel";
import { SubmitBar } from "./SubmitBar";

interface Props {
  challenge: Challenge;
  codeLines?: string[];
  diffLines?: DiffLine[];
  fileName?: string;
  hints?: HintItem[];
  onSubmit?: (submissionId: string) => void;
  scenarioParagraphs?: string[];
}

export function ChallengeScreen({
  challenge,
  onSubmit,
  codeLines,
  fileName,
  hints,
  diffLines,
  scenarioParagraphs,
}: Props) {
  const cfg =
    CATEGORY_CONFIG[challenge.category] ?? CATEGORY_CONFIG["React Rendering"];
  const ws = useChallengeWorkspace(challenge.id, onSubmit);

  return (
    <div className="flex h-full w-full flex-col">
      <TopBar
        crumbs={[
          { label: "Challenges", to: "/challenges" },
          { label: challenge.title },
        ]}
      />
      <div className="flex flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
        <ChallengeScenario
          cfg={cfg}
          challenge={challenge}
          scenarioParagraphs={scenarioParagraphs}
          setTreeOpen={ws.setTreeOpen}
          treeOpen={ws.treeOpen}
        />
        <CodeViewer
          cfg={cfg}
          codeLines={codeLines}
          fileName={fileName}
          onToggleLine={ws.toggleLine}
          selectedLine={ws.selectedLine}
        />
        <div className="flex w-full shrink-0 flex-col border-border border-s border-t lg:w-[308px] lg:border-t-0">
          <ChallengeTabs
            diffLines={diffLines}
            explanation={ws.explanation}
            hints={hints}
            hintsOpen={ws.hintsOpen}
            rightTab={ws.rightTab}
            setExplanation={ws.setExplanation}
            setRightTab={ws.setRightTab}
            toggleHint={ws.toggleHint}
          />
          {ws.error ? (
            <div className="bg-destructive/10 px-4 py-2 text-destructive text-xs">
              {ws.error}
            </div>
          ) : null}
          <SubmitBar
            isSubmitting={ws.isSubmitting}
            onSubmit={ws.submit}
            selectedLine={ws.selectedLine}
          />
        </div>
      </div>
    </div>
  );
}
