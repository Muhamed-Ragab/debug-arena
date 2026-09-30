# Architecture — Debug Arena

> **NOTE:** Earlier revisions of this doc described a NestJS API + Vite SPA.
> That stack was replaced by a single Next.js 16 app (see
> docs/superpowers/plans/2026-08-26-nextjs-migration.md): controllers →
> route handlers/server actions, guards → `auth.api.getSession` + `proxy.ts`,
> AuthModule mount `/auth` → `/api/auth/[...all]`. The app is free to use —
> no payment flow exists. AI runs server-only via Groq; user-configured
> (BYOK) providers are roadmap work (see `plan.md`).

## 1. High-Level Overview

```
┌─────────────────────────┐      ┌─────────────────────┐
│  Next.js 16 App Router  │ <──> │  Postgres 16        │
│  (Server Components,    │      │  (relational data)  │
│   Server Actions,       │      └─────────────────────┘
│   Turbopack, English UI)│               │
└─────────────────────────┘               ▼
              │                  ┌─────────────────────┐
              │                  │  Redis 7            │
              │                  │  (sessions, cache)  │
              │                  └─────────────────────┘
              ▼
     ┌─────────────────────────────────────────┐
     │  Grading pipeline (server-only)         │
     │  Sandbox runner → Groq LLM judge →      │
     │  deterministic token-overlap fallback   │
     └─────────────────────────────────────────┘
                      Vercel AI SDK
                   (model orchestration)
```

## 1.1 Layered Architecture (Flat)

Per-feature flat `repository.ts` + `service.ts` (no `repositories/`/`services/` subfolders), pure components, object maps + `switch`.

```
page.tsx (server, thin glue)
   │
   ▼
service.ts (business, DIP via repository param, isSolved/calcPoints deduped, DIFFICULTY_LABEL maps)
   │
   ▼
repository.ts (data access only, server-only, thin DTO, db.transaction stays here)
   │
   ▼
db (Drizzle) + Redis (cache) + AI (Groq)

components/*.tsx (pure, props-only, no useState business) ← hooks/* (client logic: useChallengeWorkspace, useLeaderboard, etc.)
queries.ts / actions.ts (thin facades: export from ./repository / ./service, no db leak)
constants.ts (data) / types.ts (interfaces) / utils/ (helpers if service >300 lines) / README.md (per-feature docs)
```

- **Repository**: `import "server-only"`, `ChallengeRepository` interface + `challengeRepository` const, methods `findPublished`, `findById`, etc. No business.
- **Service**: `isSolved` 1 def, `DIFFICULTY_LABEL` object map + `switch` for discriminant (≥3 branches), injects repo via param.
- **Hooks**: `features/challenge/hooks/useChallengeWorkspace`, `features/browser/hooks/useChallengeFilters` (consolidate dup), `features/leaderboard/hooks/useLeaderboard`.
- **Pure Components**: `ChallengeScreen`, `ChallengeBrowser`, `ProfileScreen`, `LeaderboardScreen`, `ResultsScreen`, `AdminQuestionsPage` — receive `value/onChange/data` only.
- **Facades**: `queries.ts` `export { getPublishedChallenges } from "./service"` etc, `actions.ts` wraps `service.submitChallenge` with `authActionClient`.

## 2. Core Components

### 2.1 Frontend (Next.js 16 + shadcn/ui)
- Challenge browser (filter by category/difficulty)
- Code viewer with syntax highlighting + inline annotation for localization step
- Explanation text editor (root-cause step)
- Diff viewer for the fix step
- Results screen: score breakdown (localization / root cause / fix / prevention), hint penalties
- Leaderboard (Global & Category-specific filters)
- Profile/stats page: per-category weak-spot radar chart, streaks, and trend analysis
- Real-time Notifications: Notification bell for achievements, grading completion, and social activities

### 2.2 Server layer (Next.js Server Actions + `next-safe-action` + Drizzle)
- Auth (better-auth + Drizzle adapter; session identity bridged into Postgres RLS per request)
- Challenge CRUD (admin-only for manual authoring)
- Submission action: orchestrates validation → sandboxed test run → grading agent call → score computation
- Stats & Leaderboard actions (all-time, rolling seven-day, and category filters)
- Profile and admin operations through validated server actions
- Streak tracking on challenge activity; badges, social feeds, and push notifications are roadmap items

### 2.3 Data layer (Postgres 16)
- Single database for relational entities (users, challenges, submissions, notifications, social graph)
- No vector columns and no `pgvector` extension: grading uses the Groq LLM judge with a deterministic token-overlap fallback
- Avoids running/operating a separate vector database service

Points are derived from submission scores and challenge `buggyArtifact.points`;
the best attempt per challenge counts once. `users.current_rating` is a separate
rating field and is not used for profile totals or leaderboard points.

### 2.4 Redis
- Stores better-auth sessions and short-lived leaderboard cache entries.
- Grading runs in the server action flow; no BullMQ job queue is configured.

### 2.5 AI operations (Vercel AI SDK + Groq, server-only)
- **Question generator**: assists admins in drafting challenge content.
- **Root-cause grading**: the Groq judge scores explanations; when no API key is configured or the request fails, a deterministic token-overlap fallback runs.
- **Socratic hints**: generates a short hint from challenge context.
- Per-user provider/model/API-key settings and AI usage limits are roadmap work, not current behavior.

### 2.6 Sandboxed runner
- Docker-based isolated execution for validating a newly injected bug or running the user's submitted fix.
- Strict resource/time limits, no network access, ephemeral containers per run.

## 3. Request Flow — Submitting a Challenge Attempt

1. User submits localization answer, explanation, and proposed fix.
2. Server validates the fix compiles/runs (sandboxed runner), returns pass/fail on hidden tests.
3. Server calls the Groq grading judge with the explanation text + challenge ID (or the token-overlap fallback when unconfigured).
4. Composite score = localization + root-cause + fix + prevention − hint penalties.
5. Gamification Engine evaluates streak continuity, updates `user_category_stats` (avg time, trends, accuracy), and unlocks any new achievements.
6. Score persisted to `submissions`, notifications dispatched via SSE for grading completion and badges.

## 4. Non-Functional Considerations
- **Cost control**: LLM calls are the main variable cost — the deterministic token-overlap fallback grades offline for free when Groq is unconfigured. Per-user AI usage quotas are roadmap work (see `plan.md`).
- **Security**: sandbox isolation for any code execution is non-negotiable. AI API keys live server-side only and are never exposed to the client.
- **Auth**: handled by better-auth; the per-request user identity is bridged into Postgres RLS via `SET LOCAL "request.jwt.claims"` (see implementation_guide.md §6).
- **Scalability**: MVP scale relies on simple DB indexing. Real-time updates (SSE) handle async UI state cleanly without aggressive polling.
