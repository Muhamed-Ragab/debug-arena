interface Props {
  explanation: string;
  setExplanation: (v: string) => void;
}

export function ExplainPanel({ explanation, setExplanation }: Props) {
  return (
    <div className="flex h-full flex-col gap-3">
      <p className="text-[11.5px] text-muted-foreground leading-relaxed">
        Describe the root cause. What is broken and why does it fail after
        exactly three interactions?
      </p>
      <textarea
        className="min-h-[260px] w-full flex-1 resize-none rounded-md border border-border bg-card p-3 text-[13px] text-foreground leading-relaxed transition-colors placeholder:text-muted-foreground focus:border-primary focus:outline-none"
        onChange={(e) => setExplanation(e.target.value)}
        placeholder="The bug occurs because..."
        value={explanation}
      />
    </div>
  );
}
