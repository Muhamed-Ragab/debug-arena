import { Search } from "lucide-react";
import {
  CATEGORY_CONFIG,
  CATEGORY_ORDER,
  DIFFICULTY_CONFIG,
  DIFFICULTY_ORDER,
} from "@/lib/domain/categories";
import type { Category, Difficulty } from "@/lib/domain/types";

interface Props {
  category: Category | "all";
  difficulty: Difficulty | "all";
  onCategory: (c: Category | "all") => void;
  onDifficulty: (d: Difficulty | "all") => void;
  onSearch: (v: string) => void;
  search: string;
}

export function ChallengeFilters({
  search,
  onSearch,
  category,
  onCategory,
  difficulty,
  onDifficulty,
}: Props) {
  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search
          className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          size={16}
        />
        <input
          className="w-full rounded-lg border border-border bg-card py-2.5 ps-10 pe-4 text-foreground text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search challenges..."
          value={search}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="me-2 font-medium text-muted-foreground text-xs uppercase tracking-wide">
          Category
        </span>
        <Pill
          active={category === "all"}
          label="All"
          onClick={() => onCategory("all")}
        />
        {CATEGORY_ORDER.map((c) => {
          const cfg = CATEGORY_CONFIG[c];
          return (
            <Pill
              active={category === c}
              dot={cfg.color}
              key={c}
              label={cfg.label}
              onClick={() => onCategory(c)}
            />
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="me-2 font-medium text-muted-foreground text-xs uppercase tracking-wide">
          Difficulty
        </span>
        <Pill
          active={difficulty === "all"}
          label="All"
          onClick={() => onDifficulty("all")}
        />
        {DIFFICULTY_ORDER.map((d) => {
          const cfg = DIFFICULTY_CONFIG[d];
          return (
            <Pill
              active={difficulty === d}
              dot={cfg.color}
              key={d}
              label={d}
              onClick={() => onDifficulty(d)}
            />
          );
        })}
      </div>
    </div>
  );
}

function Pill({
  active,
  onClick,
  label,
  dot,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  dot?: string;
}) {
  return (
    <button
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-medium text-xs transition-colors ${
        active
          ? "border-primary bg-primary/10 font-semibold text-heading"
          : "border-border bg-card text-muted-foreground hover:text-foreground"
      }`}
      onClick={onClick}
      type="button"
    >
      {Boolean(dot) && (
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: dot }}
        />
      )}
      {label}
    </button>
  );
}
