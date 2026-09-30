import { redirect } from "next/navigation";
import { categoryService } from "@/features/category/service";
import { ProfileSettingsPage } from "@/features/profile/ProfileSettingsPage";
import { profileService } from "@/features/profile/service";
import { getServerSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function Page() {
  const session = await getServerSession();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const [settingsData, categories] = await Promise.all([
    profileService.getUserSettingsData(session.user.id),
    categoryService.getActiveCategories(),
  ]);

  return (
    <ProfileSettingsPage
      categories={categories}
      initialAccounts={settingsData?.accounts}
      initialProfile={settingsData?.profile}
      initialSessions={settingsData?.sessions}
    />
  );
}
