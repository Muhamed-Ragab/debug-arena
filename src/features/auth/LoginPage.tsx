"use client";

import { ArrowRight, AtSign, GitBranch, Lock, Mail } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useExtracted } from "next-intl";
import { type FormEvent, useEffect, useState } from "react";
import { Logo } from "@/components/layout/Logo";
import { LanguageSwitcher } from "@/components/preferences/LanguageSwitcher";
import { ThemeToggle } from "@/components/preferences/ThemeToggle";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { authClient } from "@/lib/auth/client";

function getSafeCallbackUrl(callbackUrl: string | null): string | null {
  if (!callbackUrl) {
    return null;
  }
  if (!callbackUrl.startsWith("/") || callbackUrl.startsWith("//")) {
    return null;
  }
  return callbackUrl;
}

export function LoginPage() {
  const t = useExtracted();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = getSafeCallbackUrl(searchParams.get("callbackUrl"));
  const { data: session, isPending } = authClient.useSession();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const lastMethod = authClient.getLastUsedLoginMethod();

  useEffect(() => {
    if (isPending || !session) {
      return;
    }
    const { role } = session.user;
    const target = callbackUrl ?? (role === "admin" ? "/admin" : "/challenges");
    router.replace(target as Route);
  }, [session, isPending, callbackUrl, router]);

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
        if (signInError.code === "PASSWORD_COMPROMISED") {
          setError(
            "This password appeared in a data breach. Please choose another."
          );
        } else {
          setError(signInError.message ?? "Login failed");
        }
        return;
      }
      try {
        const sessionRes = await authClient.getSession();
        const { role: sessionRole } = sessionRes.data?.user ?? {
          role: undefined,
        };
        const target =
          callbackUrl ?? (sessionRole === "admin" ? "/admin" : "/challenges");
        router.push(target as Route);
        router.refresh();
      } catch {
        router.push((callbackUrl ?? "/challenges") as Route);
      }
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
              {t("Welcome back")}
            </h1>
            <p className="text-muted-foreground text-sm">
              {t("Log in to keep diagnosing.")}
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Button
                className="relative"
                onClick={() => {
                  authClient.signIn.social({
                    callbackURL: callbackUrl ?? "/challenges",
                    provider: "github",
                  });
                }}
                size="md"
                variant={
                  authClient.isLastUsedLoginMethod("github")
                    ? "default"
                    : "outline"
                }
              >
                <GitBranch size={16} />
                GitHub
                {lastMethod === "github" && (
                  <Badge className="absolute -inset-e-2 -top-2 text-[10px]">
                    Last used
                  </Badge>
                )}
              </Button>
              <Button
                className="relative"
                onClick={() => {
                  authClient.signIn.social({
                    callbackURL: callbackUrl ?? "/challenges",
                    provider: "google",
                  });
                }}
                size="md"
                variant={
                  authClient.isLastUsedLoginMethod("google")
                    ? "default"
                    : "outline"
                }
              >
                <Mail size={16} />
                Google
                {lastMethod === "google" && (
                  <Badge className="absolute -inset-e-2 -top-2 text-[10px]">
                    Last used
                  </Badge>
                )}
              </Button>
            </div>

            <div className="my-4 flex items-center gap-3 text-[11px] text-muted-foreground uppercase tracking-[0.14em]">
              <Separator className="flex-1" />
              {t("or")}
              <Separator className="flex-1" />
            </div>

            <form className="space-y-4" noValidate onSubmit={handleSubmit}>
              <div className="space-y-1.5">
                <Label htmlFor="email">{t("Email")}</Label>
                <div className="relative">
                  <AtSign
                    className="pointer-events-none absolute inset-s-3 top-1/2 -translate-y-1/2 text-muted-foreground"
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
                  <Label htmlFor="password">{t("Password")}</Label>
                  <Link
                    className="text-muted-foreground text-xs transition-colors hover:text-primary"
                    href="/forgot-password"
                  >
                    {t("Forgot password?")}
                  </Link>
                </div>
                <div className="relative">
                  <Lock
                    className="pointer-events-none absolute inset-s-3 top-1/2 -translate-y-1/2 text-muted-foreground"
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
                className="relative w-full"
                disabled={loading}
                size="lg"
                type="submit"
                variant="default"
              >
                {loading ? "Logging in..." : t("Log in")}
                <ArrowRight size={16} />
                {lastMethod === "email" && (
                  <Badge className="ms-2" variant="secondary">
                    Last used
                  </Badge>
                )}
              </Button>
            </form>

            <p className="mt-4 text-center text-muted-foreground text-sm">
              {t("New here?")}{" "}
              <Link
                className="font-medium text-primary hover:underline"
                href="/register"
              >
                {t("Create an account")}
              </Link>
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
