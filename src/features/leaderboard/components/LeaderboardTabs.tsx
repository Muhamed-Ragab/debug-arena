import { CATEGORY_CONFIG } from "@/lib/domain/categories";
import type { Category } from "@/lib/domain/types";
import { cn } from "@/lib/utils";
import type { LeaderboardTab } from "../types";

interface Props {
  setTab: (t: LeaderboardTab) => void;
  tab: LeaderboardTab;
}

const TABS: { id: LeaderboardTab; label: string }[] = [
  { id: "week", label: "This week" },
  { id: "alltime", label: "All time" },
  { id: "State Mutations", label: "State Mutations" },
  { id: "Race Conditions", label: "Race Conditions" },
  { id: "Security Flaws", label: "Security Flaws" },
  { id: "Memory Leaks", label: "Memory Leaks" },
];

const CATEGORY_TABS: Category[] = [
  "State Mutations",
  "Race Conditions",
  "Security Flaws",
  "Memory Leaks",
];

function getTabClasses(active: boolean, hasCfg: boolean): string {
  if (!active) {
    return "border-transparent text-muted-foreground hover:text-foreground";
  }
  if (hasCfg) {
    return "border-current";
  }
  return "border-primary font-semibold text-primary";
}

export function LeaderboardTabs({ tab, setTab }: Props) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto">
      {TABS.map(({ id, label }) => {
        const active = tab === id;
        const isCat = CATEGORY_TABS.includes(id as Category);
        const cfg = isCat ? CATEGORY_CONFIG[id as Category] : null;
        return (
          <button
            className={cn(
              "whitespace-nowrap border-b-2 px-3 py-2 font-medium text-[12px] transition-colors",
              getTabClasses(active, Boolean(cfg))
            )}
            key={id}
            onClick={() => setTab(id)}
            style={
              active && cfg
                ? { borderBottomColor: cfg.color, color: cfg.color }
                : {}
            }
            type="button"
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
