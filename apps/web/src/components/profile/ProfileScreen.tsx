import {
  RADAR_DATA,
  STRENGTH_DATA,
  RECENT_SUBMISSIONS,
  CATEGORY_STATS,
  PROFILE_STATS,
} from "../../data/profile";
import { Avatar } from "../ui/Avatar";
import ProfileStats from "./ProfileStats";
import CategoryStrengthChart from "./CategoryStrengthChart";
import SolvedByDifficultyChart from "./SolvedByDifficultyChart";
import RecentSubmissions from "./RecentSubmissions";

export default function ProfileScreen() {
  return (
    <div className="flex h-full overflow-hidden">
      <div
        className="w-[240px] shrink-0 border-r flex flex-col gap-0 overflow-y-auto"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}
      >
        <div className="p-6 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <Avatar name="You" size={52} />
          <h2 className="text-[14px] font-semibold text-zinc-100 mt-3 mb-0.5">you</h2>
          <p className="text-[12px] text-zinc-600">Member since Jan 2024</p>
        </div>

        <ProfileStats stats={PROFILE_STATS} categoryStats={CATEGORY_STATS} />
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8">
        <div className="grid grid-cols-2 gap-6">
          <CategoryStrengthChart data={RADAR_DATA} />
          <SolvedByDifficultyChart data={STRENGTH_DATA} />
        </div>

        <RecentSubmissions items={RECENT_SUBMISSIONS} />
      </div>
    </div>
  );
}
