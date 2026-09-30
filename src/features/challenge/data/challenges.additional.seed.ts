import type { SeedChallenge } from "./challenges.seed";

interface ChallengeDraft {
  buggy: string;
  categorySlug: string;
  difficulty: SeedChallenge["difficulty"];
  entryFile: string;
  expectedBehavior: string;
  fix: string;
  hint: string;
  name: string;
  rootCause: string;
  slug: string;
  title: string;
}

// Scenarios are original teaching examples based on recurring reliability,
// security, and architecture failure patterns in the linked primary sources.
const drafts: ChallengeDraft[] = [
  {
    buggy:
      "useEffect(() => {\n  fetchResults(query).then(setResults);\n}, []);",
    categorySlug: "react-rendering",
    difficulty: "easy",
    entryFile: "Search.tsx",
    expectedBehavior:
      "Changing the query triggers a request for the new value.",
    fix: "useEffect(() => {\n  fetchResults(query).then(setResults);\n}, [query]);",
    hint: "Compare the effect's dependencies with the values it reads.",
    name: "Search.tsx",
    rootCause:
      "The effect captures the first query because its dependency list is empty.",
    slug: "react-effect-stale-search",
    title: "Search results use a stale query",
  },
  {
    buggy:
      "useEffect(() => {\n  fetchResults(query).then(setResults);\n}, [query]);",
    categorySlug: "react-rendering",
    difficulty: "medium",
    entryFile: "Search.tsx",
    expectedBehavior:
      "Only the response for the current query updates the results.",
    fix: "useEffect(() => {\n  let active = true;\n  fetchResults(query).then((value) => { if (active) setResults(value); });\n  return () => { active = false; };\n}, [query]);",
    hint: "Consider what should happen to an earlier request when the query changes.",
    name: "Search.tsx",
    rootCause:
      "Responses are applied in completion order, so an older request can replace newer state.",
    slug: "react-effect-request-race",
    title: "Slow search response overwrites newer results",
  },
  {
    buggy:
      "items.map((item, index) => (\n  <Row key={index} item={item} />\n));",
    categorySlug: "react-rendering",
    difficulty: "medium",
    entryFile: "Rows.tsx",
    expectedBehavior:
      "Row-local state stays attached to the same item after reordering.",
    fix: "items.map((item) => (\n  <Row key={item.id} item={item} />\n));",
    hint: "Follow a row's identity after an item is inserted at the start.",
    name: "Rows.tsx",
    rootCause:
      "Index keys bind component state to a position rather than to the item identity.",
    slug: "react-list-index-key-state",
    title: "Reordered rows show the wrong editor state",
  },
  {
    buggy: `useEffect(() => {\n  socket.on("update", setData);\n}, [socket]);`,
    categorySlug: "react-rendering",
    difficulty: "easy",
    entryFile: "Dashboard.tsx",
    expectedBehavior: "Leaving the dashboard removes its event listener.",
    fix: `useEffect(() => {\n  socket.on("update", setData);\n  return () => socket.off("update", setData);\n}, [socket]);`,
    hint: "Pair every subscription with the inverse operation.",
    name: "Dashboard.tsx",
    rootCause:
      "The effect registers a listener but never unregisters it during cleanup.",
    slug: "react-subscription-cleanup",
    title: "Unmounted dashboard keeps receiving events",
  },
  {
    buggy: "items[0].done = true;\nsetItems(items);",
    categorySlug: "react-rendering",
    difficulty: "easy",
    entryFile: "Checklist.tsx",
    expectedBehavior:
      "Marking an item done produces a new state reference and rerenders.",
    fix: "setItems((current) => current.map((item, index) =>\n  index === 0 ? { ...item, done: true } : item\n));",
    hint: "Create a new array and a new object for the changed item.",
    name: "Checklist.tsx",
    rootCause:
      "The same array reference is reused, so React can skip the state update.",
    slug: "react-state-mutation-render",
    title: "Mutated items do not update the checklist",
  },
  {
    buggy:
      "const item = await loadItem(id);\nif (item.stock > 0) await saveStock(id, item.stock - 1);",
    categorySlug: "backend-concurrency",
    difficulty: "hard",
    entryFile: "inventory.ts",
    expectedBehavior: "At most the available stock count can be reserved.",
    fix: `const [item] = await db.update(items)\n  .set({ stock: sql\`\${items.stock} - 1\` })\n  .where(and(eq(items.id, id), gt(items.stock, 0)))\n  .returning();\nif (!item) throw new Error("Out of stock");`,
    hint: "Move the availability check and decrement into one atomic database operation.",
    name: "inventory.ts",
    rootCause:
      "Read-modify-write is not atomic, allowing concurrent requests to observe the same stock value.",
    slug: "backend-inventory-lost-update",
    title: "Concurrent orders oversell the last item",
  },
  {
    buggy:
      "const client = await pool.connect();\nconst rows = await client.query(sql);\nclient.release();",
    categorySlug: "backend-concurrency",
    difficulty: "medium",
    entryFile: "repository.ts",
    expectedBehavior:
      "Every acquired connection is released even when the query rejects.",
    fix: "const client = await pool.connect();\ntry { return await client.query(sql); }\nfinally { client.release(); }",
    hint: "Resource release must run on both success and failure paths.",
    name: "repository.ts",
    rootCause:
      "An exception skips release and permanently consumes a connection from the pool.",
    slug: "backend-connection-release",
    title: "Failed query leaks a pooled connection",
  },
  {
    buggy: "audit.write(event);\nreturn response(200, { saved: true });",
    categorySlug: "backend-concurrency",
    difficulty: "medium",
    entryFile: "handler.ts",
    expectedBehavior:
      "The request reports success only after the required audit write succeeds.",
    fix: "await audit.write(event);\nreturn response(200, { saved: true });",
    hint: "Identify which side effect is part of the request's success contract.",
    name: "handler.ts",
    rootCause:
      "The handler reports success while a required asynchronous write may still fail.",
    slug: "backend-unawaited-write",
    title: "Request succeeds before its audit write finishes",
  },
  {
    buggy:
      "await lock.acquire(key);\nawait processJob(job);\nawait lock.release(key);",
    categorySlug: "backend-concurrency",
    difficulty: "hard",
    entryFile: "worker.ts",
    expectedBehavior:
      "The lock is released after both successful and failed job processing.",
    fix: "await lock.acquire(key);\ntry { await processJob(job); }\nfinally { await lock.release(key); }",
    hint: "Put lock release in a guaranteed cleanup path.",
    name: "worker.ts",
    rootCause:
      "A thrown processing error bypasses the lock release and blocks future workers.",
    slug: "backend-lock-not-released",
    title: "Worker lock remains held after processing error",
  },
  {
    buggy:
      "const profile = cache.get(userId);\nprofile.lastViewedAt = new Date();\nreturn profile;",
    categorySlug: "backend-concurrency",
    difficulty: "medium",
    entryFile: "profile.ts",
    expectedBehavior:
      "Request-specific display data does not mutate the shared cached profile.",
    fix: "const profile = cache.get(userId);\nreturn { ...profile, lastViewedAt: new Date() };",
    hint: "Treat shared cache values as immutable snapshots.",
    name: "profile.ts",
    rootCause:
      "A mutable cached object is shared between requests and modified in place.",
    slug: "backend-shared-mutable-cache",
    title: "One request changes another user's cached profile",
  },
  {
    buggy:
      "const previous = tasks;\nsetTasks(next);\ntry { await save(next); } catch { setTasks(previous); }",
    categorySlug: "state-management",
    difficulty: "medium",
    entryFile: "useTasks.ts",
    expectedBehavior:
      "Only the latest failed save restores the state snapshot it replaced.",
    fix: "const mutationId = ++latestMutation.current;\nsetTasks(next);\ntry { await save(next); } catch {\n  if (mutationId === latestMutation.current) setTasks(previous);\n}",
    hint: "Associate each optimistic update with its own revision.",
    name: "useTasks.ts",
    rootCause:
      "An older failed mutation rolls state back over a newer optimistic update.",
    slug: "state-optimistic-rollback-clobber",
    title: "Failed save erases a newer checkbox change",
  },
  {
    buggy:
      "const [items, setItems] = useState(initialItems);\nconst [count, setCount] = useState(initialItems.length);\nsetItems(nextItems);",
    categorySlug: "state-management",
    difficulty: "easy",
    entryFile: "Cart.tsx",
    expectedBehavior: "The badge count always reflects the current cart items.",
    fix: "const [items, setItems] = useState(initialItems);\nconst count = items.length;\nsetItems(nextItems);",
    hint: "Derive values that can be calculated directly from canonical state.",
    name: "Cart.tsx",
    rootCause:
      "The same fact is stored twice and one copy is not updated with the other.",
    slug: "state-duplicate-derived-count",
    title: "Cart badge disagrees with the cart contents",
  },
  {
    buggy:
      "async function enable(name) {\n  await save(name);\n  setEnabled([...enabled, name]);\n}",
    categorySlug: "state-management",
    difficulty: "medium",
    entryFile: "Preferences.tsx",
    expectedBehavior:
      "Concurrent preference saves preserve every successfully enabled item.",
    fix: "async function enable(name) {\n  await save(name);\n  setEnabled((current) => current.includes(name) ? current : [...current, name]);\n}",
    hint: "Use the latest state value when applying updates after an await.",
    name: "Preferences.tsx",
    rootCause:
      "The async callback applies an update based on a captured, potentially stale array.",
    slug: "state-stale-async-update",
    title: "Overlapping saves drop the latest preference",
  },
  {
    buggy: `const [status, setStatus] = useState(searchParams.get("status") ?? "all");\n// URL changes on browser back, local state stays unchanged`,
    categorySlug: "state-management",
    difficulty: "medium",
    entryFile: "Filters.tsx",
    expectedBehavior:
      "Browser back and forward update the displayed filter selection.",
    fix: `const status = searchParams.get("status") ?? "all";\nfunction selectStatus(value) { router.replace(withStatus(searchParams, value)); }`,
    hint: "Choose one canonical source for navigable filter state.",
    name: "Filters.tsx",
    rootCause:
      "The URL and component state both store the filter, but only one observes history navigation.",
    slug: "state-url-filter-desync",
    title: "Back navigation restores the URL but not the selected filter",
  },
  {
    buggy:
      "function AccountForm({ account }) {\n  const [name, setName] = useState(account.name);\n  return <input value={name} onChange={(e) => setName(e.target.value)} />;\n}",
    categorySlug: "state-management",
    difficulty: "easy",
    entryFile: "AccountForm.tsx",
    expectedBehavior:
      "Selecting a different account loads its own name into the form.",
    fix: "function AccountForm({ account }) {\n  const [name, setName] = useState(account.name);\n  useEffect(() => setName(account.name), [account.id, account.name]);\n  return <input value={name} onChange={(e) => setName(e.target.value)} />;\n}",
    hint: "Decide when the form's local draft should follow a new record identity.",
    name: "AccountForm.tsx",
    rootCause:
      "The form initializes local state once and does not reset it when the selected record changes.",
    slug: "state-reset-on-prop-change",
    title: "Switching accounts keeps the previous account's draft",
  },
  {
    buggy:
      "const offset = page * pageSize;\nreturn db.items.findMany({ offset, limit: pageSize });",
    categorySlug: "api-design",
    difficulty: "easy",
    entryFile: "pagination.ts",
    expectedBehavior:
      "Page one begins at row zero and each next page advances by pageSize.",
    fix: "const offset = (page - 1) * pageSize;\nreturn db.items.findMany({ offset, limit: pageSize });",
    hint: "Check the offset for page one before testing later pages.",
    name: "pagination.ts",
    rootCause: "A one-based page number is used as a zero-based row offset.",
    slug: "api-pagination-empty-page",
    title: "Last-page request skips the final records",
  },
  {
    buggy:
      "const bio = body.bio || current.bio;\nawait updateProfile({ bio });",
    categorySlug: "api-design",
    difficulty: "medium",
    entryFile: "profile-route.ts",
    expectedBehavior:
      "Omitting bio preserves it; explicitly sending null clears it.",
    fix: `const bio = Object.hasOwn(body, "bio") ? body.bio : current.bio;\nawait updateProfile({ bio });`,
    hint: "Distinguish absence from a provided empty value.",
    name: "profile-route.ts",
    rootCause:
      "Truthiness treats an intentional empty value as if the field were omitted.",
    slug: "api-patch-null-semantics",
    title: "PATCH request cannot clear an optional field",
  },
  {
    buggy:
      "async function charge(order) {\n  return gateway.createCharge(order.amount);\n}",
    categorySlug: "api-design",
    difficulty: "hard",
    entryFile: "payments.ts",
    expectedBehavior:
      "Repeated requests for one order return the original charge result.",
    fix: "async function charge(order) {\n  return gateway.createCharge(order.amount, { idempotencyKey: order.id });\n}",
    hint: "Make repeated delivery of the same logical operation recognizable.",
    name: "payments.ts",
    rootCause:
      "A retry is treated as a new operation because the request has no stable idempotency key.",
    slug: "api-delete-retries-unsafe",
    title: "Retrying a timed-out payment creates a duplicate charge",
  },
  {
    buggy: `try { return response(200, await createUser(body)); }\ncatch { return response(500, { error: "Request failed" }); }`,
    categorySlug: "api-design",
    difficulty: "easy",
    entryFile: "route.ts",
    expectedBehavior:
      "Invalid input returns 400 while unexpected faults remain 500.",
    fix: `try { return response(201, await createUser(body)); }\ncatch (error) {\n  if (error instanceof ValidationError) return response(400, { error: error.message });\n  return response(500, { error: "Request failed" });\n}`,
    hint: "Map known failure types to their API status codes.",
    name: "route.ts",
    rootCause:
      "Expected client input errors and unexpected server faults share one error response.",
    slug: "api-error-status-leak",
    title: "Validation failure is returned as a server error",
  },
  {
    buggy: `const limit = Number(searchParams.get("limit") ?? 20);\nreturn listRecords({ limit });`,
    categorySlug: "api-design",
    difficulty: "medium",
    entryFile: "list-route.ts",
    expectedBehavior:
      "Malformed, negative, and excessively large limits use a safe bounded value.",
    fix: `const requested = Number(searchParams.get("limit") ?? 20);\nconst limit = Number.isFinite(requested) ? Math.min(100, Math.max(1, requested)) : 20;\nreturn listRecords({ limit });`,
    hint: "Validate the number and enforce a server-side upper bound.",
    name: "list-route.ts",
    rootCause:
      "The endpoint accepts an unbounded caller-controlled resource limit.",
    slug: "api-unbounded-page-size",
    title: "A huge page size exhausts the database pool",
  },
  {
    buggy:
      "const orders = await listOrders();\nfor (const order of orders) order.customer = await getCustomer(order.customerId);",
    categorySlug: "performance",
    difficulty: "medium",
    entryFile: "orders.ts",
    expectedBehavior:
      "Loading a page uses a bounded number of database round trips.",
    fix: "const orders = await db.query.orders.findMany({ with: { customer: true } });",
    hint: "Fetch related rows in one joined or batched query.",
    name: "orders.ts",
    rootCause:
      "Related records are fetched serially for each result, making query count grow with page size.",
    slug: "performance-n-plus-one-list",
    title: "Loading a page issues one query per row",
  },
  {
    buggy:
      "const unique = rows.filter((row, index) =>\n  rows.findIndex((candidate) => candidate.id === row.id) === index\n);",
    categorySlug: "performance",
    difficulty: "medium",
    entryFile: "import.ts",
    expectedBehavior:
      "Deduplication preserves first occurrence with near-linear work.",
    fix: "const seen = new Set<string>();\nconst unique = rows.filter((row) => {\n  if (seen.has(row.id)) return false;\n  seen.add(row.id);\n  return true;\n});",
    hint: "Track previously seen identifiers in a hash-based set.",
    name: "import.ts",
    rootCause:
      "Each row scans the full input again, so work grows quadratically.",
    slug: "performance-quadratic-dedup",
    title: "Large import becomes quadratic while removing duplicates",
  },
  {
    buggy:
      "await Promise.all(records.map((record) => remote.fetch(record.id)));",
    categorySlug: "performance",
    difficulty: "hard",
    entryFile: "export.ts",
    expectedBehavior:
      "The export processes all records while limiting concurrent fetches.",
    fix: "for (const batch of chunk(records, 20)) {\n  await Promise.all(batch.map((record) => remote.fetch(record.id)));\n}",
    hint: "Bound the number of in-flight downstream requests.",
    name: "export.ts",
    rootCause:
      "All records fan out simultaneously without a concurrency limit.",
    slug: "performance-unbounded-concurrency",
    title: "Bulk export overwhelms the downstream service",
  },
  {
    buggy: `const key = \`report:\${reportId}\`;
return cache.getOrSet(key, () => loadReport(tenantId, reportId));`,
    categorySlug: "performance",
    difficulty: "hard",
    entryFile: "reports.ts",
    expectedBehavior:
      "Reports cached for different tenants never share an entry.",
    fix: `const key = \`tenant:\${tenantId}:report:\${reportId}\`;
return cache.getOrSet(key, () => loadReport(tenantId, reportId));`,
    hint: "Include every authorization-relevant dimension in the cache key.",
    name: "reports.ts",
    rootCause:
      "The cache key omits tenant identity even though the cached result is tenant-scoped.",
    slug: "performance-cache-key-collision",
    title: "One tenant receives another tenant's cached report",
  },
  {
    buggy:
      "const chartData = buildCharts(allRows);\nreturn <>{searchResults.map(renderRow)}<Charts data={chartData} /></>;",
    categorySlug: "performance",
    difficulty: "medium",
    entryFile: "Dashboard.tsx",
    expectedBehavior:
      "Changing search text does not recompute unchanged chart data.",
    fix: "const chartData = useMemo(() => buildCharts(allRows), [allRows]);\nreturn <>{searchResults.map(renderRow)}<Charts data={chartData} /></>;",
    hint: "Memoize the calculation against the data it actually depends on.",
    name: "Dashboard.tsx",
    rootCause:
      "Expensive chart data is rebuilt during renders caused by unrelated search input state.",
    slug: "performance-expensive-render-loop",
    title: "Dashboard recalculates every chart on each keystroke",
  },
  {
    buggy: `const query = \`SELECT * FROM users WHERE name = '\${name}'\`;
return db.execute(query);`,
    categorySlug: "security",
    difficulty: "hard",
    entryFile: "users.ts",
    expectedBehavior: "SQL-looking search text is treated as a literal value.",
    fix:
      "return db.execute(sql`SELECT * FROM users WHERE name = " +
      String.fromCharCode(36) +
      "{name}`);",
    hint: "Keep user data separate from the SQL statement structure.",
    name: "users.ts",
    rootCause:
      "Untrusted input is concatenated into SQL syntax rather than sent as a bound value.",
    slug: "security-sql-interpolation",
    title: "Search text changes the meaning of the SQL query",
  },
  {
    buggy:
      "const invoice = await invoices.findById(params.id);\nreturn response(200, invoice);",
    categorySlug: "security",
    difficulty: "hard",
    entryFile: "invoice-route.ts",
    expectedBehavior: "A user cannot read an invoice owned by another account.",
    fix: "const invoice = await invoices.findOwnedById(params.id, session.user.id);\nif (!invoice) return response(404);\nreturn response(200, invoice);",
    hint: "Authorization must constrain the resource lookup by the authenticated principal.",
    name: "invoice-route.ts",
    rootCause:
      "The route verifies authentication but never checks that the invoice belongs to the caller.",
    slug: "security-idor-account-read",
    title: "Changing the account ID exposes another user's invoice",
  },
  {
    buggy: "return <div dangerouslySetInnerHTML={{ __html: comment.body }} />;",
    categorySlug: "security",
    difficulty: "hard",
    entryFile: "Comment.tsx",
    expectedBehavior:
      "HTML-looking comment content displays literally and cannot run script.",
    fix: "return <div>{comment.body}</div>;",
    hint: "Render user text as text unless trusted sanitized rich content is required.",
    name: "Comment.tsx",
    rootCause: "Untrusted comment text is inserted as executable HTML.",
    slug: "security-html-output-injection",
    title: "Comment markup executes in the moderator view",
  },
  {
    buggy: `const next = request.nextUrl.searchParams.get("next");\nreturn redirect(next ?? "/");`,
    categorySlug: "security",
    difficulty: "medium",
    entryFile: "login.ts",
    expectedBehavior:
      "External and protocol-relative redirect targets fall back to the site home.",
    fix: `const next = request.nextUrl.searchParams.get("next");\nconst target = next?.startsWith("/") && !next.startsWith("//") ? next : "/";\nreturn redirect(new URL(target, request.url));`,
    hint: "Allow only same-origin relative destinations.",
    name: "login.ts",
    rootCause:
      "An arbitrary absolute URL is accepted as the post-login destination.",
    slug: "security-open-redirect",
    title: "Login redirect sends users to an attacker site",
  },
  {
    buggy:
      "const file = join(exportDirectory, request.query.filename);\nreturn sendFile(file);",
    categorySlug: "security",
    difficulty: "hard",
    entryFile: "download.ts",
    expectedBehavior:
      "Traversal sequences cannot access files outside the export directory.",
    fix: 'const file = resolve(exportDirectory, request.query.filename);\nif (!file.startsWith(resolve(exportDirectory) + sep)) throw new Error("Invalid path");\nreturn sendFile(file);',
    hint: "Normalize the path and verify it remains inside the allowed directory.",
    name: "download.ts",
    rootCause:
      "The filename is joined to a base directory without checking the resolved path boundary.",
    slug: "security-path-traversal-download",
    title: "Download endpoint reads outside the export folder",
  },
  {
    buggy:
      "for (let attempt = 0; attempt < 5; attempt++) {\n  try { return await callService(); } catch { await sleep(1000); }\n}",
    categorySlug: "system-design",
    difficulty: "hard",
    entryFile: "retry.ts",
    expectedBehavior:
      "Retries spread over time and eventually surface the final failure.",
    fix: "for (let attempt = 0; attempt < 5; attempt++) {\n  try { return await callService(); } catch (error) {\n    if (attempt === 4) throw error;\n    await sleep(Math.random() * Math.min(30_000, 500 * 2 ** attempt));\n  }\n}",
    hint: "Use capped exponential backoff with random jitter and stop after the retry budget.",
    name: "retry.ts",
    rootCause:
      "Every client retries on the same fixed schedule, amplifying load during recovery.",
    slug: "system-design-retry-storm",
    title: "Synchronized retries keep a failing service overloaded",
  },
  {
    buggy: "function enqueue(job) {\n  waiting.push(job);\n  drain();\n}",
    categorySlug: "system-design",
    difficulty: "hard",
    entryFile: "queue.ts",
    expectedBehavior:
      "The queue stays bounded and rejects or sheds excess work explicitly.",
    fix: `function enqueue(job) {\n  if (waiting.length >= MAX_QUEUE_SIZE) throw new Error("Queue full");\n  waiting.push(job);\n  drain();\n}`,
    hint: "Protect memory by applying backpressure when the queue reaches capacity.",
    name: "queue.ts",
    rootCause:
      "Incoming work is accepted without a queue capacity or overload response.",
    slug: "system-design-unbounded-queue",
    title: "A slow dependency turns the request queue into a memory leak",
  },
  {
    buggy: "return fetch(catalogUrl).then((response) => response.json());",
    categorySlug: "system-design",
    difficulty: "medium",
    entryFile: "catalog.ts",
    expectedBehavior:
      "A stalled dependency fails within the configured request timeout.",
    fix: "return fetch(catalogUrl, { signal: AbortSignal.timeout(2_000) })\n  .then((response) => response.json());",
    hint: "Give each dependency call a deadline that fits inside the caller's budget.",
    name: "catalog.ts",
    rootCause:
      "The outbound request has no deadline, so stalled dependencies retain work indefinitely.",
    slug: "system-design-missing-timeout",
    title: "One stalled service holds request workers forever",
  },
  {
    buggy:
      "async function healthy() {\n  await database.ping();\n  return true;\n}",
    categorySlug: "system-design",
    difficulty: "hard",
    entryFile: "health.ts",
    expectedBehavior:
      "Database trouble marks an instance unready without triggering restart loops.",
    fix: "function live() { return true; }\nasync function ready() { return database.pingWithTimeout(250); }",
    hint: "Separate process liveness from readiness to receive traffic.",
    name: "health.ts",
    rootCause:
      "Liveness is tied to a downstream dependency, causing healthy processes to restart during an outage.",
    slug: "system-design-healthcheck-dependency",
    title: "Database slowdown removes every instance from service",
  },
  {
    buggy:
      "async function get(key) {\n  return (await cache.get(key)) ?? loadAndCache(key);\n}",
    categorySlug: "system-design",
    difficulty: "medium",
    entryFile: "cache.ts",
    expectedBehavior:
      "One loader serves concurrent misses for a key while its value is absent.",
    fix: "async function get(key) {\n  const cached = await cache.get(key);\n  if (cached) return cached;\n  return singleFlight.run(key, () => loadAndCache(key));\n}",
    hint: "Coalesce concurrent cache misses for the same key.",
    name: "cache.ts",
    rootCause:
      "Concurrent misses for one hot key all start the same expensive database load.",
    slug: "system-design-cache-stampede",
    title: "Popular cache expiry floods the database",
  },
  {
    buggy:
      "const order = await insertOrder(input);\nawait insertOrderItems(order.id, input.items);\nreturn order;",
    categorySlug: "database-design",
    difficulty: "hard",
    entryFile: "orders.ts",
    expectedBehavior:
      "An order and its items are both committed or both rolled back.",
    fix: "return db.transaction(async (tx) => {\n  const order = await insertOrder(tx, input);\n  await insertOrderItems(tx, order.id, input.items);\n  return order;\n});",
    hint: "Use one transaction for state that must succeed or fail together.",
    name: "orders.ts",
    rootCause:
      "Related writes are committed separately, leaving a partial order when the second write fails.",
    slug: "database-transaction-partial-write",
    title: "Order is saved even though its items fail",
  },
  {
    buggy:
      "return db.posts.findMany({\n  limit: 20, offset: page * 20, orderBy: desc(posts.createdAt)\n});",
    categorySlug: "database-design",
    difficulty: "medium",
    entryFile: "feed.ts",
    expectedBehavior:
      "New inserts do not shift the boundary of an already-started traversal.",
    fix: "return db.posts.findMany({\n  limit: 20, where: lt(posts.createdAt, cursor), orderBy: desc(posts.createdAt)\n});",
    hint: "Use a stable keyset cursor for a feed that changes while it is paged.",
    name: "feed.ts",
    rootCause:
      "Offset pagination shifts when new rows are inserted ahead of the next page.",
    slug: "database-offset-pagination-drift",
    title: "Rows repeat when records are inserted between pages",
  },
  {
    buggy:
      "CREATE INDEX events_created_at_idx ON events(created_at);\nSELECT * FROM events WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 50;",
    categorySlug: "database-design",
    difficulty: "medium",
    entryFile: "schema.sql",
    expectedBehavior:
      "The database can seek to one tenant's newest events without scanning all tenants.",
    fix: "CREATE INDEX events_tenant_created_at_idx ON events(tenant_id, created_at DESC);\nSELECT * FROM events WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 50;",
    hint: "Match the composite index order to equality filters and then sort order.",
    name: "schema.sql",
    rootCause:
      "The index does not begin with the filter column used by the tenant-scoped query.",
    slug: "database-missing-composite-index",
    title: "Tenant dashboard scans every event to find recent rows",
  },
  {
    buggy: "if (!(await findByName(name))) {\n  await insertUser({ name });\n}",
    categorySlug: "database-design",
    difficulty: "hard",
    entryFile: "users.ts",
    expectedBehavior:
      "Concurrent creates leave exactly one row for a unique username.",
    fix: "await db.insert(users).values({ name })\n  .onConflictDoNothing({ target: users.name });",
    hint: "Enforce uniqueness in the database and handle the conflict at write time.",
    name: "users.ts",
    rootCause:
      "A check-then-insert sequence has a race between the existence check and the write.",
    slug: "database-unique-check-race",
    title: "Two requests create the same username",
  },
  {
    buggy:
      "const current = await readCount(id);\nawait writeCount(id, current + 1);",
    categorySlug: "database-design",
    difficulty: "medium",
    entryFile: "views.ts",
    expectedBehavior: "Every concurrent view contributes one increment.",
    fix: `await db.update(posts)
  .set({ views: sql\`\${posts.views} + 1\` })
  .where(eq(posts.id, id));`,
    hint: "Let the database apply the increment as one statement.",
    name: "views.ts",
    rootCause:
      "The counter is incremented from a stale read instead of atomically in the database.",
    slug: "database-lost-counter-update",
    title: "Concurrent views lose counter increments",
  },
  {
    buggy:
      "async function handle(event) {\n  await refund(event.paymentId, event.amount);\n  await markProcessed(event.id);\n}",
    categorySlug: "distributed-systems",
    difficulty: "hard",
    entryFile: "webhook.ts",
    expectedBehavior:
      "Repeated delivery of one event creates no additional refund.",
    fix: "async function handle(event) {\n  await db.transaction(async (tx) => {\n    if (!(await claimEvent(tx, event.id))) return;\n    await refund(tx, event.paymentId, event.amount);\n  });\n}",
    hint: "Claim a unique event identifier atomically with the business change.",
    name: "webhook.ts",
    rootCause:
      "The effect runs before a durable idempotency claim, so redelivery repeats it.",
    slug: "distributed-duplicate-webhook",
    title: "Webhook retry applies the same refund twice",
  },
  {
    buggy:
      "async function apply(event) {\n  await saveProfile(event.userId, event.address);\n}",
    categorySlug: "distributed-systems",
    difficulty: "medium",
    entryFile: "consumer.ts",
    expectedBehavior:
      "An older event cannot replace state written by a newer version.",
    fix: "async function apply(event) {\n  await updateProfileIfVersionNewer(event.userId, event.address, event.version);\n}",
    hint: "Use a monotonic version or sequence to reject stale updates.",
    name: "consumer.ts",
    rootCause:
      "Events are applied in arrival order even though delivery can be reordered.",
    slug: "distributed-out-of-order-events",
    title: "Older profile event overwrites the latest address",
  },
  {
    buggy:
      "const record = await primary.insert(input);\nreturn replica.findById(record.id);",
    categorySlug: "distributed-systems",
    difficulty: "medium",
    entryFile: "create.ts",
    expectedBehavior:
      "The create response includes the record that was just committed.",
    fix: "const record = await primary.insert(input);\nreturn record;",
    hint: "Return the committed write result or use a read-your-writes consistency path.",
    name: "create.ts",
    rootCause:
      "The immediate read is sent to a replica that may not have received the write yet.",
    slug: "distributed-stale-replica-read",
    title: "Newly created record is missing from the confirmation page",
  },
  {
    buggy:
      "const lease = await acquireLease(resource);\nawait doWork();\nawait writeResult(resource, result);",
    categorySlug: "distributed-systems",
    difficulty: "hard",
    entryFile: "lease-worker.ts",
    expectedBehavior:
      "A previous lease holder cannot overwrite data after a newer lease is issued.",
    fix: "const lease = await acquireLease(resource);\nawait doWork();\nawait writeResultIfFenceMatches(resource, lease.fence, result);",
    hint: "Use a monotonically increasing fencing token on writes.",
    name: "lease-worker.ts",
    rootCause:
      "A worker assumes its lease is still valid after pausing, while a newer owner may have taken over.",
    slug: "distributed-expired-lease-owner",
    title: "A paused worker writes after its lease expired",
  },
  {
    buggy: `await orders.insert(order);\nawait broker.publish({ type: "OrderCreated", orderId: order.id });`,
    categorySlug: "distributed-systems",
    difficulty: "hard",
    entryFile: "checkout.ts",
    expectedBehavior:
      "Every committed order has a durable event available for publication.",
    fix: `await db.transaction(async (tx) => {\n  await orders.insert(tx, order);\n  await outbox.insert(tx, { type: "OrderCreated", orderId: order.id });\n});`,
    hint: "Persist the event in the same transaction and publish it asynchronously from an outbox.",
    name: "checkout.ts",
    rootCause:
      "The database and message broker are written independently, so a crash can split their state.",
    slug: "distributed-outbox-dual-write",
    title: "Database commit succeeds but the event is never published",
  },
  {
    buggy: `const account = await createAccount({ email: "test@example.com" });\n// every test file uses the same email`,
    categorySlug: "testing-reliability",
    difficulty: "medium",
    entryFile: "account.test.ts",
    expectedBehavior:
      "Tests can run concurrently without colliding on shared account state.",
    fix: `const account = await createAccount({ email: \`test-\${crypto.randomUUID()}@example.com\` });
// cleanup this test's own account after the assertion`,
    hint: "Give each test an isolated fixture and clean up only resources it owns.",
    name: "account.test.ts",
    rootCause:
      "Parallel test cases share a unique fixture and race to create or mutate it.",
    slug: "reliability-flaky-shared-fixture",
    title: "Parallel tests overwrite the same account fixture",
  },
  {
    buggy: "sendNotification(userId, message);\nreturn { accepted: true };",
    categorySlug: "testing-reliability",
    difficulty: "medium",
    entryFile: "notify.ts",
    expectedBehavior:
      "A failed notification is logged and does not become an unhandled rejection.",
    fix: `void sendNotification(userId, message).catch((error) =>\n  logger.error({ error, userId }, "Notification delivery failed")\n);\nreturn { accepted: true };`,
    hint: "Background work still needs a failure handler and operational visibility.",
    name: "notify.ts",
    rootCause:
      "The promise is intentionally detached but has no rejection handler or observable failure path.",
    slug: "reliability-unhandled-background-rejection",
    title: "Failed background notification becomes an unhandled rejection",
  },
  {
    buggy:
      "expect(isExpired({ expiresAt: new Date() })).toBe(false);\n// execution may cross the exact expiry boundary",
    categorySlug: "testing-reliability",
    difficulty: "easy",
    entryFile: "token.test.ts",
    expectedBehavior: "Expiry assertions produce the same result on every run.",
    fix: `const now = new Date("2030-01-01T00:00:00Z");\nexpect(isExpired({ expiresAt: new Date(now.getTime() - 1) }, now)).toBe(true);`,
    hint: "Inject a fixed clock and test both sides of the deadline explicitly.",
    name: "token.test.ts",
    rootCause:
      "The test depends on wall-clock time at execution and sits on an unstable boundary.",
    slug: "reliability-time-dependent-test",
    title: "Expiry test changes result depending on when it runs",
  },
  {
    buggy: `it("rejects invalid input", () => {\n  expect(service.save(invalidInput)).rejects.toThrow();\n});`,
    categorySlug: "testing-reliability",
    difficulty: "easy",
    entryFile: "service.test.ts",
    expectedBehavior:
      "The test fails when the promise resolves instead of rejecting.",
    fix: `it("rejects invalid input", async () => {\n  await expect(service.save(invalidInput)).rejects.toThrow();\n});`,
    hint: "Make the test lifecycle wait for its asynchronous assertion.",
    name: "service.test.ts",
    rootCause:
      "The test does not return or await the promise assertion, so the runner finishes early.",
    slug: "reliability-swallowed-async-test",
    title: "Test passes before its rejected promise is checked",
  },
  {
    buggy: "server.listen(PORT);\nawait warmRequiredCache();",
    categorySlug: "testing-reliability",
    difficulty: "medium",
    entryFile: "server.ts",
    expectedBehavior:
      "Requests are accepted only after the required cache warmup completes.",
    fix: "await warmRequiredCache();\nserver.listen(PORT);",
    hint: "Do not announce readiness until dependencies and required state are prepared.",
    name: "server.ts",
    rootCause:
      "The server accepts requests before completing required startup initialization.",
    slug: "reliability-deployment-readiness",
    title: "Traffic reaches an instance before its cache is ready",
  },
];

