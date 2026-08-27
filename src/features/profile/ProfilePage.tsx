"use client";

import { ProfileScreen } from "./components/ProfileScreen";
import type { UserProfileData } from "./queries";

interface Props {
  data?: UserProfileData | null;
}

export function ProfilePage({ data }: Props) {
  return <ProfileScreen data={data} />;
}
