"use client";

import { useExtracted } from "next-intl";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { StrengthPoint } from "../types";

export function SolvedByDifficultyChart({ data }: { data: StrengthPoint[] }) {
  const t = useExtracted();
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <p className="mb-4 font-mono text-[11px] text-muted-foreground uppercase tracking-widest">
        {t("Solved by difficulty")}
      </p>
      <ResponsiveContainer height={220} width="100%">
        <BarChart barCategoryGap="30%" barSize={16} data={data}>
          <XAxis
            axisLine={false}
            dataKey="name"
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            tickLine={false}
          />
          <YAxis
            axisLine={false}
            tick={{ fill: "#94a3b8", fontSize: 10 }}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 6,
              fontSize: 12,
            }}
            cursor={{ fill: "rgba(255,255,255,0.03)" }}
            itemStyle={{ color: "var(--foreground)" }}
          />
          <Bar
            dataKey="Easy"
            fill="#22C55E"
            fillOpacity={0.7}
            radius={[0, 0, 0, 0]}
            stackId="a"
          />
          <Bar dataKey="Medium" fill="#F59E0B" fillOpacity={0.7} stackId="a" />
          <Bar dataKey="Hard" fill="#F97316" fillOpacity={0.7} stackId="a" />
          <Bar
            dataKey="Expert"
            fill="#EF4444"
            fillOpacity={0.7}
            radius={[3, 3, 0, 0]}
            stackId="a"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
