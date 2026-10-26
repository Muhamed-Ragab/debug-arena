# Bring Your Own Key (BYOK) & Multi-Model Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable users to configure their own AI providers (Anthropic, OpenAI, Groq, Google Gemini) with AES-256-GCM encrypted API keys, custom/recommended model selection, live connection testing, and Redis-enforced rate limits (RPM) & daily usage quotas with graceful platform defaults.

**Architecture:** Encrypted API keys are stored in a dedicated `user_api_keys` Postgres table via Node.js AES-256-GCM ciphering, with active preferences in `user_ai_settings`. Decryption happens strictly server-side inside `src/lib/ai/` right before provider invocation. A unified Vercel AI SDK client dynamically routes requests to the selected provider. Redis enforces sliding-window/TTL-based RPM limits (5 for platform, 30 for BYOK) and daily evaluation quotas (15 for platform, unmetered for BYOK). The Challenge Workspace surfaces the active model, and the User Settings panel provides full key lifecycle management, live connection testing, and usage gauges.

**Tech Stack:** Next.js 16 (App Router), `@ai-sdk/openai`, `@ai-sdk/anthropic`, `@ai-sdk/google`, `@ai-sdk/groq`, `ai`, `drizzle-orm`, `ioredis`, Node.js `node:crypto`, `zod`, `next-safe-action`, Base UI + Tailwind CSS v4.

---

## Global Constraints

- **Language:** English-only user-facing copy and code comments.
- **Security:** Plaintext API keys must NEVER be logged, never sent to client components, and never stored unencrypted. Only masked previews (`sk-...4a2b`) leave the server.
- **Architecture Pattern:** Flat feature layout (`repository.ts`, `service.ts`, `validation.ts`, `types.ts`, `actions.ts`). Repositories use `createXRepository(dbClient = db)` and `server-only`. Services use `createXService(repo = xRepository)`. Singletons exported without destructuring.
- **Verification Chain:** Every phase must verify with `pnpm lint`, `pnpm format:check`, `pnpm typecheck`, and `pnpm vitest run <changed-files>`.
- **Fail-Safe Fallback:** If Redis is down or unreachable, rate limits must degrade gracefully without crashing challenge submissions. If an external AI provider fails or errors, evaluate via deterministic token overlap.

---

## Phase 1: Dependencies, Environment & Cryptographic Security

### Task 1.1: Install Provider SDKs & Add `AI_ENCRYPTION_SECRET`

**Files:**
- Modify: `package.json`
- Modify: `src/lib/env/env.ts`
- Test: `src/lib/env/env.test.ts`

**Interfaces:**
- Produces: `env.AI_ENCRYPTION_SECRET` (string, min 32 chars)

- [ ] **Step 1: Write the test for environment configuration**
- [ ] **Step 2: Run test to verify it fails (`pnpm vitest run src/lib/env/env.test.ts`)**
- [ ] **Step 3: Install SDK dependencies (`pnpm add @ai-sdk/openai @ai-sdk/anthropic @ai-sdk/google`) and update `src/lib/env/env.ts`**
- [ ] **Step 4: Run test to verify it passes**
- [ ] **Step 5: Commit**

---

### Task 1.2: AES-256-GCM Encryption Utility

**Files:**
- Create: `src/lib/crypto/encryption.ts`
- Create: `src/lib/crypto/encryption.test.ts`

**Interfaces:**
- Produces:
  - `encryptApiKey(plaintext: string, secret?: string): string` (outputs `ivHex:ciphertextHex:tagHex`)
  - `decryptApiKey(encrypted: string, secret?: string): string`
  - `maskApiKey(apiKey: string): string` (e.g. `sk-ant...4a2b`)

- [ ] **Step 1: Write unit tests for AES-256-GCM encrypt/decrypt and masking**
- [ ] **Step 2: Run test to verify it fails (`pnpm vitest run src/lib/crypto/encryption.test.ts`)**
- [ ] **Step 3: Implement `src/lib/crypto/encryption.ts`**
- [ ] **Step 4: Run test to verify it passes**
- [ ] **Step 5: Commit**

---

## Phase 2: Multi-Model AI Engine & Live Connection Testing

### Task 2.1: Model Catalog & Multi-Provider Client Facade

**Files:**
- Modify: `src/lib/ai/types.ts`
- Modify: `src/lib/ai/constants.ts`
- Modify: `src/lib/ai/client.ts`
- Modify: `src/lib/ai/client.test.ts`

**Interfaces:**
- Produces:
  - `AIProviderType = "platform" | "groq" | "openai" | "anthropic" | "google"`
  - `RECOMMENDED_MODELS`
  - `getAIModel(modelName: string, options?: AIProviderOptions): LanguageModel`

- [ ] **Step 1: Write test for multi-provider model creation in `src/lib/ai/client.test.ts`**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Update `types.ts`, `constants.ts`, and `client.ts`**
- [ ] **Step 4: Run tests to verify they pass**
- [ ] **Step 5: Commit**

---

### Task 2.2: Live Provider Connection Test Action

**Files:**
- Create: `src/lib/ai/test-connection.ts`
- Create: `src/lib/ai/test-connection.test.ts`

**Interfaces:**
- Produces: `testProviderConnection(provider: AIProviderType, apiKey: string, modelId?: string): Promise<{ success: boolean; latencyMs: number; error?: string }>`

