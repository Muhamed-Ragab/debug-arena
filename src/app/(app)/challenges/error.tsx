"use client";

import { useTranslations } from "next-intl";
import { OfflineBanner } from "@/components/shared/offline-banner";
import { isOfflineCause, isOfflineError, OFFLINE_MESSAGE } from "@/lib/offline";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ChallengesError({ error, reset }: ErrorProps) {
  const t = useTranslations();
  const { cause } = error as Error & { cause?: unknown };
  const offline = isOfflineError(error) || isOfflineCause(cause);

  const variant = offline ? "offline" : "generic";
  const message = offline ? OFFLINE_MESSAGE : "Something went wrong";
  t("error.somethingWrong");
  t("error.serviceUnavailable");

  return (
    <div className="mx-auto flex min-h-[50vh] w-full max-w-xl flex-col justify-center p-6">
      <OfflineBanner message={message} onRetry={reset} variant={variant} />
      {error.digest !== undefined && error.digest.length > 0 ? (
        <p className="mt-3 text-center text-muted-foreground text-xs">
          {t("error.digest", { digest: error.digest })}
        </p>
      ) : null}
    </div>
  );
}
