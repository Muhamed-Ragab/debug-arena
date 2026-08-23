# Backend Foundation & API Wiring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the contracts package to isolate schemas and types, build global infrastructure (filters, interceptors, loggers), and wire up the stubbed NestJS backend modules (Auth, Challenges, Submissions) to use `@ts-rest/nest` contracts and Drizzle ORM. 

**Architecture:** The backend uses NestJS. Controllers use `@ts-rest/nest` handlers fulfilling Zod-validated contracts. Services execute business logic using `@debug-arena/db`. Auth is powered by `better-auth`.

**Global Infrastructure:** 
- **Error Handling**: Throw standard NestJS exceptions (e.g., `NotFoundException`) in services/controllers. A global Exception Filter will catch these and format them into `{ success: false, error: ... }`.
- **Response Shape**: A global Interceptor will wrap all successful responses into `{ success: true, data: ... }`. Controllers will just return the raw data payloads.
- **Logging**: A global middleware or interceptor will log all incoming requests and their execution times.

**Tech Stack:** NestJS 10, ts-rest, Drizzle ORM, PostgreSQL (pgvector), better-auth, Zod, Vitest/Jest for testing.

**Spec:** `docs/implementation_guide.md`, `docs/API.md`, `packages/contracts/src/`

## Global Constraints

- TypeScript 7.0.2 with NodeNext module resolution.
- Format with `oxfmt` and lint with `oxlint` (`pnpm lint`, `pnpm typecheck`).
- **No types in logic files:** Do not define `interface` or `type` blocks inside `.service.ts` or `.controller.ts` files. All types must be imported from the `@debug-arena/contracts` package.
- **Contract Schema Isolation:** Zod schemas must live in `*.schema.ts` files, keeping the `*.contract.ts` files purely for `c.router(...)` definitions.
- **Strictly forbid `@Req() req: any` and all uses of `any`**: Extract user/session data using the `@Session()` decorator from `@thallesp/nestjs-better-auth`.
- **Global Envelope**: Do NOT manually return `{ success, data }` in controllers. Return `{ status, body: rawData }`. The global interceptor will handle the wrapping. Ensure the contracts reflect this unwrapped inner shape or use a generic wrapper type on the contract side so TypeScript doesn't complain.

---

### Task 1: Refactor Contracts Package for Schema/Type Isolation

**Files:**
- Create: `packages/contracts/src/auth.schema.ts`, `challenges.schema.ts`, `submissions.schema.ts`
- Modify: `packages/contracts/src/auth.contract.ts` (and others)
- Modify: `packages/contracts/src/index.ts`

- [ ] **Step 1: Isolate Auth Schemas & Types**
```typescript
// packages/contracts/src/auth.schema.ts
import { z } from 'zod';
export const RegisterBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  username: z.string().optional(),
});
export type RegisterBody = z.infer<typeof RegisterBodySchema>;
// ... LoginBodySchema
```

- [ ] **Step 2: Update Contracts & Re-export**
*(Import schemas into `.contract.ts`, and export everything from `index.ts`)*

- [ ] **Step 3: Commit**

---

### Task 2: Core Infrastructure (Logger, Filter, Interceptor)

**Files:**
- Create: `apps/api/src/common/middleware/logger.middleware.ts`
- Create: `apps/api/src/common/filters/http-exception.filter.ts`
- Create: `apps/api/src/common/interceptors/response.interceptor.ts`
- Modify: `apps/api/src/main.ts`

- [ ] **Step 1: Create Logger Middleware**
```typescript
// apps/api/src/common/middleware/logger.middleware.ts
import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl } = req;
    const start = Date.now();
    res.on('finish', () => {
      const { statusCode } = res;
      const delay = Date.now() - start;
      this.logger.log(`${method} ${originalUrl} ${statusCode} - ${delay}ms`);
    });
    next();
  }
}
```

- [ ] **Step 2: Create Global Response Interceptor**
```typescript
// apps/api/src/common/interceptors/response.interceptor.ts
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map(data => ({ success: true, data }))
    );
  }
}
```

- [ ] **Step 3: Create Global Exception Filter**
```typescript
// apps/api/src/common/filters/http-exception.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    response.status(status).json({
      success: false,
      error: typeof exceptionResponse === 'string' ? exceptionResponse : (exceptionResponse as Record<string, unknown>).message || exceptionResponse,
    });
  }
}
```

- [ ] **Step 4: Register Globally in `main.ts`**
```typescript
// apps/api/src/main.ts
app.useGlobalInterceptors(new ResponseInterceptor());
app.useGlobalFilters(new HttpExceptionFilter());
```

- [ ] **Step 5: Commit**

---

### Task 3: Setup BetterAuth & AuthModule with Drizzle Adapter

**Files:**
- Create: `apps/api/src/common/auth/auth.ts`
- Modify: `apps/api/src/app.module.ts`

- [ ] **Step 1: Create better-auth instance**
*(Use `drizzleAdapter`, map schemas)*

- [ ] **Step 2: Register AuthModule in AppModule**
*(Apply `AuthModule.forRoot(...)` and configure `LoggerMiddleware` via `configure(consumer: MiddlewareConsumer)`).*

- [ ] **Step 3: Commit**

---

### Task 4: Auth Module - ts-rest Wiring

**Files:**
- Modify: `apps/api/src/modules/auth/auth.controller.ts`
- Modify: `apps/api/src/modules/auth/auth.service.ts`

- [ ] **Step 1: Write Service**
*(Use `RegisterBody` imported from `@debug-arena/contracts`, throw `BadRequestException` on error).*

- [ ] **Step 2: Write Controller**
```typescript
// apps/api/src/modules/auth/auth.controller.ts
@AllowAnonymous()
@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @TsRestHandler(authContract)
  async handler() {
    return tsRestHandler(authContract, {
      register: async ({ body }) => {
        const result = await this.authService.register(body);
        return { status: 201, body: result }; // Interceptor handles envelope
      },
      login: async ({ body }) => {
        const result = await this.authService.login(body);
        return { status: 200, body: result };
      },
    });
  }
}
```

- [ ] **Step 3: Commit**

---

### Task 5: Challenges Module - ts-rest Wiring and DB Queries

**Files:**
- Modify: `apps/api/src/modules/challenges/challenges.controller.ts`
- Modify: `apps/api/src/modules/challenges/challenges.service.ts`

- [ ] **Step 1: Write Service**
*(Throw `NotFoundException` if challenge missing).*

- [ ] **Step 2: Write Controller**
```typescript
// apps/api/src/modules/challenges/challenges.controller.ts
@Controller()
export class ChallengesController {
  constructor(private readonly challengesService: ChallengesService) {}

  @TsRestHandler(challengesContract)
  async handler(@Session() session: UserSession) {
    return tsRestHandler(challengesContract, {
      list: async ({ query }) => {
        const result = await this.challengesService.list(query);
        return { status: 200, body: result };
      },
      detail: async ({ params }) => {
        const result = await this.challengesService.detail(params.id);
        return { status: 200, body: result };
      },
    });
  }
}
```

- [ ] **Step 3: Commit**

---

### Task 6: Submissions Module - ts-rest Wiring

**Files:**
- Modify: `apps/api/src/modules/submissions/submissions.controller.ts`
- Modify: `apps/api/src/modules/submissions/submissions.service.ts`

- [ ] **Step 1: Write Controller**
*(Use `@Session() session: UserSession` to get user ID, return raw body).*

- [ ] **Step 2: Commit**