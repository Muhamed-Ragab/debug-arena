"use client";

import {
  ArrowRight,
  Bot,
  Bug,
  GitBranch,
  Microscope,
  Radar,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Logo } from "@/components/layout/Sidebar";
import { LanguageSwitcher } from "@/components/preferences/LanguageSwitcher";
import { ThemeToggle } from "@/components/preferences/ThemeToggle";
import { buttonVariants } from "@/components/ui/button";
import { SignOutButton } from "@/features/auth/components/SignOutButton";
import { useSession } from "@/lib/auth/client";
import {
  CATEGORY_CONFIG,
  CATEGORY_ORDER,
  type Category,
} from "@/lib/domain/categories";

function HeroBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <div
        className="absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(34,38,56,0.6) 1px, transparent 1px), linear-gradient(to bottom, rgba(34,38,56,0.6) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage:
            "radial-gradient(ellipse 80% 70% at 50% 30%, black 40%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 70% at 50% 30%, black 40%, transparent 100%)",
        }}
      />
      <div
        className="absolute inset-s-1/2 top-[-10%] h-130 w-205 -translate-x-1/2 rounded-full opacity-30 blur-[120px]"
        style={{
          background:
            "radial-gradient(circle, rgba(79,70,229,0.55), transparent 70%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(to bottom, rgba(255,255,255,0.8) 0px, rgba(255,255,255,0.8) 1px, transparent 1px, transparent 3px)",
        }}
      />
    </div>
  );
}

function HeroSnippet() {
  return (
    <div className="relative rounded-xl border border-border bg-inset/80 shadow-2xl shadow-black/40 backdrop-blur-sm">
      <div className="flex items-center gap-2 border-border border-b px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-500/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
        <span className="ms-auto font-mono text-[11px] text-muted-foreground">
          diagnose — checkout.ts
        </span>
      </div>
      <pre className="overflow-x-auto px-4 py-4 font-mono text-[12.5px] leading-relaxed">
        <code>
          <span className="text-primary">$</span>{" "}
          <span className="text-foreground">
            debug-arena diagnose ./src/checkout.ts
          </span>
          {"\n"}
          <span className="text-muted-foreground">›</span>{" "}
          <span className="text-muted-foreground">
            scanning for root cause…
          </span>
          {"\n"}
          <span className="text-destructive">✗</span>{" "}
          <span className="text-destructive">TypeError</span>
          <span className="text-foreground">
            : Cannot read properties of undefined
          </span>
          {"\n"}
          {"  "}
          <span className="text-muted-foreground">at</span>{" "}
          <span className="text-foreground">CartSummary</span>
          <span className="text-muted-foreground"> (checkout.ts:42)</span>
          {"\n"}
          {"  "}
          <span className="text-muted-foreground">at</span>{" "}
          <span className="text-foreground">renderWithHooks</span>
          <span className="text-muted-foreground"> (react-dom:391)</span>
          {"\n\n"}
          <span className="font-semibold text-emerald-400">root cause ›</span>{" "}
          <span className="text-foreground">
            cart read before async fetch resolved
          </span>
          <span className="ms-1 inline-block h-3.5 w-2 translate-y-0.5 animate-pulse bg-primary" />
        </code>
      </pre>
    </div>
  );
}

const FEATURES: Array<{
  category: Category;
  icon: typeof GitBranch;
  title: string;
  body: string;
}> = [
  {
    body: "React rendering, state mutation, race conditions, memory leaks — the bugs that actually page you, not toy algorithms.",
    category: "State Mutations",
    icon: GitBranch,
    title: "Real bug classes",
  },
  {
    body: "The graded deliverable is the diagnosis, not a passing test. You prove you understood the bug, not just that you patched it.",
    category: "Race Conditions",
    icon: Microscope,
    title: "Explain the root cause",
  },
  {
    body: "Your fix runs against hidden tests, then an agent grades the explanation against the canonical root cause.",
    category: "Security Flaws",
    icon: Bot,
    title: "Hidden tests + grading agent",
  },
  {
    body: "A per-category radar shows exactly where you keep getting paged, so practice targets your real gaps.",
    category: "Memory Leaks",
    icon: Radar,
    title: "Weak-spot analytics",
  },
];

