# Next.js Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the NestJS+Vite monorepo with a single latest Next.js app at repo root that serves the exact existing UI, runs better-auth in-process, and deletes the old workspace structure — docs updated first.

**Architecture:** One Next.js 16 App Router app (`src/`, Turbopack, React Compiler, oxlint/oxfmt). All 10 routes ported flat (no `[locale]` segment). better-auth server mounts at `/api/auth/[...all]`; Drizzle schema folds into `src/db`. i18n keeps the runtime `i18n._()` + JSON-catalog pattern (no macros → no SWC plugin → no Turbopack ABI risk). Protected routes = `proxy.ts` cookie gate + client `ProtectedRoute` fallback inside the `(app)` route group.

**Tech Stack:** Next.js 16.3.x, React 19, TypeScript (scaffold-pinned), Tailwind v4 CSS-first, better-auth ^1.7.x + `@better-auth/drizzle-adapter`, ioredis, Drizzle ORM (pg), @lingui/core+react+cli 6.x, TanStack Query 5, lucide-react, recharts, oxlint, oxfmt, vitest + @testing-library/react.

**Spec:** This plan implements the user request of 2026-08-26 (conversation): scaffold via create-next-app CLI; move all components/pages/config exactly; latest Next with React Compiler and TS in `src/`; oxc tooling; AI instructions for Next; then remove monorepo; rebuild all auth features on better-auth-for-Next (docs checked first); update docs FIRST.

## Global Constraints

- Node ≥ 20.9.0 required by Next 16 (verify `node -v` before scaffolding).
- Latest stable Next.js line: **16.3.x** (16.3.3 as of Aug 2026 security release).
- React Compiler is the **top-level** `reactCompiler: true` key (NOT `experimental.`) + dev dep `babel-plugin-react-compiler`.
- Linter: **oxlint**, formatter: **oxfmt** — no ESLint, no Biome. Scaffold with `--no-linter`.
- TypeScript in `src/` only; import alias `@/*`.
- NEVER use `any` (repo rule); strict types everywhere.
- No `[locale]` URL segments — locale stays in `localStorage("app-lang")`, activated client-side exactly as today.
- No `@lingui/swc-plugin`, no `@lingui/macro` package — current code has zero macro calls.
- better-auth env keys preserved verbatim: `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `REDIS_URL`, `GOOGLE_CLIENT_ID/SECRET`, `GITHUB_CLIENT_ID/SECRET`, `DATABASE_URL`. Drop legacy `JWT_SECRET`, `JWT_EXPIRES_IN`.
- Server auth `basePath` becomes `/api/auth`; client `baseURL` `/api/auth` unchanged.
- DB roles `admin`/`user` remain `.existing()`; connection string unchanged.
- Docker compose services (pgvector pg16 :5432, redis :6379) unchanged.
- Verification order every task end: `pnpm lint` → `pnpm typecheck` → `pnpm test` → `pnpm build`.
- Commit after every task (messages follow repo style: `feat(web): …` / `chore: …`).

---

## Phase A — Docs First

### Task 1: Rewrite AGENTS.md + .env.example for the target architecture

**Files:**
- Modify: `AGENTS.md`
- Modify: `.env.example`
- Modify: `docs/architecture.md` (add "Migration note" header section)
- Create: `docs/superpowers/plans/2026-08-26-nextjs-migration.md` (this file — already done)

**Interfaces:**
- Produces: documentation contract every later task follows (command names `pnpm lint/typecheck/test/build/dev/db:*`, layout table, env keys).

- [ ] **Step 1: Rewrite AGENTS.md**

Replace content with (keep global rules sections intact, replace project sections):

```markdown
# AGENTS.md

## Quick Reference

```bash
pnpm install                # install deps
docker compose up -d        # Postgres (pgvector:pg16) + Redis 7
cp .env.example .env        # fill BETTER_AUTH_SECRET, DATABASE_URL, etc.
pnpm db:generate && pnpm db:migrate  # Drizzle codegen + run migrations
pnpm dev                    # Next.js dev (Turborepo removed)
```

Verification order: `pnpm lint` -> `pnpm typecheck` -> `pnpm test` -> `pnpm build`

## Layout

| Path | Role |
|---|---|
| `src/app/` | App Router routes (public pages + `(app)` protected group) |
| `src/components/ui/` | shadcn-style primitives |
| `src/features/{name}/` | one directory per page/feature |
| `src/lib/auth.ts` | better-auth SERVER instance |
| `src/lib/auth-client.ts` | better-auth React client |
| `src/db/` | Drizzle schema + client (folded from packages/db) |
| `drizzle/` | migrations |
| `src/locales/{en,ar}/` | Lingui catalogs (.po source + compiled .ts) |

## Toolchain

- Next.js 16 App Router, src dir, Turbopack default (dev+build), React Compiler ON (`reactCompiler: true`)
- Formatter `oxfmt`, linter `oxlint` (root `.oxlintrc.json`) — Next runs NO linter during build (`next lint` removed in 16)
- TypeScript: standard `tsc --noEmit` (tsgo dropped for Next compatibility); strict mode on
- Package manager pnpm 9.9.0; Node >= 20.9

## Conventions

- Client Components: add `"use client"` when a file uses hooks/context/window/localStorage/recharts/better-auth hooks. Pure presentational files stay Server Components.
- Routing: react-router is GONE. `Link` from `next/link` (`href=`), `useRouter/usePathname/useParams/useSearchParams` from `next/navigation`.
- Auth guards: `proxy.ts` (cookie presence via `getSessionCookie`) + client `ProtectedRoute` (full session check) in `src/app/(app)/layout.tsx` chain.
- Response envelope `{ success, data, error }` applies to OUR route handlers under `src/app/api/**` (better-auth endpoints return their native shape).
- i18n: Lingui runtime pattern — `useLingui().i18n._("key")`, catalogs `src/locales/{locale}/*.json` loaded by `dynamicActivate`. No macros.
- AI instructions: read bundled version-matched docs at `node_modules/next/dist/docs/` before Next.js API work.
```

- [ ] **Step 2: Update .env.example**

Final contents (remove JWT lines, adjust comments):

```bash
# Database (unchanged)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/debug_arena
# Redis (secondary session storage + future BullMQ)
REDIS_URL=redis://localhost:6379
# better-auth
BETTER_AUTH_SECRET=change-me-32+-random-chars
BETTER_AUTH_URL=http://localhost:3000
# OAuth (both keys of a pair required to enable that provider)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

- [ ] **Step 3: Prepend migration note to docs/architecture.md**

```markdown
> **MIGRATION NOTE (2026-08-26):** The NestJS API and Vite SPA are being replaced by a single
> Next.js 16 app (see docs/superpowers/plans/2026-08-26-nextjs-migration.md). Sections describing
> `apps/api` modules apply to their Next.js equivalents: controllers → route handlers/server actions,
> guards → `auth.api.getSession` + `proxy.ts`, AuthModule mount `/auth` → `/api/auth/[...all]`.
> Data layer (Drizzle/pgvector/RLS), job queue design, sandbox model are unchanged conceptually.
```

