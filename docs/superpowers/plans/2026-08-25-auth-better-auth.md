# Auth Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship working authentication end-to-end: email+password and OAuth (Google/GitHub) sign-in backed by better-auth on the API, real session wiring in the React SPA, and session guards ready for every future protected endpoint.

**Architecture:** better-auth owns credential/OAuth flows, sessions, accounts, and verification tokens through a Drizzle adapter pointed at `@debug-arena/db`. The `@thallesp/nestjs-better-auth` module mounts better-auth's Node handler inside NestJS (no hand-written auth routes). NestJS guards resolve the session per-request and attach `req.user`; an RLS claim helper scopes DB transactions to the authenticated identity. The SPA talks to better-auth's React client through the existing Vite `/api` proxy.

**Tech Stack:** NestJS 11 · better-auth ^1.7.1 · @better-auth/drizzle-adapter ^1.7.1 · @thallesp/nestjs-better-auth ^2.7.0 · Drizzle ORM ^0.45.2 (+ drizzle-kit 0.31) + Postgres 16 (pgvector image) · React 19 + Vite 8 + TanStack Query · vitest (new, API-side tests)

**Spec:** `docs/tasks.md` Phase 0 items "Auth: integrate better-auth…" and "Migrate auth schema…"; `docs/implementation_guide.md` §6 (mounting, adapter, RLS bridge, guards); `docs/API.md` §1 (endpoint contract); `docs/erd.md` (users/accounts/sessions/verifications/login_attempts shapes).

## Baseline Warning (read first)

Updated 2026-08-25 after dependency refresh: all workspace packages are on latest versions — NestJS 11.x, `drizzle-orm@0.45.2` (exact match for the adapter's `^0.45.2` peer), `drizzle-kit@0.31`, zod pinned `^3.25.76` (ts-rest peer requirement). The former better-auth ↔ drizzle peer conflict is **RESOLVED** (`implementation_guide.md` §6 Known Issue); lint/typecheck/build are green on this baseline. HEAD is `7d348e1`; the working tree carries **uncommitted** changes implementing the ts-rest revert plus these upgrades and typecheck fixes. Before starting Task 1, confirm this baseline still holds:

```bash
git log --oneline -1          # expect 7d348e1 feat(api): setup better-auth
git status --short            # expect modified: packages/db/*, docs/*, apps/{api,web}/package.json, package.json, pnpm-lock.yaml
grep '"drizzle-orm"' packages/db/package.json   # expect ^0.45.2
```

If reality differs, re-read `docs/tasks.md` Phase 0 and reconcile before executing.

## Global Constraints

- **NEVER use the `any` type.** Strict mode is on; use `unknown` + narrowing or explicit interfaces.
- Formatter is `oxfmt` (double quotes, trailing commas, 100 char width); linter is `oxlint`. Run `pnpm fmt` before committing.
- Verification order for every task: `pnpm lint` → `pnpm typecheck` → `pnpm build` (scoped to touched apps).
- All API responses flow through the global `ResponseInterceptor` (`{ success, data, error, meta }`). Controllers return raw payloads; never hand-wrap envelopes.
- All commands run through pnpm workspace filters: `pnpm --filter @debug-arena/api …`, `pnpm --filter @debug-arena/db …`.
- Postgres runs via `docker compose up -d` (repo root). RLS roles `admin` and `user` must exist before migrating (Task 2 creates them).
- Never commit `.env`. Secrets go in `.env` only (copy from `.env.example`).
- Tests live next to source as `*.spec.ts`, import `describe/it/expect` explicitly from `"vitest"` (globals are NOT enabled), and run with `pnpm --filter @debug-arena/api test`.

---

### Task 1: Test harness + better-auth configuration

**Files:**
- Create: `apps/api/vitest.config.ts`
- Create: `apps/api/vitest.setup.ts`
- Create: `apps/api/src/common/auth/social-providers.ts`
- Test: `apps/api/src/common/auth/social-providers.spec.ts`
- Modify: `apps/api/package.json` (add `test` script + `vitest` devDep)
- Modify: `apps/api/src/common/auth/auth.ts`
- Modify: `.env.example`

**Interfaces:**
- Produces: `buildSocialProviders(env: NodeJS.ProcessEnv): Record<string, { clientId: string; clientSecret: string }>` — exported from `apps/api/src/common/auth/social-providers.ts`, consumed by `auth.ts` and later tasks.
- Produces: `auth` (better-auth instance) mounted at **basePath `/auth`**, with sliding 30-day sessions and the `emailVerified → email_verified_at` column mapping. Later tasks assume these three properties.

- [ ] **Step 1: Add vitest to the API package**

In `apps/api/package.json`, add to `scripts`: `"test": "vitest run"`. Add to `devDependencies`: `"vitest": "^2.1.8"`. Then run:

```bash
pnpm install
```

Expected: lockfile updates, install succeeds.

- [ ] **Step 2: Create vitest config**

Create `apps/api/vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.spec.ts"],
    setupFiles: ["./vitest.setup.ts"],
  },
  esbuild: {
    target: "node20",
    tsconfigRaw: {
      compilerOptions: { experimentalDecorators: true, emitDecoratorMetadata: true },
    },
  },
});
```

Create `apps/api/vitest.setup.ts`:

```ts
import "reflect-metadata";
```

- [ ] **Step 3: Write the failing social-providers test**

Create `apps/api/src/common/auth/social-providers.spec.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildSocialProviders } from "./social-providers";

describe("buildSocialProviders", () => {
  it("returns empty object when no provider env vars are set", () => {
    const result = buildSocialProviders({});
    expect(result).toEqual({});
  });

  it("configures google when both google vars present", () => {
    const result = buildSocialProviders({
      GOOGLE_CLIENT_ID: "g-id",
      GOOGLE_CLIENT_SECRET: "g-secret",
    });
    expect(result.google).toEqual({ clientId: "g-id", clientSecret: "g-secret" });
    expect(result.github).toBeUndefined();
  });

  it("configures github when both github vars present", () => {
    const result = buildSocialProviders({
      GITHUB_CLIENT_ID: "gh-id",
      GITHUB_CLIENT_SECRET: "gh-secret",
    });
    expect(result.github).toEqual({ clientId: "gh-id", clientSecret: "gh-secret" });
  });

  it("skips a provider when only one of its two vars is set", () => {
    const result = buildSocialProviders({ GOOGLE_CLIENT_ID: "g-id" });
    expect(result).toEqual({});
  });

  it("configures both providers together", () => {
    const result = buildSocialProviders({
      GOOGLE_CLIENT_ID: "g-id",
      GOOGLE_CLIENT_SECRET: "g-secret",
      GITHUB_CLIENT_ID: "gh-id",
      GITHUB_CLIENT_SECRET: "gh-secret",
    });
    expect(Object.keys(result).sort()).toEqual(["github", "google"]);
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

```bash
pnpm --filter @debug-arena/api test
```

Expected: FAIL — cannot resolve `./social-providers`.

- [ ] **Step 5: Implement social-providers**

Create `apps/api/src/common/auth/social-providers.ts`:

```ts
export interface OAuthCredentials {
  clientId: string;
  clientSecret: string;
}

/**
 * Builds the better-auth socialProviders config from process env.
 * Providers are only enabled when BOTH their env vars are present so the
 * API boots cleanly in dev without OAuth credentials configured.
 */
export function buildSocialProviders(
  env: NodeJS.ProcessEnv,
): Record<string, OAuthCredentials> {
  const providers: Record<string, OAuthCredentials> = {};
  if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
    providers.google = {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    };
  }
  if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) {
    providers.github = {
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    };
  }
  return providers;
}
```

- [ ] **Step 6: Run test to verify it passes**

```bash
pnpm --filter @debug-arena/api test
```

Expected: PASS (5 tests).

- [ ] **Step 7: Rewrite auth.ts configuration**

Replace the entire contents of `apps/api/src/common/auth/auth.ts` with:

```ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { db, schema } from "@debug-arena/db";
import { buildSocialProviders } from "./social-providers";

