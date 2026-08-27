"use client";

import { useLingui } from "@lingui/react";
import { ArrowRight, AtSign, GitBranch, Lock, Mail, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Logo } from "@/components/layout/Sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button, buttonVariants } from "@/components/ui/Button";
import { authClient } from "@/lib/auth/client";

export function RegisterPage() {
  const { i18n } = useLingui();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      const { error: signUpError } = await authClient.signUp.email({
        email: String(formData.get("email") ?? ""),
        name: String(formData.get("name") ?? ""),
        password: String(formData.get("password") ?? ""),
      });
      if (signUpError) {
        setError(signUpError.message ?? "Registration failed");
        return;
      }
      router.push("/challenges");
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background text-foreground">
      <header className="flex h-16 items-center justify-between px-4 sm:px-8">
        <Logo />
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-7 shadow-2xl shadow-black/30">
          <div className="mb-6 text-center">
            <h1 className="font-semibold text-2xl text-heading tracking-tight">
              {i18n._("Create your arena")}
            </h1>
            <p className="mt-1.5 text-muted-foreground text-sm">
              {i18n._("Start diagnosing real-world bugs.")}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              className={buttonVariants({ size: "md", variant: "outline" })}
              onClick={() => {
                authClient.signIn.social({ provider: "github" });
              }}
              type="button"
            >
              <GitBranch size={16} />
              GitHub
            </button>
            <button
              className={buttonVariants({ size: "md", variant: "outline" })}
              onClick={() => {
                authClient.signIn.social({ provider: "google" });
              }}
              type="button"
            >
              <Mail size={16} />
              Google
            </button>
          </div>

          <div className="my-5 flex items-center gap-3 text-[11px] text-muted-foreground uppercase tracking-[0.14em]">
            <span className="h-px flex-1 bg-border" />
            {i18n._("or")}
            <span className="h-px flex-1 bg-border" />
          </div>

          <form className="space-y-4" noValidate onSubmit={handleSubmit}>
            <div>
              <label
                className="mb-1.5 block font-medium text-body text-sm"
                htmlFor="name"
              >
                {i18n._("Display name")}
              </label>
              <div className="relative">
                <User
                  className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  size={15}
                />
                <input
                  autoComplete="name"
                  className="w-full rounded-md border border-border bg-inset py-2.5 ps-10 pe-3 text-foreground text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  id="name"
                  name="name"
                  placeholder="Ada Lovelace"
                  type="text"
                />
              </div>
            </div>

            <div>
              <label
                className="mb-1.5 block font-medium text-body text-sm"
                htmlFor="email"
              >
                {i18n._("Email")}
              </label>
              <div className="relative">
                <AtSign
                  className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  size={15}
                />
                <input
                  autoComplete="email"
                  className="w-full rounded-md border border-border bg-inset py-2.5 ps-10 pe-3 text-foreground text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  id="email"
                  name="email"
                  placeholder="you@company.com"
                  type="email"
                />
              </div>
            </div>

            <div>
              <label
                className="mb-1.5 block font-medium text-body text-sm"
                htmlFor="password"
              >
                {i18n._("Password")}
              </label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  size={15}
                />
                <input
                  autoComplete="new-password"
                  className="w-full rounded-md border border-border bg-inset py-2.5 ps-10 pe-3 text-foreground text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  type="password"
                />
              </div>
            </div>

            {Boolean(error) && (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-destructive text-xs">
                {error}
              </p>
            )}

            <Button
              className="w-full"
              disabled={loading}
              size="lg"
              type="submit"
            >
              {loading ? "Creating account..." : i18n._("Create account")}
              <ArrowRight size={16} />
            </Button>
          </form>

          <p className="mt-5 text-center text-muted-foreground text-xs leading-relaxed">
            {i18n._(
              "By creating an account you agree to the terms. We'll never page you at 2am."
            )}
          </p>

          <p className="mt-5 text-center text-muted-foreground text-sm">
            {i18n._("Already have an account?")}{" "}
            <Link
              className="font-medium text-primary hover:underline"
              href="/login"
            >
              {i18n._("Log in")}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
