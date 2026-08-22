import { useState } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import { PROFILE_DEFAULT } from "../data/settings";

export default function DangerZone() {
  const [confirming, setConfirming] = useState(false);
  const [typed, setTyped] = useState("");

  const CONFIRM_PHRASE = PROFILE_DEFAULT.handle;
  const matches = typed.trim().toLowerCase() === CONFIRM_PHRASE.toLowerCase();

  const reset = () => {
    setConfirming(false);
    setTyped("");
  };

  return (
    <section className="rounded-lg border border-danger/30 bg-danger/[0.04] p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-danger/30 bg-danger/10 text-danger-soft">
          <AlertTriangle size={17} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-[15px] font-semibold text-danger-soft">Delete account</h2>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Permanently remove your account and all associated data. This cannot be undone.
          </p>
        </div>
      </div>

      {!confirming ? (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="mt-4 inline-flex items-center gap-2 rounded-md border border-danger/40 bg-transparent px-4 py-2 text-[13px] font-medium text-danger-soft transition-colors hover:bg-danger/10"
        >
          <Trash2 size={14} /> Delete account
        </button>
      ) : (
        <div className="mt-4 rounded-md border border-danger/30 bg-inset p-4">
          <p className="text-[13px] text-foreground">
            To confirm, type your handle{" "}
            <code className="rounded bg-black/30 px-1.5 py-0.5 font-mono text-[12px] text-danger-soft">
              {CONFIRM_PHRASE}
            </code>{" "}
            below.
          </p>
          <input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoFocus
            className="mt-3 w-full rounded-md border border-danger/30 bg-background px-3 py-2 font-mono text-[13px] text-foreground placeholder:text-muted-foreground/50 transition-colors focus:border-danger/60 focus:outline-none focus:ring-1 focus:ring-danger/40"
            placeholder={CONFIRM_PHRASE}
          />
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              disabled={!matches}
              className="inline-flex items-center gap-2 rounded-md bg-danger px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-danger/90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Trash2 size={14} /> Permanently delete
            </button>
            <button
              type="button"
              onClick={reset}
              className="rounded-md border border-border bg-card px-4 py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-white/[0.04]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
