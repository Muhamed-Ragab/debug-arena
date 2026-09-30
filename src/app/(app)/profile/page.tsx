import { redirect } from "next/navigation";
import { categoryService } from "@/features/category/service";
import { ProfilePage } from "@/features/profile/ProfilePage";
import { profileService } from "@/features/profile/service";
import { getServerSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function Page() {
  const session = await getServerSession();
  if (!session) {
    redirect("/login");
  }

  const [profileData, categories] = await Promise.all([
    profileService.getUserProfileData(session.user.id),
    categoryService.getActiveCategories(),
  ]);

  return <ProfilePage categories={categories} data={profileData} />;
}
