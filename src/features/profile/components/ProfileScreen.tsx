"use client";

import { Flame, Trophy } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { Avatar } from "@/components/ui/Avatar";
import {
  CATEGORY_STATS,
  PROFILE,
  PROFILE_STATS,
  RADAR_DATA,
  RECENT_SUBMISSIONS,
  STRENGTH_DATA,
} from "@/features/profile/data/profile";
import type { UserProfileData } from "../queries";
import { CategoryStrengthChart } from "./CategoryStrengthChart";
import { ProfileStats } from "./ProfileStats";
import { RecentSubmissions } from "./RecentSubmissions";
import { SolvedByDifficultyChart } from "./SolvedByDifficultyChart";

interface Props {
  data?: UserProfileData | null;
}

export function ProfileScreen({ data }: Props) {
  const profile = data?.profile ?? PROFILE;
  const stats = data?.profileStats ?? PROFILE_STATS;
  const categoryStats = data?.categoryStats ?? CATEGORY_STATS;
  const radarData = data?.radarData ?? RADAR_DATA;
  const strengthData = data?.strengthData ?? STRENGTH_DATA;
  const recentSubmissions = data?.recentSubmissions ?? RECENT_SUBMISSIONS;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <TopBar crumbs={[{ label: "Arena" }, { label: "Profile" }]} />

      <div className="flex flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
        {/* Left column: User Identity and Stats */}
        <div className="flex w-full shrink-0 flex-col gap-0 overflow-y-auto border-border border-e border-b bg-surface lg:w-68 lg:border-b-0">
          <div className="border-border border-b p-6">
            <Avatar
              image={profile.image}
              name={profile.name}
              preferredColor={profile.avatarColor}
              size={56}
            />
            <h2 className="mt-3 mb-0.5 font-semibold text-[15px] text-heading">
              {profile.name}
            </h2>
            <p className="font-mono text-[12px] text-primary">
              {profile.handle}
            </p>

            {profile.jobTitle ? (
              <p className="mt-1 font-medium text-[12px] text-foreground">
                {profile.jobTitle}
              </p>
            ) : null}

            {/* Badges: Rank & Points & Streak */}
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 font-medium font-mono text-[11px] text-primary">
                <Trophy size={11} /> {profile.rank}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 font-medium font-mono text-[11px] text-emerald-400">
                {profile.points} pts
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 font-medium font-mono text-[11px] text-amber-500">
                <Flame size={11} /> {profile.streak}
              </span>
            </div>

            <p className="mt-2.5 text-[11px] text-muted-foreground">
              {profile.joined}
            </p>

            {Boolean(profile.bio) && (
              <p className="mt-3 text-[12px] text-muted-foreground leading-relaxed">
                {profile.bio}
              </p>
            )}
          </div>

          <ProfileStats categoryStats={categoryStats} stats={stats} />
        </div>

        {/* Right column: Performance Charts & Submissions */}
        <div className="flex-1 space-y-8 overflow-y-auto px-4 py-6 sm:px-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <CategoryStrengthChart data={radarData} />
            <SolvedByDifficultyChart data={strengthData} />
          </div>

          <RecentSubmissions items={recentSubmissions} />
        </div>
      </div>
    </div>
  );
}
