import { TEST_STOCKS } from "./db-seed";

/** Mock response for GET /api/screen?theme=e2e-us-tech */
export const MOCK_SCREEN_RESPONSE = {
  theme: "e2e-us-tech",
  runId: 999,
  count: TEST_STOCKS.length,
  stocks: TEST_STOCKS.map((s) => ({
    ...s,
    signals: {
      sigValuation: s.sigValuation,
      sigGrowth: s.sigGrowth,
      sigMargins: s.sigMargins,
      sigTrend: s.sigTrend,
      sigMomentum: s.sigMomentum,
      sigPattern: s.sigPattern,
      sigCatalyst: s.sigCatalyst,
      sigSentiment: s.sigSentiment,
    },
    rating: { zh: s.rating, en: "BUY" },
  })),
};

/** Raw TradingView scan response shape (for smoke test reference) */
export const MOCK_TV_SCAN_RESPONSE = {
  totalCount: 3,
  data: [
    {
      s: "NASDAQ:NVDA",
      d: [
        "NVIDIA Corporation",
        950.0, 2.5, 2.3e12, 65.0, 55.0,
        95.0, 73.0, 62.0, 35.0,
        58.0, 32.0, 900.0, 750.0,
        980.0, 450.0, 980.0,
        null, "Electronic Technology",
      ],
    },
  ],
};
