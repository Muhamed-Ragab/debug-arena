import type { Difficulty } from "../../lib/types";
import { DIFFICULTY_CONFIG } from "../../data/categories";

export function DiffBadge({ difficulty }: { difficulty: Difficulty }) {
  const c = DIFFICULTY_CONFIG[difficulty];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium tracking-wide"
      style={{ color: c.color, backgroundColor: c.bg, border: `1px solid ${c.border}` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: c.color }} />
      {difficulty}
    </span>
  );
}
