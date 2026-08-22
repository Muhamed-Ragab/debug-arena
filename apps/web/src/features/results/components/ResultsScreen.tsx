import { ChevronRight } from "lucide-react";
import {
  SCORE_PARTS,
  USER_EXPLANATION,
  CANONICAL,
  AI_FEEDBACK,
  PREVENTION,
} from "../../../features/results/data/results";
import ScoreBreakdown from "./ScoreBreakdown";
import ExplanationComparison from "./ExplanationComparison";
import Prevention from "./Prevention";
import TopBar from "../../../components/layout/TopBar";

interface Props {
  onNext: () => void;
}

export default function ResultsScreen({ onNext }: Props) {
  const total = SCORE_PARTS.reduce((s, p) => s + p.score, 0);
  const maxTotal = SCORE_PARTS.reduce((s, p) => s + p.max, 0);

  return (
    <div className="flex h-full w-full flex-col">
      <TopBar
        crumbs={[{ label: "Challenges", to: "/challenges" }, { label: "Results" }]}
      />
      <div className="flex-1 overflow-y-auto flex flex-col">
      <div
        className="px-4 pt-7 pb-5 border-b flex flex-wrap items-center justify-between gap-y-2 sticky top-0 z-10 backdrop-blur-sm sm:px-8"
        style={{ borderColor: "rgba(255,255,255,0.06)", backgroundColor: "rgba(13,13,18,0.92)" }}
      >
        <div className="min-w-0">
          <p className="text-[11px] text-zinc-600 uppercase tracking-widest mb-0.5 font-mono">Results</p>
          <h1 className="text-[15px] font-semibold text-zinc-100">Dashboard freezes after third click</h1>
        </div>
        <div className="text-end">
          <p className="text-[11px] text-zinc-600 font-mono mb-0.5">Total score</p>
          <p className="text-2xl font-semibold text-white tabular-nums font-mono">
            {total}
            <span className="text-zinc-600 text-base font-normal"> / {maxTotal}</span>
          </p>
        </div>
      </div>

      <div className="px-4 py-6 space-y-8 max-w-[1100px] mx-auto sm:px-8">
        <ScoreBreakdown parts={SCORE_PARTS} />
        <ExplanationComparison
          userExplanation={USER_EXPLANATION}
          canonical={CANONICAL}
          aiFeedback={AI_FEEDBACK}
        />
        <Prevention items={PREVENTION} />

        <div className="flex flex-wrap items-center justify-between gap-3 pb-8">
          <p className="text-[12px] text-zinc-700">Challenge complete · +{total} pts added to your profile</p>
          <button
            onClick={onNext}
            className="flex items-center gap-2 px-4 py-2 rounded text-[13px] font-medium text-white transition-colors"
            style={{ backgroundColor: "#4F46E5" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#4338CA")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#4F46E5")}
          >
            Back to challenges <ChevronRight size={14} />
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}
