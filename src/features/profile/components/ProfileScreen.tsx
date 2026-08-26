"use client";

import { TopBar } from "@/components/layout/TopBar";
import { Avatar } from "@/components/ui/Avatar";
import {
  CATEGORY_STATS,
  PROFILE_STATS,
  RADAR_DATA,
  RECENT_SUBMISSIONS,
  STRENGTH_DATA,
} from "@/features/profile/data/profile";
import { CategoryStrengthChart } from "./CategoryStrengthChart";
import { ProfileStats } from "./ProfileStats";
import { RecentSubmissions } from "./RecentSubmissions";
import { SolvedByDifficultyChart } from "./SolvedByDifficultyChart";

export function ProfileScreen() {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <TopBar crumbs={[{ label: "Arena" }, { label: "Profile" }]} />

      <div className="flex flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
        <div className="flex w-full shrink-0 flex-col gap-0 overflow-y-auto border-border border-e border-b bg-surface lg:w-[240px] lg:border-b-0">
          <div className="border-border border-b p-6">
            <Avatar name="Marcus Reyes" size={52} />
            <h2 className="mt-3 mb-0.5 font-semibold text-[14px] text-heading">
              Marcus Reyes
            </h2>
            <p className="text-[12px] text-muted-foreground">
              Member since Jan 2024
            </p>
          </div>

          <ProfileStats categoryStats={CATEGORY_STATS} stats={PROFILE_STATS} />
        </div>

        <div className="flex-1 space-y-8 overflow-y-auto px-4 py-6 sm:px-8">
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
