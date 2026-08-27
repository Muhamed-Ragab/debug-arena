// Test shim for the `server-only` package.
//
// In the Next.js server build, `server-only` resolves to an empty module via the
// `react-server` export condition. Vitest runs in a jsdom (client) environment
// without that condition, so it resolves to the throwing module
// ("This module cannot be imported from a Client Component module"), crashing any
// suite that imports a module pulling in `server-only` transitively.
//
// This empty shim reproduces the server-build behavior for the test runtime.
export {};
