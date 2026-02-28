import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    exclude: ["e2e/**", "node_modules/**"],
    coverage: {
      provider: "v8",
      include: [
        "lib/signal-scorer.ts",
        "lib/reddit-sentiment.ts",
        "lib/xueqiu-sentiment.ts",
        "lib/sentiment.ts",
        "app/api/screen/route.ts",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
