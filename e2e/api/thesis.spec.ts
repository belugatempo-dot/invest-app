import { test, expect } from "@playwright/test";

const BASE = "http://localhost:8888";

test.describe("POST /api/thesis", () => {
  test("returns 503 when no LLM is configured", async ({ request }) => {
    const resp = await request.post(`${BASE}/api/thesis`, {
      data: { ticker: "NVDA" },
    });
    // Without LLM_PROVIDER/LLM_API_KEY, should be 503
    expect(resp.status()).toBe(503);
    const body = await resp.json();
    expect(body.error).toContain("未配置");
  });

  test("returns 400 when ticker is missing", async ({ request }) => {
    const resp = await request.post(`${BASE}/api/thesis`, {
      data: {},
    });
    expect(resp.status()).toBe(400);
  });
});
