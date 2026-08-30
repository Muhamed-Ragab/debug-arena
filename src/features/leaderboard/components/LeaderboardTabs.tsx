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
  const t = useExtracted();

  function getTabLabel(
    id: LeaderboardTab,
    tFn: ReturnType<typeof useExtracted>
  ): string {
    switch (id) {
      case "week":
        return tFn("This week");
      case "alltime":
        return tFn("All time");
      case "State Mutations":
        return tFn("State Mutations");
      case "Race Conditions":
        return tFn("Race Conditions");
      case "Security Flaws":
        return tFn("Security Flaws");
      case "Memory Leaks":
        return tFn("Memory Leaks");
      default:
        return id;
    }
  }

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
            {getTabLabel(id, t)}
          </Button>
        );
      })}
    </div>
  );
}
