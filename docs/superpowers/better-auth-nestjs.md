# NestJS Better Auth Integration Guide

This guide details how to integrate Better Auth with NestJS using the `@thallesp/nestjs-better-auth` package.

## 1. Installation

First, install the required packages:

```bash
pnpm add better-auth @thallesp/nestjs-better-auth
```

## 2. Basic Setup (NestJS Bootstrap)

You must disable NestJS's built-in body parser to allow Better Auth to handle the raw request body.

```typescript
// apps/api/src/main.ts
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // REQUIRED: Disable built-in parser for better-auth
    bodyParser: false,
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

## 3. Configure Better Auth Instance

Create the `better-auth` instance.

```typescript
// apps/api/src/common/auth/auth.ts
import { betterAuth } from 'better-auth';
import { Pool } from 'pg';

export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),
  emailAndPassword: {
    enabled: true,
  },
  // If you intend to use hooks, you must at least provide an empty object:
  hooks: {}, 
  databaseHooks: {},
});
```

## 4. Import AuthModule

Import the `AuthModule` in your root module (e.g., `AppModule`) and pass the `auth` instance.

```typescript
// apps/api/src/app.module.ts
import { Module } from "@nestjs/common";
import { AuthModule } from "@thallesp/nestjs-better-auth";
import { auth } from "./common/auth/auth";

@Module({
  imports: [
    AuthModule.forRoot({
      auth,
      bodyParser: {
        json: { limit: "2mb" },
        urlencoded: { limit: "2mb", extended: true },
        rawBody: true,
      },
    }),
  ],
})
export class AppModule {}
```

## 5. Route Protection & Guards

By default, the `AuthModule` registers an `AuthGuard` **globally**. This means *all routes are protected by default*.

If you need a public route, use the `@AllowAnonymous()` decorator.

```typescript
import { Controller, Get } from "@nestjs/common";
import { AllowAnonymous, OptionalAuth } from "@thallesp/nestjs-better-auth";

@Controller("public")
export class PublicController {
  
  @Get()
  @AllowAnonymous() // Bypass global auth guard
  async publicRoute() {
    return { message: "This route is public" };
  }
}
```

## 6. Accessing the Session & User

The library provides a built-in `@Session()` decorator, which injects the strongly-typed `UserSession` object into your controllers. 

*(Note: You do not need to build a custom `@CurrentUser` decorator, the library provides this out of the box).*

```typescript
import { Controller, Get } from "@nestjs/common";
import { Session, UserSession } from "@thallesp/nestjs-better-auth";

@Controller("users")
export class UserController {
  @Get("me")
  async getProfile(@Session() session: UserSession) {
    // session contains: { session: {...}, user: {...} }
    return session;
  }
}
```

## 7. Using AuthService

The `AuthService` is automatically provided by `AuthModule` and can be injected into any of your controllers or services to access the Better Auth API endpoints directly on the server.

```typescript
import { Injectable } from "@nestjs/common";
import { AuthService } from "@thallesp/nestjs-better-auth";
import { auth } from "../../common/auth/auth";

@Injectable()
export class MyService {
  // Pass your auth instance type for strict typing
  constructor(private authService: AuthService<typeof auth>) {}

  async doSomething() {
    // Access the better-auth API directly
    // e.g. this.authService.api.listUserAccounts(...)
  }
}
```

## Summary of Available Decorators

- `@Session()`: Extracts `UserSession` (contains `user` and `session` objects).
- `@AllowAnonymous()`: Bypasses the global `AuthGuard`.
- `@OptionalAuth()`: Does not enforce auth, but extracts session if token is present.
- `@Roles(roles: string[])`: Enforces system-level roles (requires admin plugin).
- `@Hook()`, `@BeforeHook()`, `@AfterHook()`: Integrate Better Auth lifecycle hooks with NestJS DI.
