"use client";

import { useExtracted } from "next-intl";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import type { RadarPoint } from "../types";

export function CategoryStrengthChart({ data }: { data: RadarPoint[] }) {
  const t = useExtracted();
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <p className="mb-4 font-mono text-[11px] text-muted-foreground uppercase tracking-widest">
        {t("Category strength")}
      </p>
      <ResponsiveContainer height={220} width="100%">
        <RadarChart data={data}>
          <PolarGrid stroke="rgba(255,255,255,0.07)" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: "#94a3b8", fontSize: 11 }}
          />
          <PolarRadiusAxis axisLine={false} domain={[0, 100]} tick={false} />
          <Radar
            dataKey="score"
            dot={{ fill: "#6366f1", r: 3 }}
            fill="#6366f1"
            fillOpacity={0.2}
            stroke="#6366f1"
            strokeWidth={1.5}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
