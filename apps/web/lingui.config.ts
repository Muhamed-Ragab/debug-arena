import { defineConfig } from "@lingui/cli";
import { formatter } from "@lingui/format-po";

export default defineConfig({
  sourceLocale: "en",
  locales: ["en", "ar"],
  catalogs: [
    {
      path: "<rootDir>/src/locales/{locale}/messages",
      include: ["<rootDir>/src"],
    },
  ],
  format: formatter({ lineNumbers: false }),
});
