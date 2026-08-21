import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import type { RadarPoint } from "../../lib/types";

export default function CategoryStrengthChart({ data }: { data: RadarPoint[] }) {
  return (
    <div
      className="rounded-lg p-5"
      style={{ backgroundColor: "var(--card)", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <p className="text-[11px] text-zinc-600 uppercase tracking-widest font-mono mb-4">Category strength</p>
      <ResponsiveContainer width="100%" height={220}>
        <RadarChart data={data}>
          <PolarGrid stroke="rgba(255,255,255,0.07)" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: "#64648a", fontSize: 11, fontFamily: "Inter" }}
          />
          <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            dataKey="score"
            stroke="#6366f1"
            fill="#6366f1"
            fillOpacity={0.15}
            strokeWidth={1.5}
            dot={{ fill: "#6366f1", r: 3 }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
