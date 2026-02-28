import { test, expect } from "@playwright/test";
import { TEST_STOCKS } from "../fixtures/db-seed";

const BASE = "http://localhost:8888";

test.describe("POST /api/push", () => {
  test("pushes stocks and they appear in history", async ({ request }) => {
    const resp = await request.post(`${BASE}/api/push`, {
      data: { theme: "e2e-us-tech", stocks: TEST_STOCKS },
    });

    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body.runId).toBeGreaterThan(0);
    expect(body.count).toBe(TEST_STOCKS.length);

    // Verify via history
    const histResp = await request.get(`${BASE}/api/history?action=runs`);
    expect(histResp.status()).toBe(200);
    const runs = await histResp.json();
    const ourRun = runs.find(
      (r: { id: number }) => r.id === body.runId,
    );
    expect(ourRun).toBeDefined();
    expect(ourRun.themeId).toBe("e2e-us-tech");
    expect(ourRun.candidateCount).toBe(TEST_STOCKS.length);
  });

  test("returns 400 for missing theme", async ({ request }) => {
    const resp = await request.post(`${BASE}/api/push`, {
      data: { stocks: TEST_STOCKS },
    });
    expect(resp.status()).toBe(400);
  });

  test("returns 404 for unknown theme", async ({ request }) => {
    const resp = await request.post(`${BASE}/api/push`, {
      data: { theme: "nonexistent-theme", stocks: TEST_STOCKS },
    });
    expect(resp.status()).toBe(404);
  });
});
