import { LeaderboardPage } from "@/features/leaderboard/LeaderboardPage";
import { getTopLeaderboard } from "@/features/leaderboard/queries";
import { getServerSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function Page() {
  const session = await getServerSession();
  const entries = await getTopLeaderboard({
    currentUserId: session?.user?.id ?? null,
    period: "all_time",
  });

  return <LeaderboardPage initialEntries={entries} />;
}
