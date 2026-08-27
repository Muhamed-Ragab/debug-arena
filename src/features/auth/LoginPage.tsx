"use client";

import { useLingui } from "@lingui/react";
import { ArrowRight, AtSign, GitBranch, Lock, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { Logo } from "@/components/layout/Sidebar";
import { LanguageSwitcher } from "@/components/preferences/LanguageSwitcher";
import { ThemeToggle } from "@/components/preferences/ThemeToggle";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { authClient } from "@/lib/auth/client";

export function LoginPage() {
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
      const { error: signInError } = await authClient.signIn.email({
        email: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? ""),
      });
      if (signInError) {
        setError(signInError.message ?? "Login failed");
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
        <Card className="w-full max-w-md p-2 shadow-2xl shadow-black/30">
          <CardHeader className="space-y-1.5 text-center">
            <h1 className="font-semibold text-2xl text-heading tracking-tight">
              {i18n._("Welcome back")}
            </h1>
            <p className="text-muted-foreground text-sm">
              {i18n._("Log in to keep diagnosing.")}
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => {
                  authClient.signIn.social({ provider: "github" });
                }}
                size="md"
                variant="outline"
              >
                <GitBranch size={16} />
                GitHub
              </Button>
              <Button
                onClick={() => {
                  authClient.signIn.social({ provider: "google" });
                }}
                size="md"
                variant="outline"
              >
                <Mail size={16} />
                Google
              </Button>
            </div>

            <div className="my-4 flex items-center gap-3 text-[11px] text-muted-foreground uppercase tracking-[0.14em]">
              <Separator className="flex-1" />
              {i18n._("or")}
              <Separator className="flex-1" />
            </div>

            <form className="space-y-4" noValidate onSubmit={handleSubmit}>
              <div className="space-y-1.5">
                <Label htmlFor="email">{i18n._("Email")}</Label>
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

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">{i18n._("Password")}</Label>
                  <Link
                    className="text-muted-foreground text-xs transition-colors hover:text-primary"
                    href="/forgot-password"
                  >
                    {i18n._("Forgot password?")}
                  </Link>
                </div>
                <div className="relative">
                  <Lock
                    className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    size={15}
                  />
                  <Input
                    autoComplete="current-password"
                    className="h-10 ps-10 pe-3"
                    id="password"
                    name="password"
                    placeholder="••••••••"
                    type="password"
                  />
                </div>
              </div>

              {Boolean(error) && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                className="w-full"
                disabled={loading}
                size="lg"
                type="submit"
              >
                {loading ? "Logging in..." : i18n._("Log in")}
                <ArrowRight size={16} />
              </Button>
            </form>

            <p className="mt-4 text-center text-muted-foreground text-sm">
              {i18n._("New here?")}{" "}
              <Link
                className="font-medium text-primary hover:underline"
                href="/register"
              >
                {i18n._("Create an account")}
              </Link>
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
