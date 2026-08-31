"use client";

import { useExtracted } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { toggleUserBanAction } from "@/features/admin/actions";

interface UserRow {
  banExpires?: Date | string | null;
  banned: boolean | null;
  banReason?: string | null;
  currentRating: number;
  displayName: string | null;
  email: string;
  id: string;
  name: string | null;
  streakCount: number;
}

interface Props {
  initialUsers: UserRow[];
}

export function UserManagementClient({ initialUsers }: Props) {
  const t = useExtracted();
  const [users, setUsers] = useState<UserRow[]>(initialUsers);
  const [query, setQuery] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);

  const filtered = users.filter((u) => {
    const q = query.toLowerCase();
    return (
      u.email.toLowerCase().includes(q) ||
      (u.displayName ?? "").toLowerCase().includes(q) ||
      (u.name ?? "").toLowerCase().includes(q)
    );
  });

  async function toggleBan(user: UserRow) {
    const nextBanned = !user.banned;
    const previous = users;
    setPendingId(user.id);
    setUsers((prev) =>
      prev.map((p) => (p.id === user.id ? { ...p, banned: nextBanned } : p))
    );
    const result = await toggleUserBanAction({
      banned: nextBanned,
      userId: user.id,
    });
    setPendingId(null);
    if (result?.serverError) {
      setUsers(previous);
      toast.error(result.serverError);
      return;
    }
    if (result?.validationErrors) {
      setUsers(previous);
      toast.error(t("Validation failed"));
      return;
    }
    toast.success(nextBanned ? t("Banned") : t("Active"));
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
      <input
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t("Search by name or email...")}
        value={query}
      />
      {filtered.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground text-sm">
          {t("No users found.")}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-border border-b text-left text-muted-foreground">
                <th className="px-3 py-2 font-medium">{t("User")}</th>
                <th className="px-3 py-2 font-medium">{t("Email")}</th>
                <th className="px-3 py-2 font-medium">{t("Rating")}</th>
                <th className="px-3 py-2 font-medium">{t("Streak")}</th>
                <th className="px-3 py-2 font-medium">{t("Status")}</th>
                <th className="px-3 py-2 font-medium">{t("Action")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                let banLabel: string;
                if (pendingId === u.id) {
                  banLabel = "...";
                } else if (u.banned) {
                  banLabel = t("Unban");
                } else {
                  banLabel = t("Ban");
                }
                return (
                  <tr
                    className="border-border border-b last:border-0"
                    key={u.id}
                  >
                    <td className="px-3 py-2 font-medium text-heading">
                      {u.displayName || u.name || "—"}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {u.email}
                    </td>
                    <td className="px-3 py-2">{u.currentRating}</td>
                    <td className="px-3 py-2">{u.streakCount}</td>
                    <td className="px-3 py-2">
                      <span
                        className={
                          u.banned ? "text-destructive" : "text-emerald-600"
                        }
                      >
                        {u.banned ? t("Banned") : t("Active")}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <Button
                        disabled={pendingId === u.id}
                        onClick={() => toggleBan(u)}
                        size="sm"
                        variant={u.banned ? "outline" : "destructive"}
                      >
                        {banLabel}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