export const auth = betterAuth({
  // Mounted by @thallesp/nestjs-better-auth at this path. The SPA calls
  // /api/auth/* through the Vite proxy, which strips /api -> /auth reaches Nest.
  basePath: "/auth",
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.oauthAccounts, // Task 2 repoints this to schema.accounts
    },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // SMTP integration is a later phase
    sendResetPassword: async ({ user, url }) => {
      // Dev delivery: real SMTP/email templates land in a later phase
      // (implementation_guide.md §8). Log so devs can complete resets locally.
      console.log(`[auth] password reset link for ${user.email}: ${url}`);
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // sliding refresh daily
  },
  advanced: {
    generateId: () => crypto.randomUUID(), // keeps FK-compatible ids
  },
  user: {
    fields: {
      // Our users table predates better-auth defaults; map the one column
      // whose name differs (name/image columns added in Task 2).
      emailVerified: "email_verified_at",
    },
  },
  socialProviders: buildSocialProviders(process.env),
});
```

> Note: if `@debug-arena/db` does not export `schema` as a named export, open `packages/db/src/index.ts` and use whatever it exports (e.g. `import * as schema from "@debug-arena/db"` then `schema.users`) — match the import style already used by `packages/db/src/client.ts`.

- [ ] **Step 8: Add missing env var documentation**

Append to root `.env.example` (do NOT touch values in any real `.env`):

```bash
# --- better-auth ---
BETTER_AUTH_SECRET=change-me-32+-random-chars
# Optional: absolute origin used in emails/redirects; leave unset for local dev
# BETTER_AUTH_URL=http://localhost:5173
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

- [ ] **Step 9: Verify**

```bash
pnpm --filter @debug-arena/api lint && pnpm --filter @debug-arena/api typecheck && pnpm --filter @debug-arena/api build
```

Expected: all three pass. (Build compiles even though runtime DB tables lag — nothing executes at build time.)

- [ ] **Step 10: Commit**

```bash
git add apps/api/vitest.config.ts apps/api/vitest.setup.ts apps/api/src/common/auth/social-providers.spec.ts apps/api/src/common/auth/social-providers.ts apps/api/src/common/auth/auth.ts apps/api/package.json .env.example pnpm-lock.yaml
git commit -m "feat(api): configure better-auth basePath, sessions, conditional OAuth"
```

---

### Task 2: Reshape auth schema for better-auth ownership

better-auth requires specific columns on the tables it manages. Field mapping renames columns; it cannot create them. Per `erd.md`, better-auth owns `sessions`/`accounts`/`verifications` outright; `oauth_accounts`, `email_verifications`, and `password_resets` are superseded; `login_attempts` stays.

**Files:**
- Modify: `packages/db/src/schema.ts`
- Modify: `packages/db/src/index.ts` (only if dropped symbols were re-exported individually)
- Modify: `apps/api/src/common/auth/auth.ts` (repoint adapter `schema.account`)
- Check: `packages/db/src/zod.ts`, `packages/db/src/queries.ts` (drop references to deleted tables)

**Interfaces:**
- Produces: exported Drizzle tables `users` (extended with `name`, `image`), `sessions`, `accounts`, `verifications`, `loginAttempts` — consumed by the adapter mapping in `auth.ts`.
- Produces: adapter mapping `{ user: schema.users, session: schema.sessions, account: schema.accounts, verification: schema.verifications }`.

