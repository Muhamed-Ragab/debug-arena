# Implementation Guide & Feature Breakdown

This document provides a senior-level technical breakdown of how each feature in Debug Arena will be implemented. It details the specific functions, order of execution, dependencies, and architectural feasibility before any code is written.

## 1. Rate Limiting, DDoS Prevention, and Retries
**Feasibility:** 100% (Native NestJS + Axios + BullMQ support)

### Backend (NestJS API)
- **Tooling:** `@nestjs/throttler` backed by Redis (`@nestjs/throttler-storage-redis`).
- **Implementation:**
  1. Register `ThrottlerModule.forRootAsync` pointing to our Redis instance.
  2. Apply `ThrottlerGuard` globally via `APP_GUARD`.
  3. Use `@Throttle({ default: { limit: X, ttl: Y } })` decorators on specific controllers (`AuthController` gets strict 5 req/15min, `ChallengesController` gets 60 req/1min).
- **Why:** Prevents brute force on login, limits expensive LLM grading calls, and prevents DB enumeration.

### Frontend (React + Vite)
- **Tooling:** Axios Interceptors or React Query (`@tanstack/react-query`).
- **Implementation:**
  1. React Query is configured with `retry: 3` and an exponential backoff function (`retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)`).
  2. If a request hits `429 Too Many Requests`, the Axios interceptor reads the `X-RateLimit-Reset` header and automatically waits before React Query retries.

### Background Jobs (BullMQ)
- **Tooling:** BullMQ Workers.
- **Implementation:** LLM and Sandbox jobs use `{ attempts: 3, backoff: { type: 'exponential', delay: 2000 } }`. If the Vercel AI SDK times out or the Sandbox fails ungracefully, BullMQ automatically retries without user intervention.

---

## 2. Pagination Strategies (Offset vs Cursor)
**Feasibility:** 100% (Native Drizzle Support via `.$dynamic()`)

We employ two distinct strategies depending on the API's UX requirements to ensure optimal DB performance.

### A. Offset/Limit Pagination (For Browsing & Jumping)
**Target APIs:** `/challenges`, `/leaderboard`
**Why:** Users often want to jump to a specific page (e.g., viewing ranks 100-120 on page 5).
**Implementation (`withOffsetPagination`):**
1. Contract accepts `page` and `limit`.
2. Drizzle calculates `offset = (page - 1) * limit`.
3. Fetch data via relational API (`db.query.challenges.findMany`).
4. Fetch aggregate count (`db.select({ count: count() })`).

### B. Cursor-Based Pagination (For Infinite Scroll & Performance)
**Target APIs:** `/notifications`, `/users/me/recent-submissions`
**Why:** These are time-series activity feeds. Using `OFFSET` on a table with 1M+ submissions gets progressively slower. Cursors use indexes (e.g., `createdAt`) to fetch the next batch instantly `WHERE createdAt < cursor`.
**Implementation (`withCursorPagination`):**
1. Contract accepts `cursor` (a timestamp string) and `limit`.
2. **Drizzle Layer:**
   ```typescript
   let query = db.query.submissions.findMany({
     where: cursor ? lt(submissions.createdAt, new Date(cursor)) : undefined,
     orderBy: [desc(submissions.createdAt)],
     limit: limit
   });
   ```
3. Return the `nextCursor` as the `createdAt` value of the last item in the returned array.

---

## 3. Notifications (SSE + SMTP Email Fallback)
**Feasibility:** 100% (NestJS `@Sse()`, `EventEmitter2`, `Nodemailer`)

### Components
- `NotificationsService`: Handles persisting notifications to the DB.
- `EmailService`: Wraps Nodemailer. Configured with Ethereal Email (test SMTP) for Phase 1.
- `SseController`: Maintains active client connections.
- `EventEmitter2`: Decouples module logic from notification dispatch.

### Execution Flow
Let's trace what happens when an async grading job completes:

