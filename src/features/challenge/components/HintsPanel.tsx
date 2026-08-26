import { ChevronDown, Lock } from "lucide-react";
import { HINTS } from "@/features/challenge/data/challenges";

export interface HintItem {
  order: number;
  penaltyPoints: number;
  socraticPrompt: string;
}

interface Props {
  hints?: HintItem[];
  hintsOpen: number[];
  toggleHint: (i: number) => void;
}

export function HintsPanel({ hintsOpen, toggleHint, hints }: Props) {
  // Normalize hints format if custom hints array provided, else fallback to HINTS
  const formattedHints: HintItem[] =
    hints && hints.length > 0
      ? hints
      : HINTS.map((h, i) => ({
          order: i + 1,
          penaltyPoints: (i + 1) * 10,
          socraticPrompt: h,
        }));

  return (
    <div className="space-y-2.5">
      <p className="mb-4 text-[11.5px] text-muted-foreground leading-relaxed">
        Each revealed hint reduces your maximum score for this challenge.
      </p>
      {formattedHints.map((hint, i) => {
        const open = hintsOpen.includes(i);
        const cost = hint.penaltyPoints;
        return (
          <div
            className="overflow-hidden rounded border border-border bg-card"
            key={`${hint.order}-${hint.socraticPrompt.slice(0, 20)}`}
          >
            <button
              className="flex w-full items-center gap-2 px-3 py-2.5 text-start text-[12px]"
              onClick={() => toggleHint(i)}
              type="button"
            >
              {open ? (
                <ChevronDown
                  className="flex-shrink-0 text-muted-foreground"
                  size={12}
                />
              ) : (
                <Lock
                  className="flex-shrink-0 text-muted-foreground"
                  size={11}
                />
              )}
              <span
                className={open ? "text-foreground" : "text-muted-foreground"}
              >
                Hint {hint.order}
              </span>
              {!open && (
                <span className="ms-auto font-mono text-[11px] text-amber-500">
                  Reveal (−{cost} pts)
                </span>
              )}
            </button>
            {open && (
              <div className="border-border border-t px-3 pt-2 pb-3 text-[12px] text-muted-foreground leading-relaxed">
                {hint.socraticPrompt}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
