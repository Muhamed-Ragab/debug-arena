"use client";

import { useTranslations } from "next-intl";
import { CATEGORY_CONFIG, type Category } from "@/lib/domain";

export function CategoryTag({ category }: { category: Category }) {
  const t = useTranslations();
  const cfg = CATEGORY_CONFIG[category] ?? {
    bg: "rgba(107, 114, 128, 0.1)",
    border: "rgba(107, 114, 128, 0.25)",
    color: "#6b7280",
    label: category,
  };
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
      {t(cfg.label as string)}
    </span>
  );
}
