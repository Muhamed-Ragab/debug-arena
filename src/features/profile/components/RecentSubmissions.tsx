import { CategoryTag } from "@/components/ui/CategoryTag";
import type { RecentSubmission } from "../types";

function getScoreColor(pct: number): string {
  if (pct >= 80) {
    return "#22C55E";
  }
  if (pct >= 60) {
    return "#F59E0B";
  }
  return "#EF4444";
}

export function RecentSubmissions({ items }: { items: RecentSubmission[] }) {
  return (
    <div>
      <p className="mb-3 font-mono text-[11px] text-muted-foreground uppercase tracking-widest">
        Recent submissions
      </p>
      <div className="space-y-2">
        {items.map((r) => {
          const pct = Math.round((r.score / r.pts) * 100);
          const color = getScoreColor(pct);
          return (
            <div
              className="flex items-center gap-4 rounded-lg border border-border bg-card px-4 py-3"
              key={r.title}
            >
              <CategoryTag category={r.category} />
              <p className="flex-1 truncate text-[13px] text-foreground">
                {r.title}
              </p>
              <div className="flex-shrink-0 text-end">
                <span
                  className="font-medium font-mono text-[13px]"
                  style={{ color }}
                >
                  {r.score}
                </span>
                <span className="font-mono text-[12px] text-muted-foreground">
                  {" "}
                  / {r.pts}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
