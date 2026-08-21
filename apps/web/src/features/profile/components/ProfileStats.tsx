import type { ProfileStat, CategoryStat } from "../../../features/profile/data/profile";
import { CATEGORY_CONFIG } from "../../../lib/categories";

interface Props {
  stats: ProfileStat[];
  categoryStats: CategoryStat[];
}

export default function ProfileStats({ stats, categoryStats }: Props) {
  return (
    <div className="p-5 space-y-4">
      <div>
        <p className="text-[10px] text-zinc-700 uppercase tracking-widest mb-2 font-mono">Stats</p>
        <div className="space-y-2.5">
          {stats.map(({ label, value, Icon, iconColor }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-[12px] text-zinc-600">{label}</span>
              <span
                className="flex items-center gap-1 text-[12px] font-mono text-zinc-300"
                style={iconColor ? { color: iconColor } : {}}
              >
                {Icon && <Icon size={11} />}
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-2 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <p className="text-[10px] text-zinc-700 uppercase tracking-widest mb-2.5 font-mono">Per category</p>
        {categoryStats.map(({ category, score, solved }) => {
          const cfg = CATEGORY_CONFIG[category];
          return (
            <div key={category} className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11.5px] text-zinc-500">{cfg.label}</span>
                <span className="text-[11px] font-mono" style={{ color: cfg.color }}>
                  {solved} solved
                </span>
              </div>
              <div className="h-[3px] rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${score}%`, backgroundColor: cfg.color, opacity: 0.65 }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
