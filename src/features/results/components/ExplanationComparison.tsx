import {
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  Sparkles,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { EvaluationDetails } from "../types";

interface Props {
  aiFeedback: string;
  canonical: string;
  evaluationDetails?: EvaluationDetails | null;
  userExplanation: string;
  userSolution?: string;
}

export function ExplanationComparison({
  userExplanation,
  userSolution,
  canonical,
  aiFeedback,
  evaluationDetails,
}: Props) {
  const isCorrect = evaluationDetails?.isCorrect;
  const needsEnhancement = evaluationDetails?.needsEnhancement;
  const enhancementSuggestions =
    evaluationDetails?.enhancementSuggestions ?? [];
  const keyConcepts = evaluationDetails?.keyConceptsIdentified ?? [];
  const missedMechanisms = evaluationDetails?.missedMechanisms ?? [];

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-3 font-mono text-[11px] text-muted-foreground uppercase tracking-widest">
          Diagnosis & Solution comparison
        </p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-3 rounded-lg border border-border bg-card p-4">
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <p className="font-mono text-[11px] text-muted-foreground uppercase tracking-wide">
                  Your root cause diagnosis
                </p>
                {isCorrect !== undefined && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium text-[11px]",
                      isCorrect
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-rose-500/15 text-rose-400"
                    )}
                  >
                    {isCorrect ? (
                      <>
                        <CheckCircle2 size={12} /> Correct Diagnosis
                      </>
                    ) : (
                      <>
                        <XCircle size={12} /> Incorrect Mechanism
                      </>
                    )}
                  </span>
                )}
              </div>
              <p className="text-[13px] text-foreground leading-relaxed">
                {userExplanation}
              </p>
            </div>
            {Boolean(userSolution) && (
              <div className="border-border border-t pt-3">
                <p className="mb-1.5 font-mono text-[11px] text-muted-foreground uppercase tracking-wide">
                  Your proposed solution
                </p>
                <p className="text-[13px] text-foreground leading-relaxed">
                  {userSolution}
                </p>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-emerald-500/30 bg-card p-4">
            <p className="mb-2.5 font-mono text-[11px] text-emerald-400 uppercase tracking-wide">
              Canonical root cause
            </p>
            <p className="text-[13px] text-foreground leading-relaxed">
              {canonical}
            </p>
          </div>
        </div>
      </div>

      {/* AI Feedback Card */}
      <div className="rounded-lg border border-primary/25 bg-primary/5 p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-primary/15 border-b pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="text-primary" size={16} />
            <p className="font-medium font-mono text-[12px] text-primary uppercase tracking-wide">
              LLM Mentor Evaluation & Feedback
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {Boolean(needsEnhancement) && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 font-medium text-[11px] text-amber-400">
                <AlertTriangle size={12} /> Needs Enhancement
              </span>
            )}
            {evaluationDetails?.alignmentPercent !== undefined && (
              <span className="rounded-full bg-primary/15 px-2 py-0.5 font-mono text-[11px] text-primary">
                {evaluationDetails.alignmentPercent}% alignment
              </span>
            )}
          </div>
        </div>

        <p className="text-[13px] text-foreground leading-relaxed">
          {aiFeedback}
        </p>

        {/* Enhancement Suggestions */}
        {enhancementSuggestions.length > 0 && (
          <div className="mt-4 rounded-md border border-amber-500/20 bg-amber-500/5 p-3.5">
            <div className="mb-2 flex items-center gap-1.5 text-amber-400">
              <Lightbulb size={14} />
              <p className="font-medium font-mono text-[11px] uppercase tracking-wide">
                Enhancement Recommendations
              </p>
            </div>
            <ul className="space-y-1.5 text-[12px] text-muted-foreground">
              {enhancementSuggestions.map((suggestion) => (
                <li
                  className="flex items-start gap-2 text-foreground/90"
                  key={suggestion}
                >
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Key Strengths & Missed Concepts */}
        {(keyConcepts.length > 0 || missedMechanisms.length > 0) && (
          <div className="mt-4 grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2">
            {keyConcepts.length > 0 && (
              <div className="rounded-md border border-border/60 bg-card/60 p-3">
                <p className="mb-2 font-mono text-[11px] text-emerald-400 uppercase tracking-wide">
                  Key Concepts Identified
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {keyConcepts.map((concept) => (
                    <span
                      className="rounded bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-300"
                      key={concept}
                    >
                      ✓ {concept}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {missedMechanisms.length > 0 && (
              <div className="rounded-md border border-border/60 bg-card/60 p-3">
                <p className="mb-2 font-mono text-[11px] text-rose-400 uppercase tracking-wide">
                  Missed Mechanisms
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {missedMechanisms.map((missed) => (
                    <span
                      className="rounded bg-rose-500/10 px-2 py-0.5 text-[11px] text-rose-300"
                      key={missed}
                    >
                      • {missed}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
