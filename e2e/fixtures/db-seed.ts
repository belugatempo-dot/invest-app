import type { APIRequestContext } from "@playwright/test";

export const TEST_THEMES = [
  {
    id: "e2e-us-tech",
    nameZh: "E2E美股科技",
    nameEn: "E2E US Tech",
    market: "america",
    sectors: ["Electronic Technology", "Technology Services"],
    filters: [
      { left: "market_cap_basic", operation: "greater", right: 5e9 },
      { left: "sector", operation: "in_range", right: ["Electronic Technology", "Technology Services"] },
    ],
    schedule: null,
  },
  {
    id: "e2e-cn-ai",
    nameZh: "E2E中国AI",
    nameEn: "E2E China AI",
    market: "china",
    sectors: ["Electronic Technology"],
    filters: [
      { left: "market_cap_basic", operation: "greater", right: 2e10 },
      { left: "sector", operation: "in_range", right: ["Electronic Technology"] },
    ],
    schedule: null,
  },
];

export const TEST_STOCKS = [
  {
    ticker: "NVDA",
    company: "NVIDIA Corporation",
    exchange: "NASDAQ",
    sector: "Electronic Technology",
    close: 950.0,
    changePct: 2.5,
    marketCap: 2.3e12,
    pe: 65.0,
    evEbitda: 55.0,
    revGrowth: 0.95,
    grossMargin: 0.73,
    opMargin: 0.62,
    fcfMargin: 0.35,
    rsi: 58.0,
    adx: 32.0,
    sma50: 900.0,
    sma200: 750.0,
    high52w: 980.0,
    low52w: 450.0,
    ath: 980.0,
    earningsDays: 25,
    sigValuation: -1,
    sigGrowth: 1,
    sigMargins: 1,
    sigTrend: 1,
    sigMomentum: 0,
    sigPattern: 1,
    sigCatalyst: 0,
    sigSentiment: 1,
    signalTotal: 4,
    rating: "买入",
    entryRange: "$900 – $960",
    target: "$980",
    stop: "$712",
  },
  {
    ticker: "AVGO",
    company: "Broadcom Inc",
    exchange: "NASDAQ",
    sector: "Electronic Technology",
    close: 180.0,
    changePct: 1.2,
    marketCap: 8.4e11,
    pe: 35.0,
    revGrowth: 0.44,
    grossMargin: 0.71,
    opMargin: 0.38,
    fcfMargin: 0.42,
    rsi: 45.0,
    adx: 28.0,
    sma50: 170.0,
    sma200: 155.0,
    high52w: 195.0,
    low52w: 120.0,
    sigValuation: 0,
    sigGrowth: 1,
    sigMargins: 1,
    sigTrend: 1,
    sigMomentum: 1,
    sigPattern: 1,
    sigCatalyst: 0,
    sigSentiment: 0,
    signalTotal: 5,
    rating: "买入",
    entryRange: "$155 – $184",
    target: "$195",
    stop: "$147",
  },
  {
    ticker: "AMD",
    company: "Advanced Micro Devices",
    exchange: "NASDAQ",
    sector: "Electronic Technology",
    close: 160.0,
    changePct: -0.8,
    marketCap: 2.6e11,
    pe: 48.0,
    revGrowth: 0.18,
    grossMargin: 0.53,
    opMargin: 0.22,
    fcfMargin: 0.12,
    rsi: 42.0,
    adx: 18.0,
    sma50: 158.0,
    sma200: 148.0,
    high52w: 230.0,
    low52w: 125.0,
    sigValuation: 0,
    sigGrowth: 1,
    sigMargins: 1,
    sigTrend: 1,
    sigMomentum: 1,
    sigPattern: 0,
    sigCatalyst: 0,
    sigSentiment: 0,
    signalTotal: 4,
    rating: "买入",
    entryRange: "$148 – $163",
    target: "$230",
    stop: "$140",
  },
];

export async function seedTestData(
  request: APIRequestContext,
  baseURL: string,
): Promise<{ runId: number; count: number }> {
  const resp = await request.post(`${baseURL}/api/push`, {
    data: { theme: "e2e-us-tech", stocks: TEST_STOCKS },
  });
  if (!resp.ok()) {
    throw new Error(`Seed failed: ${resp.status()} ${await resp.text()}`);
  }
  return resp.json();
}

export async function cleanupWatchlist(
  request: APIRequestContext,
  baseURL: string,
): Promise<void> {
  const resp = await request.get(`${baseURL}/api/watchlist`);
  if (!resp.ok()) return;
  const { tickers } = await resp.json();
  for (const ticker of tickers) {
    await request.delete(`${baseURL}/api/watchlist?ticker=${ticker}`);
  }
}
