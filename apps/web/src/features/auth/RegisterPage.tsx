import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, AtSign, GitBranch, Lock, Mail, User } from "lucide-react";
import { useLingui } from "@lingui/react";
import { Logo } from "../../components/layout/Sidebar";
import { buttonVariants } from "../../components/ui/Button";
import { ThemeToggle } from "../../components/ThemeToggle";
import { LanguageSwitcher } from "../../components/LanguageSwitcher";

export default function RegisterPage() {
  const { i18n } = useLingui();
  const navigate = useNavigate();
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
            <h1 className="text-2xl font-semibold tracking-tight text-heading">{i18n._("Create your arena")}</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">{i18n._("Start diagnosing real-world bugs.")}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button type="button" className={buttonVariants({ variant: "outline", size: "md" })}>
              <GitBranch size={16} />GitHub</button>
            <button type="button" className={buttonVariants({ variant: "outline", size: "md" })}>
              <Mail size={16} />Google</button>
          </div>

          <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            <span className="h-px flex-1 bg-border" />{i18n._("or")}<span className="h-px flex-1 bg-border" />
          </div>

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              navigate("/challenges");
            }}
          >
            <div>
              <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-body">{i18n._("Display name")}</label>
              <div className="relative">
                <User
                  size={15}
                  className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Ada Lovelace"
                  className="w-full rounded-md border border-border bg-inset py-2.5 ps-10 pe-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-body">{i18n._("Email")}</label>
              <div className="relative">
                <AtSign
                  size={15}
                  className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  className="w-full rounded-md border border-border bg-inset py-2.5 ps-10 pe-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-body">{i18n._("Password")}</label>
              <div className="relative">
                <Lock
                  size={15}
                  className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className="w-full rounded-md border border-border bg-inset py-2.5 ps-10 pe-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className={buttonVariants({ variant: "primary", size: "lg", className: "w-full" })}
            >{i18n._("Create account")}<ArrowRight size={16} />
            </button>
          </form>

          <p className="mt-5 text-center text-xs leading-relaxed text-muted-foreground">{i18n._("By creating an account you agree to the terms. We'll never page you at 2am.")}</p>

          <p className="mt-5 text-center text-sm text-muted-foreground">{i18n._("Already have an account?")} {" "}
            <Link to="/login" className="font-medium text-primary hover:underline">{i18n._("Log in")}</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
