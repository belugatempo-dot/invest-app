import { test, expect } from "@playwright/test";
import { cleanupWatchlist } from "../fixtures/db-seed";

const BASE = "http://localhost:8888";

test.describe("Watchlist CRUD", () => {
  test.afterEach(async ({ request }) => {
    await cleanupWatchlist(request, BASE);
  });

  test("full CRUD cycle: add, list, delete", async ({ request }) => {
    // Add
    const addResp = await request.post(`${BASE}/api/watchlist`, {
      data: { ticker: "AAPL" },
    });
    expect(addResp.status()).toBe(200);
    const addBody = await addResp.json();
    expect(addBody.ok).toBe(true);
    expect(addBody.ticker).toBe("AAPL");

    // List
    const listResp = await request.get(`${BASE}/api/watchlist`);
    expect(listResp.status()).toBe(200);
    const listBody = await listResp.json();
    expect(listBody.tickers).toContain("AAPL");

    // Delete
    const delResp = await request.delete(`${BASE}/api/watchlist?ticker=AAPL`);
    expect(delResp.status()).toBe(200);
    const delBody = await delResp.json();
    expect(delBody.ok).toBe(true);

    // Verify deleted
    const listResp2 = await request.get(`${BASE}/api/watchlist`);
    const listBody2 = await listResp2.json();
    expect(listBody2.tickers).not.toContain("AAPL");
  });

  test("rejects invalid ticker format", async ({ request }) => {
    const resp = await request.post(`${BASE}/api/watchlist`, {
      data: { ticker: "invalid ticker!!!" },
    });
    expect(resp.status()).toBe(400);
    const body = await resp.json();
    expect(body.error).toContain("Invalid ticker");
  });

  test("rejects missing ticker", async ({ request }) => {
    const resp = await request.post(`${BASE}/api/watchlist`, {
      data: {},
    });
    expect(resp.status()).toBe(400);
  });
});
