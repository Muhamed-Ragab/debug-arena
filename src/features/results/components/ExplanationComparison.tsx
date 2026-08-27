interface Props {
  aiFeedback: string;
  canonical: string;
  userExplanation: string;
  userSolution?: string;
}

export function ExplanationComparison({
  userExplanation,
  userSolution,
  canonical,
  aiFeedback,
}: Props) {
  return (
    <div>
      <p className="mb-3 font-mono text-[11px] text-muted-foreground uppercase tracking-widest">
        Diagnosis & Solution comparison
      </p>
      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-3 rounded-lg border border-border bg-card p-4">
          <div>
            <p className="mb-1.5 font-mono text-[11px] text-muted-foreground uppercase tracking-wide">
              Your root cause diagnosis
            </p>
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

      <div className="rounded-lg border border-primary/20 bg-primary/10 p-4">
        <p className="mb-2 font-mono text-[11px] text-primary uppercase tracking-wide">
          AI feedback & Evaluation
        </p>
        <p className="text-[13px] text-foreground leading-relaxed">
          {aiFeedback}
        </p>
      </div>
    </div>
  );
}
