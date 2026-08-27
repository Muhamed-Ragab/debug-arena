### Task 2: Core Infrastructure (Logger, Filter, Interceptor)

**Files:**
- Create: apps/api/src/common/middleware/logger.middleware.ts
- Create: apps/api/src/common/filters/http-exception.filter.ts
- Create: apps/api/src/common/interceptors/response.interceptor.ts
- Modify: apps/api/src/main.ts

**Interfaces:**
- Produces: Global request logging, global error wrapping ({ success: false, error: ... }), and global response wrapping ({ success: true, data: ... }).

- [ ] **Step 1: Create Logger Middleware**
Implement standard NestJS middleware to log \METHOD URL STATUS - DELAYms\.

- [ ] **Step 2: Create Global Response Interceptor**
Implement a NestInterceptor that wraps successful responses: \eturn next.handle().pipe(map(data => ({ success: true, data })))\.

- [ ] **Step 3: Create Global Exception Filter**
Catch \HttpException\, return \{ success: false, error: message }\.

- [ ] **Step 4: Register Globally**
In \main.ts\, use \pp.useGlobalInterceptors\ and \pp.useGlobalFilters\. (The LoggerMiddleware will be applied in \pp.module.ts\ later, you don't need to do it in main.ts).

- [ ] **Step 5: Verify**
Ensure no type errors.
