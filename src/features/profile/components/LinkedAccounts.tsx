"use client";

import { AlertTriangle, Check, KeyRound, Link2 } from "lucide-react";
import { useState } from "react";
import { unlinkAccountAction } from "../actions";
import {
  LINKED_ACCOUNTS,
  type LinkedAccount,
  type ProviderId,
} from "../data/settings";

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
  initialAccounts?: LinkedAccount[];
}

export function LinkedAccounts({ initialAccounts }: LinkedAccountsProps) {
  const [accounts, setAccounts] = useState<LinkedAccount[]>(
    initialAccounts || LINKED_ACCOUNTS
  );
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
      } else if (res?.serverError) {
        setErrorMessage(res.serverError);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to unlink";
      setErrorMessage(msg);
    } finally {
      setIsUnlinking(null);
    }
  };

  return (
    <section className="rounded-lg border border-border bg-card p-5 sm:p-6">
      <div>
        <h2 className="font-semibold text-[15px] text-heading">
          Connected accounts
        </h2>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Link providers to sign in faster. One stays primary for your avatar
          and name.
        </p>
      </div>

      {Boolean(errorMessage) && (
        <div className="mt-4 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-[12px] text-destructive">
          <AlertTriangle className="mt-0.5 shrink-0" size={14} />
          <span>{errorMessage}</span>
        </div>
      )}

      <ul className="mt-5 divide-y divide-border">
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
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 font-medium text-[11px] text-primary">
                        <Check size={11} /> Connected
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[12px] text-muted-foreground">
                    {account.connected
                      ? (account.email ?? "Connected")
                      : "Not connected"}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {account.connected ? (
                    <button
                      className="rounded-md border border-border bg-card px-3 py-1.5 font-medium text-[12px] text-destructive transition-colors hover:border-destructive/40 hover:bg-destructive/10 disabled:opacity-50"
                      disabled={loading}
                      onClick={() => onDisconnect(account)}
                      type="button"
                    >
                      {loading ? "Unlinking..." : "Unlink"}
                    </button>
                  ) : (
                    <a
                      className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 font-medium text-[12px] text-primary-foreground transition-colors hover:bg-primary/90"
                      href={`/api/auth/sign-in/social?provider=${account.provider}`}
                    >
                      <Link2 size={13} /> Connect
                    </a>
                  )}
                </div>
              </div>

              {Boolean(isBlocked) && (
                <div className="mt-3 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-[12px] text-destructive">
                  <AlertTriangle className="mt-0.5 shrink-0" size={14} />
                  <span>
                    Can&apos;t unlink <strong>{account.label}</strong> —
                    it&apos;s your only sign-in method. Add another provider
                    first, then retry.
                  </span>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <div className="mt-5 flex items-start gap-2 rounded-md border border-border bg-inset px-3 py-2.5 text-[12px] text-muted-foreground">
        <KeyRound className="mt-0.5 shrink-0 text-primary" size={14} />
        <span>
          Unlinking a provider only removes the connection — it never deletes
          your Debug Arena account or your challenge history.
        </span>
      </div>
    </section>
  );
}
