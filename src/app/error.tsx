"use client";

import { useTranslations } from "next-intl";
import { OfflineBanner } from "@/components/shared/offline-banner";
import { isOfflineCause, isOfflineError, OFFLINE_MESSAGE } from "@/lib/offline";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

// biome-ignore lint/suspicious/noShadowRestrictedNames: Next.js requires prop name `error`
export default function Error({ error: boundaryError, reset }: ErrorProps) {
  const t = useTranslations();
  const { cause } = boundaryError as Error & { cause?: unknown };
  const offline = isOfflineError(boundaryError) || isOfflineCause(cause);

  const variant = offline ? "offline" : "generic";
  const message = offline ? OFFLINE_MESSAGE : "Something went wrong";
  // Seed literals for extraction
  t("error.somethingWrong");
  t("error.serviceUnavailable");

  return (
    <div className="mx-auto flex min-h-[50vh] w-full max-w-xl flex-col justify-center p-6">
      <OfflineBanner message={message} onRetry={reset} variant={variant} />
      {boundaryError.digest !== undefined && boundaryError.digest.length > 0 ? (
        <p className="mt-3 text-center text-muted-foreground text-xs">
          {t("error.digest", { digest: boundaryError.digest })}
        </p>
      ) : null}
    </div>
  );
}
