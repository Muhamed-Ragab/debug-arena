import type { Metadata } from "next";
import { AdminQuestionsPage } from "@/features/admin/components/AdminQuestionsPage";
import { adminService } from "@/features/admin/service";
import { listAdminChallengesQuerySchema } from "@/features/admin/validation";
import { isOfflineCause, isOfflineError } from "@/lib/offline";

export const metadata: Metadata = {
  description:
    "AI-powered question and challenge generation studio for Debug Arena administrators.",
  title: "AI Question Studio | Debug Arena Admin",
};

export const dynamic = "force-dynamic";

type SearchParams = {
  difficulty?: string;
  page?: string;
  pageSize?: string;
  search?: string;
  source?: string;
  status?: string;
};

export default async function AdminQuestionsRoute({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  try {
    const sp = await searchParams;
    const parsed = listAdminChallengesQuerySchema.safeParse({
      difficulty: sp.difficulty,
      page: sp.page,
      pageSize: sp.pageSize,
      search: sp.search,
      source: sp.source,
      status: sp.status,
    });

    const opts = parsed.success
      ? parsed.data
      : {
          difficulty: "all" as const,
          page: 1,
          pageSize: 10,
          search: "",
          sortBy: "createdAt" as const,
          sortOrder: "desc" as const,
          source: "all" as const,
          status: "all" as const,
        };

    const [categories, challenges, paginated] = await Promise.all([
      adminService.getAdminCategories(),
      adminService.getAdminChallenges(),
      adminService.getAdminChallengesPaginated(opts),
    ]);
    return (
      <AdminQuestionsPage
        categories={categories}
        challenges={challenges}
        initialChallenges={paginated.items}
        initialTotal={paginated.total}
      />
    );
  } catch (err) {
    const offline = isOfflineError(err) || isOfflineCause(err);
    const message =
      err instanceof Error ? err.message : "Failed to load admin data";
    return (
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-6">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 dark:border-amber-900 dark:bg-amber-950/30">
          <h2 className="font-semibold text-amber-900 dark:text-amber-100">
            {offline ? "You are offline" : "Failed to load"}
          </h2>
          <p className="mt-1 text-amber-800 text-sm dark:text-amber-200">
            {message}
          </p>
          {offline ? (
            <p className="mt-2 text-amber-700 text-sm dark:text-amber-300">
              Database and AI services require an internet connection. Reconnect
              and refresh the page — already-generated drafts and the studio UI
              remain available locally.
            </p>
          ) : null}
          <p className="mt-3 text-muted-foreground text-xs">
            Check: Wi-Fi / VPN, then retry. Server stays running — no restart
            needed.
          </p>
        </div>
        <AdminQuestionsPage categories={[]} challenges={[]} />
      </div>
    );
  }
}
