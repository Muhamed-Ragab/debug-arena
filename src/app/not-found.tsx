"use client";

import { Bug, Home, Terminal } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  const t = useTranslations();
  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-background px-4 text-foreground selection:bg-primary/20">
      {/* Background Gradients & Grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div
          className="absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(34,38,56,0.6) 1px, transparent 1px), linear-gradient(to bottom, rgba(34,38,56,0.6) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
            maskImage:
              "radial-gradient(ellipse 80% 70% at 50% 50%, black 40%, transparent 100%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 80% 70% at 50% 50%, black 40%, transparent 100%)",
          }}
        />
        <div
          className="absolute inset-s-1/2 top-1/3 h-120 w-160 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-25 blur-[120px]"
          style={{
            background:
              "radial-gradient(circle, rgba(99,102,241,0.6), rgba(239,68,68,0.2) 60%, transparent 80%)",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto flex max-w-xl flex-col items-center text-center">
        {/* Error Badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-destructive/30 bg-destructive/10 px-3.5 py-1.5 font-mono text-destructive text-xs backdrop-blur-sm">
          <Bug className="animate-pulse" size={14} />
          <span>{t("common.notFound.badge")}</span>
        </div>

        {/* Big Glitch-style Heading */}
        <h1 className="font-extrabold text-6xl text-heading tracking-tight sm:text-7xl">
          404
        </h1>
        <h2 className="mt-3 font-semibold text-heading text-xl sm:text-2xl">
          {t("common.notFound.title")}
        </h2>

        <p className="mt-3 max-w-md text-muted-foreground text-sm sm:text-base">
          {t("common.notFound.description")}
        </p>

        {/* Terminal / Code Card */}
        <div className="mt-8 w-full overflow-hidden rounded-xl border border-border/80 bg-surface/90 text-left font-mono text-xs shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between border-border border-b bg-inset/50 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/60" />
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Terminal size={12} />
              <span>{t("common.notFound.logfile")}</span>
            </div>
          </div>
          <div className="space-y-1.5 p-4 text-[13px]">
            <p className="text-destructive">
              <span className="text-muted-foreground">&gt;</span>{" "}
              {t("common.notFound.error")}
            </p>
            <p className="text-muted-foreground text-xs">
              {t("common.notFound.stack1")}
            </p>
            <p className="text-muted-foreground text-xs">
              {t("common.notFound.stack2")}
            </p>
            <p className="pt-1 text-emerald-500 text-xs">
              {t("common.notFound.fix")}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            className={buttonVariants({ size: "default", variant: "default" })}
            href="/challenges"
          >
            <Bug size={16} />
            <span>{t("common.notFound.enterChallenges")}</span>
          </Link>
          <Link
            className={buttonVariants({ size: "default", variant: "outline" })}
            href="/"
          >
            <Home size={16} />
            <span>{t("common.notFound.returnHome")}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
