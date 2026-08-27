"use client";

import { useLingui } from "@lingui/react";
import { ArrowRight, AtSign } from "lucide-react";
import Link from "next/link";
import { type FormEvent, useState } from "react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Logo } from "@/components/layout/Sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { authClient } from "@/lib/auth/client";

export function ForgotPasswordPage() {
  const { i18n } = useLingui();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      const { error: resetError } = await authClient.requestPasswordReset({
        email: String(formData.get("email") ?? ""),
        redirectTo: `${typeof window === "undefined" ? "" : window.location.origin}/login`,
      });
      if (resetError) {
        setError(resetError.message ?? "Could not send reset link");
        return;
      }
      setSent(true);
    } catch {
      setError("Failed to request password reset.");
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
              {i18n._("Reset your password")}
            </h1>
            <p className="mt-1.5 text-muted-foreground text-sm">
              {i18n._("Enter your email and we'll send a reset link.")}
            </p>
          </div>

          <form className="space-y-4" noValidate onSubmit={handleSubmit}>
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

            <Button
              className="w-full"
              disabled={loading}
              size="lg"
              type="submit"
            >
              {loading ? "Sending link..." : i18n._("Send reset link")}
              <ArrowRight size={16} />
            </Button>

            {Boolean(sent) && (
              <p className="mt-4 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-primary text-xs">
                {i18n._("If that account exists, a reset link is on its way.")}
              </p>
            )}
            {Boolean(error) && (
              <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-destructive text-xs">
                {error}
              </p>
            )}
          </form>

          <p className="mt-6 text-center text-muted-foreground text-sm">
            {i18n._("Remembered it?")}{" "}
            <Link
              className="font-medium text-primary hover:underline"
              href="/login"
            >
              {i18n._("Back to login")}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
