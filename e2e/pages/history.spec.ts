import { test, expect } from "@playwright/test";
import { seedTestData } from "../fixtures/db-seed";

const BASE = "http://localhost:8888";

test.describe("History page", () => {
  test("shows timeline table with seeded run data", async ({
    page,
    request,
  }) => {
    await seedTestData(request, BASE);
    await page.goto("/history");

    // Page header — target main content area, not sidebar
    const main = page.locator("main");
    await expect(main.getByText("筛选记录")).toBeVisible();

    // Table headers
    await expect(page.getByRole("columnheader", { name: "时间" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "主题" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "来源" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "标的数" })).toBeVisible();

    // Our seeded run should show CLI source badge
    await expect(main.getByText("CLI").first()).toBeVisible();

    // Theme name should appear
    await expect(main.getByText("E2E美股科技").first()).toBeVisible();
  });

  test("signal evolution section is present", async ({ page, request }) => {
    await seedTestData(request, BASE);
    await page.goto("/history");

    const main = page.locator("main");
    await expect(main.getByRole("heading", { name: "信号演变" })).toBeVisible();
  });

  test("decision journal section shows empty or populated state", async ({
    page,
  }) => {
    await page.goto("/history");
    const main = page.locator("main");
    await expect(main.getByText("决策日志")).toBeVisible();
  });
});
