import type { RecentSubmission } from "../types";
import { CategoryTag } from "../../../components/ui/CategoryTag";

export default function RecentSubmissions({ items }: { items: RecentSubmission[] }) {
  return (
    <div>
      <p className="text-[11px] text-zinc-600 uppercase tracking-widest font-mono mb-3">Recent submissions</p>
      <div className="space-y-2">
        {items.map((r, i) => {
          const pct = Math.round((r.score / r.pts) * 100);
          const color = pct >= 80 ? "#22C55E" : pct >= 60 ? "#F59E0B" : "#EF4444";
          return (
            <div
              key={i}
              className="flex items-center gap-4 px-4 py-3 rounded-lg"
              style={{ backgroundColor: "var(--card)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <CategoryTag category={r.category} />
              <p className="flex-1 text-[13px] text-zinc-300 truncate">{r.title}</p>
              <div className="text-end flex-shrink-0">
                <span className="font-mono text-[13px] font-medium" style={{ color }}>
                  {r.score}
                </span>
                <span className="text-zinc-700 text-[12px] font-mono"> / {r.pts}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
