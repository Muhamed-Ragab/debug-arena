import { useLeaderboard } from "../../hooks/useLeaderboard";
import { LEADERBOARD } from "../../data/leaderboard";
import { CATEGORY_CONFIG } from "../../data/categories";
import LeaderboardTabs from "./LeaderboardTabs";
import LeaderboardTable from "./LeaderboardTable";

export default function LeaderboardScreen() {
  const { tab, setTab, categoryTab } = useLeaderboard();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-8 pt-7 pb-0 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <h1 className="text-[15px] font-semibold text-zinc-100 mb-5">Leaderboard</h1>
        <LeaderboardTabs tab={tab} setTab={setTab} />
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6">
        {categoryTab &&
          (() => {
            const cfg = CATEGORY_CONFIG[categoryTab];
            const Icon = cfg.Icon;
            return (
              <div
                className="flex items-center gap-2 mb-4 px-3 py-2.5 rounded-lg"
                style={{ backgroundColor: cfg.bg, border: `1px solid ${cfg.border}` }}
              >
                <Icon size={13} style={{ color: cfg.color }} />
                <span className="text-[12px] font-medium" style={{ color: cfg.color }}>
                  {cfg.label} — top solvers ranked by category score
                </span>
              </div>
            );
          })()}

        <LeaderboardTable entries={LEADERBOARD} />
      </div>
    </div>
  );
}