- [ ] **Step 4: Verify** — files render correctly; commit:

```bash
git add AGENTS.md .env.example docs/
git commit -m "docs: retarget stack to single Next.js app"
```

---

## Phase B — Scaffold

### Task 2: Scaffold Next.js 16 into repo root (+vitest infra)

**Files:**
- Create (via CLI): root `package.json`, `next.config.ts`, `tsconfig.json`, `postcss.config.mjs`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`, `public/`, `eslint.config` (none — `--no-linter`), `.gitignore` merge
- Create: `vitest.config.ts`, `src/test/setup.ts`
- Modify: `.gitignore`
- Preserve aside: current root `package.json`, `README.md`, `AGENTS.md` (Task 1 output), `.oxfmtrc.json`, `.oxlintrc.json`(api/web copies exist per-app; root gets new)

**Interfaces:**
- Produces: `pnpm dev` boots Next at :3000; scripts `dev/build/start/lint/typecheck/test` defined; alias `@/*` working; `reactCompiler` active.

- [ ] **Step 1: Verify prerequisites**

Run: `node -v`
Expected: v20.9.0 or higher. If lower, stop and upgrade Node first.

- [ ] **Step 2: Stash collision-prone root files**

```bash
Copy-Item package.json package.json.monorepo.bak
Copy-Item README.md README.md.bak
```

(`AGENTS.md` and this plans dir are not touched by CNA because we pass `--no-agents-md`.)

- [ ] **Step 3: Scaffold into temp dir and move up**

```bash
npx create-next-app@latest .next-scaffold-tmp --typescript --app --src-dir --tailwind --react-compiler --turbopack --no-linter --import-alias "@/*" --disable-git --yes
# move everything (incl dotfiles except its .git if any) into repo root:
Get-ChildItem .next-scaffold-tmp -Force | Move-Item -Destination .
Remove-Item .next-scaffold-tmp -Recurse -Force
Remove-Item README.md; Move-Item README.md.bak README.md
```

If `--disable-git` is rejected by the installed CLI version, delete the nested `.git` after move: `Remove-Item .git -Recurse -Force` ONLY if it is the fresh scaffold's (check `git rev-parse --git-dir` still resolves to repo root afterwards; if broken, `git init` is NOT needed — original `.git` was never touched since we stashed nothing there).

- [ ] **Step 4: Merge package.json**

Take the scaffolded `package.json` as base, restore these fields from `package.json.monorepo.bak`: `"name": "debug-arena"`, `"private": true`, pnpm `packageManager` field, and merge scripts (final):

```json
{
  "name": "debug-arena",
  "private": true,
  "packageManager": "pnpm@9.9.0",
  "scripts": {
    "dev": "lingui compile && next dev",
    "build": "lingui compile && next build",
    "start": "next start",
    "lint": "oxlint src",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "tsx src/db/migrate.ts",
    "i18n:extract": "lingui extract --clean",
    "i18n:compile": "lingui compile"
  }
}
```

Then install runtime additions now (auth/db/i18n/data deps — scaffold already added next/react/tailwind):

```bash
pnpm add better-auth@^1.7.1 @better-auth/drizzle-adapter ioredis drizzle-orm pg @lingui/core@^6.6.0 @lingui/react@^6.6.0 @tanstack/react-query@^5 lucide-react recharts
pnpm add -D babel-plugin-react-compiler @lingui/cli@^6.6.0 drizzle-kit tsx oxlint vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom dotenv
```

Delete leftover monorepo scripts later (Task 17); keep `package.json.monorepo.bak` until teardown.

- [ ] **Step 5: Write next.config.ts**

Replace generated config entirely:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  typedRoutes: true,
};

export default nextConfig;
```

(No `rewrites` needed: better-auth lives in-process. If `typedRoutes` fights a dynamic href during later tasks, remove that one line rather than fighting it.)

- [ ] **Step 6: Replace globals.css with the real theme**

Overwrite `src/app/globals.css` with the FULL contents of `apps/web/src/index.css` (fonts `@import url(...Inter...JetBrains Mono...)`, `@import "tailwindcss";`, `@theme {…}` token map, `@custom-variant dark (&:where(.dark, .dark *));`, `:root {…}`, `.dark {…}`, base layer). Copy verbatim — do not trim tokens. Delete scaffold demo styling blocks.

- [ ] **Step 7: Root layout skeleton (will grow in Tasks 4–5)**

`src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Debug Arena",
  description: "Learn debugging by fixing real bugs",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background text-foreground">{children}</body>
    </html>
  );
}
```

(`suppressHydrationWarning` because ThemeContext/i18n mutate `<html>` classes/lang/dir post-hydration.)

- [ ] **Step 8: Vitest infrastructure**

`vitest.config.ts`:

```ts
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    css: false,
  },
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
});
```

`src/test/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => cleanup());
```

`src/app/page.test.tsx` (smoke — proves compiler+tsc+testing stack work together):

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "./page";

describe("Home", () => {
  it("renders scaffold heading", () => {
    render(<Home />);
    expect(screen.getByRole("main")).toBeInTheDocument();
  });
});
```

(If scaffold `page.tsx` lacks `<main>`, assert on `document.body.textContent` containing "Next" instead.)

- [ ] **Step 9: Verify gates**

Run: `pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm dev` (stop dev after boot check)
Expected: lint 0 errors; tsc clean; 1 test pass; `next build` succeeds with React Compiler log line; dev server responds on http://localhost:3000.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js 16 app with react compiler, tailwind v4, vitest"
```

---

### Task 3: Port shared lib + UI primitives

**Files:**
- Move verbatim: `apps/web/src/lib/utils.ts` → `src/lib/utils.ts`; `apps/web/src/lib/types.ts` → `src/lib/types.ts`; `apps/web/src/lib/categories.ts` → `src/lib/categories.ts`
- Move verbatim: `apps/web/src/components/ui/Button.tsx`, `Avatar.tsx`, `RankMedal.tsx`, `DiffBadge.tsx`, `CategoryTag.tsx` → `src/components/ui/`
- Move + edit: `apps/web/src/components/ui/NotificationBell.tsx` → `src/components/ui/NotificationBell.tsx` (add directive)
- Test: `src/components/ui/Button.test.tsx`

**Interfaces:**
- Produces: `cn(...classes: string[]): string`; types `Screen/Category/Difficulty/Challenge`; `CATEGORY_CONFIG`, `DIFFICULTY_CONFIG`; ui primitives exported names unchanged.

- [ ] **Step 1: Copy the 3 lib files and 5 pure ui files byte-for-byte.** Zero edits expected (pure presentational, no router imports).

- [ ] **Step 2: NotificationBell** — prepend `"use client";` as line 1 (uses useState/useRef/useEffect/document listeners). No other edits.

- [ ] **Step 3: Failing test**

`src/components/ui/Button.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "@/components/ui/Button";

describe("Button", () => {
  it("renders children with default variant", () => {
    render(<Button>Launch</Button>);
    expect(screen.getByRole("button", { name: "Launch" })).toBeInTheDocument();
  });
});
```

Run: `pnpm test` → FAIL (file not found) until Step 1 copies land; re-run after copy → PASS.

- [ ] **Step 4: Gates + commit** `feat(web): port shared lib and ui primitives`

---

### Task 4: Theme system + Providers shell

**Files:**
- Move + edit: `apps/web/src/contexts/ThemeContext.tsx` → `src/contexts/ThemeContext.tsx`
- Move + edit: `apps/web/src/components/ThemeToggle.tsx` → `src/components/ThemeToggle.tsx`
- Create: `src/app/providers.tsx`
- Modify: `src/app/layout.tsx`
- Test: `src/contexts/ThemeContext.test.tsx`

**Interfaces:**
- Produces: `<Providers>` wraps whole tree; exports `ThemeProvider({defaultTheme?, storageKey?})`, `useTheme() → {theme, setTheme}`; `Theme = "dark"|"light"|"system"`.

- [ ] **Step 1: ThemeContext.tsx** — prepend `"use client";`. Keep ALL logic identical (localStorage `storageKey` default `"vite-ui-theme"` kept deliberately so existing users' prefs survive).

- [ ] **Step 2: ThemeToggle.tsx** — prepend `"use client";`. No other edits.

- [ ] **Step 3: providers.tsx**

```tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { ThemeProvider } from "@/contexts/ThemeContext";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark">{children}</ThemeProvider>
    </QueryClientProvider>
  );
}
```

(I18nProvider joins in Task 5.)

- [ ] **Step 4: layout.tsx** — wrap `{children}` with `<Providers>`; import it.

- [ ] **Step 5: Failing test**

`src/contexts/ThemeContext.test.tsx`:

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ThemeProvider, useTheme } from "./ThemeContext";

function Probe() {
  const { theme, setTheme } = useTheme();
  return (
    <button onClick={() => setTheme("light")}>{`theme:${theme}`}</button>
  );
}

describe("ThemeContext", () => {
  it("defaults to dark and persists changes", () => {
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.getByText("theme:dark")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button"));
    expect(document.documentElement.classList.contains("light")).toBe(true);
    expect(localStorage.getItem("vite-ui-theme")).toBe("light");
  });
});
```

Run → PASS after Steps 1–4 (write test first to watch it fail on missing module, then implement/copy).

- [ ] **Step 6: Gates + commit** `feat(web): port theme system into providers`

---

### Task 5: i18n system (Lingui runtime pattern)

**Files:**
- Move tree verbatim: `apps/web/src/locales/**` → `src/locales/**` (includes `en.json`, `ar.json`, `en/messages.po|js`, `ar/messages.po|js`)
- Move + edit: `apps/web/src/i18n.ts` → `src/i18n.ts`
- Move + edit: `apps/web/lingui.config.ts` → root `lingui.config.ts`
- Move + edit: `apps/web/src/components/LanguageSwitcher.tsx` → `src/components/LanguageSwitcher.tsx`
- Modify: `src/app/providers.tsx`, `src/app/layout.tsx`, `.gitignore`
- Test: `src/i18n.test.ts`

**Interfaces:**
- Produces: `dynamicActivate(locale: "en"|"ar"): Promise<void>`; `locales` record; `I18nProvider` mounted in Providers; LanguageSwitcher persists `localStorage["app-lang"]`.

- [ ] **Step 1: locales tree copy** — `Get-ChildItem apps/web/src/locales -Recurse | …` copy preserving relative paths into `src/locales`.

- [ ] **Step 2: lingui.config.ts** (root) — change `<rootDir>` occurrences from `apps/web` to repo root:

```ts
import { defineConfig } from "@lingui/cli";

export default defineConfig({
  sourceLocale: "en",
  locales: ["en", "ar"],
  catalogs: [
    {
      path: "<rootDir>/src/locales/{locale}/messages",
      include: ["<rootDir>/src"],
    },
  ],
  format: ["po", { lineNumbers: false }],
});
```

- [ ] **Step 3: i18n.ts** — prepend `"use client";` and fix the catalog import path (one line change):

```ts
"use client";

import { i18n } from "@lingui/core";

export const locales = {
  en: "English",
  ar: "العربية",
};

export async function dynamicActivate(locale: keyof typeof locales): Promise<void> {
  const { messages } = await import(`./locales/${locale}.json`);
  i18n.load(locale, messages);
  i18n.activate(locale);
  document.documentElement.lang = locale;
  document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
  localStorage.setItem("app-lang", locale);
}
```

(Only the import specifier changed vs Vite version — verify against original before overwriting; if original had extra exports, keep them.)

- [ ] **Step 4: LanguageSwitcher.tsx** — prepend `"use client";`; imports of `dynamicActivate` become `@/i18n`. Everything else identical.

- [ ] **Step 5: Providers gain I18nProvider + bootstrap**

Add to `providers.tsx` (inside ThemeProvider, around children):

```tsx
function LocaleBootstrap({ children }: { children: React.ReactNode }) {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem("app-lang");
    const locale = saved === "ar" || saved === "en" ? saved : "en";
    void dynamicActivate(locale).finally(() => setLoaded(true));
  }, []);
  return loaded ? <>{children}</> : null;
}
```

Tree: `<QueryClientProvider><ThemeProvider><I18nProvider i18n={i18n}><LocaleBootstrap>{children}</LocaleBootstrap></I18nProvider></ThemeProvider></QueryClientProvider>`
Imports: `import { i18n } from "@lingui/core";` `import { I18nProvider } from "@lingui/react";` `import { dynamicActivate } from "@/i18n";`
Note: SSR HTML renders English source strings once (catalogs load client-side) — accepted tradeoff matching "move exactly"; documented in architecture note.

- [ ] **Step 6: .gitignore additions**

```
# compiled lingui catalogs (sources .po are committed)
src/locales/*/messages.js
```

Keep `en.json`/`ar.json` committed (runtime imports them directly).

- [ ] **Step 7: Failing test**

`src/i18n.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import en from "./locales/en.json";
import ar from "./locales/ar.json";

