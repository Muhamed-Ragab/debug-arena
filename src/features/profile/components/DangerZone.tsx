"use client";

import { AlertTriangle, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth/client";
import { deleteAccountAction } from "../actions";

const AT_PREFIX_REGEX = /^@/;

interface DangerZoneProps {
  handle?: string;
}

export function DangerZone({ handle }: DangerZoneProps) {
  const t = useTranslations();
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [typed, setTyped] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const CONFIRM_PHRASE = handle?.replace(AT_PREFIX_REGEX, "") || "delete";
  const matches = typed.trim().toLowerCase() === CONFIRM_PHRASE.toLowerCase();

  const reset = () => {
    setConfirming(false);
    setTyped("");
  };

  const handleDelete = async () => {
    if (!matches || isDeleting) {
      return;
    }
    setIsDeleting(true);
    try {
      await deleteAccountAction({});
      await authClient.signOut();
      router.push("/login");
    } catch (err) {
      console.error("Failed to delete account:", err);
      setIsDeleting(false);
    }
  };

  return (
    <Card className="border-destructive/30 bg-destructive/5 p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-destructive/30 bg-destructive/10 text-destructive">
          <AlertTriangle size={17} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-[15px] text-destructive">
            {t("profile.danger.deleteAccount")}
          </h2>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {t("profile.danger.deleteDescription")}
          </p>
        </div>
      </div>

      {confirming ? (
        <div className="mt-4 rounded-md border border-destructive/30 bg-inset p-4">
          <p className="text-[13px] text-foreground">
            {(() => {
              const translated = t("profile.danger.confirmHandle", {
                phrase: CONFIRM_PHRASE,
              });
              const parts = translated.split(CONFIRM_PHRASE);
              if (parts.length === 2) {
                return (
                  <>
                    {parts[0]}
                    <code className="rounded bg-black/30 px-1.5 py-0.5 font-mono text-[12px] text-destructive">
                      {CONFIRM_PHRASE}
                    </code>
                    {parts[1]}
                  </>
                );
              }
              return translated;
            })()}
          </p>
          <Input
            className="mt-3 border-destructive/30 bg-background font-mono text-[13px] focus-visible:ring-destructive"
            onChange={(e) => setTyped(e.target.value)}
            placeholder={CONFIRM_PHRASE}
            value={typed}
          />
          <div className="mt-3 flex items-center gap-2">
            <Button
              disabled={!matches || isDeleting}
              onClick={handleDelete}
              size="sm"
              variant="destructive"
            >
              <Trash2 size={14} />{" "}
              {isDeleting
                ? t("common.actions.deleting")
                : t("common.actions.permanentlyDelete")}
            </Button>
            <Button onClick={reset} size="sm" variant="outline">
              {t("common.actions.cancel")}
            </Button>
          </div>
        </div>
      ) : (
        <Button
          className="mt-4 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => setConfirming(true)}
          size="sm"
          variant="outline"
        >
          <Trash2 size={14} /> {t("profile.danger.deleteAccount")}
        </Button>
      )}
    </Card>
  );
}
