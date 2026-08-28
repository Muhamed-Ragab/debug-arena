# Auth Feature

## Overview
Drizzle schema for `users`, `accounts`, `loginAttempts` + RLS policies, plus client login/register/forgot pages. Real auth logic lives in `src/lib/auth` (better-auth).

## How it works
`auth/schema.ts` (Drizzle, `server-only` via `db`) defines `userRoleEnum` (`user`/`admin`), `users` (with `currentRating`, `streakCount`, `banned`, `role`, `isPublic`, etc.), `accounts` (better-auth), `loginAttempts`. RLS: `admin_all_users`, `user_own_profile`, `admin_all_login_attempts` via `request.jwt.claim.sub`. Client pages `LoginPage`, `RegisterPage`, `ForgotPasswordPage` (`"use client"`) use `authClient` from `@/lib/auth/client` (`signIn.email`, `signUp.email`, `signIn.social`, `requestPasswordReset`, `signOut`). No `queries.ts`/`service.ts`/`repository.ts`.

## File map
| File | Role |
|------|------|
| `schema.ts` | Drizzle tables + RLS + `UserSelect`/`UserInsert` types, `user`/`account` aliases |
| `LoginPage.tsx` | `"use client"` form, `authClient.signIn.email`/`social` |
| `RegisterPage.tsx` | `"use client"` form, `authClient.signUp.email` |
| `ForgotPasswordPage.tsx` | `"use client"` form, `authClient.requestPasswordReset` |
| `components/SignOutButton.tsx` | `"use client"` button, `authClient.signOut()` |

## Data flow
```
LoginPage → authClient.signIn.email({ email, password }) → better-auth server (lib/auth) → db `users`/`accounts` → session cookie → proxy.ts checks getSessionCookie for PROTECTED_PREFIXES
RegisterPage → authClient.signUp.email → db insert users
```

## SOLID notes
- **Schema only**: no business logic, no service, presentational client components only.
- **DIP**: pages depend on `lib/auth` abstraction, not direct DB.
- **No maps/switch**: trivial forms, no enum branches.

## How to run/test
No service tests (no service). Manual: `pnpm dev`, visit `/login`, test email/password and social.

## Conventions
- Schema split by feature, re-exported via `src/db/schema/index.ts`.
- `import "server-only"` not needed for client pages, but `schema.ts` is server-only.
