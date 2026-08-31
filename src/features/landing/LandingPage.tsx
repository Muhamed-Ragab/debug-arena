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
import { useExtracted } from "next-intl";
import { Logo } from "@/components/layout/Logo";
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

const _FEATURES: Array<{
  bodyKey: string;
  category: Category;
  icon: typeof GitBranch;
  titleKey: string;
}> = [
  {
    bodyKey: "landing.features.realBugClasses.body",
    category: "State Mutations",
    icon: GitBranch,
    titleKey: "landing.features.realBugClasses.title",
  },
  {
    bodyKey: "landing.features.explainRootCause.body",
    category: "Race Conditions",
    icon: Microscope,
    titleKey: "landing.features.explainRootCause.title",
  },
  {
    bodyKey: "landing.features.hiddenTests.body",
    category: "Security Flaws",
    icon: Bot,
    titleKey: "landing.features.hiddenTests.title",
  },
  {
    bodyKey: "landing.features.weakSpotAnalytics.body",
    category: "Memory Leaks",
    icon: Radar,
    titleKey: "landing.features.weakSpotAnalytics.title",
  },
];

function FeatureBlocks() {
  const t = useExtracted();
  const features = [
    {
      body: t(
        "React rendering, state mutation, race conditions, memory leaks — the bugs that actually page you, not toy algorithms."
      ),
      category: "State Mutations" as Category,
      icon: GitBranch,
      title: t("Real bug classes"),
    },
    {
      body: t(
        "The graded deliverable is the diagnosis, not a passing test. You prove you understood the bug, not just that you patched it."
      ),
      category: "Race Conditions" as Category,
      icon: Microscope,
      title: t("Explain the root cause"),
    },
    {
      body: t(
        "Your fix runs against hidden tests, then an agent grades the explanation against the canonical root cause."
      ),
      category: "Security Flaws" as Category,
      icon: Bot,
      title: t("Hidden tests + grading agent"),
    },
    {
      body: t(
        "A per-category radar shows exactly where you keep getting paged, so practice targets your real gaps."
      ),
      category: "Memory Leaks" as Category,
      icon: Radar,
      title: t("Weak-spot analytics"),
    },
  ];
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {features.map((f) => {
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
              {f.title}
            </h3>
            <p className="mt-1.5 text-muted-foreground text-sm leading-relaxed">
              {f.body}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function CategoryChips() {
  const t = useExtracted();
  const labels: Record<Category, string> = {
    "Backend Concurrency": t("Backend Concurrency"),
    "Logic Inversions": t("Logic Inversions"),
    "Memory Leaks": t("Memory Leaks"),
    "Off-by-One": t("Off-by-One"),
    "Race Conditions": t("Race Conditions"),
    "React Rendering": t("React Rendering"),
    "Security Flaws": t("Security Flaws"),
    "State Mutations": t("State Mutations"),
  };
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
            {labels[c]}
          </span>
        );
      })}
    </div>
  );
}

function SocialProof() {
  const t = useExtracted();
  const STATS = [
    { label: t("bugs diagnosed"), value: "12k" },
    { label: t("bug classes"), value: "6" },
    { label: t("hidden-test grading"), value: "100%" },
  ];
  return (
    <div className="border-border border-t bg-surface/60">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-8">
        <p className="text-center font-medium text-[11px] text-muted-foreground uppercase tracking-[0.18em]">
          {t("Trusted by engineers who would rather not get paged twice")}
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
  const t = useExtracted();
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
                  {t("Enter Arena")}
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
                  {t("Log in")}
                </Link>
                <Link
                  className={buttonVariants({ size: "sm", variant: "default" })}
                  href="/register"
                >
                  {t("Sign up")}
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
              {t("LeetCode for debugging")}
            </div>
            <h1 className="text-balance font-semibold text-4xl text-heading leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              {t("Debug like it's 2am on call.")}
            </h1>
            <p className="mt-5 max-w-xl text-pretty text-base text-body leading-relaxed sm:text-lg">
              {t(
                "LeetCode for debugging — practice root-cause diagnosis on real-world bugs, not toy algorithms."
              )}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                className={buttonVariants({ size: "lg", variant: "default" })}
                href="/challenges"
              >
                {t("Start a challenge")}
                <ArrowRight size={16} />
              </Link>
              <Link
                className={buttonVariants({ size: "lg", variant: "outline" })}
                href="/challenges"
              >
                {t("See how grading works")}
              </Link>
            </div>
          </div>
          <HeroSnippet />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-8">
        <div className="mb-10 max-w-2xl">
          <h2 className="font-semibold text-2xl text-heading tracking-tight sm:text-3xl">
            {t("Practice the bugs that actually page you.")}
          </h2>
          <p className="mt-3 text-muted-foreground text-sm leading-relaxed">
            {t(
              "Four bug classes, one graded deliverable: the diagnosis. Pick your weak spot and train it."
            )}
          </p>
          <div className="mt-5">
            <CategoryChips />
          </div>
        </div>

        <FeatureBlocks />

        <div className="mt-12 flex flex-col items-center gap-4 rounded-xl border border-border bg-card px-6 py-10 text-center">
          <h3 className="font-semibold text-heading text-lg">
            {t("Ready to find out why it broke?")}
          </h3>
          <Link
            className={buttonVariants({ size: "lg", variant: "default" })}
            href="/challenges"
          >
            {t("Start a challenge")}
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <SocialProof />

      <footer className="border-border border-t bg-surface/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-muted-foreground text-xs sm:flex-row sm:px-8">
          <Logo />
          <p>
            {t("© {year} Debug Arena. Diagnose, don't guess.", {
              year: String(new Date().getFullYear()),
            })}
          </p>
          <div className="flex items-center gap-4">
            <Link
              className="transition-colors hover:text-foreground"
              href="/login"
            >
              {t("Log in")}
            </Link>
            <Link
              className="transition-colors hover:text-foreground"
              href="/register"
            >
              {t("Sign up")}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
