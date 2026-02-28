import { test, expect } from "@playwright/test";

const BASE = "http://localhost:8888";

test.describe("POST /api/analyze", () => {
  test("scores raw stocks and returns signals + rating", async ({ request }) => {
    const rawStocks = [
      {
        ticker: "TEST1",
        company: "Test Corp One",
        close: 100,
        pe: 15,
        revGrowth: 0.25,
        grossMargin: 0.55,
        fcfMargin: 0.1,
        rsi: 45,
        adx: 30,
        sma50: 95,
        sma200: 85,
        high52w: 110,
        low52w: 60,
        marketCap: 5e9,
      },
      {
        ticker: "TEST2",
        company: "Test Corp Two",
        close: 50,
        pe: 80,
        revGrowth: 0.03,
        grossMargin: 0.18,
        fcfMargin: -0.05,
        rsi: 75,
        adx: 12,
        sma50: 52,
        sma200: 55,
        high52w: 70,
        low52w: 40,
        marketCap: 2e9,
      },
    ];

    const resp = await request.post(`${BASE}/api/analyze`, {
      data: { stocks: rawStocks },
    });

    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body.count).toBe(2);
    expect(body.stocks).toHaveLength(2);

    // Each stock should have signals, signalTotal, and rating
    for (const stock of body.stocks) {
      expect(stock.signals).toBeDefined();
      expect(stock.signalTotal).toBeGreaterThanOrEqual(-8);
      expect(stock.signalTotal).toBeLessThanOrEqual(8);
      expect(stock.rating).toBeDefined();
      expect(stock.rating.zh).toBeDefined();
      expect(stock.rating.en).toBeDefined();

      // All 8 signal dimensions present
      for (const key of [
        "sigValuation", "sigGrowth", "sigMargins", "sigTrend",
        "sigMomentum", "sigPattern", "sigCatalyst", "sigSentiment",
      ]) {
        expect(stock.signals[key]).toBeGreaterThanOrEqual(-1);
        expect(stock.signals[key]).toBeLessThanOrEqual(1);
      }
    }

    // Results sorted by signalTotal descending
    expect(body.stocks[0].signalTotal).toBeGreaterThanOrEqual(
      body.stocks[1].signalTotal,
    );
  });

  test("returns 400 for empty stocks array", async ({ request }) => {
    const resp = await request.post(`${BASE}/api/analyze`, {
      data: { stocks: [] },
    });
    expect(resp.status()).toBe(400);
  });

  test("returns 400 for missing stocks field", async ({ request }) => {
    const resp = await request.post(`${BASE}/api/analyze`, {
      data: { invalid: true },
    });
    expect(resp.status()).toBe(400);
  });
});
