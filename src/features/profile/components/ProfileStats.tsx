"use client";

import { useExtracted } from "next-intl";
import { CATEGORY_CONFIG } from "@/lib/domain/categories";
import type { CategoryStat, ProfileStat } from "../types";

interface Props {
  categoryStats: CategoryStat[];
  stats: ProfileStat[];
}

export function ProfileStats({ stats, categoryStats }: Props) {
  const t = useExtracted();

  const getCategoryLabel = (category: string): string => {
    switch (category) {
      case "Backend Concurrency":
        return t("Backend Concurrency");
      case "Logic Inversions":
        return t("Logic Inversions");
      case "Memory Leaks":
        return t("Memory Leaks");
      case "Off-by-One":
        return t("Off-by-One");
      case "Race Conditions":
        return t("Race Conditions");
      case "React Rendering":
        return t("React Rendering");
      case "Security Flaws":
        return t("Security Flaws");
      case "State Mutations":
        return t("State Mutations");
      default:
        return category;
    }
  };

  return (
    <div className="space-y-4 p-5">
      <div>
        <p className="mb-2 font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
          {t("Stats")}
        </p>
        <div className="space-y-2.5">
          {stats.map(({ label, value, Icon, iconColor }) => (
            <div className="flex items-center justify-between" key={label}>
              <span className="text-[12px] text-muted-foreground">{label}</span>
              <span
                className="flex items-center gap-1 font-mono text-[12px] text-foreground"
                style={iconColor ? { color: iconColor } : {}}
              >
                {Icon ? <Icon size={11} /> : null}
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="border-border border-t pt-2">
        <p className="mb-2.5 font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
          {t("Per category")}
        </p>
        {categoryStats.map(({ category, score, solved }) => {
          const cfg = CATEGORY_CONFIG[category];
          return (
            <div className="mb-3" key={category}>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[11.5px] text-muted-foreground">
                  {getCategoryLabel(cfg?.label ?? category)}
                </span>
                <span
                  className="font-mono text-[11px]"
                  style={{ color: cfg?.color }}
                >
                  {t("{solved} solved", { solved: String(solved) })}
                </span>
              </div>
              <div className="h-[3px] overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full"
                  style={{
                    backgroundColor: cfg?.color,
                    opacity: 0.65,
                    width: `${score}%`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
