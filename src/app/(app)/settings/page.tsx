import { redirect } from "next/navigation";
import { ProfileSettingsPage } from "@/features/profile/ProfileSettingsPage";
import { getUserSettingsData } from "@/features/profile/queries";
import { getServerSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function Page() {
  const session = await getServerSession();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const settingsData = await getUserSettingsData(session.user.id);

  return (
    <ProfileSettingsPage
      initialAccounts={settingsData?.accounts}
      initialProfile={settingsData?.profile}
      initialSessions={settingsData?.sessions}
    />
  );
}
