import { test, expect } from "@playwright/test";

const BASE = "http://localhost:8888";

test.describe("TradingView Live @smoke", () => {
  test("real TradingView scan API returns valid stock data @smoke", async () => {
    const resp = await fetch(
      "https://scanner.tradingview.com/america/scan",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          columns: [
            "name",
            "close",
            "change",
            "market_cap_basic",
            "price_earnings_ttm",
          ],
          filter: [
            { left: "market_cap_basic", operation: "greater", right: 1e12 },
          ],
          sort: { sortBy: "market_cap_basic", sortOrder: "desc" },
          range: [0, 5],
        }),
      },
    );

    expect(resp.ok).toBe(true);
    const data = await resp.json();

    expect(data.totalCount).toBeGreaterThan(0);
    expect(data.data).toBeDefined();
    expect(data.data.length).toBeGreaterThan(0);
    expect(data.data.length).toBeLessThanOrEqual(5);

    // Each result should have symbol and data array
    for (const item of data.data) {
      expect(item.s).toBeDefined(); // e.g., "NASDAQ:AAPL"
      expect(item.d).toBeDefined();
      expect(Array.isArray(item.d)).toBe(true);
    }
  });

  test("real /api/analyze scores live TradingView data @smoke", async ({
    request,
  }) => {
    // First, fetch real data from TradingView
    const tvResp = await fetch(
      "https://scanner.tradingview.com/america/scan",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          columns: [
            "name",
            "close",
            "change",
            "market_cap_basic",
            "price_earnings_ttm",
            "total_revenue_yoy_growth_ttm",
            "gross_margin_ttm",
            "free_cash_flow_margin_ttm",
            "RSI",
            "ADX",
            "SMA50",
            "SMA200",
            "price_52_week_high",
            "price_52_week_low",
          ],
          filter: [
            { left: "market_cap_basic", operation: "greater", right: 5e11 },
            { left: "sector", operation: "in_range", right: ["Electronic Technology"] },
          ],
          sort: { sortBy: "market_cap_basic", sortOrder: "desc" },
          range: [0, 5],
        }),
      },
    );

    expect(tvResp.ok).toBe(true);
    const tvData = await tvResp.json();

    // Map to RawStockData
    const stocks = tvData.data.map((item: { s: string; d: (string | number | null)[] }) => {
      const [exchange, ticker] = item.s.split(":");
      const d = item.d;
      return {
        ticker: ticker ?? item.s,
        company: (d[0] as string) ?? ticker,
        exchange,
        close: d[1] as number | undefined,
        changePct: d[2] as number | undefined,
        marketCap: d[3] as number | undefined,
        pe: d[4] as number | undefined,
        revGrowth: d[5] != null ? (d[5] as number) / 100 : undefined,
        grossMargin: d[6] != null ? (d[6] as number) / 100 : undefined,
        fcfMargin: d[7] != null ? (d[7] as number) / 100 : undefined,
        rsi: d[8] as number | undefined,
        adx: d[9] as number | undefined,
        sma50: d[10] as number | undefined,
        sma200: d[11] as number | undefined,
        high52w: d[12] as number | undefined,
        low52w: d[13] as number | undefined,
      };
    });

    // Score via our API
    const analyzeResp = await request.post(`${BASE}/api/analyze`, {
      data: { stocks },
    });

    expect(analyzeResp.status()).toBe(200);
    const body = await analyzeResp.json();
    expect(body.count).toBeGreaterThan(0);

    for (const stock of body.stocks) {
      expect(stock.signals).toBeDefined();
      expect(stock.signalTotal).toBeGreaterThanOrEqual(-8);
      expect(stock.signalTotal).toBeLessThanOrEqual(8);
      expect(stock.rating.zh).toBeDefined();
    }
  });
});
