import { Clock, ChevronDown, ChevronRight } from "lucide-react";
import type { Challenge } from "../../../lib/types";
import type { CategoryConfig } from "../../../lib/categories";
import { CategoryTag } from "../../../components/ui/CategoryTag";
import { DiffBadge } from "../../../components/ui/DiffBadge";
import { SCENARIO_PARAGRAPHS } from "../../../features/challenge/data/challenges";
import FileTree from "./FileTree";

interface Props {
  challenge: Challenge;
  cfg: CategoryConfig;
  treeOpen: boolean;
  setTreeOpen: (v: boolean) => void;
}

export default function ChallengeScenario({ challenge, cfg, treeOpen, setTreeOpen }: Props) {
  const lastIndex = SCENARIO_PARAGRAPHS.length - 1;

  return (
    <div
      className="w-full shrink-0 flex flex-col border-b border-e overflow-hidden max-h-[45vh] lg:max-h-none lg:w-[272px] lg:border-b-0"
      style={{ borderColor: "rgba(255,255,255,0.06)" }}
    >
      <div className="px-5 pt-5 pb-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <CategoryTag category={challenge.category} />
          <DiffBadge difficulty={challenge.difficulty} />
        </div>
        <h2 className="text-[13px] font-semibold text-zinc-100 leading-snug mt-2.5">{challenge.title}</h2>
        <div className="flex items-center gap-3 mt-2 text-[11px] text-zinc-700">
          <span className="flex items-center gap-1">
            <Clock size={10} /> {challenge.timeLimit}
          </span>
          <span className="font-mono">{challenge.points} pts max</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 text-[12.5px] text-zinc-500 leading-relaxed">
        {SCENARIO_PARAGRAPHS.map((p, i) => (
          <p key={i} className={i < lastIndex ? "mb-3" : ""}>
            {i === lastIndex ? (
              <>
                The{" "}
                <code className="font-mono text-[11.5px] text-zinc-400 bg-white/[0.06] px-1 py-0.5 rounded">
                  Dashboard
                </code>{" "}
                component was refactored in this release to add a polling mechanism.
              </>
            ) : (
              p
            )}
          </p>
        ))}

        <div className="mt-5">
          <button
            onClick={() => setTreeOpen(!treeOpen)}
            className="flex items-center gap-1.5 text-[10px] text-zinc-700 hover:text-zinc-400 transition-colors uppercase tracking-widest mb-2"
          >
            {treeOpen ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
            Relevant files
          </button>
          {treeOpen && <FileTree cfg={cfg} />}
        </div>
      </div>
    </div>
  );
}
