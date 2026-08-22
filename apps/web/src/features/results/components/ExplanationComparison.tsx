interface Props {
  userExplanation: string;
  canonical: string;
  aiFeedback: string;
}

export default function ExplanationComparison({ userExplanation, canonical, aiFeedback }: Props) {
  return (
    <div>
      <p className="text-[11px] text-zinc-600 uppercase tracking-widest mb-3 font-mono">Explanation comparison</p>
      <div className="grid grid-cols-1 gap-4 mb-4 md:grid-cols-2">
        <div
          className="rounded-lg p-4"
          style={{ backgroundColor: "var(--card)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <p className="text-[11px] text-zinc-600 uppercase tracking-wide font-mono mb-2.5">Your explanation</p>
          <p className="text-[13px] text-zinc-400 leading-relaxed">{userExplanation}</p>
        </div>
        <div
          className="rounded-lg p-4"
          style={{ backgroundColor: "var(--card)", border: "1px solid rgba(34,197,94,0.14)" }}
        >
          <p
            className="text-[11px] uppercase tracking-wide font-mono mb-2.5"
            style={{ color: "#22C55E" }}
          >
            Canonical root cause
          </p>
          <p className="text-[13px] text-zinc-300 leading-relaxed">{canonical}</p>
        </div>
      </div>

      <div
        className="rounded-lg p-4"
        style={{ backgroundColor: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.18)" }}
      >
        <p className="text-[11px] text-indigo-400 uppercase tracking-wide font-mono mb-2">AI feedback</p>
        <p className="text-[13px] text-zinc-400 leading-relaxed">{aiFeedback}</p>
      </div>
    </div>
  );
}
