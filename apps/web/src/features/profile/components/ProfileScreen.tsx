import { useOutletContext } from "react-router-dom";
import { Menu } from "lucide-react";
import {
  RADAR_DATA,
  STRENGTH_DATA,
  RECENT_SUBMISSIONS,
  CATEGORY_STATS,
  PROFILE_STATS,
} from "../../../features/profile/data/profile";
import { Avatar } from "../../../components/ui/Avatar";
import ProfileStats from "./ProfileStats";
import CategoryStrengthChart from "./CategoryStrengthChart";
import SolvedByDifficultyChart from "./SolvedByDifficultyChart";
import RecentSubmissions from "./RecentSubmissions";
import type { AppShellContext } from "../../../components/layout/AppShell";

export default function ProfileScreen() {
  const { onMenuClick } = useOutletContext<AppShellContext>();

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header
        className="flex h-16 shrink-0 items-center gap-3 border-b px-4 sm:px-8"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}
      >
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-colors hover:text-foreground lg:hidden"
        >
          <Menu size={18} />
        </button>
        <h1 className="text-[15px] font-semibold text-zinc-100">Profile</h1>
      </header>

      <div className="flex flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
        <div
          className="w-full shrink-0 border-b border-e flex flex-col gap-0 overflow-y-auto lg:w-[240px] lg:border-b-0"
          style={{ borderColor: "rgba(255,255,255,0.06)" }}
        >
          <div className="p-6 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <Avatar name="You" size={52} />
            <h2 className="text-[14px] font-semibold text-zinc-100 mt-3 mb-0.5">you</h2>
            <p className="text-[12px] text-zinc-600">Member since Jan 2024</p>
          </div>

          <ProfileStats stats={PROFILE_STATS} categoryStats={CATEGORY_STATS} />
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8 sm:px-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <CategoryStrengthChart data={RADAR_DATA} />
            <SolvedByDifficultyChart data={STRENGTH_DATA} />
          </div>

          <RecentSubmissions items={RECENT_SUBMISSIONS} />
        </div>
      </div>
    </div>
  );
}