- [ ] **Step 1: Extend users with better-auth display columns**

In `packages/db/src/schema.ts`, inside the `users` table definition (after the `avatarUrl` line), add:

```ts
  name: text("name"),
  image: text("image"),
```

Keep every existing column (`passwordHash`, `emailVerifiedAt`, etc.) untouched.

- [ ] **Step 2: Replace sessions with the better-auth canonical shape**

Replace the entire existing `sessions` table export AND its `sessionsRelations` export with:

```ts
export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    sessionUserIdx: index("session_user_idx").on(t.userId),
  }),
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));
```

- [ ] **Step 3: Add accounts table, delete oauth_accounts**

Add below the new `sessionsRelations`:

```ts
export const accounts = pgTable(
  "accounts",
  {
    id: text("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    providerId: text("provider_id").notNull(),
    accountId: text("account_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"), // credential hash lives here, not on users
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    accountsProviderAccountIdx: uniqueIndex("accounts_provider_account_idx").on(
      t.providerId,
      t.accountId,
    ),
  }),
);

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));
```

Then **delete** the entire `oauthAccounts` table export and the `oauthAccountsRelations` export.

- [ ] **Step 4: Add verifications table, delete legacy token tables**

Add:

```ts
export const verifications = pgTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
```

Then **delete** the entire `emailVerifications`, `passwordResets` table exports and their matching `*Relations` exports.

- [ ] **Step 5: Remove now-dead enum definitions**

Run:

```bash
grep -rn "oauthProviderEnum\|sessionStatusEnum\|emailVerifications\|passwordResets\|oauthAccounts" packages/db/src apps/api/src apps/web/src
```

Delete the enum definitions themselves (`oauthProviderEnum`, `sessionStatusEnum`) from `packages/db/src/schema.ts` once the grep returns zero hits outside their own declarations. Fix any remaining referencing lines (expected candidates: `zod.ts`, `queries.ts`, `index.ts`) by removing those references entirely.

- [ ] **Step 6: Repoint the adapter**

In `apps/api/src/common/auth/auth.ts`, change the adapter schema block to:

```ts
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
```

- [ ] **Step 7: Generate and run the migration**

```bash
docker compose up -d
docker compose exec postgres psql -U postgres -d debug_arena -c "DO \$\$ BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'admin') THEN CREATE ROLE admin NOLOGIN; END IF; IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '\"user\"') THEN CREATE ROLE \"user\" NOLOGIN; END IF; END \$\$;"
pnpm --filter @debug-arena/db generate
pnpm --filter @debug-arena/db migrate
```

