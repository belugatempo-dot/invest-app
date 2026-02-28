import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("/ redirects to /screens", async ({ page }) => {
    await page.goto("/");
    await page.waitForURL("**/screens");
    expect(page.url()).toContain("/screens");
  });

  test("sidebar nav links navigate between pages", async ({ page }) => {
    await page.goto("/screens");

    // Navigate to dashboard
    await page.getByRole("link", { name: /决策面板/ }).click();
    await page.waitForURL("**/dashboard");
    expect(page.url()).toContain("/dashboard");

    // Navigate to history
    await page.getByRole("link", { name: /历史追踪/ }).click();
    await page.waitForURL("**/history");
    expect(page.url()).toContain("/history");

    // Navigate back to screener
    await page.getByRole("link", { name: /主题筛选/ }).click();
    await page.waitForURL("**/screens");
    expect(page.url()).toContain("/screens");
  });

  test("sidebar collapse/expand toggle", async ({ page }) => {
    await page.goto("/screens");

    const sidebar = page.locator("aside");
    const toggleBtn = page.getByRole("button", { name: /侧边栏/ });

    // Initially expanded — check Decision Engine text is visible
    await expect(page.getByText("Decision Engine v2")).toBeVisible();

    // Collapse
    await toggleBtn.click();
    await expect(page.getByText("Decision Engine v2")).toBeHidden();
    // Sidebar should be narrow
    await expect(sidebar).toHaveCSS("width", "56px");

    // Expand
    await toggleBtn.click();
    await expect(page.getByText("Decision Engine v2")).toBeVisible();
  });
});
