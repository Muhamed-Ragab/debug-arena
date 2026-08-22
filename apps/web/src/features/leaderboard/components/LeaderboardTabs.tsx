import type { Category } from "../../../lib/types";
import type { LeaderboardTab } from "../types";
import { CATEGORY_CONFIG } from "../../../lib/categories";
import { cn } from "../../../lib/utils";

interface Props {
  tab: LeaderboardTab;
  setTab: (t: LeaderboardTab) => void;
}

const TABS: { id: LeaderboardTab; label: string }[] = [
  { id: "week", label: "This week" },
  { id: "alltime", label: "All time" },
  { id: "react", label: "React" },
  { id: "concurrency", label: "Concurrency" },
  { id: "distributed", label: "Distributed" },
];

const CATEGORY_TABS: Category[] = ["react", "concurrency", "distributed"];

export default function LeaderboardTabs({ tab, setTab }: Props) {
  return (
    <div className="flex items-center gap-1">
      {TABS.map(({ id, label }) => {
        const active = tab === id;
        const isCat = CATEGORY_TABS.includes(id as Category);
        const cfg = isCat ? CATEGORY_CONFIG[id as Category] : null;
        return (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              "px-3 py-2 text-[12px] font-medium transition-colors border-b-[1.5px]",
              active
                ? cfg
                  ? "border-current"
                  : "text-indigo-300 border-indigo-500"
                : "text-zinc-600 border-transparent hover:text-zinc-400",
            )}
            style={active && cfg ? { color: cfg.color, borderBottomColor: cfg.color } : {}}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