(If your compose service isn't named `postgres`, use `docker compose ps` to find the right service name.)

Expected: migration files generated into `packages/db/drizzle/`, migrator exits 0.

> If `pgPolicy`/`pgRole` emits errors under drizzle-kit 0.31, STOP — do not improvise schema syntax. Report the error; the halt ruling from the previous session applies.

- [ ] **Step 8: Verify tables in Postgres**

```bash
docker compose exec postgres psql -U postgres -d debug_arena -c "\d sessions" -c "\d accounts" -c "\d verifications"
docker compose exec postgres psql -U postgres -d debug_arena -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name IN ('name','image');"
```

Expected: `sessions` shows `id/text`, `token`, `expires_at`, `updated_at`; `accounts` exists with `provider_id`+`account_id` unique index; `verifications` exists; `users` has `name` and `image`. Legacy `oauth_accounts`/`email_verifications`/`password_resets` no longer exist:

```bash
docker compose exec postgres psql -U postgres -d debug_arena -c "SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename IN ('oauth_accounts','email_verifications','password_resets','accounts','verifications');"
```

Expected rows: `accounts`, `verifications` only.

- [ ] **Step 9: Smoke-boot the API against the new schema**

```bash
cp .env.example .env  # only if .env doesn't exist; then fill BETTER_AUTH_SECRET
pnpm --filter @debug-arena/api dev &
sleep 8 && curl -s http://localhost:3000/auth/ok
```

Expected: JSON containing `"ok":true` (better-auth liveness probe proves adapter ↔ schema compatibility on drizzle 0.45). Kill the dev server afterwards. The peer-conflict item is already marked resolved at the dependency level (`implementation_guide.md` §6); this probe re-verifies it live at runtime.

- [ ] **Step 10: Verify + commit**

```bash
pnpm --filter @debug-arena/db generate && git checkout -- packages/db/drizzle  # ensure no drift
pnpm lint && pnpm typecheck && pnpm build
git add packages/db/src/schema.ts packages/db/src/index.ts packages/db/drizzle apps/api/src/common/auth/auth.ts pnpm-lock.yaml
git commit -m "feat(db): reshape auth tables for better-auth ownership"
```

---

### Task 3: Delete the legacy JWT auth module

Two auth systems currently coexist (better-auth mount + stubbed `@Post register/login` controller). better-auth won; remove the corpse.

**Files:**
- Delete: `apps/api/src/modules/auth/auth.controller.ts`
- Delete: `apps/api/src/modules/auth/auth.service.ts`
- Delete: `apps/api/src/modules/auth/auth.module.ts`
- Modify: `apps/api/src/app.module.ts` (remove `AppAuthModule`)
- Modify: `apps/api/package.json` (remove JWT/passport deps)

**Interfaces:**
- Consumes: nothing (this code is dead).
- Produces: single auth surface at `/auth/*` handled by the `AuthModule.forRoot` middleware registered in `app.module.ts`.

- [ ] **Step 1: Confirm nothing imports the legacy module besides app.module.ts**

```bash
grep -rn "modules/auth\|AppAuthModule\|AuthService\|JwtModule\|passport" apps/api/src --include="*.ts"
```

Expected: hits confined to `app.module.ts` and `src/modules/auth/*`. Any other hit: stop and reconcile (it means someone wired legacy auth somewhere new).

- [ ] **Step 2: Remove module registration**

In `apps/api/src/app.module.ts`: delete the `AppAuthModule` import statement, remove `AppAuthModule` from the `imports` array, and remove any now-unused `JwtModule`-related imports. Keep `AuthModule.forRoot({ auth, ... })` exactly as-is.

- [ ] **Step 3: Delete files and dependencies**

```bash
git rm apps/api/src/modules/auth/auth.controller.ts apps/api/src/modules/auth/auth.service.ts apps/api/src/modules/auth/auth.module.ts
pnpm --filter @debug-arena/api remove @nestjs/jwt @nestjs/passport passport passport-jwt
pnpm --filter @debug-arena/api remove -D @types/passport-jwt
```

- [ ] **Step 4: Verify**

```bash
grep -rn "passport\|JwtModule\|AuthService" apps/api/src --include="*.ts"
pnpm --filter @debug-arena/api lint && pnpm --filter @debug-arena/api typecheck && pnpm --filter @debug-arena/api build
```

Expected: grep returns nothing; all three commands exit 0.

- [ ] **Step 5: Commit**

```bash
git add -A apps/api
git commit -m "refactor(api): drop legacy JWT auth in favor of better-auth"
```

---

### Task 4: Session guards + RLS claim helper

Implements `implementation_guide.md` §6: `BetterAuthSessionGuard`, `OptionalBetterAuthSessionGuard`, `RolesGuard`, and the `request.jwt.claim.sub` transaction bridge.

> **Doc inconsistency resolved here:** `erd.md` policies read `current_setting('request.jwt.claim.sub')::uuid` (a scalar GUC), while `implementation_guide.md` §6 sketches `SET LOCAL "request.jwt.claims" = {...json}` (plural, JSON). The migrations encode the **singular scalar** form, so the bridge sets `request.jwt.claim.sub` — otherwise every existing RLS policy sees NULL.

**Files:**
- Create: `apps/api/src/common/guards/authenticated-request.ts`
- Create: `apps/api/src/common/guards/better-auth-session.guard.ts`
- Create: `apps/api/src/common/guards/better-auth-session.guard.spec.ts`
- Create: `apps/api/src/common/guards/roles.guard.ts`
- Create: `apps/api/src/common/guards/roles.decorator.ts`
- Create: `apps/api/src/common/guards/roles.guard.spec.ts`
- Create: `apps/api/src/common/db/request-claims.ts`
- Create: `apps/api/src/common/db/request-claims.spec.ts`

**Interfaces:**
- Consumes: `auth` from `apps/api/src/common/auth/auth.ts` (`auth.api.getSession({ headers })`).
- Produces: `interface SessionUser { id: string; email: string; name: string | null; image: string | null; role: string | null }`; `AuthenticatedRequest extends Request { user?: SessionUser }`; `BetterAuthSessionGuard` (401 when no session); `OptionalBetterAuthSessionGuard` (passes through); `@Roles(...roles: string[])` + `RolesGuard` (403 when `req.user.role` not listed); `withRequestClaims<T>(userId: string, role: string | null, fn: (tx) => Promise<T>): Promise<T>`.

- [ ] **Step 1: Define the request/user contract**

Create `apps/api/src/common/guards/authenticated-request.ts`:

```ts
import type { Request } from "express";

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: string | null;
}

export interface AuthenticatedRequest extends Request {
  user?: SessionUser;
}
```

- [ ] **Step 2: Write the failing session-guard test**

Create `apps/api/src/common/guards/better-auth-session.guard.spec.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthenticatedRequest } from "./authenticated-request";

const getSessionMock = vi.fn();
vi.mock("../auth/auth", () => ({
  auth: { api: { getSession: (...args: unknown[]) => getSessionMock(...args) } },
}));

const { BetterAuthSessionGuard } = await import("./better-auth-session.guard");
const { OptionalBetterAuthSessionGuard } = await import("./better-auth-session.guard");

function fakeContext(req: Partial<AuthenticatedRequest>) {
  return {
    switchToHttp: () => ({ getRequest: () => req }),
  };
}

beforeEach(() => {
  getSessionMock.mockReset();
});

describe("BetterAuthSessionGuard", () => {
  it("attaches the session user and allows access", async () => {
    getSessionMock.mockResolvedValue({
      user: { id: "u1", email: "a@b.c", name: "Ada", image: null, role: "user" },
      session: { id: "s1" },
    });
    const guard = new BetterAuthSessionGuard();
    const req: Partial<AuthenticatedRequest> = { headers: {} };
    const ok = await guard.canActivate(fakeContext(req) as never);
    expect(ok).toBe(true);
    expect(req.user).toEqual({
      id: "u1",
      email: "a@b.c",
      name: "Ada",
      image: null,
      role: "user",
    });
  });

  it("throws UnauthorizedException when no session exists", async () => {
    getSessionMock.mockResolvedValue(null);
    const guard = new BetterAuthSessionGuard();
    await expect(guard.canActivate(fakeContext({ headers: {} }) as never)).rejects.toThrow(
      "Unauthorized",
    );
  });
});

describe("OptionalBetterAuthSessionGuard", () => {
  it("passes through without a session and does not set user", async () => {
    getSessionMock.mockResolvedValue(null);
    const guard = new OptionalBetterAuthSessionGuard();
    const req: Partial<AuthenticatedRequest> = { headers: {} };
    const ok = await guard.canActivate(fakeContext(req) as never);
    expect(ok).toBe(true);
    expect(req.user).toBeUndefined();
  });

  it("attaches user when a session exists", async () => {
    getSessionMock.mockResolvedValue({
      user: { id: "u2", email: "x@y.z", name: null, image: null, role: "admin" },
      session: { id: "s2" },
    });
    const guard = new OptionalBetterAuthSessionGuard();
    const req: Partial<AuthenticatedRequest> = { headers: {} };
    await guard.canActivate(fakeContext(req) as never);
    expect(req.user?.id).toBe("u2");
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

```bash
pnpm --filter @debug-arena/api test
```

Expected: FAIL — cannot resolve `./better-auth-session.guard`.

- [ ] **Step 4: Implement the guards**

Create `apps/api/src/common/guards/better-auth-session.guard.ts`:

```ts
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import type { SessionUser } from "./authenticated-request";
import { auth } from "../auth/auth";

async function resolveSession(headers: Record<string, unknown>): Promise<SessionUser | null> {
  const session = await auth.api.getSession({ headers: new Headers(headers as HeadersInit) });
  if (!session) return null;
  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name ?? null,
    image: session.user.image ?? null,
    role: session.user.role ?? null,
  };
}

