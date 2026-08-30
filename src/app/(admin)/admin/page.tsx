import type { Metadata } from "next";
import Link from "next/link";
import { getExtracted } from "next-intl/server";
import { HealthPanel } from "@/features/admin/components/HealthPanel";
import { adminService } from "@/features/admin/service";
import { analyticsService } from "@/features/analytics/service";

export const metadata: Metadata = {
  description:
    "Admin dashboard overview of platform health, content, and community.",
  title: "Dashboard | Debug Arena Admin",
};

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const t = await getExtracted();
  let overview: Awaited<
    ReturnType<typeof analyticsService.getOverview>
  > | null = null;
  let challenges: Awaited<ReturnType<typeof adminService.getAdminChallenges>> =
    [];
  try {
    const [ov, ch] = await Promise.all([
      analyticsService.getOverview(),
      adminService.getAdminChallenges(),
    ]);
    overview = ov;
    challenges = ch;
  } catch {
    overview = null;
  }

  const recent = challenges.slice(0, 5);
  const totalUsers = overview?.totalUsers ?? 0;
  const totalChallenges = overview?.totalChallenges ?? challenges.length;
  const published =
    overview?.challengesByStatus.find((s) => s.status === "published")?.count ??
    0;
  const drafts =
    overview?.challengesByStatus.find((s) => s.status === "draft")?.count ?? 0;
  const solveRate = overview?.solveRate.rate ?? 0;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-6">
      <div>
        <h1 className="font-semibold text-2xl text-heading">
          {t("Admin Dashboard")}
        </h1>
        <p className="mt-1 text-muted-foreground text-sm">
          {t("Overview of platform health, content, and community.")}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-muted-foreground text-sm">{t("Total Users")}</p>
          <p className="mt-2 font-semibold text-2xl text-heading">
            {totalUsers}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-muted-foreground text-sm">
            {t("Total Challenges")}
          </p>
          <p className="mt-2 font-semibold text-2xl text-heading">
            {totalChallenges}
          </p>
          <p className="mt-1 text-muted-foreground text-xs">
            {t("Published")}: {published} · {t("Drafts")}: {drafts}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-muted-foreground text-sm">{t("Solve Rate")}</p>
          <p className="mt-2 font-semibold text-2xl text-heading">
            {solveRate}%
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-muted-foreground text-sm">
            {t("Total Submissions")}
          </p>
          <p className="mt-2 font-semibold text-2xl text-heading">
            {overview?.totalSubmissions ?? 0}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
          <h2 className="font-semibold text-heading">{t("Quick Links")}</h2>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Link
              className="rounded-lg bg-inset px-4 py-3 font-medium text-sm hover:bg-inset/80"
              href="/admin/categories"
            >
              {t("Categories")}
            </Link>
            <Link
              className="rounded-lg bg-inset px-4 py-3 font-medium text-sm hover:bg-inset/80"
              href="/admin/questions"
            >
              AI Question Studio
            </Link>
            <Link
              className="rounded-lg bg-inset px-4 py-3 font-medium text-sm hover:bg-inset/80"
              href="/admin/analytics"
            >
              {t("Analytics")}
            </Link>
            <Link
              className="rounded-lg bg-inset px-4 py-3 font-medium text-sm hover:bg-inset/80"
              href="/admin/health"
            >
              {t("Health Check")}
            </Link>
            <Link
              className="rounded-lg bg-inset px-4 py-3 font-medium text-sm hover:bg-inset/80"
              href="/admin/users"
            >
              {t("Users")}
            </Link>
            <Link
              className="rounded-lg bg-inset px-4 py-3 font-medium text-sm hover:bg-inset/80"
              href="/challenges"
            >
              Browse Challenges
            </Link>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-semibold text-heading">
            {t("Recent Submissions")}
          </h2>
          {recent.length === 0 ? (
            <p className="mt-4 text-muted-foreground text-sm">
              {t("No recent submissions.")}
            </p>
          ) : (
            <ul className="mt-4 flex flex-col gap-2">
              {recent.map((r) => (
                <li
                  className="flex items-center justify-between rounded-md bg-inset px-3 py-2 text-sm"
                  key={r.id}
                >
                  <span className="truncate font-medium text-heading">
                    {r.title}
                  </span>
                  <span className="text-muted-foreground">
                    {r.submissionsCount}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <HealthPanel />
    </div>
  );
}
