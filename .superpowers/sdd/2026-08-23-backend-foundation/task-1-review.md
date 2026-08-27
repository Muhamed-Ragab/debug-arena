### Commits

20e85da chore: update AGENTS.md rules
86c8696 refactor(contracts): isolate Zod schemas into .schema.ts files

### Stat

 AGENTS.md                                      |  6 ++++
 packages/contracts/src/auth.contract.ts        | 26 +++++++--------
 packages/contracts/src/auth.schema.ts          | 25 ++++++++++++++
 packages/contracts/src/challenges.contract.ts  | 39 +++++++---------------
 packages/contracts/src/challenges.schema.ts    | 45 ++++++++++++++++++++++++++
 packages/contracts/src/index.ts                |  5 ++-
 packages/contracts/src/submissions.contract.ts | 29 ++++-------------
 packages/contracts/src/submissions.schema.ts   | 30 +++++++++++++++++
 8 files changed, 139 insertions(+), 66 deletions(-)

### Diff

diff --git a/AGENTS.md b/AGENTS.md
index 7cb9768..1a46e17 100644
--- a/AGENTS.md
+++ b/AGENTS.md
@@ -105,10 +105,16 @@ Scaffold phase — all module/service files contain `TODO` stubs. No tests exist
 | `implementation_guide.md` | Senior-level technical breakdown for: rate limiting (`@nestjs/throttler` + Redis), pagination (offset vs cursor strategies with Drizzle code), SSE notifications + email fallback, gamification engine (streaks + achievements), async submission + sandbox flow, Auth via better-auth (DB sessions, google+github OAuth, RLS bridge); session guards detailed in `implementation_guide.md §6`, pgvector RAG grading pipeline, email templates | **Primary reference when implementing any feature** — has exact function signatures, execution flows, and code patterns |
 | `API.md` | Full endpoint reference: paths, methods, request/response shapes, rate limits per endpoint, pagination strategy per endpoint (offset vs cursor), global response envelope `{ success, data, error, meta }` | Implementing any controller or frontend API integration |
 
 ### Key cross-doc patterns
 
 - **Response envelope**: All API responses use `{ success, data, error, meta }` — see `API.md`
 - **Pagination**: Offset for browseable lists (`/challenges`, `/leaderboard`), cursor for feeds (`/notifications`, `/recent-submissions`) — strategies detailed in `implementation_guide.md §2`, endpoint mapping in `API.md`
 - **Async grading flow**: Submission → sandbox test run (sync) → BullMQ grading job (async) → SSE push on completion — full trace in `implementation_guide.md §5`, architecture context in `architecture.md §2.4`
 - **Auth guards**: `BetterAuthSessionGuard` (requires auth), `OptionalBetterAuthSessionGuard` (passes anonymous), `RolesGuard` (admin-only) — detailed in `implementation_guide.md §6`
 - **Rate limits**: Per-endpoint limits defined in `API.md`, implementation approach in `implementation_guide.md §1`
+
+## TypeScript Strictness
+- **NEVER use 'any' type.**
+- Always set strict types for all variables, parameters, and function return values.
+- Use explicit interfaces or Zod schema inference for payloads.
+- No implicit 'any'; if a type is unknown, use 'unknown' and narrow it down.
diff --git a/packages/contracts/src/auth.contract.ts b/packages/contracts/src/auth.contract.ts
index 6b19ecf..31dfe01 100644
--- a/packages/contracts/src/auth.contract.ts
+++ b/packages/contracts/src/auth.contract.ts
@@ -1,32 +1,30 @@
 import { initContract } from "@ts-rest/core";
-import { z } from "zod";
+import {
+  RegisterBodySchema,
+  LoginBodySchema,
+  AuthTokenResponseSchema,
+  AuthErrorResponseSchema,
+} from "./auth.schema";
 
 const c = initContract();
 
 export const authContract = c.router({
   register: {
     method: "POST",
     path: "/auth/register",
-    body: z.object({
-      email: z.string().email(),
-      username: z.string().min(3),
-      password: z.string().min(8),
-    }),
+    body: RegisterBodySchema,
     responses: {
-      201: z.object({ token: z.string() }),
-      409: z.object({ message: z.string() }),
+      201: AuthTokenResponseSchema,
+      409: AuthErrorResponseSchema,
     },
   },
   login: {
     method: "POST",
     path: "/auth/login",
-    body: z.object({
-      email: z.string().email(),
-      password: z.string(),
-    }),
+    body: LoginBodySchema,
     responses: {
-      200: z.object({ token: z.string() }),
-      401: z.object({ message: z.string() }),
+      200: AuthTokenResponseSchema,
+      401: AuthErrorResponseSchema,
     },
   },
 });
