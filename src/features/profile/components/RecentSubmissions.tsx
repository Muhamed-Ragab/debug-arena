"use client";

import Link from "next/link";
import { useExtracted } from "next-intl";
import { CategoryTag } from "@/components/shared/CategoryTag";
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

export function RecentSubmissions({
  items,
}: {
  items: (RecentSubmission & { id?: string; submittedAt?: string })[];
}) {
  const t = useExtracted();
  return (
    <div>
      <p className="mb-3 font-mono text-[11px] text-muted-foreground uppercase tracking-widest">
        {t("Recent submissions")}
      </p>

      {items.length === 0 ? (
        <div className="rounded-lg border border-border bg-card/40 p-8 text-center">
          <p className="font-medium text-foreground text-sm">
            {t("No submissions yet")}
          </p>
          <p className="mt-1 text-muted-foreground text-xs">
            {t(
              "Solve a challenge in the arena to track your debugging diagnostic history."
            )}
          </p>
          <Link
            className="mt-4 inline-flex items-center rounded-md bg-primary px-3.5 py-1.5 font-medium text-primary-foreground text-xs transition-colors hover:bg-primary/90"
            href="/challenges"
          >
            {t("Explore Challenges")}
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((r) => {
            const maxPts = r.pts || 100;
            const pct = Math.round((r.score / maxPts) * 100);
            const color = getScoreColor(pct);
            const content = (
              <div className="flex items-center gap-4 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:border-primary/40">
                <CategoryTag category={r.category} />
                <p className="flex-1 truncate text-[13px] text-foreground">
                  {r.title}
                </p>
                {r.submittedAt ? (
                  <span className="hidden font-mono text-[11px] text-muted-foreground sm:inline-block">
                    {r.submittedAt}
                  </span>
                ) : null}
                <div className="shrink-0 text-end">
                  <span
                    className="font-medium font-mono text-[13px]"
                    style={{ color }}
                  >
                    {r.score}
                  </span>
                  <span className="font-mono text-[12px] text-muted-foreground">
                    {" "}
                    / {maxPts}
                  </span>
                </div>
              </div>
            );

            if (r.id) {
              return (
                <Link
                  className="block"
                  href={`/submissions/${r.id}/results`}
                  key={r.id}
                >
                  {content}
                </Link>
              );
            }

            return <div key={r.title}>{content}</div>;
          })}
        </div>
      )}
    </div>
  );
}
