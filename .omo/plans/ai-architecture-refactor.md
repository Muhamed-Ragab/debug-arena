# AI Architecture & Code Organization Refactor

## TL;DR

> **Quick Summary**: This refactor addresses SOLID violations (SRP/OCP) in the AI agents and standardizes file organization across features. It transitions the application to use the **Vercel AI SDK** for standardizing LLM interactions, extracts all duplicated LLM constants into a unified `ai` namespace, and splits bundled schemas/types into their correct feature-level files.
>
> **Deliverables**:
> - `src/lib/ai/constants.ts` (Unified LLM constants)
> - `src/lib/ai/client.ts` (Vercel AI SDK configuration)
> - Standardized `types.ts` and `schemas.ts` for Admin and Challenge features.
> - Functional Strategy/Factory implementation for `ai-evaluator.ts` and `question-generator-agent.ts` leveraging Vercel AI SDK (`generateObject`/`generateText`).
>
> **Estimated Effort**: Medium
> **Parallel Execution**: YES - 2 waves

---

## Context

### Original Request
Audit `src/features` for bundled validations/schemas/types/constants (e.g., `question-generator-agent.ts`) and duplicated constants (e.g., `ai-evaluator.ts`), then plan a refactor to separate them cleanly using SOLID principles.

### Interview Summary
**Key Discussions**:
- **Architecture**: Agreed to use the **Vercel AI SDK** to cleanly separate AI network calls from domain logic, combined with a **Strategy Pattern** (via Functional Composition) and a **Factory Pattern**.
- **Namespace**: Agreed to use a global, provider-agnostic `ai` namespace (e.g., `src/lib/ai/`) and standard AI SDK providers, future-proofing the application.

### Research Findings
- **Duplicates Found**: `GROQ_ENDPOINT`, `PRIMARY_MODEL`, and `FAST_MODEL` are duplicated across `admin/lib/question-generator-agent.ts`, `challenge/lib/ai-evaluator.ts`, and hardcoded in multiple test files (`ai-evaluator.test.ts`, `ai-evaluator-answers.test.ts`).
- **Existing Conventions**: The project *already* uses `types.ts` and `validations.ts`/`schema.ts` in features like `profile` and `challenge`. The `admin` and `challenge` lib files are violating an already-established project convention.

---

## Work Objectives

### Core Objective
Decouple LLM network logic from domain logic by migrating to the Vercel AI SDK, unify AI constants, and strictly separate schemas/types from implementation files.

### Must Have
- Move all LLM constants to `src/lib/ai/constants.ts` and update all references (including tests).
- Create `src/lib/ai/client.ts` to configure and export the Vercel AI SDK provider.
- Split `question-generator-agent.ts` into `types.ts` and `schemas.ts` (or `validations.ts`).
- Refactor `ai-evaluator.ts` and `question-generator-agent.ts` to use Vercel AI SDK's `generateObject` or `generateText` alongside Functional Strategy/Factory patterns.

### Must NOT Have (Guardrails)
- Do NOT use heavy OOP Classes for the Strategy pattern; strictly use functional composition (returning objects with matching function signatures).
- Do NOT break existing public APIs for these agents; update the export boundaries cleanly.

---

## Execution Strategy

### Parallel Execution Waves

```text
Wave 1 (Foundation):
├── Task 1: Extract LLM constants to `src/lib/ai/constants.ts` and update tests/references. [quick]
├── Task 2: Split Admin schemas/types from `question-generator-agent.ts` into `src/features/admin/types.ts` & `schemas.ts`. [quick]

Wave 2 (Architecture Refactor - MAX PARALLEL):
├── Task 3: Setup Vercel AI SDK provider in `src/lib/ai/client.ts`. [deep]
├── Task 4: Refactor `ai-evaluator.ts` (Vercel AI SDK & Functional Strategy). [deep]
├── Task 5: Refactor `question-generator-agent.ts` (Vercel AI SDK & Functional Strategy). [deep]

Wave FINAL (Verification):
├── Task F1: Plan compliance audit
├── Task F2: Code quality review & tests
```

---

## TODOs

- [x] 1. Extract unified AI constants
  **What to do**: Create `src/lib/ai/constants.ts`. Move `GROQ_ENDPOINT`, `PRIMARY_MODEL`, `FAST_MODEL`, and `REQUEST_TIMEOUT_MS` here. Rename Groq-specific variables to generic AI names (e.g., `AI_ENDPOINT`, `AI_PRIMARY_MODEL`). Update `admin/lib/question-generator-agent.ts`, `challenge/lib/ai-evaluator.ts`, and test files to import these.
  **QA Scenarios**:
  ```
  Scenario: Constants resolve correctly in tests
    Tool: interactive_bash
    Steps:
      1. Run `pnpm test src/features/challenge/lib/ai-evaluator.test.ts`
    Expected Result: Tests pass, proving the constants were correctly imported and replaced.
  ```

- [x] 2. Split Admin & Challenge Types/Schemas
  **What to do**: Move interfaces (DiffLine, ChallengeFile, etc.) from `question-generator-agent.ts` to `src/features/admin/types.ts`. Move `rawLlmChallengeSchema` to `src/features/admin/schemas.ts`. Update imports.
  **QA Scenarios**:
  ```
  Scenario: TypeScript compiles successfully after split
    Tool: interactive_bash
    Steps:
      1. Run `pnpm typecheck`
    Expected Result: 0 TypeScript errors.
  ```

- [x] 3. Create generic AI Adapter via Vercel AI SDK
  **What to do**: Install `ai` and `@ai-sdk/openai` (or `@ai-sdk/groq` if available/preferred, or use openai client with Groq baseURL). Create `src/lib/ai/client.ts`. Export a configured AI provider and/or helper functions wrapping `generateObject`/`generateText` if needed, to standardize the SDK usage.
  **QA Scenarios**:
  ```
  Scenario: AI SDK client is successfully configured
    Tool: interactive_bash
    Steps:
      1. Run `pnpm lint` and `pnpm typecheck`
    Expected Result: No errors, ensuring the client setup is strictly typed.
  ```

- [x] 4. Refactor AI Evaluator (Vercel AI SDK & Strategy/Factory)
  **What to do**: Refactor `src/features/challenge/lib/ai-evaluator.ts`. Define a functional type `EvaluatorStrategy = (params) => Promise<AIEvaluationResult>`. Create a Vercel AI SDK based strategy using `generateObject` with structured outputs, replacing raw `fetch` and manual JSON.parse. Keep the fallback strategy for offline/no-key usage. Create a factory `getEvaluatorStrategy()` that routes to the fallback if the API key is missing.
  **QA Scenarios**:
  ```
  Scenario: Evaluator fallback logic resolves cleanly
    Tool: interactive_bash
    Steps:
      1. Temporarily unset GROQ_API_KEY and run a test script invoking the evaluator.
    Expected Result: The Factory routes correctly to the Fallback Strategy.
  ```

- [x] 5. Refactor Question Generator (Vercel AI SDK & Strategy/Factory)
  **What to do**: Apply the exact same Vercel AI SDK + Strategy/Factory pattern to `src/features/admin/lib/question-generator-agent.ts` for both the `generate` and `refine` functions. Use `generateObject` for safe JSON drafting.
  **QA Scenarios**:
  ```
  Scenario: Generator factory resolves correctly
    Tool: interactive_bash
    Steps:
      1. Run `pnpm typecheck` and `pnpm test`
    Expected Result: Passes successfully, proving the Vercel AI SDK correctly infers return shapes.
  ```
