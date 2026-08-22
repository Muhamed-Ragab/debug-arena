interface Props {
  explanation: string;
  setExplanation: (v: string) => void;
}

export default function ExplainPanel({ explanation, setExplanation }: Props) {
  return (
    <div className="flex flex-col gap-3 h-full">
      <p className="text-[11.5px] text-zinc-600 leading-relaxed">
        Describe the root cause. What is broken and why does it fail after exactly three interactions?
      </p>
      <textarea
        value={explanation}
        onChange={(e) => setExplanation(e.target.value)}
        placeholder="The bug occurs because..."
        className="flex-1 min-h-[260px] w-full rounded p-3 text-[13px] text-zinc-300 placeholder:text-zinc-700 leading-relaxed resize-none focus:outline-none transition-colors"
        style={{
          backgroundColor: "var(--card)",
          border: "1px solid rgba(255,255,255,0.07)",
          fontFamily: "'Inter', system-ui, sans-serif",
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(99,102,241,0.4)")}
        onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")}
      />
    </div>
  );
}
