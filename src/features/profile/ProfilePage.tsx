"use client";

import { useExtracted } from "next-intl";
import { TopBar } from "@/components/layout/TopBar";
import type { UserProfileData } from "@/features/profile/types";
import { ProfileScreen } from "./components/ProfileScreen";

interface Props {
  data?: UserProfileData | null;
}

export function ProfilePage({ data }: Props) {
  const t = useExtracted();
  if (!data) {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <TopBar crumbs={[{ label: t("Arena") }, { label: t("Profile") }]} />
        <div className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground text-sm">
            {t("Profile data is unavailable.")}
          </p>
        </div>
      </div>
    );
  }

  return <ProfileScreen data={data} />;
}
