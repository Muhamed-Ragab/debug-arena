# Draft: Feature code organization & constant-dedup audit

## Goal
Audit `src/features/**` for two code-quality issues and plan a refactor:
1. **Bundled schemas/types/interfaces/constants** — files that inline Zod schemas + TS interfaces + module constants together (like `src/features/admin/lib/question-generator-agent.ts`) instead of splitting into `types.ts` / `schemas.ts` / `constants.ts`.
2. **Duplicated LLM constants** — `GROQ_ENDPOINT`, `PRIMARY_MODEL`, `FAST_MODEL`, `REQUEST_TIMEOUT_MS` re-declared across files. Consolidate to ONE source under a provider-agnostic `ai` namespace.
3. **Architectural Refactor** — Implement Strategy, Factory, and Adapter patterns to fix SOLID (SRP/OCP) violations in AI agents.

## Confirmed requirements (from user)
- Check ALL feature dirs, not just the two named.
- Separate validation schemas, types/interfaces, and constants into dedicated files.
- Do NOT duplicate vars — use a single shared source for shared constants.
- **Architecture**: Use **Functional Composition** for the Strategy pattern.
- **Architecture**: Use Factory pattern to resolve implementations (e.g., AI vs Fallback) and Adapter pattern for the underlying LLM fetch logic.
- **Naming/Namespace**: Rename "groq" references to "ai" globally to ensure the system is provider-agnostic.

## Open questions for user
- Naming convention for feature splits: `types.ts` / `schemas.ts` / `constants.ts` per feature lib folder?
- Should extraction preserve public API (named exports) so call sites don't break?

## Research findings
- (pending explore agents)

## Scope boundaries
- INCLUDE: `src/features/**/lib/**` and sibling feature subfolders.
- EXCLUDE: test files, generated files, `node_modules`.
