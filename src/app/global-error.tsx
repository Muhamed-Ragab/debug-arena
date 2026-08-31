"use client";

import { useExtracted } from "next-intl";
import { isOfflineCause, isOfflineError } from "@/lib/offline";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

const VARIANT_CONTAINER: Record<"offline" | "generic", string> = {
  generic:
    "rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950/30",
  offline:
    "rounded-lg border border-amber-200 bg-amber-50 p-6 dark:border-amber-900 dark:bg-amber-950/30",
};

function getContainerClass(variant: "offline" | "generic"): string {
  switch (variant) {
    case "offline":
      return VARIANT_CONTAINER.offline;
    case "generic":
      return VARIANT_CONTAINER.generic;
    default: {
      const exhaustive: never = variant;
      return exhaustive;
    }
  }
}

export default function GlobalError({
  error: boundaryError,
  reset,
}: GlobalErrorProps) {
  const t = useExtracted();
  const { cause } = boundaryError as Error & { cause?: unknown };
  const offline = isOfflineError(boundaryError) || isOfflineCause(cause);

  const variant: "offline" | "generic" = offline ? "offline" : "generic";
  const title =
    variant === "offline" ? t("You are offline") : t("Something went wrong");
  const message = offline
    ? t("Service temporarily unavailable. Please try again.")
    : t("Something went wrong");
  const containerClass = getContainerClass(variant);

  const headingClass =
    variant === "offline"
      ? "font-semibold text-amber-900 dark:text-amber-100"
      : "font-semibold text-red-900 dark:text-red-100";

  const textClass =
    variant === "offline"
      ? "mt-1 text-amber-800 text-sm dark:text-amber-200"
      : "mt-1 text-red-800 text-sm dark:text-red-200";

  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center p-6">
          <div className={containerClass} role="alert">
            <h2 className={headingClass}>{title}</h2>
            <p className={textClass}>{message}</p>
            <button
              className="mt-4 inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground text-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={reset}
              type="button"
            >
              {t("Try again")}
            </button>
          </div>
          {boundaryError.digest !== undefined &&
          boundaryError.digest.length > 0 ? (
            <p className="mt-3 text-center text-muted-foreground text-xs">
              {t("Error ID: {digest}", { digest: boundaryError.digest })}
            </p>
          ) : null}
        </div>
      </body>
    </html>
  );
}
