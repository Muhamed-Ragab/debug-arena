interface Props {
  aiFeedback: string;
  canonical: string;
  userExplanation: string;
}

export function ExplanationComparison({
  userExplanation,
  canonical,
  aiFeedback,
}: Props) {
  return (
    <div>
      <p className="mb-3 font-mono text-[11px] text-muted-foreground uppercase tracking-widest">
        Explanation comparison
      </p>
      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="mb-2.5 font-mono text-[11px] text-muted-foreground uppercase tracking-wide">
            Your explanation
          </p>
          <p className="text-[13px] text-foreground leading-relaxed">
            {userExplanation}
          </p>
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
          AI feedback
        </p>
        <p className="text-[13px] text-foreground leading-relaxed">
          {aiFeedback}
        </p>
      </div>
    </div>
  );
}
