import { OfflineBanner } from "@/components/shared/offline-banner";
import { LeaderboardPage } from "@/features/leaderboard/LeaderboardPage";
import { leaderboardService } from "@/features/leaderboard/service";
import { getServerSession } from "@/lib/auth/session";
import { isOfflineCause, isOfflineError, OFFLINE_MESSAGE } from "@/lib/offline";

export const dynamic = "force-dynamic";

export default async function Page() {
  const session = await getServerSession();
  try {
    const entries = await leaderboardService.getTopLeaderboard({
      currentUserId: session?.user?.id ?? null,
      period: "all_time",
    });

    return <LeaderboardPage initialEntries={entries} />;
  } catch (err) {
    console.error("[LeaderboardPage] Failed to load:", err);
    const offline = isOfflineError(err) || isOfflineCause(err);
    if (offline) {
      return (
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-6">
          <OfflineBanner message={OFFLINE_MESSAGE} variant="offline" />
          <LeaderboardPage initialEntries={[]} />
        </div>
      );
    }
    return (
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-6">
        <OfflineBanner message="Something went wrong" variant="generic" />
        <LeaderboardPage initialEntries={[]} />
      </div>
    );
  }
}
