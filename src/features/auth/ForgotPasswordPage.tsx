"use client";

import { ArrowRight, AtSign } from "lucide-react";
import Link from "next/link";
import { useExtracted } from "next-intl";
import { type FormEvent, useState } from "react";
import { Logo } from "@/components/layout/Logo";
import { LanguageSwitcher } from "@/components/preferences/LanguageSwitcher";
import { ThemeToggle } from "@/components/preferences/ThemeToggle";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth/client";

export function ForgotPasswordPage() {
  const t = useExtracted();
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
        <Card className="w-full max-w-md p-2 shadow-2xl shadow-black/30">
          <CardHeader className="space-y-1.5 text-center">
            <h1 className="font-semibold text-2xl text-heading tracking-tight">
              {t("Reset your password")}
            </h1>
            <p className="text-muted-foreground text-sm">
              {t("Enter your email and we'll send a reset link.")}
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
            <form className="space-y-4" noValidate onSubmit={handleSubmit}>
              <div className="space-y-1.5">
                <Label htmlFor="email">{t("Email")}</Label>
                <div className="relative">
                  <AtSign
                    className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    size={15}
                  />
                  <Input
                    autoComplete="email"
                    className="h-10 ps-10 pe-3"
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
                {loading ? "Sending link..." : t("Send reset link")}
                <ArrowRight size={16} />
              </Button>

              {Boolean(sent) && (
                <Alert
                  className="border-primary/30 bg-primary/10 text-primary"
                  variant="default"
                >
                  <AlertDescription>
                    {t("If that account exists, a reset link is on its way.")}
                  </AlertDescription>
                </Alert>
              )}
              {Boolean(error) && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </form>

            <p className="mt-4 text-center text-muted-foreground text-sm">
              {t("Remembered it?")}{" "}
              <Link
                className="font-medium text-primary hover:underline"
                href="/login"
              >
                {t("Back to login")}
              </Link>
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
