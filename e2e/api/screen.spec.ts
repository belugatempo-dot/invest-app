import { test, expect } from "@playwright/test";

const BASE = "http://localhost:8888";

test.describe("GET /api/screen", () => {
  test("returns 400 when theme parameter is missing", async ({ request }) => {
    const resp = await request.get(`${BASE}/api/screen`);
    expect(resp.status()).toBe(400);
    const body = await resp.json();
    expect(body.error).toContain("Missing");
  });

  test("returns 404 for unknown theme", async ({ request }) => {
    const resp = await request.get(`${BASE}/api/screen?theme=does-not-exist`);
    expect(resp.status()).toBe(404);
    const body = await resp.json();
    expect(body.error).toContain("not found");
  });
});