1. **`GradingProcessor` (BullMQ Worker) finishes grading.**
2. It fires an event: `eventEmitter.emit('grading.completed', { userId, submissionId, score })`.
3. **`NotificationsService` listener catches the event.**
   - Action A: Inserts a new row into the `notifications` table (`type: 'challenge'`).
4. **`SseController` listener catches the event.**
   - Checks if `userId` is currently in the active SSE Connections Map.
   - If **YES**: Sends a JSON event down the active HTTP stream. The React frontend receives it and updates the `NotificationBell` context.
5. **`EmailService` listener catches the event.**
   - Checks user preferences (and if they were disconnected from SSE).
   - Compiles an HTML template ("Your challenge score is ready! You got a 92/100.").
   - Dispatches via `nodemailer.sendMail()`.

---

## 4. Gamification (Streaks & Achievements)
**Feasibility:** 100%

### Execution Flow (Post-Submission)
Triggered via event `eventEmitter.emit('submission.created', { userId })`

1. **`GamificationService.evaluateStreak(userId)`:**
   - Fetches the user's `last_activity_date` and `streak_count`.
   - **Logic Check:**
     - If `last_activity_date` is *yesterday*: `streak_count += 1`.
     - If `last_activity_date` is *today*: Do nothing (already counted).
     - If `last_activity_date` is *older than yesterday*: Reset `streak_count = 1`.
   - Update `users` table with the new date and streak.
   - If the streak hit a milestone (e.g., 7 days), emit an achievement event.

2. **`GamificationService.evaluateAchievements(userId, submission)`:**
   - Evaluates rule-based triggers. E.g., for "Bug Slayer" (10 consecutive concurrency bugs):
     - Relational Query: 
       ```typescript
       const recentSubmits = await db.query.submissions.findMany({
         where: and(eq(submissions.userId, userId), eq(submissions.categorySlug, 'concurrency')),
         orderBy: [desc(submissions.createdAt)],
         limit: 10
       });
       ```
     - Are all 10 `fixCorrect == true`?
     - Has this user already unlocked this achievement? (Check `user_achievements` table).
   - If unlocked:
     - Insert into `user_achievements`.
     - Emit `achievement.unlocked` event (which flows into the Notification system to alert via SSE and Email).

---

## 5. Async Submission & Sandboxed Runner
**Feasibility:** 100% (BullMQ + Docker SDK or isolated Node `vm` for MVP)

### Execution Flow
1. **`SubmissionsController.submit`** receives the user's explanation and fix.
2. **`SandboxService.run` (Synchronous Pre-Check):**
   - Writes the user's fix to a temporary dir.
   - Spawns an isolated Docker container with strict constraints (`--network none`, `--cpus=0.5`, `-m 128m`).
   - Runs `npm test` on the hidden tests.
   - Retrieves the exit code and logs.
3. **Database Insert:**
   - Inserts the submission row into Postgres with `fix_correct` populated, but `root_cause_score = null`.
4. **Enqueue Grading:**
   - `gradingQueue.add('grade_submission', { submissionId })` is dispatched to BullMQ.
5. **Controller Response:**
   - Responds immediately with `{ success: true, data: { status: "Grading in progress", fixCorrect: true } }`.
6. **Background Worker (`GradingProcessor`):**
   - Computes pgvector embedding for the user's explanation.
   - Queries Postgres for cosine similarity against `challenges.root_cause_embedding`.
   - Passes the text and similarity metadata to Vercel AI SDK (Anthropic model).
   - Updates `submissions` table with final score.
   - Emits `grading.completed` event (triggering SSE and Emails).

---

## 6. Authentication (better-auth)
**Feasibility:** 100% (`better-auth` + `@better-auth/drizzle-adapter` + Postgres/pg + NestJS `toNodeHandler`)

