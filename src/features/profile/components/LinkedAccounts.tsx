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
import { authClient } from "@/lib/auth/client";
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

const ENABLED_PROVIDERS = new Set<ProviderId>(["google"]);

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
  const [isLinking, setIsLinking] = useState<string | null>(null);

  const connectedCount = accounts.filter((a) => a.connected).length;

  const handleLink = async (provider: ProviderId) => {
    if (!ENABLED_PROVIDERS.has(provider)) {
      setErrorMessage(t("Provider not available"));
      toast.error(t("Provider not available"));
      return;
    }
    setIsLinking(provider);
    setErrorMessage(null);
    try {
      const result = await authClient.linkSocial({
        callbackURL: "/settings",
        provider: "google",
      });
      if (result?.error) {
        const msg = result.error.message ?? t("Something went wrong");
        setErrorMessage(msg);
        toast.error(msg);
      }
    } catch {
      const msg = t("Something went wrong");
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsLinking(null);
    }
  };

  const handleUnlink = async (account: LinkedAccount) => {
    if (!ENABLED_PROVIDERS.has(account.provider)) {
      setErrorMessage(t("Provider not available"));
      toast.error(t("Provider not available"));
      return;
    }
    if (account.connected && connectedCount <= 1) {
      setBlocked(account.provider);
      return;
    }

    setIsUnlinking(account.provider);
    setErrorMessage(null);

    try {
      if (!account.accountId) {
        setErrorMessage(t("Something went wrong"));
        toast.error(t("Something went wrong"));
        return;
      }
      const result = await authClient.unlinkAccount({
        accountId: account.accountId,
      });
      if (result?.error) {
        const msg = result.error.message ?? t("Something went wrong");
        setErrorMessage(msg);
        toast.error(msg);
      } else {
        setAccounts((prev) =>
          prev.map((a) =>
            a.provider === account.provider
              ? { ...a, connected: false, email: undefined }
              : a
          )
        );
        toast.success(t("Provider unlinked"));
      }
    } catch {
      const msg = t("Something went wrong");
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsUnlinking(null);
    }
  };

  const onLinkClick = (provider: ProviderId) => {
    handleLink(provider).catch(() => {
      // handled inside
    });
  };

  const onUnlinkClick = (account: LinkedAccount) => {
    handleUnlink(account).catch(() => {
      // handled inside
    });
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
            const loadingUnlink = isUnlinking === account.provider;
            const loadingLink = isLinking === account.provider;
            const isEnabled = ENABLED_PROVIDERS.has(account.provider);

            let actionButton: React.ReactNode = null;
            if (account.connected) {
              actionButton = (
                <Button
                  disabled={loadingUnlink || !isEnabled}
                  onClick={() => onUnlinkClick(account)}
                  size="sm"
                  title={
                    isEnabled
                      ? undefined
                      : t("Coming soon — only Google is available")
                  }
                  variant="destructive"
                >
                  {loadingUnlink ? t("Unlinking...") : t("Unlink")}
                </Button>
              );
            } else if (isEnabled) {
              actionButton = (
                <Button
                  disabled={loadingLink}
                  onClick={() => onLinkClick(account.provider)}
                  size="sm"
                  variant="default"
                >
                  <Link2 size={13} />{" "}
                  {loadingLink ? t("Connecting...") : t("Connect")}
                </Button>
              );
            } else {
              actionButton = (
                <Button
                  aria-disabled="true"
                  disabled
                  size="sm"
                  title={t("Coming soon — only Google is available")}
                  variant="secondary"
                >
                  <Link2 size={13} /> {t("Connect")}
                </Button>
              );
            }

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
                    {actionButton}
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
