"use client";
import { DIFFICULTY_CONFIG, type Difficulty } from "@/lib/domain";

export function DiffBadge({ difficulty }: { difficulty: Difficulty }) {
  const c = DIFFICULTY_CONFIG[difficulty];
  const label = (() => {
    switch (difficulty) {
      case "Easy":
        return "Easy";
      case "Medium":
        return "Medium";
      case "Hard":
        return "Hard";
      default:
        return difficulty;
    }
  })();
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium text-[11px] tracking-wide"
      style={{
        backgroundColor: c.bg,
        border: `1px solid ${c.border}`,
        color: c.color,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: c.color }}
      />
      {label}
    </span>
  );
}
