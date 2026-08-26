import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, AtSign } from "lucide-react";
import { useLingui } from "@lingui/react";
import { Logo } from "../../components/layout/Sidebar";
import { buttonVariants } from "../../components/ui/Button";
import { ThemeToggle } from "../../components/ThemeToggle";
import { LanguageSwitcher } from "../../components/LanguageSwitcher";
import { authClient } from "../../lib/auth-client";

export default function ForgotPasswordPage() {
  const { i18n } = useLingui();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    const { error } = await authClient.requestPasswordReset({
      email: String(formData.get("email") ?? ""),
      redirectTo: `${window.location.origin}/login`,
    });
    if (error) {
      setError(error.message ?? "Could not send reset link");
      return;
    }
    setSent(true);
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
            <h1 className="text-2xl font-semibold tracking-tight text-heading">{i18n._("Reset your password")}</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">{i18n._("Enter your email and we'll send a reset link.")}</p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-body">{i18n._("Email")}</label>
              <div className="relative">
                <AtSign
                  size={15}
                  className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  className="w-full rounded-md border border-border bg-inset py-2.5 ps-10 pe-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className={buttonVariants({ variant: "primary", size: "lg", className: "w-full" })}
            >{i18n._("Send reset link")}<ArrowRight size={16} />
            </button>

            {sent && (
              <p className="mt-4 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-xs text-primary">
                {i18n._("If that account exists, a reset link is on its way.")}
              </p>
            )}
            {error && (
              <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {i18n._(error)}
              </p>
            )}
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">{i18n._("Remembered it?")} {" "}
            <Link to="/login" className="font-medium text-primary hover:underline">{i18n._("Back to login")}</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
