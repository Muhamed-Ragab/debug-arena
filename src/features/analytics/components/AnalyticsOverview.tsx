"use client";

import { useExtracted } from "next-intl";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";
import type { ChartConfig } from "@/components/ui/chart";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
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

  const submissionsConfig = {
    count: { color: "var(--chart-1)", label: t("Submissions") },
  } satisfies ChartConfig;

  const avgScoreConfig = {
    avgScore: { color: "var(--chart-1)", label: t("Avg Score") },
  } satisfies ChartConfig;

  const statusConfig = {
    count: { color: "var(--chart-1)", label: t("Challenges") },
  } satisfies ChartConfig;

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
            <ChartContainer
              className="mt-4 h-64 w-full"
              config={submissionsConfig}
            >
              <LineChart accessibilityLayer data={submissionsByDay}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  axisLine={false}
                  dataKey="date"
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                  tickFormatter={(v: string) => v.slice(5)}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                  tickLine={false}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  dataKey="count"
                  dot={false}
                  stroke="var(--color-count)"
                  type="monotone"
                />
              </LineChart>
            </ChartContainer>
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
            <ChartContainer
              className="mt-4 h-64 w-full"
              config={avgScoreConfig}
            >
              <BarChart accessibilityLayer data={avgScorePerCategory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  axisLine={false}
                  dataKey="categoryName"
                  interval={0}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                  tickLine={false}
                />
                <YAxis
                  axisLine={false}
                  domain={[0, 100]}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                  tickLine={false}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="avgScore"
                  fill="var(--color-avgScore)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
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
            <ChartContainer className="mt-4 h-48 w-full" config={statusConfig}>
              <BarChart
                accessibilityLayer
                data={challengesByStatus}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  allowDecimals={false}
                  axisLine={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                  tickLine={false}
                  type="number"
                />
                <YAxis
                  axisLine={false}
                  dataKey="status"
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                  tickLine={false}
                  type="category"
                  width={80}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="count"
                  fill="var(--color-count)"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ChartContainer>
          )}
        </div>
      </div>
    </div>
  );
}
