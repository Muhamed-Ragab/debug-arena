"use client";

import { useExtracted } from "next-intl";

type BannerVariant = "offline" | "generic";

interface OfflineBannerProps {
  message: string;
  onRetry?: () => void;
  variant: BannerVariant;
}

const VARIANT_CONFIG: Record<
  BannerVariant,
  { container: string; heading: string; text: string }
> = {
  generic: {
    container:
      "rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950/30",
    heading: "font-semibold text-red-900 dark:text-red-100",
    text: "mt-1 text-red-800 text-sm dark:text-red-200",
  },
  offline: {
    container:
      "rounded-lg border border-amber-200 bg-amber-50 p-6 dark:border-amber-900 dark:bg-amber-950/30",
    heading: "font-semibold text-amber-900 dark:text-amber-100",
    text: "mt-1 text-amber-800 text-sm dark:text-amber-200",
  },
};

function getVariantConfig(variant: BannerVariant) {
  switch (variant) {
    case "offline":
      return VARIANT_CONFIG.offline;
    case "generic":
      return VARIANT_CONFIG.generic;
    default: {
      const exhaustive: never = variant;
      return exhaustive;
    }
  }
}

export function OfflineBanner({
  message,
  onRetry,
  variant,
}: OfflineBannerProps) {
  const t = useExtracted();
  const config = getVariantConfig(variant);
  // Seed OFFLINE_MESSAGE literal for extraction (dynamic message prop won't be extracted otherwise)
  t("Service temporarily unavailable. Please try again.");
  const title =
    variant === "offline" ? t("You are offline") : t("Something went wrong");
  const retryLabel = t("Try again");
  const translatedMessage = message;

  return (
    <div className={config.container} role="alert">
      <h2 className={config.heading}>{title}</h2>
      <p className={config.text}>{translatedMessage}</p>
      {onRetry ? (
        <button
          className="mt-4 inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground text-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={onRetry}
          type="button"
        >
          {retryLabel}
        </button>
      ) : null}
    </div>
  );
}
