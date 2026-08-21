import type { RightTab } from "../types";
import { cn } from "../../../lib/utils";
import ExplainPanel from "./ExplainPanel";
import FixPanel from "./FixPanel";
import HintsPanel from "./HintsPanel";

interface Props {
  rightTab: RightTab;
  setRightTab: (t: RightTab) => void;
  explanation: string;
  setExplanation: (v: string) => void;
  hintsOpen: number[];
  toggleHint: (i: number) => void;
}

const TABS: RightTab[] = ["explain", "fix", "hints"];

export default function ChallengeTabs({
  rightTab,
  setRightTab,
  explanation,
  setExplanation,
  hintsOpen,
  toggleHint,
}: Props) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setRightTab(tab)}
            className={cn(
              "px-4 py-3 text-[12px] font-medium capitalize transition-colors border-b",
              rightTab === tab
                ? "text-indigo-300 border-indigo-500"
                : "text-zinc-600 hover:text-zinc-400 border-transparent",
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {rightTab === "explain" && (
          <ExplainPanel explanation={explanation} setExplanation={setExplanation} />
        )}
        {rightTab === "fix" && <FixPanel />}
        {rightTab === "hints" && <HintsPanel hintsOpen={hintsOpen} toggleHint={toggleHint} />}
      </div>
    </div>
  );
}
