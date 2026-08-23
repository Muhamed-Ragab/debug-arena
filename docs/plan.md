# Plan — Debug Arena

## Phase 0 — Foundation (setup)
- Repo scaffolding: NestJS + Drizzle + Postgres (with pgvector), React + Vite + shadcn/ui, ts-rest contracts
- Auth (better-auth + Drizzle adapter; RLS bridged per request)
- Base schema migration (users, categories, challenges, submissions, hints, stats, leaderboards, notifications, social graph, gamification)

## Phase 1 — Manual MVP (Validate the Core Loop)
- Manually author ~20 challenges across 2 categories: React rendering + Node/backend concurrency (code_snippet format).
- Build the challenge screen, submission flow, and results screen.
- Ship the grading agent (embedding similarity + LLM judge).
- Sandboxed runner for fix validation (Docker isolation, hidden tests per challenge).
- Basic leaderboard (Global and Category-specific tabs).
- Profile Dashboard: Basic stats (avg time, avg score, radar charts).
- **Goal of this phase**: Confirm the root-cause grading feels accurate and valuable.

## Phase 2 — Gamification & Social (Retention Engine)
- Notifications UI and SSE real-time pushes.
- Streaks tracking (daily activity streaks).
- Achievements/Badges (e.g., "Bug Slayer" for 10 consecutive solves).
- Social features (Follow/Unfollow, friend leaderboards).
- Enhanced Profile: Trend tracking (improving vs weak spot) and root-cause accuracy percentages.

## Phase 3 — Scale Content
- Bug-injection agent: auto-generate challenges from a reference repo.
- Admin review queue for AI-generated challenges.
- Expand categories: distributed/systems bugs (idempotency, cache invalidation, retry storms).

## Phase 4 — Differentiated Modes & Supply
- "On-call / log-only" challenge format (diagnose from logs/traces).
- Adaptive Socratic hint agent (replaces static hint lists).
- Weak-spot targeting: route users toward categories based on their `weak_spot_rank`.
- Postmortem-import agent: convert closed GitHub issues into challenges.
- UI-recording challenge format.

## Sequencing Rationale
- Core gameplay (Phase 1) must be validated before adding gamification (Phase 2) or scaling content (Phase 3).
- Security-sensitive sandboxed execution is part of the foundation.
- Social and gamification elements (Phase 2) are moved up before mass content generation to ensure we have a retention loop for early adopters once the core mechanics are proven.

## Open Questions
- ELO-style dynamic difficulty scaling vs fixed challenge difficulties.
- B2B Bootcamps vs B2C developer subscriptions model influencing content style.