describe("catalogs", () => {
  it("ar translates every en key", () => {
    for (const key of Object.keys(en)) {
      expect(ar[key], `missing ar translation: ${key}`).toBeTruthy();
    }
  });
  it("loads and activates a locale", async () => {
    const { dynamicActivate } = await import("./i18n");
    await dynamicActivate("en");
    const { i18n } = await import("@lingui/core");
    expect(i18n.locale).toBe("en");
  });
});
```

(jsdom provides document/localStorage. Run `pnpm i18n:compile` once first so `lingui compile` script doesn't block dev/build on missing compiled artifacts.)
Expected PASS.

- [ ] **Step 8: Gates + commit** `feat(web): port lingui i18n with json catalogs`

---

### Task 6: Fold packages/db into src/db

**Files:**
- Move verbatim: `packages/db/src/schema.ts` → `src/db/schema.ts`; `packages/db/src/client.ts` → `src/db/client.ts`; `packages/db/src/migrate.ts` → `src/db/migrate.ts`
- Move + edit: `packages/db/drizzle.config.ts` → root `drizzle.config.ts`
- Modify: root `tsconfig.json` (ensure `resolveJsonModule: true` survives), `.env.example` untouched (Task 1 done)
- Test: `src/db/request-claims.test.ts` (comes with Task 7 helper — placeholder none; see Task 7)

**Interfaces:**
- Produces: `db` (Drizzle node-postgres instance), `schema` barrel, runnable `pnpm db:generate` / `pnpm db:migrate`.

- [ ] **Step 1: Copy the three files.** In `client.ts` fix relative imports if they pointed at sibling package paths (they were intra-package: `./schema` — unchanged).

- [ ] **Step 2: drizzle.config.ts** (root):

```ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/debug_arena" },
});
```

Move existing `packages/db/drizzle/*.sql` folder → root `drizzle/`.

- [ ] **Step 3: Migrations still apply** — Run `docker compose up -d` then `pnpm db:migrate`
Expected: migrations apply cleanly (same DATABASE_URL as before; tables already exist from prior runs → migrate runner records/upgrades gracefully; if it errors on existing tables, run against fresh db name to validate, then revert).

- [ ] **Step 4: Gates + commit** `chore(db): fold drizzle schema into next app`

---

## Phase C — Auth (server → client → guards)

### Task 7: better-auth server instance + Redis storage + handler

**Files:**
- Create: `src/lib/env.ts`, `src/lib/redis.ts`, `src/lib/social-providers.ts`, `src/lib/auth.ts`
- Create: `src/app/api/auth/[...all]/route.ts`
- Create: `src/db/request-claims.ts`
- Modify: `.env` local only (never committed)
- Test: `src/lib/social-providers.test.ts`, `src/db/request-claims.test.ts`

**Interfaces:**
- Produces: `auth` (betterAuth instance), `getRedis(): ioredis`, `buildSocialProviders(env): Record<string,{clientId;clientSecret}>`, `withRequestClaims<T>(userId, role, fn)`, route `POST/GET /api/auth/*`.

- [ ] **Step 1: src/lib/env.ts**

```ts
import { config as loadEnv } from "dotenv";

loadEnv(); // loads ./.env — mirrors old apps/api/src/env.ts dual-load intent

export interface OAuthCredentials {
  clientId: string;
  clientSecret: string;
}
```

- [ ] **Step 2: src/lib/redis.ts** — globalThis singleton (Next hot-reload safe):

```ts
import { Redis } from "ioredis";

const globalForRedis = globalThis as unknown as { redis?: Redis };

export function getRedis(): Redis {
  if (!globalForRedis.redis) {
    globalForRedis.redis = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
      maxRetriesPerRequest: 20,
    });
  }
  return globalForRedis.redis;
}
```

- [ ] **Step 3: src/lib/social-providers.ts** — port of old conditional builder:

```ts
import type { OAuthCredentials } from "./env";

export function buildSocialProviders(env: NodeJS.ProcessEnv): Record<string, OAuthCredentials> {
  const providers: Record<string, OAuthCredentials> = {};
  if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
    providers.google = { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET };
  }
  if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) {
    providers.github = { clientId: env.GITHUB_CLIENT_ID, clientSecret: env.GITHUB_CLIENT_SECRET };
  }
  return providers;
}
```

Test `src/lib/social-providers.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildSocialProviders } from "./social-providers";

describe("buildSocialProviders", () => {
  it("omits provider when either credential missing", () => {
    expect(buildSocialProviders({ GOOGLE_CLIENT_ID: "id" })).toEqual({});
  });
  it("includes google+github when both pairs present", () => {
    const result = buildSocialProviders({
      GOOGLE_CLIENT_ID: "g-id", GOOGLE_CLIENT_SECRET: "g-s",
      GITHUB_CLIENT_ID: "h-id", GITHUB_CLIENT_SECRET: "h-s",
    });
    expect(Object.keys(result)).toEqual(["google", "github"]);
  });
});
```

- [ ] **Step 4: src/db/request-claims.ts** — port RLS primitive (SET LOCAL semantics preserved):

```ts
import { sql } from "drizzle-orm";
import { db } from "./client";

type TransactionFn = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Runs `fn` inside a transaction whose GUC `request.jwt.claim.sub` equals userId.
 * SET LOCAL scope dies with the transaction — pooled connections cannot leak identity.
 * NOTE: role switching (connect AS user/admin role) is NOT implemented here — same gap as
 * the previous NestJS codebase; policies currently rely on the sub claim only.
 */
