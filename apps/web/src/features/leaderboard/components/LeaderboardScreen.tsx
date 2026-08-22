import { useOutletContext } from "react-router-dom";
import { Menu } from "lucide-react";
import { useLeaderboard } from "../hooks/useLeaderboard";
import { LEADERBOARD } from "../../../features/leaderboard/data/leaderboard";
import { CATEGORY_CONFIG } from "../../../lib/categories";
import LeaderboardTabs from "./LeaderboardTabs";
import LeaderboardTable from "./LeaderboardTable";
import { LeaderboardTopThree } from "./LeaderboardTopThree";
import type { AppShellContext } from "../../../components/layout/AppShell";

export default function LeaderboardScreen() {
  const { onMenuClick } = useOutletContext<AppShellContext>();
  const { tab, setTab, categoryTab } = useLeaderboard();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-4 pt-7 pb-0 border-b sm:px-8" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="mb-5 flex items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Open navigation"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-colors hover:text-foreground lg:hidden"
          >
            <Menu size={18} />
          </button>
          <h1 className="text-[15px] font-semibold text-zinc-100">Leaderboard</h1>
        </div>
        <LeaderboardTabs tab={tab} setTab={setTab} />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-8">
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

        <LeaderboardTopThree />
        <LeaderboardTable entries={LEADERBOARD} />
      </div>
    </div>
  );
}