We adopt **better-auth** instead of hand-rolling Passport/JWT/session logic. It provides battle-tested credential + OAuth login, DB-backed sessions with revocation and device listing, email verification, and password reset out of the box. We preserve our Postgres **RLS** security model by bridging the session identity into the `request.jwt.claim.sub` GUC per request (see RLS Bridge).

### Mounting in NestJS
better-auth is framework-agnostic. Mount its Node handler on a catch-all auth route and let it own `/api/auth/*` (sign-up, sign-in, OAuth callback, session list/revoke, email verification, password reset). No manual controller methods are required beyond the proxy:
```ts
// apps/api/src/modules/auth/auth.controller.ts
import { All, Controller, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./auth";

@Controller("api/auth")
export class AuthController {
  @All("*")
  async handle(@Req() req: Request, @Res() res: Response) {
    return toNodeHandler(auth)(req, res);
  }
}
```

### Drizzle adapter + schema
```ts
// apps/api/src/modules/auth/auth.ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { db } from "@debug-arena/db";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  socialProviders: {
    google: { clientId: process.env.GOOGLE_CLIENT_ID!, clientSecret: process.env.GOOGLE_CLIENT_SECRET! },
    github: { clientId: process.env.GITHUB_CLIENT_ID!, clientSecret: process.env.GITHUB_CLIENT_SECRET! },
  },
  session: { expiresIn: 60 * 60 * 24 * 30, updateAge: 60 * 60 * 24 }, // 30d session, sliding 1d refresh
  advanced: { generateId: () => crypto.randomUUID() }, // keep users.id as uuid
});
```
We keep our `users` table (uuid PK) extended with better-auth's expected columns and let better-auth own `sessions`, `accounts`, and `verifications` via the adapter. Our legacy `oauth_accounts`, `email_verifications`, and `password_resets` tables are superseded by better-auth's `accounts`/`verifications`; `login_attempts` stays as a custom audit/rate-limit table (better-auth has no built-in equivalent). See `erd.md` for the mapped schema.

> **Schema change required:** `packages/db/src/schema.ts` and `migrate.ts` must be updated to the better-auth tables (tracked in `tasks.md` Phase 0). This document change does not modify code.

### RLS Bridge (CRITICAL)
Our RLS policies key on `request.jwt.claim.sub`. better-auth issues **opaque session tokens**, not Postgres JWTs, so that GUC is empty unless we populate it. Bridge it in a NestJS guard/interceptor that runs before any DB access:
```ts
const session = await auth.api.getSession({ headers: req.headers });
if (session) {
  await db.execute(sql`SET LOCAL "request.jwt.claims" = ${JSON.stringify({ sub: session.user.id, role: session.user.role })}::json`);
}
```
This keeps every existing RLS policy (users, submissions, sessions, accounts, verifications, analytics) working unchanged. Scope the `SET LOCAL` to the request transaction and reset it afterward (per-request Drizzle transaction or middleware that clears the GUC). Anonymous requests set no claim, so policies that allow public reads still apply.

### Session Guards
- `BetterAuthSessionGuard` calls `auth.api.getSession({ headers })`; on success it sets the RLS claim and attaches `req.user`. A missing/dead session (better-auth deletes revoked rows) → `401`.
- `OptionalBetterAuthSessionGuard` runs the same check but passes through when unauthenticated (challenge browser for anonymous reads).
- `RolesGuard` reads `session.user.role` for admin routes (challenge authoring, bug-injection review).

### What we no longer hand-write
- Password hashing (argon2/bcrypt handled by better-auth)
- Refresh-token rotation (replaced by better-auth sliding sessions + `updateAge`)
- OAuth callback / state / PKCE (handled by `socialProviders`)
- Email verification + password-reset token machinery (handled by the `verifications` table)

---

## 7. pgvector RAG
**Feasibility:** 100% (Postgres `pgvector` extension, already provisioned in `docker-compose.yml`)

The grading pipeline uses retrieval over stored embeddings as a cheap first-pass signal before the LLM judge runs. The `challenges` table carries `root_cause_embedding vector(1536)` and `submissions` carries `root_cause_embedding vector(1536)`. We populate the challenge side at authoring time and query it with cosine distance during grading.

