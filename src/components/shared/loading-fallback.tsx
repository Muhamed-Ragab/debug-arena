"use client";

import { Loader2 } from "lucide-react";
import { useExtracted } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface LoadingFallbackProps {
  className?: string;
  description?: string;
  message?: string;
  variant?: "page" | "section" | "inline";
}

export function LoadingSpinner({
  className,
  size = 20,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <Loader2
      aria-hidden="true"
      className={cn("animate-spin text-primary", className)}
      size={size}
    />
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-[50vh] w-full flex-col items-center justify-center overflow-hidden bg-background px-4 py-16">
      {/* grid + aura — matches not-found / landing */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(34,38,56,0.6) 1px, transparent 1px), linear-gradient(to bottom, rgba(34,38,56,0.6) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
            maskImage:
              "radial-gradient(ellipse 70% 60% at 50% 50%, black 35%, transparent 100%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 70% 60% at 50% 50%, black 35%, transparent 100%)",
          }}
        />
        <div
          className="absolute inset-s-1/2 top-1/2 h-120 w-160 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-20 blur-[120px]"
          style={{
            background:
              "radial-gradient(circle, rgba(99,102,241,0.45), rgba(99,102,241,0) 70%)",
          }}
        />
      </div>
      <div className="relative z-10 flex w-full max-w-md flex-col items-center">
        {children}
      </div>
    </div>
  );
}

export function LoadingFallback({
  className,
  description,
  message,
  variant = "page",
}: LoadingFallbackProps) {
  const t = useExtracted();
  // literals for extraction — must be in same function body as t retrieval
  t("Loading...");
  t("Preparing your arena...");
  t("Fetching challenges, hang tight.");

  const title = message ?? t("Loading...");
  const subtitle = description ?? t("Preparing your arena...");

  if (variant === "inline") {
    return (
      <span
        aria-busy="true"
        aria-label={title}
        className={cn(
          "inline-flex items-center gap-2 text-muted-foreground text-sm",
          className
        )}
        role="status"
      >
        <LoadingSpinner size={16} />
        <span>{title}</span>
      </span>
    );
  }

  if (variant === "section") {
    return (
      <div
        aria-busy="true"
        aria-label={title}
        className={cn(
          "flex w-full flex-col items-center justify-center rounded-xl border border-border bg-card px-6 py-10",
          className
        )}
        role="status"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-muted">
          <LoadingSpinner size={18} />
        </span>
        <p className="mt-4 font-medium text-heading text-sm">{title}</p>
        <p className="mt-1 text-center text-muted-foreground text-xs">
          {subtitle}
        </p>
        <div className="mt-6 flex w-full max-w-sm flex-col gap-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
          <Skeleton className="h-3 w-4/6" />
        </div>
      </div>
    );
  }

  // variant === "page" — full-viewport fallback for src/app/loading.tsx and Suspense boundaries
  return (
    <PageShell>
      <div
        aria-busy="true"
        aria-label={title}
        className={cn("flex w-full flex-col items-center text-center", className)}
        role="status"
      >
        {/* spinner badge */}
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-card shadow-sm">
          <LoadingSpinner size={22} />
        </span>

        <h2 className="mt-5 font-semibold text-heading text-lg tracking-tight">
          {title}
        </h2>
        <p className="mt-1.5 max-w-sm text-muted-foreground text-sm leading-relaxed">
          {subtitle}
        </p>
        {/* skeleton card preview — gives perceived skeleton loading */}
        <div className="mt-8 w-full overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="border-border border-b bg-inset/50 px-4 py-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-2.5 w-2.5 rounded-full" />
              <Skeleton className="h-2.5 w-2.5 rounded-full" />
              <Skeleton className="h-2.5 w-2.5 rounded-full" />
              <Skeleton className="ms-auto h-3 w-24" />
            </div>
          </div>
          <div className="space-y-3 p-4">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-8 w-24 rounded-lg" />
              <Skeleton className="h-8 w-24 rounded-lg" />
            </div>
          </div>
        </div>

        <span className="sr-only">{t("Fetching challenges, hang tight.")}</span>
      </div>
    </PageShell>
  );
}

// Convenience alias for Suspense `fallback` prop — keeps imports tidy
export const SuspenseFallback = LoadingFallback;
