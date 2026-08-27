# Tasks — Debug Arena (working title)

Scoped to Phase 0 + Phase 1 (manual MVP). Later-phase tasks live in plan.md until they're next up.

## Phase 0 — Foundation
- [ ] Init monorepo (pnpm + Turborepo) or single-repo NestJS+React split — decide structure
- [ ] Provision Postgres, enable `pgvector` extension
- [ ] Set up Drizzle schema + migrations for: `users`, `categories`, `challenges`, `hints`, `submissions`
- [ ] Set up ts-rest contract package shared between API and frontend
- [ ] Auth: integrate better-auth (drizzle adapter, /api/auth/* proxy controller, google+github OAuth, session guards, RLS bridge via SET LOCAL request.jwt.claims) + frontend auth flow with better-auth/client
- [ ] Migrate auth schema: extend users (uuid id, add emailVerified/name/image, map passwordHash), let better-auth own sessions/accounts/verifications; drop legacy oauth_accounts/email_verifications/password_resets; keep login_attempts (schema.ts + migrate.ts)
- [x] Resolve better-auth ↔ drizzle-orm peer conflict — RESOLVED 2026-08-25: workspace on drizzle-orm 0.45.2 (adapter peer match) + drizzle-kit 0.31.10; schema.ts extraConfig converted to object-return, native Drizzle `vector` used (npm pgvector pkg removed); lint/typecheck/build green
- [x] Add `@typescript/native-preview` to `apps/api` devDependencies so `tsgo --noEmit` typecheck runs (fixed 2026-08-25 along with: array→object extraConfig returns in schema.ts, missing `better-auth`/`@types/express` declarations, removal of nonexistent `pgvector/drizzle-orm` import — Drizzle has native `vector` since 0.31)
- [ ] CI: lint + typecheck + migration check on PR

## Phase 1 — Manual MVP

### Content
- [ ] Define challenge JSON schema for `buggy_artifact` and `reference_fix` (code_snippet format)
- [ ] Author 10 React-rendering challenges (stale closures, missing deps, key mismatches, unnecessary re-renders, missed cleanup)
- [ ] Author 10 backend-concurrency challenges (singleton/duplicate instance, race conditions, N+1 queries, connection pool exhaustion, deadlocks)
- [ ] Write canonical `root_cause_summary` + `prevention_notes` for each challenge
- [ ] Write 2–3 hidden tests per challenge for fix validation
- [ ] Write 2–3 Socratic hints per challenge (static list, adaptive agent comes later)

### Backend
- [ ] Challenge CRUD API (admin-only write, public read of published challenges)
- [ ] Submission endpoint: accept localization + explanation + fix
- [ ] Sandboxed runner: Docker-based isolated execution, resource/time limits, no network access
- [ ] Wire submission → sandbox test run → pass/fail result
- [ ] Grading job (BullMQ): compute embedding for explanation, pgvector cosine similarity against `challenges.root_cause_embedding`, call LLM judge for reasoning score
- [ ] Score composition logic: localization + root-cause + fix + prevention bonus − hint penalties
- [ ] Persist submission + update `user_category_stats`
- [ ] Leaderboard endpoint (all-time rollup, scheduled or on-read)

### Frontend
- [ ] Challenge browser page (filter by category/difficulty)
- [ ] Challenge screen: file tree + code viewer + line-click localization
- [ ] Explain / Fix / Hints tabbed panel
- [ ] Hint reveal UI showing point cost before reveal
- [ ] Submit flow with loading state during sandbox+grading
- [ ] Results screen: score breakdown, side-by-side user vs. canonical explanation, prevention section
- [ ] Profile/stats page: per-category score chart
- [ ] Leaderboard page

### AI Agents
- [ ] Grading agent prompt: canonical root cause + user explanation → score + short feedback
- [ ] Tune embedding-similarity threshold for "cheap pass" vs. "needs full LLM reasoning" fallback
- [ ] Cost-tracking on grading calls (log token usage per submission)

### QA / Launch readiness
- [ ] Security review of sandboxed runner (isolation, resource limits, no escape vectors)
- [ ] Manual playtest of all 20 challenges end-to-end (localization → explain → fix → results)
- [ ] Basic analytics: submissions per challenge, average score per challenge (catch broken/mis-calibrated challenges early)