@Injectable()
export class BetterAuthSessionGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ headers: Record<string, unknown>; user?: SessionUser }>();
    const user = await resolveSession(request.headers);
    if (!user) throw new UnauthorizedException();
    request.user = user;
    return true;
  }
}

@Injectable()
export class OptionalBetterAuthSessionGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ headers: Record<string, unknown>; user?: SessionUser }>();
    const user = await resolveSession(request.headers);
    if (user) request.user = user;
    return true; // anonymous passes through
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
pnpm --filter @debug-arena/api test
```

Expected: all PASS (previous suites too).

- [ ] **Step 6: Write failing RolesGuard test**

Create `apps/api/src/common/guards/roles.guard.spec.ts`:

```ts
import { describe, expect, it } from "vitest";
import { Reflector } from "@nestjs/core";
import { RolesGuard } from "./roles.guard";
import type { AuthenticatedRequest } from "./authenticated-request";

function makeReflector(roles: string[]): Reflector {
  return { getAllAndOverride: () => roles } as unknown as Reflector;
}

function ctxWith(userRole: string | undefined) {
  const req: Partial<AuthenticatedRequest> = { headers: {} };
  if (userRole !== undefined) {
    req.user = { id: "u1", email: "e@e.e", name: null, image: null, role: userRole };
  }
  return { switchToHttp: () => ({ getRequest: () => req }) };
}

describe("RolesGuard", () => {
  it("allows when user role is in required roles", async () => {
    const guard = new RolesGuard(makeReflector(["admin"]));
    await expect(guard.canActivate(ctxWith("admin") as never)).resolves.toBe(true);
  });

  it("rejects with ForbiddenException when role missing", async () => {
    const guard = new RolesGuard(makeReflector(["admin"]));
    await expect(guard.canActivate(ctxWith("user") as never)).rejects.toThrow("Forbidden");
  });

  it("rejects anonymous requests even for public-ish handlers", async () => {
    const guard = new RolesGuard(makeReflector(["user"]));
    await expect(guard.canActivate(ctxWith(undefined) as never)).rejects.toThrow("Forbidden");
  });
});
```

- [ ] **Step 7: Implement RolesGuard + decorator**

Create `apps/api/src/common/guards/roles.decorator.ts`:

```ts
import { SetMetadata } from "@nestjs/common";

export const ROLES_KEY = "roles";
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
```

Create `apps/api/src/common/guards/roles.guard.ts`:

```ts
import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY } from "./roles.decorator";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const request = context.switchToHttp().getRequest<{
      user?: { role: string | null };
    }>();
    const role = request.user?.role ?? null;
    if (!role || !required.includes(role)) {
      throw new ForbiddenException(`Requires role: ${required.join(", ")}`);
    }
    return true;
  }
}
```

- [ ] **Step 8: Write failing RLS claim helper test**

Create `apps/api/src/common/db/request-claims.spec.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";

const executeMock = vi.fn();
const transactionMock = vi.fn();

vi.mock("@debug-arena/db", () => ({
  db: {
    transaction: (fn: (tx: unknown) => Promise<unknown>) =>
      transactionMock(fn),
  },
}));

const { withRequestClaims } = await import("./request-claims");

beforeEach(() => {
  executeMock.mockReset();
  transactionMock.mockReset();
});