export async function withRequestClaims<T>(
  userId: string,
  role: string | null,
  fn: (tx: TransactionFn) => Promise<T>,
): Promise<T> {
  void role; // reserved: future policies may add request.jwt.claim.role
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT set_config('request.jwt.claim.sub', ${userId}, true)`);
    return fn(tx);
  });
}
```

Test `src/db/request-claims.test.ts` (skips without DATABASE_URL — CI-safe):

```ts
import { describe, expect, it } from "vitest";
import { withRequestClaims } from "./request-claims";
import { db } from "./client";
import { sql } from "drizzle-orm";

const hasDb = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDb)("withRequestClaims", () => {
  it("exposes the sub claim inside the transaction", async () => {
    const seen = await withRequestClaims("00000000-0000-0000-0000-000000000001", null, async (tx) => {
      const res = await tx.execute(sql`SELECT current_setting('request.jwt.claim.sub') AS sub`);
      return (res.rows[0] as { sub: string }).sub;
    });
    expect(seen).toBe("00000000-0000-0000-0000-000000000001");
  });
});
```

- [ ] **Step 5: src/lib/auth.ts** — full server instance (parity with old `apps/api/src/common/auth/auth.ts`, adapted per current better-auth v1.7 docs):

```ts
import { betterAuth, type SecondaryStorage } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { nextCookies } from "better-auth/next-js";
import "./lib/env"; // side-effect: load .env before options evaluate
import { db, getRedis } from "@/db/client";
import * as schema from "@/db/schema";
import { buildSocialProviders } from "./social-providers";

const redis = getRedis();

const redisSecondaryStorage: SecondaryStorage = {
  get: (key) => redis.get(key),
  getAndDelete: (key) => redis.getdel(key),
  set: async (key, value, ttl) => {
    if (ttl) await redis.set(key, value, "EX", ttl);
    else await redis.set(key, value);
  },
  delete: async (key) => {
    await redis.del(key);
  },
  increment: async (key, ttl) => {
    const value = await redis.incr(key);
    if (value === 1) await redis.expire(key, ttl);
    return value;
  },
};

export const auth = betterAuth({
  basePath: "/api/auth",
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: process.env.BETTER_AUTH_URL ? [process.env.BETTER_AUTH_URL] : ["http://localhost:3000"],
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url }) => {
      // SMTP lands later; parity with old behavior is console delivery
      console.log(`[auth] password reset link for ${user.email}: ${url}`);
    },
  },
  secondaryStorage: redisSecondaryStorage,
  verification: {
    storeIdentifier: "hashed",
    storeInDatabase: false,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
    storeSessionInDatabase: false,
  },
  advanced: {
    database: {
      generateId: () => crypto.randomUUID(),
    },
  },
  user: {
    additionalFields: {
      role: { type: "string", input: false },
    },
  },
  socialProviders: buildSocialProviders(process.env),
  plugins: [nextCookies()], // must be LAST
});

export type Session = typeof auth.$Infer.Session;
```

Parity deltas vs old config (intentional): basePath `/auth`→`/api/auth`; trustedOrigins 5173→3000; everything else identical. Old code had no rateLimit — leave unset (flagged for future).

- [ ] **Step 6: Route handler** `src/app/api/auth/[...all]/route.ts`:

```ts
import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";

export const { GET, POST } = toNextJsHandler(auth);
```

- [ ] **Step 7: Manual smoke** — `docker compose up -d`, `pnpm dev`, then:
Run: `curl -i -X POST http://localhost:3000/api/auth/sign-up/email -H "content-type: application/json" -d '{"name":"T","email":"t@t.dev","password":"supersecret123"}'`
Expected: 200 with user JSON; second call with same email → 422. `redis-cli keys 'better-auth*'` shows session keys.

- [ ] **Step 8: Gates + commit** `feat(auth): better-auth server instance with redis storage`

---

### Task 8: auth-client, proxy guard, ProtectedRoute, (app) layout skeleton

**Files:**
- Create: `src/lib/auth-client.ts`
- Create: `src/proxy.ts`
- Move + edit: `apps/web/src/components/ProtectedRoute.tsx` → `src/components/ProtectedRoute.tsx`
- Create: `src/app/(app)/layout.tsx`, `src/context/AppShellContext.ts`
- Test: `src/components/ProtectedRoute.test.tsx`

**Interfaces:**
- Produces: `authClient` (+ `signIn`,`signUp`,`useSession`,`signOut` re-exports); proxy matcher guarding `(app)` paths; `AppShellContext { onMenuClick: () => void }` provided by `(app)/layout.tsx`; `ProtectedRoute` renders children when authed.

- [ ] **Step 1: src/lib/auth-client.ts**

```ts
import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import type { auth } from "./auth";

export const authClient = createAuthClient({
  baseURL: "/api/auth",
  plugins: [inferAdditionalFields<typeof auth>()],
});

export const { signIn, signUp, signOut, useSession } = authClient;
```

(type-only server import — erased at runtime, official pattern.)

- [ ] **Step 2: src/proxy.ts** (Next 16 renamed middleware→proxy; cookie-presence gate only — never trust it alone):

```ts
import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED = [/^\/challenges(\/|$)/, /^\/submissions(\/|$)/, /^\/profile$/, /^\/settings$/, /^\/leaderboard$/];

export function proxy(request: NextRequest) {
  const isProtected = PROTECTED.some((re) => re.test(request.nextUrl.pathname));
  if (!isProtected) return NextResponse.next();
  const hasSession = getSessionCookie(request);
  if (!hasSession) {
    const login = new URL("/login", request.url);
    login.searchParams.set("from", request.nextUrl.pathname);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/challenges/:path*", "/submissions/:path*", "/profile", "/settings", "/leaderboard"],
};
```

- [ ] **Step 3: AppShellContext**

`src/context/AppShellContext.ts`:

```ts
import { createContext, useContext } from "react";

export interface AppShellContextValue {
  onMenuClick: () => void;
}

export const AppShellContext = createContext<AppShellContextValue>({ onMenuClick: () => {} });

export function useAppShell(): AppShellContextValue {
  return useContext(AppShellContext);
}
```

(Replaces react-router `useOutletContext` — consumers edited in Tasks 10–15: `useOutletContext<AppShellContext>()` → `useAppShell()`.)

- [ ] **Step 4: ProtectedRoute.tsx** — ported:

```tsx
"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useSession } from "@/lib/auth-client";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { data, isPending } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isPending && !data) {
      router.replace(`/login?from=${encodeURIComponent(pathname)}`);
    }
  }, [isPending, data, router, pathname]);

  if (isPending) return null;
  if (!data) return null;
  return <>{children}</>;
}
```

(Behavior parity: pending→null; unauthenticated→redirect to /login carrying origin path; now also renders children inline instead of `<Outlet/>`.)

Test `src/components/ProtectedRoute.test.tsx` (mock module):

```tsx
import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: push }),
  usePathname: () => "/profile",
}));
const sessionState = { data: undefined as unknown, isPending: false };
vi.mock("@/lib/auth-client", () => ({
  useSession: () => sessionState,
}));

describe("ProtectedRoute", () => {
  beforeEach(() => {
    push.mockClear();
    sessionState.data = undefined;
    sessionState.isPending = false;
  });

  it("renders nothing while pending", async () => {
    sessionState.isPending = true;
    const { default: ProtectedRoute } = await import("./ProtectedRoute");
    const { container } = render(<ProtectedRoute>secret</ProtectedRoute>);
    expect(container).toBeEmptyDOMElement();
    expect(push).not.toHaveBeenCalled();
  });

  it("redirects to login when unauthenticated", async () => {
    const { default: ProtectedRoute } = await import("./ProtectedRoute");
    const { container } = render(<ProtectedRoute>secret</ProtectedRoute>);
    expect(container).toBeEmptyDOMElement();
    expect(push).toHaveBeenCalledWith("/login?from=%2Fprofile");
  });

  it("renders children when authenticated", async () => {
    sessionState.data = { user: { id: "u1" }, session: {} };
    const { default: ProtectedRoute } = await import("./ProtectedRoute");
    const { findByText } = render(<ProtectedRoute>secret</ProtectedRoute>);
    expect(await findByText("secret")).toBeInTheDocument();
  });
});
```

- [ ] **Step 5: (app) group layout skeleton** `src/app/(app)/layout.tsx` (shell chrome arrives Task 10; guard + context live NOW so pages can land progressively):

```tsx
"use client";

import { useState, type ReactNode } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AppShellContext } from "@/context/AppShellContext";

export default function AppGroupLayout({ children }: { children: ReactNode }) {
  const [menuTick, setMenuTick] = useState(0);
  return (
    <ProtectedRoute>
      <AppShellContext.Provider value={{ onMenuClick: () => setMenuTick((t) => t + 1) }}>
        {/* TODO(Task 10): <AppShell menuOpen={...}> wrapper replaces this fragment */}
        <div data-menu-tick={menuTick}>{children}</div>
      </AppShellContext.Provider>
    </ProtectedRoute>
  );
}
```

- [ ] **Step 6: Gates + commit** `feat(auth): client sdk, proxy guard, protected layout group`

---

### Task 9: Public pages — landing + login/register/forgot/reset (fully wired)

**Files:**
- Move + edit: `LandingPage.tsx` → `src/features/landing/LandingPage.tsx`; becomes `src/app/page.tsx`
- Move + edit: `LoginPage.tsx`, `RegisterPage.tsx`, `ForgotPasswordPage.tsx` → same feature dirs; become `src/app/login/page.tsx`, `src/app/register/page.tsx`, `src/app/forgot-password/page.tsx`
- Create NEW: `src/features/auth/ResetPasswordPage.tsx` + `src/app/reset-password/page.tsx`
- Test: `src/app/reset-password/page.test.tsx`

**Interfaces:**
- Consumes: `authClient.signIn/signUp`, `useLingui`, ui Button.
- Produces: routes `/`, `/login`, `/register`, `/forgot-password`, `/reset-password` public; reset flow completes with `?token=`.

Universal edits applied to EVERY moved page/component in this task (and all remaining tasks):
1. Add `"use client";` where classified client (all four auth pages + LandingPage: yes).
2. `import Link from "react-router-dom"` → `import Link from "next/link"`; prop `to=` → `href=`.
3. `const navigate = useNavigate()` → `const router = useRouter()` (from `next/navigation`); each `navigate("/x")` → `router.push("/x")`.
4. Remove any `react-router-dom` import line remnants.

- [ ] **Step 1: Port LandingPage.** Body unchanged beyond universal edits (uses Link→`/login`,`/register`, buttonVariants, ThemeToggle, LanguageSwitcher, Logo inline). `src/app/page.tsx`:

```tsx
"use client";

import LandingPage from "@/features/landing/LandingPage";

export default function Page() {
  return <LandingPage />;
}
```

- [ ] **Step 2: Port LoginPage.** After success: `router.push("/challenges")`. Social buttons: `authClient.signIn.social({ provider: "github", callbackURL: "/challenges" })` (same for google). Read `?from=` to return users:

```tsx
const searchParams = useSearchParams();
// after successful signIn.email without error:
router.push(searchParams.get("from") ?? "/challenges");
```

(add `useSearchParams` to the `next/navigation` import).

- [ ] **Step 3: Port RegisterPage** — success → `router.push("/challenges")`. Fields `name,email,password` unchanged.

- [ ] **Step 4: Port ForgotPasswordPage** — ONE deliberate behavior change: `redirectTo` now targets the new reset page:

```tsx
redirectTo: `${window.location.origin}/reset-password`,
```

(old value `${origin}/login` stranded the token).

- [ ] **Step 5: NEW ResetPasswordPage** `src/features/auth/ResetPasswordPage.tsx`:

```tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useLingui } from "@lingui/react";
import { Button } from "@/components/ui/Button";
import { authClient } from "@/lib/auth-client";

export default function ResetPasswordPage() {
  const { i18n } = useLingui();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const confirm = String(formData.get("confirm") ?? "");
    if (password !== confirm) {
      setError(i18n._("Passwords do not match"));
      return;
    }
    const token = searchParams.get("token");
    if (!token) {
      setError(i18n._("Missing reset token"));
      return;
    }
    const { error: authError } = await authClient.resetPassword({ newPassword: password, token });
    if (authError) {
      setError(authError.message ?? i18n._("Could not reset password"));
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/login"), 1500);
  }

  if (done) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p>{i18n._("Password updated. Redirecting to login…")}</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-heading text-xl font-semibold">{i18n._("Set a new password")}</h1>
        <input name="password" type="password" required minLength={8} placeholder={i18n._("New password")} className="w-full" />
        <input name="confirm" type="password" required minLength={8} placeholder={i18n._("Confirm new password")} className="w-full" />
        {error ? <p className="text-danger border border-danger rounded p-2 text-sm">{error}</p> : null}
        <Button type="submit" className="w-full">{i18n._("Update password")}</Button>
      </form>
    </main>
  );
}
```

`src/app/reset-password/page.tsx` wraps it (Suspense boundary REQUIRED for useSearchParams):

```tsx
import { Suspense } from "react";
import ResetPasswordPage from "@/features/auth/ResetPasswordPage";

export default function Page() {
  return (
    <Suspense>
      <ResetPasswordPage />
    </Suspense>
  );
}
```

Login/Register/Forgot pages get identical `page.tsx` wrappers (Suspense included wherever `useSearchParams` used).

Test `src/app/reset-password/page.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams("token=tok"),
}));

describe("ResetPasswordPage", () => {
  it("renders both password fields", async () => {
    const { default: Page } = await import(".");
    render(
      <Suspense fallback={null}>
        <Page />
      </Suspense>,
    );
    expect(await screen.findByPlaceholderText("New password")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Confirm new password")).toBeInTheDocument();
  });
});
```

(import `Suspense` from react at top.)

- [ ] **Step 6: Manual flow check** — dev server: register→logout→forgot-password→console shows link→open `/reset-password?token=…`→update→login. Expected: all succeed.

- [ ] **Step 7: Gates + commit** `feat(auth): port public auth pages, add reset-password flow`

---

## Phase D — App shell + feature pages (all inside `src/app/(app)/`)

### Task 10: AppShell / Sidebar / TopBar

**Files:**
- Move + edit: `AppShell.tsx`, `Sidebar.tsx`, `TopBar.tsx` → `src/components/layout/`
- Modify: `src/app/(app)/layout.tsx` (real shell replaces skeleton)
- Test: `src/components/layout/Sidebar.test.tsx`

Edits:
- All three: `"use client";` + drop react-router imports.
- Sidebar: `NavLink` → `next/link Link`; compute active via `const pathname = usePathname();` and compare (`pathname === item.href` or startsWith for nested). Keep exact classNames/logic otherwise.
- TopBar: unchanged besides directive + `Crumb` type export retained.
- AppShell: remove `Outlet`; accept `{children}`; KEEP its internal mobile-menu state and provide context:

```tsx
export default function AppShell({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <AppShellContext.Provider value={{ onMenuClick: () => setMenuOpen((o) => !o) }}>
      {/* existing markup: sidebar/topbar/main */}
      <main className="…existing classes…">{children}</main>
    </AppShellContext.Provider>
  );
}
```

- `(app)/layout.tsx` final form:

```tsx
"use client";

import type { ReactNode } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/layout/AppShell";

export default function AppGroupLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <AppShell>{children}</AppShell>
    </ProtectedRoute>
  );
}
```

(deletes the Task-8 skeleton fragment incl. `menuTick`.)

Sidebar test (active-state logic):

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

let pathnameValue = "/leaderboard";
vi.mock("next/navigation", () => ({ usePathname: () => pathnameValue }));

describe("Sidebar", () => {
  it("marks the active nav item", async () => {
    const { default: Sidebar } = await import("./Sidebar");
    render(<Sidebar />);
    const active = screen.getAllByRole("link").find((el) => el.getAttribute("aria-current") === "page");
    expect(active?.getAttribute("href")).toBe("/leaderboard");
  });
});
```

(Adapt assertion if Sidebar uses class-based active state instead of aria-current — inspect moved file first; test asserts whatever marker exists.)

Commit: `feat(web): port app shell navigation`

---

### Task 11: Challenge browser page

**Files:**
- Move: `features/browser/**` → `src/features/browser/**` (page, ChallengeBrowser, ChallengeCard, ChallengeFilters, hooks/useChallengeFilters, plus mock data if separate)
- Create: `src/app/(app)/challenges/page.tsx`

Edits: ChallengeBrowser `"use client";` + `useOutletContext<AppShellContext>()` → `useAppShell()` (import `@/context/AppShellContext`). ChallengeCard: Link swap. ChallengeFilters: verbatim (presentational). `useChallengeFilters.ts` is dead code today — DELETE it (note in commit body). Page wrapper:

```tsx
import ChallengeBrowser from "@/features/browser/components/ChallengeBrowser";

export default function Page() {
  return <ChallengeBrowser />;
}
```

Verify: dev → `/challenges` redirects anonymous→login; authed shows grid, filters work, pagination slices 6.
Commit: `feat(web): port challenge browser`

---

### Task 12: Challenge detail page

**Files:**
- Move: `features/challenge/**` (types, lib/tokenize, data/challenges, hooks/useChallenge, hooks/useChallengeWorkspace, components/*) → `src/features/challenge/**`
- Create: `src/app/(app)/challenges/[id]/page.tsx`

Edits:
- `useChallengeWorkspace.ts`, `ChallengeScreen.tsx`: `"use client";`
- Presentational panels (Scenario/CodeViewer/FileTree/Tabs/Hints/Fix/Explain/SubmitBar): verbatim, NO directive (server-capable, rendered under client parent).
- `ChallengePage.tsx` rewrite as the route page (params now a Promise in RSC):

```tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import ChallengeScreen from "@/features/challenge/components/ChallengeScreen";
import { useChallenge } from "@/features/challenge/hooks/useChallenge";

export default function ChallengePage() {
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const challenge = useChallenge(id);
  const router = useRouter();

  if (!challenge) {
    return <p className="p-8">Challenge not found.</p>;
  }
  return (
    <ChallengeScreen
      challenge={challenge}
      onSubmit={() => router.push(`/submissions/${challenge.id}/results`)}
    />
  );
}
```

Place at `src/app/(app)/challenges/[id]/page.tsx`. Verify: `/challenges/react-hook-dependencies` (any seeded id from CHALLENGES) renders tabs/editor; submit navigates.
Commit: `feat(web): port challenge workspace`

---

### Task 13: Results page

**Files:**
- Move: `features/results/**` → `src/features/results/**`
- Create: `src/app/(app)/submissions/[id]/results/page.tsx`

Edits: ResultsPage `"use client";` + useRouter; ResultsScreen & parts verbatim. Page:

```tsx
"use client";

import ResultsScreen from "@/features/results/components/ResultsScreen";

export default function ResultsPage() {
  return <ResultsScreen onNext={() => history.back()} />;
}
```

Hmm — original was `onNext={() => navigate("/")}`. Preserve behavior exactly:

```tsx
"use client";

import { useRouter } from "next/navigation";
import ResultsScreen from "@/features/results/components/ResultsScreen";

export default function ResultsPage() {
  const router = useRouter();
  return <ResultsScreen onNext={() => router.push("/")} />;
}
```

(`id` param intentionally unused — mock data, matches original.) Commit: `feat(web): port results screen`

---

### Task 14: Profile + settings pages (recharts clients)

**Files:**
- Move: `features/profile/**` → `src/features/profile/**`
- Create: `src/app/(app)/profile/page.tsx`, `src/app/(app)/settings/page.tsx`

Edits: ProfileSettingsPage/ProfileScreen/EditProfileForm/SessionManager/LinkedAccounts/DangerZone: `"use client";` + `useOutletContext` → `useAppShell()`. Charts (`SolvedByDifficultyChart`, `CategoryStrengthChart`): `"use client";` (ResponsiveContainer DOM measurement). Stats/RecentSubmissions/data/types: verbatim. ProfilePage thin wrapper → page.tsx re-export. SessionManager keeps mock wiring THIS task (real rewiring is Task 16 — do not half-wire here). Verify charts render at `/profile`, settings tabs switch. Commit: `feat(web): port profile and settings screens`

---

### Task 15: Leaderboard page

**Files:**
- Move: `features/leaderboard/**` → `src/features/leaderboard/**`
- Create: `src/app/(app)/leaderboard/page.tsx`

Edits: LeaderboardScreen `"use client";` + useAppShell; useLeaderboard client hook stays; Table/TopThree/Tabs verbatim; page thin wrapper. Commit: `feat(web): port leaderboard`

---

### Task 16: Complete auth features — REAL SessionManager + ChangePassword

**Files:**
- Rewrite: `src/features/profile/components/SessionManager.tsx` (replace mock)
- Create: `src/features/profile/components/ChangePasswordForm.tsx`
- Modify: `src/features/profile/ProfileSettingsPage.tsx` (mount ChangePasswordForm above SessionManager in sessions/security tab)
- Delete: mock `SESSIONS` usage from `data/settings.ts` (keep LINKED_ACCOUNTS etc.)
- Test: `src/features/profile/components/SessionManager.test.tsx`

**Interfaces:**
- Consumes: `authClient.listSessions(): Promise<{data?: Array<{session:{token,ipAddress,userAgent,createdAt,expiresAt}}>} >`, `revokeSession({token})`, `revokeOtherSessions()`, `changePassword({currentPassword,newPassword,revokeOtherSessions})`, `signOut()`.

- [ ] **Step 1: Real SessionManager**

```tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { useLingui } from "@lingui/react";
import { Button } from "@/components/ui/Button";
import { SignOutButton } from "@/features/auth/components/SignOutButton";
import { authClient } from "@/lib/auth-client";

interface UserSessionRow {
  session: {
    token: string;
    ipAddress: string | null;
    userAgent: string | null;
    createdAt: Date;
    expiresAt: Date;
  };
}

function parseDevice(userAgent: string | null): string {
  if (!userAgent) return "Unknown device";
  if (/mobile/i.test(userAgent)) return "Mobile";
  if (/tablet|ipad/i.test(userAgent)) return "Tablet";
  return "Desktop";
}

export function SessionManager() {
  const { i18n } = useLingui();
  const [sessions, setSessions] = useState<UserSessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error: listError } = await authClient.listSessions();
    if (listError) setError(listError.message ?? i18n._("Failed to load sessions"));
    else setSessions(data ?? []);
    setLoading(false);
  }, [i18n]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function revoke(token: string) {
    const { error: revokeError } = await authClient.revokeSession({ token });
    if (revokeError) setError(revokeError.message ?? i18n._("Failed to revoke session"));
    else await refresh();
  }

  async function revokeOthers() {
    const { error: revokeError } = await authClient.revokeOtherSessions();
    if (revokeError) setError(revokeError.message ?? i18n._("Failed to revoke sessions"));
    else await refresh();
  }

  if (loading) return <p>{i18n._("Loading sessions…")}</p>;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-heading font-semibold">{i18n._("Active sessions")}</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void revokeOthers()}>
            {i18n._("Sign out other sessions")}
          </Button>
          <SignOutButton />
        </div>
      </div>
      {error ? <p className="text-danger text-sm">{error}</p> : null}
      <ul className="divide-y">
        {sessions.map(({ session }) => (
          <li key={session.token} className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium">{parseDevice(session.userAgent)}</p>
              <p className="text-muted-foreground text-xs">
                {session.ipAddress ?? "unknown ip"} · {new Date(session.createdAt).toLocaleString()}
              </p>
            </div>
            <Button variant="ghost" onClick={() => void revoke(session.token)}>
              {i18n._("Revoke")}
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

(SignOutButton: ensure it does `await authClient.signOut(); router.push("/login");` — port from Task 8-era moves.)

- [ ] **Step 2: ChangePasswordForm**

```tsx
"use client";

import { useState } from "react";
import { useLingui } from "@lingui/react";
import { Button } from "@/components/ui/Button";
import { authClient } from "@/lib/auth-client";

export function ChangePasswordForm() {
  const { i18n } = useLingui();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(false);
    const formData = new FormData(event.currentTarget);
    const { error: changeError } = await authClient.changePassword({
      currentPassword: String(formData.get("current") ?? ""),
      newPassword: String(formData.get("next") ?? ""),
      revokeOtherSessions: true,
    });
    if (changeError) {
      setError(changeError.message ?? i18n._("Could not change password"));
      return;
    }
    setSuccess(true);
    event.currentTarget.reset();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <h2 className="text-heading font-semibold">{i18n._("Change password")}</h2>
      <input name="current" type="password" required placeholder={i18n._("Current password")} />
      <input name="next" type="password" required minLength={8} placeholder={i18n._("New password")} />
      {error ? <p className="text-danger text-sm">{error}</p> : null}
      {success ? <p className="text-success text-sm">{i18n._("Password changed.")}</p> : null}
      <Button type="submit">{i18n._("Save new password")}</Button>
    </form>
  );
}
```

- [ ] **Step 3: Mount in settings** — inside the sessions tab render order: `<ChangePasswordForm />` then `<SessionManager />`; remove mock SESSIONS list rendering.

- [ ] **Step 4: Test** (mock authClient):

```tsx
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const listSessions = vi.fn(async () => ({
  data: [
    { session: { token: "tokA", ipAddress: "1.2.3.4", userAgent: "Mozilla Mobile", createdAt: new Date(), expiresAt: new Date() } },
  ],
}));
vi.mock("@/lib/auth-client", () => ({
  authClient: { listSessions: (...args: unknown[]) => listSessions(...(args as [])), revokeSession: vi.fn(), revokeOtherSessions: vi.fn(), signOut: vi.fn() },
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

describe("SessionManager", () => {
  it("lists real sessions from better-auth", async () => {
    const { SessionManager } = await import("./SessionManager");
    render(<SessionManager />);
    expect(await screen.findByText("Mobile")).toBeInTheDocument();
    expect(screen.getByText(/1\.2\.3\.4/)).toBeInTheDocument();
  });
});
```

(Adjust mock typing if lint flags `as []` — use explicit arg-free signature.)

- [ ] **Step 5: Manual E2E sanity** — two browser profiles logged in; revoke-other kills profile B only; change password invalidates others (relogin required).
- [ ] **Step 6: Gates + commit** `feat(auth): wire real session management and password change`

---

## Phase E — Teardown

### Task 17: Remove monorepo

**Files:**
- Delete: `apps/`, `packages/`, `pnpm-workspace.yaml`, `turbo.json`, `package.json.monorepo.bak`, `README.md.bak`, `tsconfig.base.json`
- Modify: root `package.json` (already final from Task 2), `.gitignore` (drop `apps/*`-era entries), `docker-compose.yml` (unchanged content, verify paths)

- [ ] **Step 1: Final reference sweep** BEFORE deleting — grep old tree for anything not yet ported:
Run: `Get-ChildItem apps,packages -Recurse -File | Where-Object { $_.FullName -notmatch "node_modules" } | Measure-Object`
Cross-check against migrated inventory (Tasks 3–16). The only acceptable leftovers: NestJS-only modules (challenges/submissions/grading/sandbox/bug-injection/jobs service stubs — their Next equivalents come later, tracked in docs/architecture note) and contracts (dropped by design).
- [ ] **Step 2: Delete** `git rm -r apps packages pnpm-workspace.yaml turbo.json tsconfig.base.json && rm package.json.monorepo.bak README.md.bak`
- [ ] **Step 3: Full clean verification**
Run: `pnpm install && pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm db:migrate`
Expected: all green from a cold start.
- [ ] **Step 4: Commit** `chore!: remove nestjs+vite monorepo — single nextjs app`

---

### Task 18: Final acceptance pass

- [ ] **Step 1:** Fresh clone simulation: `pnpm install && cp .env.example .env` (fill secrets) → `docker compose up -d` → `pnpm db:migrate` → `pnpm dev`. All routes manual-walk: `/`, `/login`, `/register`, `/forgot-password`, `/reset-password?token=x`, `/challenges`, `/challenges/{id}`, `/submissions/{id}/results`, `/profile`, `/settings`, `/leaderboard`; language switch en↔ar flips `dir=rtl`; theme toggle persists across reload.
- [ ] **Step 2:** `pnpm build` output shows React Compiler active; no ESLint references anywhere.
- [ ] **Step 3:** Update this plan's checkboxes; open follow-up issues for: RLS role-switching, SMTP sendResetPassword, rate limiting, API route handlers for challenges/submissions.
- [ ] **Step 4:** Commit (if anything drifted) `chore: migration acceptance fixes`

---

## Self-Review Record

- **Spec coverage:** CLI scaffold ✓(T2) · exact UI move ✓(T3–15) · config move ✓(T2 css/postcss/oxlint, T5 lingui) · latest Next ✓(16.3.x pinned) · React Compiler ✓(T2 S5) · TS in src ✓ · oxc ✓(lint script, configs kept) · AI instructions for Next ✓(T1 AGENTS.md + node_modules/next/dist/docs convention) · server/client handled ✓(classification table drove directives) · monorepo removal ✓(T17) · better-auth w/ docs checked ✓(research synthesized into T7–9,16) · complete auth features ✓(email/pass, OAuth conditional, forgot+NEW reset, real sessions, change password, guards, role field) · docs first ✓(Task 1 is first).
- **Placeholder scan:** Task 10 Sidebar test carries one inspect-first instruction (marker depends on moved file) — bounded, not a stub. Task 8 `(app)/layout` skeleton is explicitly replaced same-plan (T10). No TBDs remain.
- **Type consistency:** `AppShellContextValue.onMenuClick` consistent T8→T10; `useChallenge(id): Challenge | undefined` matches original hook; session row type `{session:{token,…}}` matches better-auth `listSessions` shape cited from docs; `withRequestClaims` signature copied verbatim from source.
