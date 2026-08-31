"use client";

import { useExtracted } from "next-intl";
import { Button } from "@/components/ui/button";
import { CATEGORY_CONFIG } from "@/lib/domain/categories";
import type { Category } from "@/lib/domain/types";
import { cn } from "@/lib/utils";
import type { LeaderboardTab } from "../types";

interface Props {
  setTab: (t: LeaderboardTab) => void;
  tab: LeaderboardTab;
}

const TABS: { id: LeaderboardTab }[] = [
  { id: "week" },
  { id: "alltime" },
  { id: "State Mutations" },
  { id: "Race Conditions" },
  { id: "Security Flaws" },
  { id: "Memory Leaks" },
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
  const t = useExtracted();

  const getTabLabel = (id: LeaderboardTab): string => {
    switch (id) {
      case "week":
        return t("This week");
      case "alltime":
        return t("All time");
      case "State Mutations":
        return t("State Mutations");
      case "Race Conditions":
        return t("Race Conditions");
      case "Security Flaws":
        return t("Security Flaws");
      case "Memory Leaks":
        return t("Memory Leaks");
      default:
        return id;
    }
  };

  return (
    <div className="flex items-center gap-1 overflow-x-auto">
      {TABS.map(({ id }) => {
        const active = tab === id;
        const isCat = CATEGORY_TABS.includes(id as Category);
        const cfg = isCat ? CATEGORY_CONFIG[id as Category] : null;
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
            {getTabLabel(id)}
          </Button>
        );
      })}
    </div>
  );
}
