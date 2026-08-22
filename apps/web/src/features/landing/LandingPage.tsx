import { Link } from "react-router-dom";
import {
  ArrowRight,
  Bug,
  Radar,
  Microscope,
  Bot,
  GitBranch,
  Mail,
} from "lucide-react";
import { Logo } from "../../components/layout/Sidebar";
import { buttonVariants } from "../../components/ui/Button";
import { CATEGORY_CONFIG, CATEGORY_ORDER } from "../../lib/categories";
import { useLingui } from "@lingui/react";
import { ThemeToggle } from "../../components/ThemeToggle";
import { LanguageSwitcher } from "../../components/LanguageSwitcher";

function HeroBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
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
        className="absolute start-1/2 top-[-10%] h-[520px] w-[820px] -translate-x-1/2 rounded-full opacity-30 blur-[120px]"
        style={{ background: "radial-gradient(circle, rgba(79,70,229,0.55), transparent 70%)" }}
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
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-danger/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
        <span className="ms-auto font-mono text-[11px] text-muted-foreground">
          diagnose — checkout.ts
        </span>
      </div>
      <pre className="overflow-x-auto px-4 py-4 font-mono text-[12.5px] leading-relaxed">
        <code>
          <span className="text-primary">$</span>{" "}
          <span className="text-foreground">debug-arena diagnose ./src/checkout.ts</span>
          {"\n"}
          <span className="text-muted-foreground">›</span>{" "}
          <span className="text-muted-foreground">scanning for root cause…</span>
          {"\n"}
          <span className="text-danger">✗</span>{" "}
          <span className="text-danger-soft">TypeError</span>
          <span className="text-body">: Cannot read properties of </span>
          <span className="text-body">undefined</span>
          {"\n"}
          {"  "}
          <span className="text-muted-foreground">at</span>{" "}
          <span className="text-foreground">CartSummary</span>
          <span className="text-muted-foreground"> (checkout.ts:</span>
          <span className="text-cat-concurrency">42</span>
          <span className="text-muted-foreground">)</span>
          {"\n"}
          {"  "}
          <span className="text-muted-foreground">at</span>{" "}
          <span className="text-foreground">renderWithHooks</span>
          <span className="text-muted-foreground"> (react-dom:</span>
          <span className="text-cat-react">391</span>
          <span className="text-muted-foreground">)</span>
          {"\n\n"}
          <span className="text-success-strong">root cause ›</span>{" "}
          <span className="text-body">cart read before async fetch resolved</span>
          <span className="ms-1 inline-block h-3.5 w-2 translate-y-0.5 animate-pulse bg-primary" />
        </code>
      </pre>
    </div>
  );
}

const FEATURES = [
  {
    category: "react" as const,
    icon: GitBranch,
    title: "Real bug classes",
    body: "React rendering, backend concurrency, singletons, race conditions — the bugs that actually page you, not toy algorithms.",
  },
  {
    category: "concurrency" as const,
    icon: Microscope,
    title: "Explain the root cause",
    body: "The graded deliverable is the diagnosis, not a passing test. You prove you understood the bug, not just that you patched it.",
  },
  {
    category: "distributed" as const,
    icon: Bot,
    title: "Hidden tests + grading agent",
    body: "Your fix runs against hidden tests, then an agent grades the explanation against the canonical root cause.",
  },
  {
    category: "memory" as const,
    icon: Radar,
    title: "Weak-spot analytics",
    body: "A per-category radar shows exactly where you keep getting paged, so practice targets your real gaps.",
  },
];

function FeatureBlocks() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {FEATURES.map((f) => {
        const cfg = CATEGORY_CONFIG[f.category];
        const Icon = f.icon;
        return (
          <div
            key={f.title}
            className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 transition-colors hover:border-[color:var(--accent)]/50"
            style={{ ["--accent" as string]: cfg.color }}
          >
            <div
              className="absolute inset-x-0 top-0 h-px opacity-60"
              style={{ background: `linear-gradient(90deg, transparent, ${cfg.color}, transparent)` }}
            />
            <div
              className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg border"
              style={{ borderColor: cfg.border, backgroundColor: cfg.bg, color: cfg.color }}
            >
              <Icon size={18} />
            </div>
            <h3 className="text-[15px] font-semibold text-heading">{f.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
          </div>
        );
      })}
    </div>
  );
}

