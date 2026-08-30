import type { Metadata } from "next";
import { getExtracted } from "next-intl/server";
import { HealthPanel } from "@/features/admin/components/HealthPanel";

export const metadata: Metadata = {
  description: "Live system health of database and Redis.",
  title: "Health Check | Debug Arena Admin",
};

export const dynamic = "force-dynamic";

export default async function AdminHealthPage() {
  const t = await getExtracted();
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
      <div>
        <h1 className="font-semibold text-2xl text-heading">
          {t("System Health")}
        </h1>
        <p className="mt-1 text-muted-foreground text-sm">
          {t("Live status of database and Redis services.")}
        </p>
      </div>
      <HealthPanel />
    </div>
  );
}
