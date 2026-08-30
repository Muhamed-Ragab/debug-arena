"use client";

import { useExtracted } from "next-intl";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import type { ChartConfig } from "@/components/ui/chart";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { StrengthPoint } from "../types";

export function SolvedByDifficultyChart({ data }: { data: StrengthPoint[] }) {
  const t = useExtracted();
  const chartConfig = {
    Easy: { color: "var(--diff-easy)", label: t("Easy") },
    Expert: { color: "var(--diff-expert)", label: t("Expert") },
    Hard: { color: "var(--diff-hard)", label: t("Hard") },
    Medium: { color: "var(--diff-medium)", label: t("Medium") },
  } satisfies ChartConfig;
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <p className="mb-4 font-mono text-[11px] text-muted-foreground uppercase tracking-widest">
        {t("Solved by difficulty")}
      </p>
      <ChartContainer className="h-[220px] w-full" config={chartConfig}>
        <BarChart
          accessibilityLayer
          barCategoryGap="30%"
          barSize={16}
          data={data}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            axisLine={false}
            dataKey="name"
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            tickLine={false}
          />
          <YAxis
            axisLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
            tickLine={false}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar
            dataKey="Easy"
            fill="var(--color-Easy)"
            fillOpacity={0.7}
            radius={[0, 0, 0, 0]}
            stackId="a"
          />
          <Bar
            dataKey="Medium"
            fill="var(--color-Medium)"
            fillOpacity={0.7}
            stackId="a"
          />
          <Bar
            dataKey="Hard"
            fill="var(--color-Hard)"
            fillOpacity={0.7}
            stackId="a"
          />
          <Bar
            dataKey="Expert"
            fill="var(--color-Expert)"
            fillOpacity={0.7}
            radius={[3, 3, 0, 0]}
            stackId="a"
          />
        </BarChart>
      </ChartContainer>
    </div>
  );
}
