# Plan — Debug Arena (working title)

## Phase 0 — Foundation (setup)
- Repo scaffolding: NestJS + Drizzle + Postgres (with pgvector extension enabled), React + Vite + shadcn/ui, ts-rest contracts
- Auth (Passport-JWT)
- Base schema migration from ERD (users, categories, challenges, submissions, hints)

## Phase 1 — Manual MVP (validate the core loop before automating anything)
- Manually author ~20 challenges across 2 categories: React rendering + Node/backend concurrency, code_snippet format only
- Build the challenge screen, submission flow, and results screen (design.md sections 2–3)
- Ship the grading agent (embedding similarity + LLM judge) — this is the differentiator, it ships now, not later
- Sandboxed runner for fix validation (Docker isolation, hidden tests per challenge)
- Basic leaderboard (all-time only, skip weekly reset for v1)
- **Goal of this phase**: confirm the root-cause grading actually feels accurate and valuable to real users before investing in content-generation automation

## Phase 2 — Scale content
- Bug-injection agent: given a reference repo, auto-generate a challenge (bug + canonical fix + root-cause summary), verified via the sandboxed runner before publishing
- Admin review queue for AI-generated challenges before they go live (don't auto-publish unreviewed content initially)
- Expand categories: distributed/systems bugs (idempotency, cache invalidation, retry storms)
- Weekly leaderboard reset + per-category leaderboards

## Phase 3 — Differentiated modes
- "On-call / log-only" challenge format (no code shown, diagnose from logs/traces/metrics)
- Adaptive Socratic hint agent (replaces static hint lists)
- Weak-spot targeting: route users toward categories where their `user_category_stats` show low scores

## Phase 4 — Content supply at scale
- Postmortem-import agent: convert closed GitHub issues + their merge fixes into challenges automatically
- UI-recording challenge format (screen recording of buggy behavior, no code/logs shown at all)

## Sequencing Rationale
- Manual authoring first, automation second — the grading agent's quality is the actual product bet; validate it works before building expensive content-generation infrastructure around it.
- Security-sensitive sandboxed execution ships in Phase 1, not deferred — both bug-injection verification and fix-grading depend on it, so it can't be an afterthought.
- On-call/log-only mode and postmortem import are pushed later since they're bigger scope (log format-fidelity work) rather than pure engineering risk.

## Open Questions Feeding Into Later Phases
- B2B angle (bootcamps/training programs as buyers) vs. individual developer subscriptions — decide before Phase 2 content scaling, since it affects whether content should skew toward interview-prep style or on-the-job realism.
- Whether difficulty should be a fixed per-challenge label or a computed ELO-style value that shifts based on aggregate user performance.
