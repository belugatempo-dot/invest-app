import { test, expect } from "@playwright/test";
import { seedTestData } from "../fixtures/db-seed";

const BASE = "http://localhost:8888";

test.describe("GET /api/history", () => {
  test("action=runs returns screen run timeline", async ({ request }) => {
    // Seed data first
    await seedTestData(request, BASE);

    const resp = await request.get(`${BASE}/api/history?action=runs`);
    expect(resp.status()).toBe(200);

    const runs = await resp.json();
    expect(Array.isArray(runs)).toBe(true);
    expect(runs.length).toBeGreaterThan(0);

    const run = runs[0];
    expect(run).toHaveProperty("id");
    expect(run).toHaveProperty("themeId");
    expect(run).toHaveProperty("runAt");
    expect(run).toHaveProperty("candidateCount");
  });

  test("action=evolution returns signal history for ticker", async ({
    request,
  }) => {
    await seedTestData(request, BASE);

    const resp = await request.get(
      `${BASE}/api/history?action=evolution&ticker=NVDA`,
    );
    expect(resp.status()).toBe(200);

    const snapshots = await resp.json();
    expect(Array.isArray(snapshots)).toBe(true);
    expect(snapshots.length).toBeGreaterThan(0);
    expect(snapshots[0]).toHaveProperty("signalTotal");
    expect(snapshots[0]).toHaveProperty("runAt");
  });

  test("action=evolution without ticker returns 400", async ({ request }) => {
    const resp = await request.get(`${BASE}/api/history?action=evolution`);
    expect(resp.status()).toBe(400);
  });

  test("unknown action returns 400", async ({ request }) => {
    const resp = await request.get(`${BASE}/api/history?action=unknown`);
    expect(resp.status()).toBe(400);
    const body = await resp.json();
    expect(body.error).toContain("Unknown action");
  });

  test("action=decisions returns decisions array", async ({ request }) => {
    const resp = await request.get(`${BASE}/api/history?action=decisions`);
    expect(resp.status()).toBe(200);
    const decisions = await resp.json();
    expect(Array.isArray(decisions)).toBe(true);
  });
});
