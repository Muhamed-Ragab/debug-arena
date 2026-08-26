"use client";

import { AlertTriangle, Trash2 } from "lucide-react";
import { useState } from "react";
import { PROFILE_DEFAULT } from "../data/settings";

export function DangerZone() {
  const [confirming, setConfirming] = useState(false);
  const [typed, setTyped] = useState("");

  const CONFIRM_PHRASE = PROFILE_DEFAULT.handle;
  const matches = typed.trim().toLowerCase() === CONFIRM_PHRASE.toLowerCase();

  const reset = () => {
    setConfirming(false);
    setTyped("");
  };

  return (
    <section className="rounded-lg border border-destructive/30 bg-destructive/5 p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-destructive/30 bg-destructive/10 text-destructive">
          <AlertTriangle size={17} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-[15px] text-destructive">
            Delete account
          </h2>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Permanently remove your account and all associated data. This cannot
            be undone.
          </p>
        </div>
      </div>

      {confirming ? (
        <div className="mt-4 rounded-md border border-destructive/30 bg-inset p-4">
          <p className="text-[13px] text-foreground">
            To confirm, type your handle{" "}
            <code className="rounded bg-black/30 px-1.5 py-0.5 font-mono text-[12px] text-destructive">
              {CONFIRM_PHRASE}
            </code>{" "}
            below.
          </p>
          <input
            className="mt-3 w-full rounded-md border border-destructive/30 bg-background px-3 py-2 font-mono text-[13px] text-foreground transition-colors placeholder:text-muted-foreground/50 focus:border-destructive/60 focus:outline-none"
            onChange={(e) => setTyped(e.target.value)}
            placeholder={CONFIRM_PHRASE}
            value={typed}
          />
          <div className="mt-3 flex items-center gap-2">
            <button
              className="inline-flex items-center gap-2 rounded-md bg-destructive px-4 py-2 font-medium text-[13px] text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={!matches}
              type="button"
            >
              <Trash2 size={14} /> Permanently delete
            </button>
            <button
              className="rounded-md border border-border bg-card px-4 py-2 font-medium text-[13px] text-foreground transition-colors hover:bg-inset"
              onClick={reset}
              type="button"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          className="mt-4 inline-flex items-center gap-2 rounded-md border border-destructive/40 bg-transparent px-4 py-2 font-medium text-[13px] text-destructive transition-colors hover:bg-destructive/10"
          onClick={() => setConfirming(true)}
          type="button"
        >
          <Trash2 size={14} /> Delete account
        </button>
      )}
    </section>
  );
}
