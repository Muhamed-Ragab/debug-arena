# Architecture — Debug Arena

> **MIGRATION NOTE (2026-08-26):** The NestJS API and Vite SPA are being replaced by a single
> Next.js 16 app (see docs/superpowers/plans/2026-08-26-nextjs-migration.md). Sections describing
> `apps/api` modules apply to their Next.js equivalents: controllers → route handlers/server actions,
> guards → `auth.api.getSession` + `proxy.ts`, AuthModule mount `/auth` → `/api/auth/[...all]`.
> Data layer (Drizzle/pgvector/RLS), job queue design, sandbox model are unchanged conceptually.

## 1. High-Level Overview

```
┌─────────────┐      ┌──────────────────┐      ┌─────────────────────┐
│  React SPA  │ <──> │  NestJS API      │ <──> │  Postgres + pgvector │
│ (Vite,      │ (SSE)│  (ts-rest        │      │  (relational data +  │
│  shadcn/ui) │      │   contracts)     │      │   embeddings)        │
└─────────────┘      └──────────────────┘      └─────────────────────┘
                             │
                             ▼
                      ┌──────────────┐
                      │ BullMQ+Redis │
                      │ job queue    │
                      └──────────────┘
                             │
              ┌──────────────┼──────────────────┐
              ▼              ▼                  ▼
     ┌─────────────┐ ┌───────────────┐ ┌──────────────────┐
     │ Bug-Injection│ │ Grading Agent │ │ Sandboxed Runner  │
     │ Agent (LLM)  │ │ (LLM judge)   │ │ (Docker, isolated)│
     └─────────────┘ └───────────────┘ └──────────────────┘
              │              │                  │
              └──────────────┴──────────────────┘
                        Vercel AI SDK
                     (model orchestration)
```

## 2. Core Components

### 2.1 Frontend (React + Vite + shadcn/ui)
- Challenge browser (filter by category/difficulty)
- Code viewer with syntax highlighting + inline annotation for localization step
- Explanation text editor (root-cause step)
- Diff viewer for the fix step
- Results screen: score breakdown (localization / root cause / fix / prevention), hint penalties
- Leaderboard (Global & Category-specific filters)
- Profile/stats page: per-category weak-spot radar chart, streaks, and trend analysis
- Real-time Notifications: Notification bell for achievements, grading completion, and social activities

### 2.2 API layer (NestJS + ts-rest + Drizzle)
- Auth (better-auth + Drizzle adapter; session identity bridged into Postgres RLS per request)
- Challenge CRUD (admin-only for manual authoring)
- Submission endpoint: orchestrates validation → sandboxed test run → grading agent call → score computation
- Stats & Leaderboard endpoints (supports category filters and streak calculations)
- Gamification Engine: Checks conditions for badges/achievements and streak continuity on submission
- Social endpoints (follow/unfollow users)
- Real-time push (SSE/WebSockets) for async grading results and new notifications

### 2.3 Data layer (Postgres + pgvector)
- Single database for relational entities (users, challenges, submissions, notifications, social graph) and vector columns
- pgvector cosine similarity used as one signal in grading
- Avoids running/operating a separate vector database service

### 2.4 Job queue (BullMQ + Redis)
- **Bug-injection jobs**: given a reference repo + category + difficulty, an agent generates a modified version of the code with an injected bug, canonical fix, and root-cause summary.
- **Grading jobs**: submission arrives → queue a grading job. UI gets an SSE push when the score is ready.
- **Sandbox test-run jobs**: user's proposed fix is applied to the challenge's code and run against hidden tests in an isolated container.

### 2.5 AI agents (Vercel AI SDK)
- **Bug-injection agent**: takes clean reference code, injects a bug matching the requested category/difficulty, verifies the bug reproduces (via the sandbox).
- **Root-cause grading agent**: computes grading score against canonical root cause utilizing pgvector pre-checks.
- **Adaptive hint agent**: generates the next Socratic hint based on user's current context.
- **Postmortem-import agent**: reverse-engineers a challenge from a closed GitHub issue.

### 2.6 Sandboxed runner
- Docker-based isolated execution for validating a newly injected bug or running the user's submitted fix.
- Strict resource/time limits, no network access, ephemeral containers per run.

## 3. Request Flow — Submitting a Challenge Attempt

1. User submits localization answer, explanation, and proposed fix.
2. API validates the fix compiles/runs (sandboxed runner), returns pass/fail on hidden tests.
3. API enqueues a grading job with the explanation text + challenge ID.
4. Grading agent computes embedding, compares via pgvector, and asks LLM judge to score reasoning quality.
5. Composite score = localization + root-cause + fix + prevention − hint penalties.
6. Gamification Engine evaluates streak continuity, updates `user_category_stats` (avg time, trends, accuracy), and unlocks any new achievements.
7. Score persisted to `submissions`, notifications dispatched via SSE for grading completion and badges.

## 4. Non-Functional Considerations
- **Cost control**: LLM calls are the main variable cost — use embedding similarity as a cheap first-pass filter.
- **Security**: sandbox isolation for any code execution is non-negotiable.
- **Auth**: handled by better-auth; the per-request user identity is bridged into Postgres RLS via `SET LOCAL "request.jwt.claims"` (see implementation_guide.md §6).
- **Scalability**: MVP scale relies on flat scan for pgvector and simple DB indexing. Real-time updates (SSE) handle async UI state cleanly without aggressive polling.