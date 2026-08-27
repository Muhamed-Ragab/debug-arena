interface Props {
  explanation: string;
  setExplanation: (v: string) => void;
  setSolution?: (v: string) => void;
  solution?: string;
}

export function ExplainPanel({
  explanation,
  setExplanation,
  solution = "",
  setSolution,
}: Props) {
  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto">
      {/* 1. Root Cause */}
      <div className="flex flex-col gap-1.5">
        <label
          className="font-medium font-mono text-[11px] text-muted-foreground uppercase tracking-wider"
          htmlFor="root-cause-input"
        >
          1. Root Cause Diagnosis
        </label>
        <p className="text-[11.5px] text-muted-foreground leading-relaxed">
          Describe the underlying failure mechanism. What is broken and why does
          it fail?
        </p>
        <textarea
          className="min-h-35 w-full resize-none rounded-md border border-border bg-card p-3 text-[13px] text-foreground leading-relaxed transition-colors placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
          id="root-cause-input"
          onChange={(e) => setExplanation(e.target.value)}
          placeholder="The bug occurs because..."
          value={explanation}
        />
      </div>

      {/* 2. Proposed Solution / Fix */}
      <div className="flex flex-col gap-1.5">
        <label
          className="font-medium font-mono text-[11px] text-muted-foreground uppercase tracking-wider"
          htmlFor="solution-input"
        >
          2. Proposed Solution & Fix
        </label>
        <p className="text-[11.5px] text-muted-foreground leading-relaxed">
          Describe how you would resolve this bug and prevent regressions.
        </p>
        <textarea
          className="min-h-35 w-full resize-none rounded-md border border-border bg-card p-3 text-[13px] text-foreground leading-relaxed transition-colors placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
          id="solution-input"
          onChange={(e) => setSolution?.(e.target.value)}
          placeholder="To fix this, we should change..."
          value={solution}
        />
      </div>
    </div>
  );
}
