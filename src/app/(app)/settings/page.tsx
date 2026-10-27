import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { categoryService } from "@/features/category/service";
import { ProfileSettingsPage } from "@/features/profile/ProfileSettingsPage";
import { profileService } from "@/features/profile/service";
import type { ActiveSessionRecord } from "@/features/profile/types";
import { auth } from "@/lib/auth";
import { getServerSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function Page() {
  const session = await getServerSession();
  if (!session?.user?.id) {
    redirect("/login");
  }

  let betterAuthSessions: ActiveSessionRecord[] = [];
  try {
    const reqHeaders = await headers();
    const list = await auth.api.listSessions({ headers: reqHeaders });
    if (Array.isArray(list)) {
      betterAuthSessions = list as unknown as ActiveSessionRecord[];
    }
  } catch (err) {
    console.warn("[settings/page] auth.api.listSessions notice:", err);
  }

  const [settingsData, categories, aiConfig] = await Promise.all([
    profileService.getUserSettingsData(
      session.user.id,
      session.session,
      betterAuthSessions.length > 0
        ? { getSessions: async () => betterAuthSessions }
        : undefined
    ),
    categoryService.getActiveCategories(),
    profileService.getAiConfig(session.user.id),
  ]);

  return (
    <ProfileSettingsPage
      categories={categories}
      initialAccounts={settingsData?.accounts}
      initialAiConfig={aiConfig}
      initialProfile={settingsData?.profile}
      initialSessions={settingsData?.sessions}
    />
  );
}
