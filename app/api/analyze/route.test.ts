import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import type { RawStockData, ScoredStock } from "@/lib/types";

// --- Mocks ---

const mockScoreScreen = vi.fn();
vi.mock("@/lib/signal-scorer", () => ({
  scoreScreen: (...args: unknown[]) => mockScoreScreen(...args),
}));

// Import route handler AFTER mocks
const { POST } = await import("./route");

// --- Helpers ---

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost:8888/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeRawStock(overrides: Partial<RawStockData> = {}): RawStockData {
  return {
    ticker: "NVDA",
    company: "NVIDIA Corporation",
    exchange: "NASDAQ",
    close: 130,
    changePct: 2.5,
    marketCap: 3.2e12,
    pe: 65,
    revGrowth: 0.12,
    grossMargin: 0.75,
    opMargin: 0.62,
    fcfMargin: 0.35,
    rsi: 58,
    adx: 30,
    sma50: 125,
    sma200: 110,
    high52w: 140,
    low52w: 80,
    ...overrides,
  };
}

function makeScoredStock(overrides: Partial<ScoredStock> = {}): ScoredStock {
  return {
    ...makeRawStock(),
    signals: {
      sigValuation: 0,
      sigGrowth: 1,
      sigMargins: 1,
      sigTrend: 1,
      sigMomentum: 0,
      sigPattern: 0,
      sigCatalyst: 0,
      sigSentiment: 0,
    },
    signalTotal: 3,
    rating: { zh: "偏多", en: "LEAN BUY" },
    entryRange: "$125-130",
    target: "$150",
    stop: "$110",
    ...overrides,
  };
}

// --- Tests ---

describe("POST /api/analyze", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 400 when stocks is missing", async () => {
    const req = makeRequest({});
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Request body must include a non-empty 'stocks' array");
  });

  it("should return 400 when stocks is an empty array", async () => {
    const req = makeRequest({ stocks: [] });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Request body must include a non-empty 'stocks' array");
  });

  it("should return 200 with scored stocks on happy path", async () => {
    const rawStocks = [makeRawStock(), makeRawStock({ ticker: "AAPL" })];
    const scoredStocks = [makeScoredStock(), makeScoredStock({ ticker: "AAPL" })];
    mockScoreScreen.mockReturnValue(scoredStocks);

    const req = makeRequest({ stocks: rawStocks });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.count).toBe(2);
    expect(body.stocks).toEqual(scoredStocks);
    expect(mockScoreScreen).toHaveBeenCalledWith(rawStocks);
  });

  it("should return 500 when scoreScreen throws", async () => {
    mockScoreScreen.mockImplementation(() => {
      throw new Error("Scoring engine broke");
    });

    const req = makeRequest({ stocks: [makeRawStock()] });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe("Analysis failed");
  });
});