- [ ] **Step 1: Write test for `testProviderConnection`**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Implement `src/lib/ai/test-connection.ts`**
- [ ] **Step 4: Run test to verify it passes**
- [ ] **Step 5: Commit**

---

## Phase 3: Redis-Backed Rate Limiter & Usage Quotas

### Task 3.1: Redis Rate Limiter Implementation

**Files:**
- Create: `src/lib/ai/rate-limit.ts`
- Create: `src/lib/ai/rate-limit.test.ts`

**Interfaces:**
- Produces:
  - `checkAIRateLimit(userId: string, isByok: boolean): Promise<{ allowed: boolean; remaining: number; resetInSeconds: number; errorReason?: string }>`
  - `getDailyAIQuota(userId: string): Promise<{ used: number; total: number; isByok: boolean }>`

- [ ] **Step 1: Write tests for RPM and daily quota limits**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Implement `src/lib/ai/rate-limit.ts` (5 RPM / 15 daily platform, 30 RPM unmetered BYOK)**
- [ ] **Step 4: Run test to verify it passes**
- [ ] **Step 5: Commit**

---

## Phase 4: Database Schema, Migration & Repository Layer

### Task 4.1: Database Tables & Relations

**Files:**
- Modify: `src/features/profile/schema.ts`
- Modify: `src/db/schema/relations.ts`
- Create migration: `drizzle/`

**Interfaces:**
- Tables:
  - `user_api_keys`: `(id, user_id, provider, encrypted_api_key, key_preview, created_at, updated_at)`
  - `user_ai_settings`: `(id, user_id, active_provider, active_model, custom_model, updated_at)`

- [ ] **Step 1: Define tables in `src/features/profile/schema.ts` with RLS policies**
- [ ] **Step 2: Add relations in `src/db/schema/relations.ts`**
- [ ] **Step 3: Generate migration (`pnpm db:generate`)**
- [ ] **Step 4: Commit**

---

### Task 4.2: Profile Repository & Service for AI Settings

**Files:**
- Modify: `src/features/profile/types.ts`
- Modify: `src/features/profile/repository.ts`
- Modify: `src/features/profile/service.ts`
- Modify: `src/features/profile/service.test.ts`
- Modify: `src/features/profile/validation.ts`
- Modify: `src/features/profile/actions.ts`

**Interfaces:**
- Produces:
  - `saveApiKeyAction`, `deleteApiKeyAction`, `updateAiSettingsAction`, `testConnectionAction`

- [ ] **Step 1: Write service test for saving, deleting keys, and retrieving AI settings**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Implement repository and service methods**
- [ ] **Step 4: Implement Server Actions in `src/features/profile/actions.ts`**
- [ ] **Step 5: Run tests to verify they pass**
- [ ] **Step 6: Commit**

---

## Phase 5: Challenge Submission Engine Integration

### Task 5.1: Dynamic Model Resolution & Rate-Limited Grading

**Files:**
- Modify: `src/features/challenge/service.ts`
- Modify: `src/features/challenge/service.test.ts`
- Modify: `src/features/challenge/lib/ai-evaluator.ts`

**Interfaces:**
- Updates: `challengeService.submitChallenge` (resolves active AI settings, decrypts key, checks rate limits, grades with selected model, stores `modelUsed`)

- [ ] **Step 1: Write unit test in `src/features/challenge/service.test.ts`**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Update `submitChallenge` in `src/features/challenge/service.ts`**
- [ ] **Step 4: Run tests to verify they pass**
- [ ] **Step 5: Commit**

---

## Phase 6: User Interface (Settings Page & Challenge Workspace)

### Task 6.1: "AI & API Keys" Section in Profile Settings

**Files:**
- Create: `src/features/profile/components/AiSettingsTab.tsx`
- Modify: `src/features/profile/ProfileSettingsPage.tsx`
- Modify: `src/app/(app)/settings/page.tsx`

- [ ] **Step 1: Implement `AiSettingsTab.tsx` with Base UI primitives and Sonner toasts**
- [ ] **Step 2: Register section `ai` in `ProfileSettingsPage.tsx`**
- [ ] **Step 3: Update `src/app/(app)/settings/page.tsx` to load AI settings**
- [ ] **Step 4: Verify with `pnpm lint && pnpm typecheck`**
- [ ] **Step 5: Commit**

---

### Task 6.2: Active Model Indicator in Challenge Workspace

**Files:**
- Modify: `src/features/challenge/components/SubmitBar.tsx`
- Modify: `src/features/challenge/components/ChallengeScreen.tsx`

- [ ] **Step 1: Update `SubmitBar.tsx` to render active model badge**
- [ ] **Step 2: Pass active AI settings from `ChallengeScreen.tsx`**
- [ ] **Step 3: Run component tests (`pnpm vitest run src/features/challenge/components/ChallengeScreen.test.tsx`)**
- [ ] **Step 4: Commit**

---

## Phase 7: Verification, Documentation & Polish

### Task 7.1: End-to-End Suite Verification

- [ ] **Run all automated checks in order:**
  1. `pnpm lint`
  2. `pnpm format:check`
  3. `pnpm typecheck`
  4. `pnpm test`
  5. `pnpm build`
- [ ] **Update Documentation (`docs/tasks.md`, `src/features/profile/README.md`)**
- [ ] **Commit**
