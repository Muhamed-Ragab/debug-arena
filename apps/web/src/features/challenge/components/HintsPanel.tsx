import { Lock, ChevronDown } from "lucide-react";
import { HINTS } from "../../../features/challenge/data/challenges";

interface Props {
  hintsOpen: number[];
  toggleHint: (i: number) => void;
}

export default function HintsPanel({ hintsOpen, toggleHint }: Props) {
  return (
    <div className="space-y-2.5">
      <p className="text-[11.5px] text-zinc-600 mb-4 leading-relaxed">
        Each revealed hint reduces your maximum score for this challenge.
      </p>
      {HINTS.map((hint, i) => {
        const open = hintsOpen.includes(i);
        const cost = (i + 1) * 10;
        return (
          <div
            key={i}
            className="rounded overflow-hidden border"
            style={{ backgroundColor: "var(--card)", borderColor: "rgba(255,255,255,0.06)" }}
          >
            <button
              onClick={() => toggleHint(i)}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-[12px] text-start"
            >
              {open ? (
                <ChevronDown size={12} className="text-zinc-500 flex-shrink-0" />
              ) : (
                <Lock size={11} className="text-zinc-700 flex-shrink-0" />
              )}
              <span className={open ? "text-zinc-400" : "text-zinc-600"}>Hint {i + 1}</span>
              {!open && (
                <span className="ms-auto text-[11px] font-mono" style={{ color: "#F59E0B" }}>
                  Reveal (−{cost} pts)
                </span>
              )}
            </button>
            {open && (
              <div
                className="px-3 pb-3 pt-2 text-[12px] text-zinc-400 leading-relaxed border-t"
                style={{ borderColor: "rgba(255,255,255,0.05)" }}
              >
                {hint}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
