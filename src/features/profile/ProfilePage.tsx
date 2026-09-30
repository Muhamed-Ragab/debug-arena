"use client";
import { TopBar } from "@/components/layout/TopBar";
import type { CategoryDTO } from "@/features/category/types";
import type { UserProfileData } from "@/features/profile/types";
import { ProfileScreen } from "./components/ProfileScreen";

interface Props {
  categories: CategoryDTO[];
  data?: UserProfileData | null;
}

export function ProfilePage({ categories, data }: Props) {
  if (!data) {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <TopBar crumbs={[{ label: "Arena" }, { label: "Profile" }]} />
        <div className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground text-sm">
            {"Profile data is unavailable."}
          </p>
        </div>
      </div>
    );
  }

  return <ProfileScreen categories={categories} data={data} />;
}
