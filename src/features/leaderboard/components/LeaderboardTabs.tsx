"use client";
import { Button } from "@/components/ui/button";
import type { CategoryDTO } from "@/features/category/types";
import { getCategoryAppearance } from "@/lib/domain/categories";
import { cn } from "@/lib/utils";
import { buildLeaderboardTabs } from "../tabs";
import type { LeaderboardTab } from "../types";

interface Props {
  categories: CategoryDTO[];
  setTab: (t: LeaderboardTab) => void;
  tab: LeaderboardTab;
}

function getTabClasses(active: boolean, hasCfg: boolean): string {
  if (!active) {
    return "border-transparent text-muted-foreground hover:text-foreground";
  }
  if (hasCfg) {
    return "border-current";
  }
  return "border-primary font-semibold text-primary";
}

export function LeaderboardTabs({ categories, tab, setTab }: Props) {
  const tabs = buildLeaderboardTabs(categories);

  return (
    <div className="flex items-center gap-1 overflow-x-auto">
      {tabs.map(({ id, category }) => {
        const active = tab === id;
        const cfg = category ? getCategoryAppearance(category) : null;
        let label: string;
        if (id === "week") {
          label = "This week";
        } else if (id === "alltime") {
          label = "All time";
        } else {
          label = category?.name ?? id;
        }
        return (
          <Button
            className={cn(
              "whitespace-nowrap rounded-none border-b-2 px-3 py-2 font-medium text-[12px] transition-colors",
              getTabClasses(active, Boolean(cfg))
            )}
            key={id}
            onClick={() => setTab(id)}
            size="sm"
            style={
              active && cfg
                ? { borderBottomColor: cfg.color, color: cfg.color }
                : {}
            }
            type="button"
            variant="ghost"
          >
            {label}
          </Button>
        );
      })}
    </div>
  );
}