function inferBuggyLineRange(
  buggyCode: string,
  fixedCode: string
): [number, number] {
  const buggyLines = buggyCode.split("\n");
  const fixedLines = fixedCode.split("\n");
  let commonPrefix = 0;
  while (
    commonPrefix < buggyLines.length &&
    commonPrefix < fixedLines.length &&
    buggyLines[commonPrefix] === fixedLines[commonPrefix]
  ) {
    commonPrefix += 1;
  }

  let commonSuffix = 0;
  while (
    commonSuffix < buggyLines.length - commonPrefix &&
    commonSuffix < fixedLines.length - commonPrefix &&
    buggyLines.at(-commonSuffix - 1) === fixedLines.at(-commonSuffix - 1)
  ) {
    commonSuffix += 1;
  }

  const changedEnd = buggyLines.length - commonSuffix;
  if (commonPrefix < changedEnd) {
    return [commonPrefix + 1, changedEnd];
  }

  const contextLine = Math.max(1, commonPrefix);
  return [contextLine, contextLine];
}

export const ADDITIONAL_SEED_CHALLENGES: SeedChallenge[] = drafts.map(
  (draft) => ({
    buggyArtifact: {
      buggyLines: inferBuggyLineRange(draft.buggy, draft.fix),
      entryFile: draft.entryFile,
      files: [{ code: draft.buggy, isEntry: true, name: draft.name }],
      language: "typescript",
      points: 200,
      timeLimit: "25 min",
    },
    categorySlug: draft.categorySlug,
    difficulty: draft.difficulty,
    format: "code_snippet",
    hints: [
      { order: 1, penaltyPoints: 10, socraticPrompt: draft.hint },
      {
        order: 2,
        penaltyPoints: 20,
        socraticPrompt: `Trace the failure path in ${draft.entryFile} and explain why the existing code violates the expected behavior.`,
      },
    ],
    preventionNotes: `Add a focused regression test: ${draft.expectedBehavior}`,
    prompt: `Investigate this production-style bug: ${draft.title}. Identify the faulty assumption, propose a minimal correction, and explain how the corrected behavior can be verified.`,
    referenceFix: {
      diff: [
        { text: draft.buggy, type: "del" },
        { text: draft.fix, type: "add" },
      ],
      files: [{ code: draft.fix, name: draft.name }],
    },
    rootCauseSummary: draft.rootCause,
    slug: draft.slug,
    source: "manual",
    status: "published",
    title: draft.title,
  })
);
