import { defineConfig } from "@eloqnt/cli";

export default defineConfig({
  srcPath: "./src",
  messages: {
    path: "./messages/{locale}",
    locales: "infer",
    sourceLocale: "en",
    format: "po",
  },
  lint: {
    rules: {
      "orphan-message": "error",
    },
  },
});
