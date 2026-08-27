"use client";

import { useLingui } from "@lingui/react";
import { ArrowRight, AtSign, GitBranch, Lock, Mail, User } from "lucide-react";
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
        <Card className="w-full max-w-md p-2 shadow-2xl shadow-black/30">
          <CardHeader className="space-y-1.5 text-center">
            <h1 className="font-semibold text-2xl text-heading tracking-tight">
              {i18n._("Create your arena")}
            </h1>
            <p className="text-muted-foreground text-sm">
              {i18n._("Start diagnosing real-world bugs.")}
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
                <Label htmlFor="name">{i18n._("Display name")}</Label>
                <div className="relative">
                  <User
                    className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    size={15}
                  />
                  <Input
                    autoComplete="name"
                    className="h-10 ps-10 pe-3"
                    id="name"
                    name="name"
                    placeholder="Ada Lovelace"
                    type="text"
                  />
                </div>
              </div>

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
                <Label htmlFor="password">{i18n._("Password")}</Label>
                <div className="relative">
                  <Lock
                    className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    size={15}
                  />
                  <Input
                    autoComplete="new-password"
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
                {loading ? "Creating account..." : i18n._("Create account")}
                <ArrowRight size={16} />
              </Button>
            </form>

            <p className="mt-4 text-center text-muted-foreground text-xs leading-relaxed">
              {i18n._(
                "By creating an account you agree to the terms. We'll never page you at 2am."
              )}
            </p>

            <p className="mt-4 text-center text-muted-foreground text-sm">
              {i18n._("Already have an account?")}{" "}
              <Link
                className="font-medium text-primary hover:underline"
                href="/login"
              >
                {i18n._("Log in")}
              </Link>
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