### Populating `challenge_embeddings`
The term `challenge_embeddings` refers to the `root_cause_embedding` column on `challenges`, populated whenever a challenge is created or updated:

1. **Manual authoring:** An admin saves a challenge with a `root_cause_summary`. `ChallengesService` embeds that summary through the Vercel AI SDK embedding model (1536-dim, matching the column) and writes it back in the same transaction.
2. **AI-generated challenges:** The bug-injection agent produces `root_cause_summary` as part of its output. Before the challenge is published, `ChallengesService.embedRootCause(challengeId)` runs so the vector is never null at grading time.
3. **Postmortem import:** The postmortem-import agent reverse-engineers a summary from a GitHub issue; the same embed step applies.
4. **Index:** We create an IVFFlat index on `root_cause_embedding` with a cosine-distance operator class (`vector_cosine_ops`) so nearest-neighbor lookups stay fast as the challenge count grows.

### Querying with Cosine Distance
pgvector exposes cosine distance through the `<=>` operator, where `0` means identical and `1` means orthogonal. The grading worker uses it like this:

```typescript
const similar = await db.execute(sql`
  SELECT id, title, 1 - (root_cause_embedding <=> ${userEmbedding}) AS distance
  FROM challenges
  WHERE id != ${challengeId}
  ORDER BY root_cause_embedding <=> ${userEmbedding}
  LIMIT 5
`);
```

- The user's `root_cause_embedding` is computed at submission time (see section 5, step 6) from their free-text explanation.
- We compare the user's vector against the current challenge's canonical vector to get a similarity score, and against the top neighbors to detect near-duplicate reasoning patterns.
- The resulting cosine distance is normalized into a 0 to 100 sub-score that feeds the composite grade, giving us a deterministic, low-cost signal before the LLM judge scores reasoning quality.
- Because the embedding lookup is a plain SQL query, it costs a fraction of an LLM call and acts as the cost-control gate described in `architecture.md §4`.

---

## 8. Email Templates
**Feasibility:** 100% (Postgres-backed templates + Drizzle fetch + Nodemailer render)

Rather than hardcoding email bodies in the `EmailService`, we store templates in the database so non-engineers can tweak copy without a deploy. The `EmailService` fetches a template by slug and renders it with per-event variables.

### Schema
- `email_templates`: Versioned, slug-addressed templates.
  | Field | Type | Notes |
  |---|---|---|
  | id | uuid PK | |
  | slug | text unique | e.g. `grading_completed`, `achievement_unlocked` |
  | subject | text | Supports `{{variable}}` tokens |
  | html_body | text | HTML version sent to mail clients |
  | text_body | text | Plain-text fallback |
  | variables | jsonb | Declared variable names for validation |
  | is_active | boolean | Only one active template per slug at a time |
  | created_at | timestamptz | |

### Fetch and Render Flow
1. **`EmailService.getTemplate(slug)`:** Runs a Drizzle query for the active row matching the slug. We cache the result in memory (TTL 5 minutes) so a burst of grading-completed emails doesn't hit Postgres on every send.
2. **`EmailService.render(template, vars)`:** Substitutes `{{variable}}` tokens in `subject`, `html_body`, and `text_body`. Missing variables throw before send, so a broken template fails loud instead of shipping a half-rendered email.
3. **Dispatch:** The notification listeners from section 3 call `EmailService.send({ to, slug, vars })`. For example, the `grading.completed` event passes `{ username, score, challengeTitle }`, which fill the `grading_completed` template.
4. **Fallback:** If a slug has no active template (e.g. a new event type before its template is authored), `EmailService` logs a warning and skips send rather than crashing the notification pipeline.
5. **Localization hook:** Because templates live in the DB, we can later add a `locale` column and pick the row by user preference without touching `EmailService` code.