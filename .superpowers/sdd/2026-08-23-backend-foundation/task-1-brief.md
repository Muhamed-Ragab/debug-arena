### Task 1: Refactor Contracts Package for Schema/Type Isolation

**Files:**
- Create: packages/contracts/src/auth.schema.ts
- Create: packages/contracts/src/challenges.schema.ts
- Create: packages/contracts/src/submissions.schema.ts
- Modify: packages/contracts/src/auth.contract.ts (and challenges/submissions contracts)
- Modify: packages/contracts/src/index.ts

**Interfaces:**
- Produces: Isolated Zod schemas and inferred TypeScript types exported for use by the backend services.

- [ ] **Step 1: Isolate Schemas & Types**
Extract Zod schemas from .contract.ts into .schema.ts. Export inferred types (e.g. \xport type RegisterBody = z.infer<typeof RegisterBodySchema>;\).

- [ ] **Step 2: Update Contracts**
Import the separated schemas into .contract.ts. Replace inline \z.object(...)\ bodies with the imported schemas. Do NOT wrap the responses in \{ success, data }\ here if they don't already have it, just make sure the schemas correctly reflect the expected output.

- [ ] **Step 3: Re-export Types in Index**
Export everything from .schema.ts and .contract.ts in packages/contracts/src/index.ts.

- [ ] **Step 4: Self-Review & Clean Up**
Ensure \pnpm typecheck --filter @debug-arena/contracts\ passes if applicable, or just ensure no TS errors.
