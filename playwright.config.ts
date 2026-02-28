import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "html",
  timeout: 30_000,
  use: {
    baseURL: "http://localhost:8888",
    locale: "zh-CN",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    port: 8888,
    reuseExistingServer: !process.env.CI,
    env: {
      DATABASE_URL: "file:./data/test.db",
    },
    timeout: 60_000,
  },
  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",
});
