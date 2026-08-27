import { ChevronDown, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export interface HintItem {
  order: number;
  penaltyPoints: number;
  socraticPrompt: string;
}

interface Props {
  hints: HintItem[];
  hintsOpen: number[];
  toggleHint: (i: number) => void;
}

export function HintsPanel({ hintsOpen, toggleHint, hints }: Props) {
  if (hints.length === 0) {
    return (
      <p className="text-[12px] text-muted-foreground leading-relaxed">
        No hints are available for this challenge.
      </p>
    );
  }

  return (
    <div className="space-y-2.5">
      <p className="mb-4 text-[11.5px] text-muted-foreground leading-relaxed">
        Each revealed hint reduces your maximum score for this challenge.
      </p>
      {hints.map((hint, i) => {
        const open = hintsOpen.includes(i);
        const cost = hint.penaltyPoints;
        return (
          <Card
            className="overflow-hidden"
            key={`${hint.order}-${hint.socraticPrompt.slice(0, 20)}`}
          >
            <button
              className="flex w-full items-center gap-2 px-3 py-2.5 text-start text-[12px] transition-colors hover:bg-muted/50"
              onClick={() => toggleHint(i)}
              type="button"
            >
              {open ? (
                <ChevronDown
                  className="shrink-0 text-muted-foreground"
                  size={12}
                />
              ) : (
                <Lock className="shrink-0 text-muted-foreground" size={11} />
              )}
              <span
                className={
                  open ? "font-medium text-foreground" : "text-muted-foreground"
                }
              >
                Hint {hint.order}
              </span>
              {!open && (
                <Badge
                  className="ms-auto font-mono text-[11px]"
                  variant="warning"
                >
                  Reveal (−{cost} pts)
                </Badge>
              )}
            </button>
            {open && (
              <div className="border-border border-t px-3 pt-2 pb-3 text-[12px] text-muted-foreground leading-relaxed">
                {hint.socraticPrompt}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