describe("withRequestClaims", () => {
  it("sets the RLS GUC inside a transaction, scoped to it, then runs fn with tx", async () => {
    const fakeTx = { execute: executeMock };
    transactionMock.mockImplementation(async (fn: (tx: typeof fakeTx) => Promise<string>) => {
      executeMock.mockResolvedValue(undefined);
      return fn(fakeTx);
    });
    executeMock.mockClear();

    const result = await withRequestClaims("user-1", "admin", async (tx) => {
      expect(tx).toBe(fakeTx);
      return "done";
    });

    expect(result).toBe("done");
    expect(executeMock).toHaveBeenCalledTimes(1);
    const sqlArg = executeMock.mock.calls[0][0];
    // drizzle sql template: check query chunks carry our values
    const rendered = JSON.stringify(sqlArg.queryChunks ?? sqlArg);
    expect(rendered).toContain("request.jwt.claim.sub");
    expect(rendered).toContain("user-1");
  });

  it("propagates fn failures after setting the claim", async () => {
    const fakeTx = { execute: executeMock.mockResolvedValue(undefined) };
    transactionMock.mockImplementation(async (fn: (tx: typeof fakeTx) => Promise<void>) => fn(fakeTx));

    await expect(
      withRequestClaims("u", "user", async () => {
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");
  });
});
```

- [ ] **Step 9: Implement the claim helper**

Create `apps/api/src/common/db/request-claims.ts`:

```ts
import { sql } from "drizzle-orm";
import { db } from "@debug-arena/db";

type TransactionFn = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Runs `fn` inside a transaction whose RLS identity is pinned to the given
 * user. Matches the policies encoded in packages/db/src/schema.ts, which read
 * current_setting('request.jwt.claim.sub')::uuid (scalar GUC, NOT the JSON
 * variant sketched in implementation_guide.md §6).
 *
 * set_config(..., true) == SET LOCAL: the claim dies with the transaction,
 * so pooled connections can never leak identity across requests.
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

- [ ] **Step 10: Run full suite + verify**

```bash
pnpm --filter @debug-arena/api test && pnpm --filter @debug-arena/api lint && pnpm --filter @debug-arena/api typecheck && pnpm --filter @debug-arena/api build
```

Expected: everything green.

- [ ] **Step 11: Commit**

```bash
git add apps/api/src/common/guards apps/api/src/common/db
git commit -m "feat(api): add better-auth session guards, roles, and RLS claim bridge"
```

---

### Task 5: `GET /users/me` — prove the vertical slice

A single guarded endpoint exercises cookie → guard → session lookup → response, and gives the SPA something real to call.

**Files:**
- Create: `apps/api/src/modules/users/users.controller.ts`
- Create: `apps/api/src/modules/users/users.module.ts`
- Modify: `apps/api/src/app.module.ts` (register `UsersModule`)

**Interfaces:**
- Consumes: `BetterAuthSessionGuard`, `AuthenticatedRequest` (Task 4).
- Produces: `GET /users/me` → `200 { success, data: SessionUser, error: null }`; `401` without a valid session cookie.

- [ ] **Step 1: Create the users module**

Create `apps/api/src/modules/users/users.controller.ts`:

```ts
import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { BetterAuthSessionGuard } from "../../common/guards/better-auth-session.guard";
import type { AuthenticatedRequest } from "../../common/guards/authenticated-request";

@Controller("users")
export class UsersController {
  @Get("me")
  @UseGuards(BetterAuthSessionGuard)
  me(@Req() req: AuthenticatedRequest) {
    // ResponseInterceptor wraps this into { success, data, error }
    return req.user;
  }
}
```

Create `apps/api/src/modules/users/users.module.ts`:

```ts
import { Module } from "@nestjs/common";
import { UsersController } from "./users.controller";

@Module({
  controllers: [UsersController],
})
export class UsersModule {}
```

- [ ] **Step 2: Register the module**

In `apps/api/src/app.module.ts`, add `UsersModule` to the `imports` array (and its import statement).

- [ ] **Step 3: Verify manually end-to-end**

```bash
pnpm --filter @debug-arena/api dev > /tmp/api.log 2>&1 &
sleep 8
# 1) anonymous /users/me must be rejected
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/users/me
# expect: 401

# 2) register (sets session cookie) — BETTER_AUTH_SECRET must be set in .env
curl -s -c /tmp/cookies.txt -X POST http://localhost:3000/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{"email":"dev@example.com","password":"supersecret123","name":"Dev"}'
# expect: JSON with "user":{"id":...

# 3) authenticated /users/me with cookie
curl -s -b /tmp/cookies.txt http://localhost:3000/users/me
# expect: {"success":true,"data":{"id":"...","email":"dev@example.com",...},"error":null}

# 4) login flow round-trip
curl -s -c /tmp/cookies2.txt -X POST http://localhost:3000/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -d '{"email":"dev@example.com","password":"supersecret123"}'
curl -s -b /tmp/cookies2.txt http://localhost:3000/users/me
```

All four expectations must hold. Kill the server.

- [ ] **Step 4: Verify + commit**

```bash
pnpm --filter @debug-arena/api test && pnpm --filter @debug-arena/api lint && pnpm --filter @debug-arena/api typecheck && pnpm --filter @debug-arena/api build
git add apps/api/src/modules/users apps/api/src/app.module.ts
git commit -m "feat(api): add guarded GET /users/me"
```

---

### Task 6: Frontend auth client + route protection

**Files:**
- Modify: `apps/web/package.json` (add `better-auth`)
- Create: `apps/web/src/lib/auth-client.ts`
- Create: `apps/web/src/components/ProtectedRoute.tsx`
- Modify: `apps/web/src/App.tsx`

**Interfaces:**
- Produces: `authClient` (better-auth React client bound to `/api/auth`) — consumed by all auth pages in Task 7.
- Produces: `<ProtectedRoute>` — renders `<Outlet />` for signed-in users, redirects others to `/login` preserving the intended path in `location.state.from`.

- [ ] **Step 1: Install the client**

```bash
pnpm --filter @debug-arena/web add better-auth
```

- [ ] **Step 2: Create the client binding**

Create `apps/web/src/lib/auth-client.ts`:

```ts
import { createAuthClient } from "better-auth/react";

/**
 * Browser-side path includes /api so the Vite proxy forwards to the API and
 * strips the prefix; the API mounts better-auth at basePath /auth.
 * Cookies stay first-party because every request is same-origin (:5173).
 */
export const authClient = createAuthClient({ baseURL: "/api/auth" });
```

- [ ] **Step 3: Create ProtectedRoute**

Create `apps/web/src/components/ProtectedRoute.tsx`:

```tsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { authClient } from "../lib/auth-client";

export default function ProtectedRoute() {
  const { data, isPending } = authClient.useSession();
  const location = useLocation();

  if (isPending) return null; // session bootstrap; AppShell renders after
  if (!data) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}
```

- [ ] **Step 4: Guard the shell routes**

In `apps/web/src/App.tsx`, wrap the `AppShell` route so the element tree becomes:

```tsx
<Route element={<ProtectedRoute />}>
  <Route element={<AppShell />}>
    <Route path="/challenges" element={<ChallengeBrowserPage />} />
    <Route path="/challenges/:id" element={<ChallengePage />} />
    <Route path="/submissions/:id/results" element={<ResultsPage />} />
    <Route path="/profile" element={<ProfilePage />} />
    <Route path="/settings" element={<ProfileSettingsPage />} />
    <Route path="/leaderboard" element={<LeaderboardPage />} />
  </Route>
</Route>
```

Add the import: `import ProtectedRoute from "./components/ProtectedRoute";`

- [ ] **Step 5: Verify in browser**

```bash
pnpm --filter @debug-arena/web typecheck && pnpm --filter @debug-arena/web build
pnpm dev  # turbo: api :3000 + web :5173
```

Open `http://localhost:5173/challenges` while logged out → expect redirect to `/login`. Log in with the Task 5 credentials at `/login` — **the form still does nothing real** (Task 7 wires it); instead verify protection logic by temporarily calling `authClient.signIn.email` from the console, or proceed directly to Task 7 and re-verify. Kill dev server.

- [ ] **Step 6: Commit**

```bash
git add apps/web/package.json apps/web/pnpm-lock.yaml apps/web/src/lib/auth-client.ts apps/web/src/components/ProtectedRoute.tsx apps/web/src/App.tsx pnpm-lock.yaml
git commit -m "feat(web): better-auth client and protected routes"
```

---

### Task 7: Wire login / register / forgot-password pages

**Files:**
- Modify: `apps/web/src/features/auth/LoginPage.tsx`
- Modify: `apps/web/src/features/auth/RegisterPage.tsx`
- Modify: `apps/web/src/features/auth/ForgotPasswordPage.tsx`
- Create: `apps/web/src/features/auth/components/SignOutButton.tsx`
- Modify: `apps/web/src/features/profile/components/SessionManager.tsx` (inject sign-out)
- Regenerate: `apps/web/src/locales/en.json`, `ar.json` via lingui

**Interfaces:**
- Consumes: `authClient` (Task 6).
- Produces: working credential login/signup, social buttons hitting enabled providers, forgot-password posting to better-auth; `SignOutButton` navigates to `/login` after `authClient.signOut()`.

- [ ] **Step 1: LoginPage — real submission**

In `apps/web/src/features/auth/LoginPage.tsx`:

Add imports at top:

```tsx
import { useState, type FormEvent } from "react";
import { authClient } from "../../lib/auth-client";
```

Inside the component, above `return`:

```tsx
const [error, setError] = useState<string | null>(null);

async function handleSubmit(e: FormEvent<HTMLFormElement>) {
  e.preventDefault();
  setError(null);
  const formData = new FormData(e.currentTarget);
  const { error } = await authClient.signIn.email({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });
  if (error) {
    setError(error.message ?? "Login failed");
    return;
  }
  navigate("/challenges");
}
```

Change the `<form onSubmit={(e) => { e.preventDefault(); navigate("/challenges"); }} …>` to `<form className="space-y-4" onSubmit={handleSubmit} noValidate>`.

Add `name="email"` to the email `<input>` and `name="password"` to the password `<input>`.

Render the error just above the submit button:

```tsx
{error && (
  <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
    {i18n._(error)}
  </p>
)}
```

Wire the GitHub button: `onClick={() => void authClient.signIn.social({ provider: "github" })}` and Google: `onClick={() => void authClient.signIn.social({ provider: "google" })}` (both buttons lose `type="button"`-only inertness — keep `type="button"`, add the onClick).

- [ ] **Step 2: RegisterPage — real signup**

Same pattern in `RegisterPage.tsx`. Imports identical. Component body:

```tsx
const [error, setError] = useState<string | null>(null);

async function handleSubmit(e: FormEvent<HTMLFormElement>) {
  e.preventDefault();
  setError(null);
  const formData = new FormData(e.currentTarget);
  const { error } = await authClient.signUp.email({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    name: String(formData.get("name") ?? ""),
  });
  if (error) {
    setError(error.message ?? "Registration failed");
    return;
  }
  navigate("/challenges");
}
```

Swap the demo `onSubmit` for `onSubmit={handleSubmit} noValidate`; add `name="name"`, `name="email"`, `name="password"` to the three inputs; add the same error paragraph; wire the two social buttons exactly as in Step 1.

- [ ] **Step 3: ForgotPasswordPage — request reset link**

Imports: add `useState, type FormEvent` from react, `useNavigate` from react-router-dom (already imported `Link`), `authClient`. Body:

```tsx
const navigate = useNavigate();
const [sent, setSent] = useState(false);
const [error, setError] = useState<string | null>(null);

async function handleSubmit(e: FormEvent<HTMLFormElement>) {
  e.preventDefault();
  setError(null);
  const formData = new FormData(e.currentTarget);
  const { error } = await authClient.forgetPassword({
    email: String(formData.get("email") ?? ""),
    redirectTo: `${window.location.origin}/login`,
  });
  if (error) {
    setError(error.message ?? "Could not send reset link");
    return;
  }
  setSent(true);
}
```

Swap `onSubmit={(e) => e.preventDefault()}` for `onSubmit={handleSubmit} noValidate`; add `name="email"`; render below the button:

```tsx
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
```

> Reset-token consumption needs a `/reset-password` page — deliberately deferred (see Out of Scope). The emailed link logs to the API console in dev (Task 1 callback).

- [ ] **Step 4: Sign-out**

Create `apps/web/src/features/auth/components/SignOutButton.tsx`:

```tsx
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { authClient } from "../../../lib/auth-client";

export default function SignOutButton() {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-destructive"
      onClick={async () => {
        await authClient.signOut();
        navigate("/login");
      }}
    >
      <LogOut size={13} />
    </button>
  );
}
```

Open `apps/web/src/features/profile/components/SessionManager.tsx`, add `import SignOutButton from "../../auth/components/SignOutButton";` and render `<SignOutButton />` in the section header row (next to the existing heading markup). Placement is one JSX line — put it beside the panel title wherever that lives in the file.

- [ ] **Step 5: Extract i18n strings and verify**

```bash
pnpm --filter @debug-arena/web i18n:extract && pnpm --filter @debug-arena/web i18n:compile
pnpm --filter @debug-arena/web lint && pnpm --filter @debug-arena/web typecheck && pnpm --filter @debug-arena/web build
```

Expected: catalogs gain the new strings (en + ar), all commands pass.

- [ ] **Step 6: Manual walkthrough (full loop)**

```bash
pnpm dev
```

Walk: `/register` create account → lands on `/challenges` (now permitted) → `/profile` → click sign-out icon → back at `/login` → log in with same creds → `/challenges` again. Then logout → `/login` → "Forgot password?" → submit email → success notice appears; API console shows the reset link (Task 1 callback). All six checkpoints must pass.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src
git commit -m "feat(web): wire auth pages to better-auth flows"
```

---

### Task 8: Final verification + roadmap bookkeeping

**Files:**
- Modify: `docs/tasks.md` (tick completed items)
- Modify: `.superpowers/sdd/*/progress.md` (append outcome entries, house convention)

- [ ] **Step 1: Full monorepo gate**

```bash
pnpm lint && pnpm typecheck && pnpm build && pnpm --filter @debug-arena/api test
```

Expected: exit 0 across the board.

- [ ] **Step 2: Tick roadmap items**

In `docs/tasks.md`, mark complete:
- `[x] Auth: integrate better-auth (drizzle adapter, /api/auth/* proxy controller, google+github OAuth, session guards, RLS bridge via SET LOCAL request.jwt.claim.sub) + frontend auth flow with better-auth/client`
- `[x] Migrate auth schema: extend users (uuid id, add emailVerified/name/image, map passwordHash), let better-auth own sessions/accounts/verifications; drop legacy oauth_accounts/email_verifications/password_resets; keep login_attempts (schema.ts + migrate.ts)`
- The peer-conflict item: **already ticked** (resolved 2026-08-25 by upgrading to drizzle-orm ^0.45.2, matching the adapter peer; see `implementation_guide.md` §6). No action needed beyond the runtime probe in T2 Step 9.
- The `@typescript/native-preview` item: **already ticked** (`tsgo` binary present; typecheck green everywhere).

Leave the CI item and everything in Phase 1 unchecked.

- [ ] **Step 3: Append SDD progress entries**

Following the format in `.superpowers/sdd/2026-08-23-backend-foundation/progress.md`, append per-task outcomes (commit range + verdict) for Tasks 1–7 of this plan.

- [ ] **Step 4: Commit**

```bash
git add docs/tasks.md .superpowers
git commit -m "docs: tick auth feature roadmap items, record SDD progress"
```

---

## Out of Scope (deliberate cuts — do not fold back in)

- **Rate limiting** on auth endpoints (`API.md` lists limits; `implementation_guide.md` §1 owns the throttler design). Separate task.
- **Real email delivery** (SMTP, `email_templates`, verification emails). Reset links log to console; `requireEmailVerification` stays false. `API.md`'s `/auth/verify-email` + `/resend-verification` become functional only after SMTP lands.
- **`/reset-password` page** consuming the emailed token (frontend). Backend `resetPassword` endpoint works via better-auth once SMTP delivers real links.
- **App-wide RLS enforcement**: `withRequestClaims` ships as a tested primitive; threading every future service query through it happens feature-by-feature (next features adopt it from day one).
- **OAuth live E2E**: provider config is conditional; real callbacks need registered credentials and are validated manually when creds exist.
- **`packages/contracts/auth.schema.ts` refresh** to mirror better-auth payload types — revisit when ts-rest/contract work resumes.

## Self-Review Notes

- Spec coverage: tasks.md L10 (adapter ✓ T1–T2, proxy controller ✓ replaced by thallesp mount T3 — documented deviation, guards ✓ T4, RLS bridge ✓ T4, OAuth ✓ T1/T7, frontend flow ✓ T6–T7), L11 (schema migration ✓ T2, login_attempts kept ✓), peer-conflict item ✓ T2 Step 9, native-preview item ✓ pre-satisfied/T8. API.md §1 endpoints: register/login/oauth/sessions/revoke/verify/forgot/reset — all served by the better-auth mount; `/users/me` (§4) delivered early in T5 as the guard proof.
- Type consistency: `SessionUser` defined once (T4) and reused by guard specs, users controller, and RolesGuard; adapter mapping names match schema exports exactly (`schema.accounts`, `schema.verifications`); `authClient` import path stable across T6/T7.
- Known deviation flagged: implementation_guide §6 shows a manual `@All("*")` proxy controller; we use `@thallesp/nestjs-better-auth`'s mount instead (already installed and wired at HEAD) — equivalent behavior, less code. ERD-vs-guide GUC naming conflict resolved in favor of the encoded policies (`request.jwt.claim.sub`), called out in T4.
