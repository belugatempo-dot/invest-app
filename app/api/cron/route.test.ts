import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import type { RawStockData, ScoredStock } from "@/lib/types";

// --- Mocks ---

const mockThemeGet = vi.fn();
vi.mock("@/lib/db", () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({
          get: mockThemeGet,
        }),
      }),
    }),
  },
}));

vi.mock("@/lib/schema", () => ({
  themes: { id: "id" },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn(),
}));

const mockRunScreen = vi.fn();
vi.mock("@/lib/screener", () => ({
  runScreen: (...args: unknown[]) => mockRunScreen(...args),
}));

const mockScoreScreen = vi.fn();
vi.mock("@/lib/signal-scorer", () => ({
  scoreScreen: (...args: unknown[]) => mockScoreScreen(...args),
}));

const mockEnrichWithSentiment = vi.fn();
vi.mock("@/lib/sentiment", () => ({
  enrichWithSentiment: (...args: unknown[]) => mockEnrichWithSentiment(...args),
}));

const mockPersistScreenResults = vi.fn();
vi.mock("@/lib/db-operations", () => ({
  persistScreenResults: (...args: unknown[]) => mockPersistScreenResults(...args),
}));

// Import route handler AFTER mocks
const { GET } = await import("./route");

// --- Helpers ---

function makeRequest(params?: Record<string, string>, headers?: Record<string, string>) {
  const url = new URL("http://localhost:8888/api/cron");
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }
  }
  return new NextRequest(url, { headers });
}

const mockTheme = {
  id: "ai-infra",
  nameZh: "AI 基础设施",
  market: "america",
  filters: [{ left: "gross_margin_ttm", operation: "greater", right: 40 }],
};

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

describe("GET /api/cron", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.CRON_SECRET;
    delete process.env.VERCEL;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("should return 500 when VERCEL=true but no CRON_SECRET", async () => {
    process.env.VERCEL = "1";

    const req = makeRequest({ theme: "ai-infra" });
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe("CRON_SECRET not configured");
  });

  it("should return 401 when CRON_SECRET is set but auth header is wrong", async () => {
    process.env.CRON_SECRET = "mysecret";

    const req = makeRequest({ theme: "ai-infra" }, { authorization: "Bearer wrongsecret" });
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("should allow open access when no secret and not on Vercel", async () => {
    mockThemeGet.mockResolvedValue(mockTheme);
    mockRunScreen.mockResolvedValue([]);

    const req = makeRequest({ theme: "ai-infra" });
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.count).toBe(0);
  });

  it("should return 400 when theme param is missing", async () => {
    const req = makeRequest();
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Missing ?theme= parameter");
  });

  it("should return 404 when theme is not found", async () => {
    mockThemeGet.mockResolvedValue(undefined);

    const req = makeRequest({ theme: "nonexistent" });
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Theme 'nonexistent' not found");
  });

  it("should return 200 with empty results when screener finds nothing", async () => {
    mockThemeGet.mockResolvedValue(mockTheme);
    mockRunScreen.mockResolvedValue([]);

    const req = makeRequest({ theme: "ai-infra" });
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.count).toBe(0);
    expect(body.source).toBe("cron");
    expect(body.message).toBe("No candidates found");
    expect(mockScoreScreen).not.toHaveBeenCalled();
  });

  it("should run full pipeline on happy path", async () => {
    const rawStocks = [makeRawStock()];
    const enrichedStocks = rawStocks.map((s) => ({ ...s, sentimentSource: "reddit" as const }));
    const scoredStocks = [makeScoredStock()];

    mockThemeGet.mockResolvedValue(mockTheme);
    mockRunScreen.mockResolvedValue(rawStocks);
    mockEnrichWithSentiment.mockResolvedValue(enrichedStocks);
    mockScoreScreen.mockReturnValue(scoredStocks);
    mockPersistScreenResults.mockResolvedValue({ runId: 99, count: 1 });

    const req = makeRequest({ theme: "ai-infra" });
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.runId).toBe(99);
    expect(body.count).toBe(1);
    expect(body.source).toBe("cron");
    expect(mockRunScreen).toHaveBeenCalledWith(mockTheme.filters, 25, "america");
    expect(mockEnrichWithSentiment).toHaveBeenCalledWith(rawStocks, "america");
    expect(mockPersistScreenResults).toHaveBeenCalledWith("ai-infra", "cron", scoredStocks);
  });

  it("should return 500 when runScreen throws", async () => {
    mockThemeGet.mockResolvedValue(mockTheme);
    mockRunScreen.mockRejectedValue(new Error("TradingView down"));

    const req = makeRequest({ theme: "ai-infra" });
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe("Cron screen failed");
  });
});