function CategoryChips() {
  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORY_ORDER.map((c) => {
        const cfg = CATEGORY_CONFIG[c];
        return (
          <span
            key={c}
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
            style={{ backgroundColor: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: cfg.color }} />
            {cfg.label}
          </span>
        );
      })}
    </div>
  );
}

function SocialProof() {
  const { i18n } = useLingui();
  const STATS = [
    { value: "12k", label: "bugs diagnosed" },
    { value: "4", label: "bug classes" },
    { value: "100%", label: "hidden-test grading" },
  ];
  return (
    <div className="border-t border-border bg-surface/60">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-8">
        <p className="text-center text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">{i18n._("Trusted by engineers who would rather not get paged twice")}</p>
        <div className="mt-6 flex flex-col items-center justify-center gap-8 sm:flex-row sm:gap-16">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-mono text-2xl font-semibold text-heading">{s.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
        <p className="mx-auto mt-10 max-w-2xl text-center text-sm leading-relaxed text-muted-foreground">
          <span className="text-body">
            “Finally a place to practice the part of the job nobody teaches — figuring out
            why it broke instead of just making it green again.”
          </span>
          <span className="mt-2 block font-mono text-xs text-muted-foreground">
            — @runtime_panic, staff engineer
          </span>
        </p>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const { i18n } = useLingui();
  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-header backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-8">
          <Logo />
          <nav className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex items-center gap-2 me-4">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
            <Link to="/login" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              Log in
            </Link>
            <Link to="/register" className={buttonVariants({ variant: "primary", size: "sm" })}>
              Sign up
            </Link>
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-border">
        <HeroBackdrop />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-8 lg:grid-cols-2 lg:py-28">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-[11px] font-medium text-muted-foreground">
              <Bug size={13} className="text-primary" />
              LeetCode for debugging
            </div>
            <h1 className="text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-heading sm:text-5xl lg:text-6xl">{i18n._("Debug like it's 2am on call.")}</h1>
            <p className="mt-5 max-w-xl text-pretty text-base leading-relaxed text-body sm:text-lg">{i18n._("LeetCode for debugging — practice root-cause diagnosis on real-world bugs, not toy algorithms.")}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/challenges" className={buttonVariants({ variant: "primary", size: "lg" })}>{i18n._("Start a challenge")}<ArrowRight size={16} />
              </Link>
              <Link to="/challenges" className={buttonVariants({ variant: "outline", size: "lg" })}>{i18n._("See how grading works")}</Link>
            </div>
          </div>
          <HeroSnippet />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-8">
        <div className="mb-10 max-w-2xl">
          <h2 className="text-2xl font-semibold tracking-tight text-heading sm:text-3xl">{i18n._("Practice the bugs that actually page you.")}</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{i18n._("Four bug classes, one graded deliverable: the diagnosis. Pick your weak spot and train it.")}</p>
          <div className="mt-5">
            <CategoryChips />
          </div>
        </div>

        <FeatureBlocks />

        <div className="mt-12 flex flex-col items-center gap-4 rounded-xl border border-border bg-card px-6 py-10 text-center">
          <h3 className="text-lg font-semibold text-heading">{i18n._("Ready to find out why it broke?")}</h3>
          <Link to="/challenges" className={buttonVariants({ variant: "primary", size: "lg" })}>{i18n._("Start a challenge")}<ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <SocialProof />

      <footer className="border-t border-border bg-surface/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-xs text-muted-foreground sm:flex-row sm:px-8">
          <Logo />
          <p>© {new Date().getFullYear()} Debug Arena. Diagnose, don't guess.</p>
          <div className="flex items-center gap-4">
            <Link to="/login" className="transition-colors hover:text-foreground">
              Log in
            </Link>
            <Link to="/register" className="transition-colors hover:text-foreground">
              Sign up
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
