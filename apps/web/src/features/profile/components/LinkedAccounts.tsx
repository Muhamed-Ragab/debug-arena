import { useState } from "react";
import { Check, KeyRound, Link2, ShieldAlert, AlertTriangle } from "lucide-react";
import type { LinkedAccount, ProviderId } from "../data/settings";
import { LINKED_ACCOUNTS, PASSWORD_SET } from "../data/settings";

const PROVIDER_BRAND: Record<ProviderId, { initial: string; bg: string; fg: string }> = {
  github: { initial: "G", bg: "#181717", fg: "#ffffff" },
  google: { initial: "G", bg: "#ea4335", fg: "#ffffff" },
  gitlab: { initial: "Git", bg: "#fc6d26", fg: "#ffffff" },
  discord: { initial: "D", bg: "#5865f2", fg: "#ffffff" },
};

export default function LinkedAccounts() {
  const [accounts, setAccounts] = useState<LinkedAccount[]>(LINKED_ACCOUNTS);
  const [blocked, setBlocked] = useState<ProviderId | null>(null);

  const connectedCount = accounts.filter((a) => a.connected).length;

  const toggleConnect = (provider: ProviderId) => {
    setAccounts((prev) =>
      prev.map((a) =>
        a.provider === provider ? { ...a, connected: !a.connected } : a,
      ),
    );
    setBlocked(null);
  };

  const makePrimary = (provider: ProviderId) => {
    setAccounts((prev) =>
      prev.map((a) => ({ ...a, isPrimary: a.provider === provider })),
    );
  };

  const onDisconnect = (account: LinkedAccount) => {
    // Orphan guard: never remove the last sign-in method without a fallback.
    if (account.connected && connectedCount <= 1 && !PASSWORD_SET) {
      setBlocked(account.provider);
      return;
    }
    toggleConnect(account.provider);
  };

  return (
    <section className="rounded-lg border border-border bg-card p-5 sm:p-6">
      <div>
        <h2 className="text-[15px] font-semibold text-heading">Connected accounts</h2>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Link providers to sign in faster. One stays primary for your avatar and name.
        </p>
      </div>

      {!PASSWORD_SET && (
        <div className="mt-4 flex items-start gap-2 rounded-md border border-warning/30 bg-warning/5 px-3 py-2.5 text-[12px] text-warning">
          <ShieldAlert size={14} className="mt-0.5 shrink-0" />
          <span>
            No password or secondary factor is set. You can&apos;t remove your last sign-in
            method until you add one — this prevents orphaning your account.
          </span>
        </div>
      )}

      <ul className="mt-5 divide-y divide-border/70">
        {accounts.map((account) => {
          const brand = PROVIDER_BRAND[account.provider];
          const isBlocked = blocked === account.provider;
          return (
            <li key={account.provider} className="py-4">
              <div className="flex items-center gap-4">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-[13px] font-bold"
                  style={{ backgroundColor: brand.bg, color: brand.fg }}
                  aria-hidden
                >
                  {brand.initial}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[13px] font-medium text-foreground">
                      {account.label}
                    </span>
                    {account.isPrimary && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                        <Check size={11} /> Primary
                      </span>
                    )}
                    {account.isCurrentSignIn && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.06] px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                        Current sign-in
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[12px] text-muted-foreground">
                    {account.connected
                      ? account.email ?? "Connected"
                      : "Not connected"}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {account.connected ? (
                    <>
                      {!account.isPrimary && (
                        <button
                          type="button"
                          onClick={() => makePrimary(account.provider)}
                          className="rounded-md border border-border bg-card px-3 py-1.5 text-[12px] font-medium text-foreground transition-colors hover:bg-white/[0.04]"
                        >
                          Make primary
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onDisconnect(account)}
                        className="rounded-md border border-border bg-card px-3 py-1.5 text-[12px] font-medium text-danger-soft transition-colors hover:border-danger/40 hover:bg-danger/10"
                      >
                        Unlink
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => toggleConnect(account.provider)}
                      className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-primary/90"
                    >
                      <Link2 size={13} /> Connect
                    </button>
                  )}
                </div>
              </div>

              {isBlocked && (
                <div className="mt-3 flex items-start gap-2 rounded-md border border-danger/30 bg-danger/5 px-3 py-2.5 text-[12px] text-danger-soft">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                  <span>
                    Can&apos;t unlink <strong>{account.label}</strong> — it&apos;s your only
                    sign-in method. Add a password or another provider first, then retry.
                  </span>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <div className="mt-5 flex items-start gap-2 rounded-md border border-border bg-inset px-3 py-2.5 text-[12px] text-muted-foreground">
        <KeyRound size={14} className="mt-0.5 shrink-0 text-primary" />
        <span>
          Unlinking a provider only removes the connection — it never deletes your Debug
          Arena account or your challenge history.
        </span>
      </div>
    </section>
  );
}
