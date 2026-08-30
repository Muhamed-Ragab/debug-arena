import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    css: false,
    testTimeout: 10000,
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // `server-only` resolves to a throwing module outside the `react-server`
      // export condition (i.e. in vitest's jsdom environment). Alias it to a
      // no-op shim so server-targeted modules can be imported in tests.
      "server-only": fileURLToPath(
        new URL("./src/test/server-only-shim.ts", import.meta.url),
      ),
    },
  },
});
