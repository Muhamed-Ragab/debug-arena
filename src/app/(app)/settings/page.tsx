import { redirect } from "next/navigation";
import { ProfileSettingsPage } from "@/features/profile/ProfileSettingsPage";
import { profileService } from "@/features/profile/service";
import { getServerSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function Page() {
  const session = await getServerSession();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const settingsData = await profileService.getUserSettingsData(
    session.user.id
  );

  return (
    <ProfileSettingsPage
      initialAccounts={settingsData?.accounts}
      initialProfile={settingsData?.profile}
      initialSessions={settingsData?.sessions}
    />
  );
}
