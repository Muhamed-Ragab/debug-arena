import type { Metadata } from "next";
import { AnalyticsOverview } from "@/features/analytics/components/AnalyticsOverview";
import { analyticsService } from "@/features/analytics/service";

export const metadata: Metadata = {
  description: "Platform analytics and statistics. Admins excluded.",
  title: "Analytics | Debug Arena Admin",
};

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  let overview: Awaited<
    ReturnType<typeof analyticsService.getOverview>
  > | null = null;
  try {
    overview = await analyticsService.getOverview();
  } catch {
    overview = null;
  }
  if (!overview) {
    return (
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-6">
        <h1 className="font-semibold text-2xl text-heading">
          {"Analytics & Statistics"}
        </h1>
        <p className="text-muted-foreground text-sm">
          {"No data available yet."}
        </p>
      </div>
    );
  }
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-6">
      <div>
        <h1 className="font-semibold text-2xl text-heading">
          {"Analytics & Statistics"}
        </h1>
        <p className="mt-1 text-muted-foreground text-sm">
          {
            "Platform usage, challenge performance, and community insights. Admins excluded."
          }
        </p>
      </div>
      <AnalyticsOverview data={overview} />
    </div>
  );
}
