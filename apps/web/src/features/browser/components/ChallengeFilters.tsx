import { Search } from "lucide-react";
import type { Category, Difficulty } from "../../../lib/types";
import { CATEGORY_CONFIG, DIFFICULTY_CONFIG, CATEGORY_ORDER, DIFFICULTY_ORDER } from "../../../lib/categories";

interface Props {
  search: string;
  onSearch: (v: string) => void;
  category: Category | "all";
  onCategory: (c: Category | "all") => void;
  difficulty: Difficulty | "all";
  onDifficulty: (d: Difficulty | "all") => void;
}

export default function ChallengeFilters({
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
          size={16}
          className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search challenges..."
          className="w-full rounded-lg border border-border bg-card py-2.5 ps-10 pe-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="me-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Category
        </span>
        <Pill
          active={category === "all"}
          onClick={() => onCategory("all")}
          label="All"
        />
        {CATEGORY_ORDER.map((c) => {
          const cfg = CATEGORY_CONFIG[c];
          return (
            <Pill
              key={c}
              active={category === c}
              onClick={() => onCategory(c)}
              label={cfg.label}
              dot={cfg.color}
            />
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="me-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Difficulty
        </span>
        <Pill
          active={difficulty === "all"}
          onClick={() => onDifficulty("all")}
          label="All"
        />
        {DIFFICULTY_ORDER.map((d) => {
          const cfg = DIFFICULTY_CONFIG[d];
          return (
            <Pill
              key={d}
              active={difficulty === d}
              onClick={() => onDifficulty(d)}
              label={d}
              dot={cfg.color}
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
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "border-primary bg-primary/10 text-heading"
          : "border-border bg-card text-muted-foreground hover:text-foreground"
      }`}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: dot }} />}
      {label}
    </button>
  );
}
