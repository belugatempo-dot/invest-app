import type { Page, APIRequestContext } from "@playwright/test";
import { MOCK_SCREEN_RESPONSE } from "./mock-responses";

/**
 * Intercept browser fetch("/api/screen?theme=*") and return mock scored stocks.
 * Prevents server from calling TradingView.
 */
export async function mockScreenAPI(page: Page): Promise<void> {
  await page.route("**/api/screen?*", (route) => {
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_SCREEN_RESPONSE),
    });
  });
}

/**
 * Intercept dashboard polling requests to avoid noise in tests.
 */
export async function mockPolling(page: Page): Promise<void> {
  await page.route("**/api/history?action=runs*", (route) => {
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    });
  });
  await page.route("**/api/events*", (route) => {
    return route.fulfill({
      status: 200,
      contentType: "text/event-stream",
      body: "",
    });
  });
}

/**
 * Typed API request helper for Playwright's request context.
 */
export async function apiRequest(
  request: APIRequestContext,
  method: "GET" | "POST" | "DELETE",
  url: string,
  body?: unknown,
) {
  const options: { data?: unknown } = {};
  if (body !== undefined) options.data = body;

  switch (method) {
    case "GET":
      return request.get(url);
    case "POST":
      return request.post(url, options);
    case "DELETE":
      return request.delete(url, options);
  }
}
