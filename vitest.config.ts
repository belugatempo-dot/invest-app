import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    coverage: {
      provider: "v8",
      include: ["lib/signal-scorer.ts", "lib/reddit-sentiment.ts"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
