"use client";

import { useExtracted } from "next-intl";
import { CATEGORY_CONFIG, type Category } from "@/lib/domain";

export function CategoryTag({ category }: { category: Category }) {
  const t = useExtracted();
  const cfg = CATEGORY_CONFIG[category] ?? {
    bg: "rgba(107, 114, 128, 0.1)",
    border: "rgba(107, 114, 128, 0.25)",
    color: "#6b7280",
    label: category,
  };
  const label = (() => {
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
  })();
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium text-[11px] tracking-wide"
      style={{
        backgroundColor: cfg.bg,
        border: `1px solid ${cfg.border}`,
        color: cfg.color,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: cfg.color }}
      />
      {label}
    </span>
  );
}
