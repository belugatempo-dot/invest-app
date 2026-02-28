import { test, expect } from "@playwright/test";
import { mockScreenAPI } from "../fixtures/test-helpers";

test.describe("Screens page", () => {
  test("renders theme cards with names and market badges", async ({ page }) => {
    await page.goto("/screens");

    // At least our 2 seeded test themes should appear
    await expect(page.getByText("E2E美股科技")).toBeVisible();
    await expect(page.getByText("E2E中国AI")).toBeVisible();

    // Market badges inside theme cards
    const main = page.locator("main");
    await expect(main.getByText("美股").first()).toBeVisible();
    await expect(main.getByText("A股").first()).toBeVisible();
  });

  test("market filter tabs filter theme cards", async ({ page }) => {
    await page.goto("/screens");

    // Filter tabs include counts, e.g. "美股 US (1)"
    const usTab = page.getByRole("button", { name: /美股 US/ });
    await expect(usTab).toBeVisible();
    await usTab.click();

    // US theme should remain visible
    await expect(page.getByText("E2E美股科技")).toBeVisible();

    // Click show-all to restore — match tab with count, not the "一键筛选全部" button
    const allTab = page.getByRole("button", { name: /^全部 \(/ });
    await allTab.click();
    await expect(page.getByText("E2E中国AI")).toBeVisible();
  });

  test("run screen button with mocked API returns stock cards", async ({
    page,
  }) => {
    await mockScreenAPI(page);
    await page.goto("/screens");

    // Find the screen button specifically for US tech theme
    // Use first() since there may be multiple "运行筛选" buttons
    const screenBtn = page.getByRole("button", { name: "运行筛选" }).first();
    await expect(screenBtn).toBeVisible();
    await screenBtn.click();

    // Wait for results to appear — look for one of our test stock tickers
    await expect(page.getByText("NVDA").first()).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText("AVGO").first()).toBeVisible();
  });

  test("stock card links to stock detail page", async ({ page }) => {
    await mockScreenAPI(page);
    await page.goto("/screens");

    // Trigger screen
    const screenBtn = page.getByRole("button", { name: "运行筛选" }).first();
    await screenBtn.click();

    await expect(page.getByText("NVDA").first()).toBeVisible({
      timeout: 10_000,
    });

    // Click on the NVDA stock link
    const nvdaLink = page.getByRole("link", { name: /NVDA/ }).first();
    await nvdaLink.click();
    await page.waitForURL("**/stock/NVDA");
    expect(page.url()).toContain("/stock/NVDA");
  });
});
