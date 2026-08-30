"use client";

import { useExtracted } from "next-intl";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AnalyticsOverview as AnalyticsOverviewData } from "../types";

interface Props {
  data: AnalyticsOverviewData;
}

export function AnalyticsOverview({ data }: Props) {
  const t = useExtracted();
  const {
    totalUsers,
    totalChallenges,
    challengesByStatus,
    submissionsByDay,
    solveRate,
    avgScorePerCategory,
    topCategories,
  } = data;

  const statusMap = new Map(challengesByStatus.map((s) => [s.status, s.count]));
  const published = statusMap.get("published") ?? 0;
  const draft = statusMap.get("draft") ?? 0;
  const archived = statusMap.get("archived") ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-muted-foreground text-sm">{t("Total Users")}</p>
          <p className="mt-2 font-semibold text-2xl text-heading">
            {totalUsers}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-muted-foreground text-sm">
            {t("Challenges by Status")}
          </p>
          <p className="mt-2 font-semibold text-2xl text-heading">
            {totalChallenges}
          </p>
          <p className="mt-1 text-muted-foreground text-xs">
            {t("Published")}: {published} · {t("Drafts")}: {draft} ·{" "}
            {t("Archived")}: {archived}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-muted-foreground text-sm">
            {t("Overall Solve Rate")}
          </p>
          <p className="mt-2 font-semibold text-2xl text-heading">
            {solveRate.rate}%
          </p>
          <p className="mt-1 text-muted-foreground text-xs">
            {solveRate.solved} / {solveRate.total}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-muted-foreground text-sm">
            {t("Top Categories by Attempts")}
          </p>
          <p className="mt-2 font-semibold text-heading text-lg">
            {topCategories[0]?.categoryName ?? t("No data available yet.")}
          </p>
          <p className="mt-1 text-muted-foreground text-xs">
            {topCategories[0] ? `${topCategories[0].attempts} attempts` : ""}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-semibold text-heading text-sm">
            {t("Submissions (Last 30 Days)")}
          </h3>
          {submissionsByDay.length === 0 ? (
            <p className="mt-4 text-muted-foreground text-sm">
              {t("No data available yet.")}
            </p>
          ) : (
            <div className="mt-4 h-64 w-full">
              <ResponsiveContainer height="100%" width="100%">
                <LineChart data={submissionsByDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    fontSize={11}
                    tickFormatter={(v: string) => v.slice(5)}
                  />
                  <YAxis allowDecimals={false} fontSize={11} />
                  <Tooltip />
                  <Line
                    dataKey="count"
                    dot={false}
                    stroke="hsl(var(--primary))"
                    type="monotone"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-semibold text-heading text-sm">
            {t("Avg Score per Category")}
          </h3>
          {avgScorePerCategory.length === 0 ? (
            <p className="mt-4 text-muted-foreground text-sm">
              {t("No data available yet.")}
            </p>
          ) : (
            <div className="mt-4 h-64 w-full">
              <ResponsiveContainer height="100%" width="100%">
                <BarChart data={avgScorePerCategory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="categoryName" fontSize={11} interval={0} />
                  <YAxis domain={[0, 100]} fontSize={11} />
                  <Tooltip />
                  <Bar
                    dataKey="avgScore"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-semibold text-heading text-sm">
            {t("Top Categories by Attempts")}
          </h3>
          {topCategories.length === 0 ? (
            <p className="mt-4 text-muted-foreground text-sm">
              {t("No data available yet.")}
            </p>
          ) : (
            <ul className="mt-4 flex flex-col gap-2">
              {topCategories.map((c) => (
                <li
                  className="flex items-center justify-between rounded-md bg-inset px-3 py-2 text-sm"
                  key={c.categoryId}
                >
                  <span className="font-medium text-heading">
                    {c.categoryName}
                  </span>
                  <span className="text-muted-foreground">
                    {c.attempts} attempts
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-semibold text-heading text-sm">
            {t("Challenges by Status")}
          </h3>
          {challengesByStatus.length === 0 ? (
            <p className="mt-4 text-muted-foreground text-sm">
              {t("No data available yet.")}
            </p>
          ) : (
            <div className="mt-4 h-48 w-full">
              <ResponsiveContainer height="100%" width="100%">
                <BarChart data={challengesByStatus} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis allowDecimals={false} type="number" />
                  <YAxis
                    dataKey="status"
                    fontSize={12}
                    type="category"
                    width={80}
                  />
                  <Tooltip />
                  <Bar
                    dataKey="count"
                    fill="hsl(var(--primary))"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
