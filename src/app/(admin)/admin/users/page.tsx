import type { Metadata } from "next";
import { getExtracted } from "next-intl/server";
import { adminService } from "@/features/admin/service";
import { UserManagementClient } from "./users-client";

export const metadata: Metadata = {
  description: "Manage community users. Admins excluded from ranking.",
  title: "Users | Debug Arena Admin",
};

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const t = await getExtracted();
  const users = await adminService.getAdminUsers().catch(() => []);
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-6">
      <div>
        <h1 className="font-semibold text-2xl text-heading">
          {t("User Management")}
        </h1>
        <p className="mt-1 text-muted-foreground text-sm">
          {t(
            "Manage community members. Admins are excluded from gameplay ranking."
          )}
        </p>
      </div>
      <UserManagementClient initialUsers={users} />
    </div>
  );
}
