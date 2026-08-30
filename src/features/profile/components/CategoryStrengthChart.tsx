"use client";

import { useExtracted } from "next-intl";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
} from "recharts";
import type { ChartConfig } from "@/components/ui/chart";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { RadarPoint } from "../types";

export function CategoryStrengthChart({ data }: { data: RadarPoint[] }) {
  const t = useExtracted();
  const chartConfig = {
    score: { color: "#6366f1", label: t("Score") },
  } satisfies ChartConfig;
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <p className="mb-4 font-mono text-[11px] text-muted-foreground uppercase tracking-widest">
        {t("Category strength")}
      </p>
      <ChartContainer className="h-[220px] w-full" config={chartConfig}>
        <RadarChart accessibilityLayer data={data}>
          <PolarGrid stroke="rgba(255,255,255,0.07)" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
          />
          <PolarRadiusAxis axisLine={false} domain={[0, 100]} tick={false} />
          <Radar
            dataKey="score"
            dot={{ fill: "#6366f1", r: 3 }}
            fill="var(--color-score)"
            fillOpacity={0.2}
            stroke="#6366f1"
            strokeWidth={1.5}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
        </RadarChart>
      </ChartContainer>
    </div>
  );
}