diff --git a/packages/contracts/src/auth.schema.ts b/packages/contracts/src/auth.schema.ts
new file mode 100644
index 0000000..50c4728
--- /dev/null
+++ b/packages/contracts/src/auth.schema.ts
@@ -0,0 +1,25 @@
+import { z } from "zod";
+
+export const RegisterBodySchema = z.object({
+  email: z.string().email(),
+  username: z.string().min(3),
+  password: z.string().min(8),
+});
+
+export const LoginBodySchema = z.object({
+  email: z.string().email(),
+  password: z.string(),
+});
+
+export const AuthTokenResponseSchema = z.object({
+  token: z.string(),
+});
+
+export const AuthErrorResponseSchema = z.object({
+  message: z.string(),
+});
+
+export type RegisterBody = z.infer<typeof RegisterBodySchema>;
+export type LoginBody = z.infer<typeof LoginBodySchema>;
+export type AuthTokenResponse = z.infer<typeof AuthTokenResponseSchema>;
+export type AuthErrorResponse = z.infer<typeof AuthErrorResponseSchema>;
diff --git a/packages/contracts/src/challenges.contract.ts b/packages/contracts/src/challenges.contract.ts
index b0d6248..1333202 100644
--- a/packages/contracts/src/challenges.contract.ts
+++ b/packages/contracts/src/challenges.contract.ts
@@ -1,47 +1,30 @@
 import { initContract } from "@ts-rest/core";
-import { z } from "zod";
+import {
+  ChallengeListQuerySchema,
+  ChallengeListResponseSchema,
+  ChallengeDetailPathParamsSchema,
+  ChallengeDetailSchema,
+  ChallengeDetailErrorSchema,
+} from "./challenges.schema";
 
 const c = initContract();
 
-export const ChallengeSummarySchema = z.object({
-  id: z.string().uuid(),
-  title: z.string(),
-  categorySlug: z.string(),
-  difficulty: z.enum(["easy", "medium", "hard"]),
-  format: z.enum(["code_snippet", "log_only", "ui_recording"]),
-});
-
-export const ChallengeDetailSchema = ChallengeSummarySchema.extend({
-  prompt: z.string(),
-  buggyArtifact: z.unknown(), // shape varies by format — refine per-format later
-  hints: z.array(
-    z.object({
-      id: z.string().uuid(),
-      order: z.number(),
-      penaltyPoints: z.number(),
-    })
-  ),
-});
-
 export const challengesContract = c.router({
   list: {
     method: "GET",
     path: "/challenges",
-    query: z.object({
-      category: z.string().optional(),
-      difficulty: z.enum(["easy", "medium", "hard"]).optional(),
-    }),
+    query: ChallengeListQuerySchema,
     responses: {
-      200: z.array(ChallengeSummarySchema),
+      200: ChallengeListResponseSchema,
     },
   },
   detail: {
     method: "GET",
     path: "/challenges/:id",
-    pathParams: z.object({ id: z.string().uuid() }),
+    pathParams: ChallengeDetailPathParamsSchema,
     responses: {
       200: ChallengeDetailSchema,
-      404: z.object({ message: z.string() }),
+      404: ChallengeDetailErrorSchema,
     },
   },
 });
