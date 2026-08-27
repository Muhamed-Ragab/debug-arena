import { redirect } from "next/navigation";
import { ProfilePage } from "@/features/profile/ProfilePage";
import { getUserProfileData } from "@/features/profile/queries";
import { getServerSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function Page() {
  const session = await getServerSession();
  if (!session) {
    redirect("/login");
  }

  const profileData = await getUserProfileData(session.user.id);

  return <ProfilePage data={profileData} />;
}
