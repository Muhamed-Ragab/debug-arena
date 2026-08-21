# Architecture — Debug Arena (working title)

## 1. High-Level Overview

```
┌─────────────┐      ┌──────────────────┐      ┌─────────────────────┐
│  React SPA  │ <──> │  NestJS API      │ <──> │  Postgres + pgvector │
│ (Vite,      │      │  (ts-rest        │      │  (relational data +  │
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
- Leaderboard, profile/stats page (per-category weak-spot chart)

### 2.2 API layer (NestJS + ts-rest + Drizzle)
- Auth (Passport-JWT, consistent with prior stack decisions)
- Challenge CRUD (admin-only for manual authoring)
- Submission endpoint: orchestrates validation → sandboxed test run → grading agent call → score computation
- Stats endpoints for leaderboard and per-user category breakdown
- Job-trigger endpoints for bug-injection requests (admin/internal)

### 2.3 Data layer (Postgres + pgvector)
- Single database for relational entities and vector columns (see ERD)
- pgvector cosine similarity used as one signal in grading, not the sole grader
- Avoids running/operating a separate vector database service

### 2.4 Job queue (BullMQ + Redis)
- **Bug-injection jobs**: given a reference repo + category + difficulty, an agent generates a modified version of the code with an injected bug, plus the canonical fix and root-cause summary. Runs async since it involves LLM calls + validation.
- **Grading jobs**: submission arrives → queue a grading job so the user isn't blocked on LLM latency; UI polls or gets a websocket/SSE push when the score is ready.
- **Sandbox test-run jobs**: user's proposed fix is applied to the challenge's code and run against hidden tests in an isolated container.

### 2.5 AI agents (Vercel AI SDK)
- **Bug-injection agent**: takes clean reference code, injects a bug matching the requested category/difficulty, verifies the bug actually reproduces (via the sandboxed runner) before publishing the challenge.
- **Root-cause grading agent**: given the user's free-text explanation + the canonical root-cause summary + pgvector similarity score, produces a 0–100 score and short feedback. Uses the embedding similarity as a fast pre-check, falls back to full LLM reasoning for borderline cases (cost control).
- **Adaptive hint agent**: generates the next Socratic hint based on how many the user has already used and what they've written so far, rather than serving a fixed static hint list.
- **Postmortem-import agent** (later phase): given a closed GitHub issue + its merge fix, reverse-engineers a challenge (buggy artifact + canonical fix + root cause summary).

### 2.6 Sandboxed runner
- Docker-based isolated execution for: (a) validating a newly injected bug actually reproduces, (b) running the user's submitted fix against hidden tests.
- Strict resource/time limits, no network access, ephemeral containers per run — this is the highest-risk component from a security standpoint and deserves the most scrutiny before launch.

## 3. Request Flow — Submitting a Challenge Attempt

1. User submits localization answer, explanation, and proposed fix.
2. API validates the fix compiles/runs (sandboxed runner), returns pass/fail on hidden tests.
3. API enqueues a grading job with the explanation text + challenge ID.
4. Grading agent computes an embedding for the explanation, compares to `challenges.root_cause_embedding` via pgvector, and asks the LLM judge to score reasoning quality against the canonical root cause.
5. Composite score = localization (weighted) + root-cause score (weighted highest) + fix correctness + prevention bonus − hint penalties.
6. Score persisted to `submissions`, `user_category_stats` updated, leaderboard rollup refreshed on a schedule (not synchronously).

## 4. Non-Functional Considerations
- **Cost control**: LLM calls are the main variable cost — use embedding similarity as a cheap first-pass filter before invoking the full grading LLM call, and cache/reuse bug-injection outputs across users for the same challenge.
- **Security**: sandbox isolation for any code execution is non-negotiable; never execute user-submitted code outside the sandboxed runner.
- **Scalability**: MVP scale doesn't need pgvector's ANN indexes (ivfflat/hnsw) — flat scan is fine under a few hundred challenges; add indexing once challenge count grows.
