import type { Category } from "../../lib/types";
import { CATEGORY_CONFIG } from "../../lib/categories";

export function CategoryTag({ category }: { category: Category }) {
  const cfg = CATEGORY_CONFIG[category];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium tracking-wide"
      style={{ backgroundColor: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: cfg.color }} />
      {cfg.label}
    </span>
  );
}