function FeatureBlocks() {
  const t = useTranslations();
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {FEATURES.map((f) => {
        const cfg = CATEGORY_CONFIG[f.category];
        const Icon = f.icon;
        return (
          <div
            className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/50"
            key={f.title}
          >
            <div
              className="absolute inset-x-0 top-0 h-px opacity-60"
              style={{
                background: `linear-gradient(90deg, transparent, ${cfg.color}, transparent)`,
              }}
            />
            <div
              className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg border"
              style={{
                backgroundColor: cfg.bg,
                borderColor: cfg.border,
                color: cfg.color,
              }}
            >
              <Icon size={18} />
            </div>
            <h3 className="font-semibold text-[15px] text-heading">
              {t(f.title as string)}
            </h3>
            <p className="mt-1.5 text-muted-foreground text-sm leading-relaxed">
              {t(f.body as string)}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function CategoryChips() {
  const t = useTranslations();
  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORY_ORDER.map((c) => {
        const cfg = CATEGORY_CONFIG[c];
        return (
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium text-[11px]"
            key={c}
            style={{
              backgroundColor: cfg.bg,
              border: `1px solid ${cfg.border}`,
              color: cfg.color,
            }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: cfg.color }}
            />
            {t(cfg.label as string)}
          </span>
        );
      })}
    </div>
  );
}

function SocialProof() {
  const t = useTranslations();
  const STATS = [
    { label: t("landing.stats.bugsDiagnosed"), value: "12k" },
    { label: t("landing.stats.bugClasses"), value: "6" },
    { label: t("landing.stats.hiddenTestGrading"), value: "100%" },
  ];
  return (
    <div className="border-border border-t bg-surface/60">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-8">
        <p className="text-center font-medium text-[11px] text-muted-foreground uppercase tracking-[0.18em]">
          {t("landing.socialProof.trusted")}
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-8 sm:flex-row sm:gap-16">
          {STATS.map((s) => (
            <div className="text-center" key={s.label}>
              <p className="font-mono font-semibold text-2xl text-heading">
                {s.value}
              </p>
              <p className="mt-1 text-muted-foreground text-xs">{s.label}</p>
            </div>
          ))}
        </div>
        <p className="mx-auto mt-10 max-w-2xl text-center text-muted-foreground text-sm leading-relaxed">
          <span>
            “Finally a place to practice the part of the job nobody teaches —
            figuring out why it broke instead of just making it green again.”
          </span>
          <span className="mt-2 block font-mono text-muted-foreground text-xs">
            — @runtime_panic, staff engineer
          </span>
        </p>
      </div>
    </div>
  );
}

export function LandingPage() {
  const t = useTranslations();
  const { data: session } = useSession();

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <header className="sticky top-0 z-30 border-border border-b bg-header backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-8">
          <Logo />
          <nav className="flex items-center gap-2 sm:gap-3">
            <div className="me-4 hidden items-center gap-2 sm:flex">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
            {session?.user ? (
              <>
                <Link
                  className={buttonVariants({ size: "sm", variant: "default" })}
                  href="/challenges"
                >
                  {t("landing.actions.enterArena")}
                </Link>
                <SignOutButton
                  className="text-xs"
                  redirectTo="/"
                  size="sm"
                  variant="ghost"
                />
              </>
            ) : (
              <>
                <Link
                  className={buttonVariants({ size: "sm", variant: "ghost" })}
                  href="/login"
                >
                  {t("auth.actions.logIn")}
                </Link>
                <Link
                  className={buttonVariants({ size: "sm", variant: "default" })}
                  href="/register"
                >
                  {t("auth.actions.signUp")}
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden border-border border-b">
        <HeroBackdrop />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-8 lg:grid-cols-2 lg:py-28">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 font-medium text-[11px] text-muted-foreground">
              <Bug className="text-primary" size={13} />
              {t("landing.hero.badge")}
            </div>
            <h1 className="text-balance font-semibold text-4xl text-heading leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              {t("landing.hero.title")}
            </h1>
            <p className="mt-5 max-w-xl text-pretty text-base text-body leading-relaxed sm:text-lg">
              {t("landing.hero.subtitle")}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                className={buttonVariants({ size: "lg", variant: "default" })}
                href="/challenges"
              >
                {t("landing.actions.startChallenge")}
                <ArrowRight size={16} />
              </Link>
              <Link
                className={buttonVariants({ size: "lg", variant: "outline" })}
                href="/challenges"
              >
                {t("landing.actions.seeGrading")}
              </Link>
            </div>
          </div>
          <HeroSnippet />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-8">
        <div className="mb-10 max-w-2xl">
          <h2 className="font-semibold text-2xl text-heading tracking-tight sm:text-3xl">
            {t("landing.features.sectionTitle")}
          </h2>
          <p className="mt-3 text-muted-foreground text-sm leading-relaxed">
            {t("landing.features.sectionSubtitle")}
          </p>
          <div className="mt-5">
            <CategoryChips />
          </div>
        </div>

        <FeatureBlocks />

        <div className="mt-12 flex flex-col items-center gap-4 rounded-xl border border-border bg-card px-6 py-10 text-center">
          <h3 className="font-semibold text-heading text-lg">
            {t("landing.cta.title")}
          </h3>
          <Link
            className={buttonVariants({ size: "lg", variant: "default" })}
            href="/challenges"
          >
            {t("landing.actions.startChallenge")}
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <SocialProof />

      <footer className="border-border border-t bg-surface/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-muted-foreground text-xs sm:flex-row sm:px-8">
          <Logo />
          <p>
            {t("common.footer.copyright", {
              year: new Date().getFullYear(),
            })}
          </p>
          <div className="flex items-center gap-4">
            <Link
              className="transition-colors hover:text-foreground"
              href="/login"
            >
              {t("auth.actions.logIn")}
            </Link>
            <Link
              className="transition-colors hover:text-foreground"
              href="/register"
            >
              {t("auth.actions.signUp")}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
