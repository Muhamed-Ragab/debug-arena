"use client";

import { AlertTriangle, Check, KeyRound, Link2 } from "lucide-react";
import { useExtracted } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { flattenValidationErrors } from "@/lib/safe-action/validation";
import { unlinkAccountAction } from "../actions";
import type { LinkedAccount, ProviderId } from "../types";

const PROVIDER_BRAND: Record<
  ProviderId,
  { initial: string; bg: string; fg: string }
> = {
  discord: { bg: "#5865f2", fg: "#ffffff", initial: "D" },
  github: { bg: "#181717", fg: "#ffffff", initial: "G" },
  gitlab: { bg: "#fc6d26", fg: "#ffffff", initial: "Git" },
  google: { bg: "#ea4335", fg: "#ffffff", initial: "G" },
};

interface LinkedAccountsProps {
  accounts: LinkedAccount[];
}

export function LinkedAccounts({
  accounts: initialAccounts,
}: LinkedAccountsProps) {
  const t = useExtracted();
  const [accounts, setAccounts] = useState<LinkedAccount[]>(initialAccounts);
  const [blocked, setBlocked] = useState<ProviderId | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUnlinking, setIsUnlinking] = useState<string | null>(null);

  const connectedCount = accounts.filter((a) => a.connected).length;

  const onDisconnect = async (account: LinkedAccount) => {
    if (account.connected && connectedCount <= 1) {
      setBlocked(account.provider);
      return;
    }

    setIsUnlinking(account.provider);
    setErrorMessage(null);

    try {
      const res = await unlinkAccountAction({ providerId: account.provider });
      if (res?.data?.success) {
        setAccounts((prev) =>
          prev.map((a) =>
            a.provider === account.provider
              ? { ...a, connected: false, email: undefined }
              : a
          )
        );
        toast.success(t("Provider unlinked"));
      } else if (res?.validationErrors) {
        const flat = flattenValidationErrors(res.validationErrors);
        const msg = flat.providerId ?? flat._errors ?? "Validation failed";
        setErrorMessage(msg);
        toast.error(t("Validation failed"));
      } else if (res?.serverError) {
        setErrorMessage(res.serverError);
        toast.error(res.serverError);
      } else {
        setErrorMessage("Something went wrong");
        toast.error(t("Something went wrong"));
      }
    } catch {
      setErrorMessage("Something went wrong");
      toast.error(t("Something went wrong"));
    } finally {
      setIsUnlinking(null);
    }
  };

  return (
    <Card className="p-1">
      <CardHeader>
        <CardTitle className="text-base">{t("Connected accounts")}</CardTitle>
        <CardDescription>
          {t(
            "Link providers to sign in faster. One stays primary for your avatar and name."
          )}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {Boolean(errorMessage) && (
          <Alert className="mb-4" variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {errorMessage ? errorMessage : null}
            </AlertDescription>
          </Alert>
        )}

        <ul className="divide-y divide-border">
          {accounts.map((account) => {
            const brand = PROVIDER_BRAND[account.provider];
            const isBlocked = blocked === account.provider;
            const loading = isUnlinking === account.provider;

            return (
              <li className="py-4" key={account.provider}>
                <div className="flex items-center gap-4">
                  <div
                    aria-hidden
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md font-bold text-[13px]"
                    style={{ backgroundColor: brand.bg, color: brand.fg }}
                  >
                    {brand.initial}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-[13px] text-foreground">
                        {account.label}
                      </span>
                      {Boolean(account.isPrimary && account.connected) && (
                        <Badge
                          className="gap-1 font-medium text-[11px]"
                          variant="default"
                        >
                          <Check size={11} /> {t("Connected")}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-0.5 text-[12px] text-muted-foreground">
                      {account.connected
                        ? (account.email ?? t("Connected"))
                        : t("Not connected")}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {account.connected ? (
                      <Button
                        disabled={loading}
                        onClick={() => onDisconnect(account)}
                        size="sm"
                        variant="destructive"
                      >
                        {loading ? t("Unlinking...") : t("Unlink")}
                      </Button>
                    ) : (
                      <Button asChild size="sm" variant="default">
                        <a
                          href={`/api/auth/sign-in/social?provider=${account.provider}`}
                        >
                          <Link2 size={13} /> {t("Connect")}
                        </a>
                      </Button>
                    )}
                  </div>
                </div>

                {Boolean(isBlocked) && (
                  <Alert className="mt-3" variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      {t(
                        "Can't unlink {label} — it's your only sign-in method. Add another provider first, then retry.",
                        {
                          label: account.label,
                        }
                      )}
                    </AlertDescription>
                  </Alert>
                )}
              </li>
            );
          })}
        </ul>

        <div className="mt-5 flex items-start gap-2 rounded-md border border-border bg-inset px-3 py-2.5 text-[12px] text-muted-foreground">
          <KeyRound className="mt-0.5 shrink-0 text-primary" size={14} />
          <span>
            {t(
              "Unlinking a provider only removes the connection — it never deletes your Debug Arena account or your challenge history."
            )}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