diff --git a/packages/contracts/src/challenges.schema.ts b/packages/contracts/src/challenges.schema.ts
new file mode 100644
index 0000000..4873f31
--- /dev/null
+++ b/packages/contracts/src/challenges.schema.ts
@@ -0,0 +1,45 @@
+import { z } from "zod";
+
+export const ChallengeSummarySchema = z.object({
+  id: z.string().uuid(),
+  title: z.string(),
+  categorySlug: z.string(),
+  difficulty: z.enum(["easy", "medium", "hard"]),
+  format: z.enum(["code_snippet", "log_only", "ui_recording"]),
+});
+
+export const ChallengeDetailSchema = ChallengeSummarySchema.extend({
+  prompt: z.string(),
+  buggyArtifact: z.unknown(), // shape varies by format — refine per-format later
+  hints: z.array(
+    z.object({
+      id: z.string().uuid(),
+      order: z.number(),
+      penaltyPoints: z.number(),
+    })
+  ),
+});
+
+export const ChallengeListQuerySchema = z.object({
+  category: z.string().optional(),
+  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
+});
+
+export const ChallengeDetailPathParamsSchema = z.object({
+  id: z.string().uuid(),
+});
+
+export const ChallengeListResponseSchema = z.array(ChallengeSummarySchema);
+
+export const ChallengeDetailErrorSchema = z.object({
+  message: z.string(),
+});
+
+export type ChallengeSummary = z.infer<typeof ChallengeSummarySchema>;
+export type ChallengeDetail = z.infer<typeof ChallengeDetailSchema>;
+export type ChallengeListQuery = z.infer<typeof ChallengeListQuerySchema>;
+export type ChallengeDetailPathParams = z.infer<
+  typeof ChallengeDetailPathParamsSchema
+>;
+export type ChallengeListResponse = z.infer<typeof ChallengeListResponseSchema>;
+export type ChallengeDetailError = z.infer<typeof ChallengeDetailErrorSchema>;
diff --git a/packages/contracts/src/index.ts b/packages/contracts/src/index.ts
index e38994b..9032e5a 100644
--- a/packages/contracts/src/index.ts
+++ b/packages/contracts/src/index.ts
@@ -1,3 +1,6 @@
+export * from "./auth.schema";
+export * from "./challenges.schema";
+export * from "./submissions.schema";
+export * from "./auth.contract";
 export * from "./challenges.contract";
 export * from "./submissions.contract";
-export * from "./auth.contract";
diff --git a/packages/contracts/src/submissions.contract.ts b/packages/contracts/src/submissions.contract.ts
index fe1ab3b..4e1a26a 100644
--- a/packages/contracts/src/submissions.contract.ts
+++ b/packages/contracts/src/submissions.contract.ts
@@ -1,37 +1,20 @@
 import { initContract } from "@ts-rest/core";
-import { z } from "zod";
+import {
+  SubmitAttemptSchema,
+  SubmissionResultSchema,
+  SubmissionErrorSchema,
+} from "./submissions.schema";
 
 const c = initContract();
 
-export const SubmitAttemptSchema = z.object({
-  challengeId: z.string().uuid(),
-  localizationAnswer: z.string().optional(),
-  rootCauseExplanation: z.string(),
-  proposedFix: z.unknown(),
-  preventionAnswer: z.string().optional(),
-  hintsUsed: z.number().default(0),
-  timeSpentSeconds: z.number().optional(),
-});
-
-export const SubmissionResultSchema = z.object({
-  id: z.string().uuid(),
-  localizationCorrect: z.boolean().nullable(),
-  rootCauseScore: z.number().nullable(),
-  fixCorrect: z.boolean().nullable(),
-  preventionScore: z.number().nullable(),
-  totalScore: z.number().nullable(),
-  canonicalRootCauseSummary: z.string(),
-  feedback: z.string().optional(),
-});
-
 export const submissionsContract = c.router({
   submit: {
     method: "POST",
     path: "/submissions",
     body: SubmitAttemptSchema,
     responses: {
       201: SubmissionResultSchema,
-      400: z.object({ message: z.string() }),
+      400: SubmissionErrorSchema,
     },
   },
 });
diff --git a/packages/contracts/src/submissions.schema.ts b/packages/contracts/src/submissions.schema.ts
new file mode 100644
index 0000000..fe4af06
--- /dev/null
+++ b/packages/contracts/src/submissions.schema.ts
@@ -0,0 +1,30 @@
+import { z } from "zod";
+
+export const SubmitAttemptSchema = z.object({
+  challengeId: z.string().uuid(),
+  localizationAnswer: z.string().optional(),
+  rootCauseExplanation: z.string(),
+  proposedFix: z.unknown(),
+  preventionAnswer: z.string().optional(),
+  hintsUsed: z.number().default(0),
+  timeSpentSeconds: z.number().optional(),
+});
+
+export const SubmissionResultSchema = z.object({
+  id: z.string().uuid(),
+  localizationCorrect: z.boolean().nullable(),
+  rootCauseScore: z.number().nullable(),
+  fixCorrect: z.boolean().nullable(),
+  preventionScore: z.number().nullable(),
+  totalScore: z.number().nullable(),
+  canonicalRootCauseSummary: z.string(),
+  feedback: z.string().optional(),
+});
+
+export const SubmissionErrorSchema = z.object({
+  message: z.string(),
+});
+
+export type SubmitAttempt = z.infer<typeof SubmitAttemptSchema>;
+export type SubmissionResult = z.infer<typeof SubmissionResultSchema>;
+export type SubmissionError = z.infer<typeof SubmissionErrorSchema>;
