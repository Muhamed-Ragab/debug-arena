"use client";

import type { Category } from "@/lib/domain";
import { getCategoryAppearance } from "@/lib/domain/categories";

export function CategoryTag({
  category,
  color,
  icon,
}: {
  category: Category;
  color?: string | null;
  icon?: string | null;
}) {
  const cfg = getCategoryAppearance({ color, icon, name: category });
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
      {category}
    </span>
  );
}
