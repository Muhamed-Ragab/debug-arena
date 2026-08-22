import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { StrengthPoint } from "../types";

export default function SolvedByDifficultyChart({ data }: { data: StrengthPoint[] }) {
  return (
    <div
      className="rounded-lg p-5"
      style={{ backgroundColor: "var(--card)", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <p className="text-[11px] text-zinc-600 uppercase tracking-widest font-mono mb-4">Solved by difficulty</p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} barSize={16} barCategoryGap="30%">
          <XAxis
            dataKey="name"
            tick={{ fill: "#64648a", fontSize: 11, fontFamily: "Inter" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis tick={{ fill: "#64648a", fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1a1a24",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 6,
              fontSize: 12,
            }}
            itemStyle={{ color: "#e2e2ee" }}
            cursor={{ fill: "rgba(255,255,255,0.03)" }}
          />
          <Bar dataKey="Easy" stackId="a" fill="#22C55E" fillOpacity={0.7} radius={[0, 0, 0, 0]} />
          <Bar dataKey="Medium" stackId="a" fill="#F59E0B" fillOpacity={0.7} />
          <Bar dataKey="Hard" stackId="a" fill="#F97316" fillOpacity={0.7} />
          <Bar dataKey="Expert" stackId="a" fill="#EF4444" fillOpacity={0.7} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
