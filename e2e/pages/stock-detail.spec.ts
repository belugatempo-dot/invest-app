import { test, expect } from "@playwright/test";
import { seedTestData } from "../fixtures/db-seed";

const BASE = "http://localhost:8888";

test.describe("Stock detail page", () => {
  test.beforeAll(async ({ request }) => {
    await seedTestData(request, BASE);
  });

  test("NVDA detail shows signal breakdown and metrics", async ({ page }) => {
    await page.goto("/stock/NVDA");

    const main = page.locator("main");

    // Ticker heading — use exact match to avoid matching "NVDA 信号得分历史"
    await expect(main.getByRole("heading", { name: "NVDA", exact: true })).toBeVisible();

    // Company name
    await expect(main.getByText("NVIDIA Corporation")).toBeVisible();

    // Rating badge
    await expect(main.getByText("买入").first()).toBeVisible();

    // Signal score
    await expect(main.getByText(/\/ 8/)).toBeVisible();

    // Signal breakdown section
    await expect(main.getByText("信号明细")).toBeVisible();

    // All 8 signal dimensions (use the Chinese labels)
    for (const dim of ["估值", "增长", "利润率", "趋势", "动量", "形态", "催化剂", "情绪"]) {
      await expect(main.getByText(dim).first()).toBeVisible();
    }

    // Key metrics
    await expect(main.getByText("关键指标")).toBeVisible();
    await expect(main.getByText("当前价格")).toBeVisible();
    await expect(main.getByText("市值")).toBeVisible();
    await expect(main.getByText("52周高点", { exact: true })).toBeVisible();
    await expect(main.getByText("52周低点", { exact: true })).toBeVisible();

    // Price levels
    await expect(main.getByText("入场区间")).toBeVisible();
    await expect(main.getByText("目标价")).toBeVisible();
    await expect(main.getByText("止损位")).toBeVisible();
  });

  test("unknown ticker shows no-data state", async ({ page }) => {
    await page.goto("/stock/ZZZZZ");

    // Empty state text
    await expect(page.getByText("暂无该标的数据")).toBeVisible();

    // Link back to screener
    await expect(page.getByRole("link", { name: /前往筛选/ })).toBeVisible();
  });
});
