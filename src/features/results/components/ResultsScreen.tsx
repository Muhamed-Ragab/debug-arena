"use client";

import { ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/button";
import type { EvaluationDetails, ScorePart } from "@/features/results/types";
import { ExplanationComparison } from "./ExplanationComparison";
import { Prevention } from "./Prevention";
import { ScoreBreakdown } from "./ScoreBreakdown";

interface Props {
  aiFeedback: string;
  canonicalExplanation: string;
  challengeTitle: string;
  evaluationDetails: EvaluationDetails;
  maxScore: number;
  onNext?: () => void;
  preventionNotes: string[];
  scoreParts: ScorePart[];
  totalScore: number;
  userExplanation: string;
  userSolution: string;
}

export function ResultsScreen({
  onNext,
  challengeTitle,
  scoreParts,
  totalScore,
  maxScore,
  userExplanation,
  userSolution,
  canonicalExplanation,
  aiFeedback,
  evaluationDetails,
  preventionNotes,
}: Props) {
  const router = useRouter();
  const handleNext = onNext ?? (() => router.push("/challenges"));

  const calculatedTotal = totalScore;
  const calculatedMax = maxScore;

  return (
    <div className="flex h-full w-full flex-col">
      <TopBar
        crumbs={[
          { label: "Challenges", to: "/challenges" },
          { label: "Results" },
        ]}
      />
      <div className="flex flex-1 flex-col overflow-y-auto">
        <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-y-2 border-border border-b bg-surface/90 px-4 pt-7 pb-5 backdrop-blur-md sm:px-8">
          <div className="min-w-0">
            <p className="mb-0.5 font-mono text-[11px] text-muted-foreground uppercase tracking-widest">
              Results
            </p>
            <h1 className="font-semibold text-[15px] text-heading">
              {challengeTitle}
            </h1>
          </div>
          <div className="text-end">
            <p className="mb-0.5 font-mono text-[11px] text-muted-foreground">
              Total score
            </p>
            <p className="font-mono font-semibold text-2xl text-heading tabular-nums">
              {calculatedTotal}
              <span className="font-normal text-base text-muted-foreground">
                {" "}
                / {calculatedMax}
              </span>
            </p>
          </div>
        </div>

        <div className="mx-auto w-full max-w-275 space-y-8 px-4 py-6 sm:px-8">
          <ScoreBreakdown parts={scoreParts} />
          <ExplanationComparison
            aiFeedback={aiFeedback}
            canonical={canonicalExplanation}
            evaluationDetails={evaluationDetails}
            userExplanation={userExplanation}
            userSolution={userSolution}
          />
          <Prevention items={preventionNotes} />

          <div className="flex flex-wrap items-center justify-between gap-3 pb-8">
            <p className="text-[12px] text-muted-foreground">
              Challenge complete · +{calculatedTotal} pts added to your profile
            </p>
            <Button className="flex items-center gap-2" onClick={handleNext}>
              Back to challenges <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
