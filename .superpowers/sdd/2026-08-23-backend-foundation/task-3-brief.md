### Task 3: Setup BetterAuth & AuthModule with Drizzle Adapter

**Files:**
- Create: apps/api/src/common/auth/auth.ts
- Modify: apps/api/src/app.module.ts

**Interfaces:**
- Produces: Global better-auth instance using the Drizzle adapter.

- [ ] **Step 1: Install Adapter**
Run: \pnpm add @better-auth/drizzle-adapter --filter @debug-arena/api\

- [ ] **Step 2: Create better-auth instance**
In \pps/api/src/common/auth/auth.ts\, import \etterAuth\, \drizzleAdapter\, \db\ and \schema\. Create and export the \uth\ instance mapping the schema correctly (user: schema.users, session: schema.sessions, account: schema.oauthAccounts). Enable emailAndPassword.

- [ ] **Step 3: Register AuthModule in AppModule**
Import \AuthModule\ from \@thallesp/nestjs-better-auth\. Use \AuthModule.forRoot({ auth, bodyParser: { json: { limit: '2mb' }, urlencoded: { limit: '2mb', extended: true }, rawBody: true } })\.
Also, implement \NestModule\ in \AppModule\ and apply the \LoggerMiddleware\ (created in Task 2) to all routes \('*')\.

- [ ] **Step 4: Verify**
Ensure no type errors.
