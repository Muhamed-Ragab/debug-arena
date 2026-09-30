import { OfflineBanner } from "@/components/shared/offline-banner";
import { categoryService } from "@/features/category/service";
import { LeaderboardPage } from "@/features/leaderboard/LeaderboardPage";
import { leaderboardService } from "@/features/leaderboard/service";
import { getServerSession } from "@/lib/auth/session";
import { isOfflineCause, isOfflineError, OFFLINE_MESSAGE } from "@/lib/offline";

export const dynamic = "force-dynamic";

export default async function Page() {
  const session = await getServerSession();
  try {
    const [entries, categories] = await Promise.all([
      leaderboardService.getTopLeaderboard({
        currentUserId: session?.user?.id ?? null,
        period: "weekly",
      }),
      categoryService.getActiveCategories(),
    ]);

    return <LeaderboardPage categories={categories} initialEntries={entries} />;
  } catch (err) {
    console.error("[LeaderboardPage] Failed to load:", err);
    const offline = isOfflineError(err) || isOfflineCause(err);
    if (offline) {
      return (
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-6">
          <OfflineBanner message={OFFLINE_MESSAGE} variant="offline" />
          <LeaderboardPage categories={[]} initialEntries={[]} />
        </div>
      );
    }
    return (
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-6">
        <OfflineBanner message="Something went wrong" variant="generic" />
        <LeaderboardPage categories={[]} initialEntries={[]} />
      </div>
    );
  }
}
