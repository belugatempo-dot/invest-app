import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// --- Mocks ---

const mockRunsAll = vi.fn();
const mockEvolutionAll = vi.fn();
const mockDecisionsAll = vi.fn();
const mockAccuracyAll = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    select: (fields?: unknown) => {
      // Distinguish between the different select() calls by checking fields
      return {
        from: (table: { _name?: string }) => {
          if (table._name === "screen_runs") {
            return {
              leftJoin: () => ({
                orderBy: () => ({
                  limit: () => ({
                    all: mockRunsAll,
                  }),
                }),
              }),
            };
          }
          if (table._name === "stock_snapshots") {
            return {
              innerJoin: () => ({
                where: () => ({
                  orderBy: () => ({
                    all: mockEvolutionAll,
                  }),
                }),
              }),
            };
          }
          if (table._name === "decisions") {
            // Two paths: one with orderBy (decisions action), one without (accuracy action)
            if (fields) {
              // select() with no args = accuracy path
              return {
                orderBy: () => ({
                  all: mockDecisionsAll,
                }),
                all: mockAccuracyAll,
              };
            }
            return {
              orderBy: () => ({
                all: mockDecisionsAll,
              }),
              all: mockAccuracyAll,
            };
          }
          return { all: vi.fn().mockResolvedValue([]) };
        },
      };
    },
  },
}));

vi.mock("@/lib/schema", () => ({
  screenRuns: { _name: "screen_runs", id: "id", themeId: "themeId", runAt: "runAt", candidateCount: "candidateCount", source: "source" },
  stockSnapshots: { _name: "stock_snapshots", runId: "runId", ticker: "ticker", signalTotal: "signalTotal", rating: "rating" },
  themes: { _name: "themes", id: "id", nameZh: "nameZh" },
  decisions: { _name: "decisions", decidedAt: "decidedAt" },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn(),
  desc: vi.fn(),
}));

// Import route handler AFTER mocks
const { GET } = await import("./route");

// --- Helpers ---

function makeRequest(params?: Record<string, string>) {
  const url = new URL("http://localhost:8888/api/history");
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }
  }
  return new NextRequest(url);
}

// --- Tests ---

describe("GET /api/history", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 400 for unknown action", async () => {
    const req = makeRequest({ action: "bogus" });
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain("Unknown action");
  });

  it("should return 400 when action is missing", async () => {
    const req = makeRequest();
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain("Unknown action");
  });

  it("should return runs list for action=runs", async () => {
    const mockRuns = [
      { id: 1, themeId: "ai-infra", themeName: "AI 基础设施", source: "web", runAt: "2026-01-01", candidateCount: 10 },
    ];
    mockRunsAll.mockResolvedValue(mockRuns);

    const req = makeRequest({ action: "runs" });
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual(mockRuns);
  });

  it("should return 400 for evolution without ticker", async () => {
    const req = makeRequest({ action: "evolution" });
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Missing ticker");
  });

  it("should return 400 for evolution with invalid ticker", async () => {
    const req = makeRequest({ action: "evolution", ticker: "!!!" });
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Invalid ticker");
  });

  it("should return evolution data for valid ticker", async () => {
    const mockSnapshots = [
      { runAt: "2026-01-01", signalTotal: 5, rating: "买入", close: 130 },
    ];
    mockEvolutionAll.mockResolvedValue(mockSnapshots);

    const req = makeRequest({ action: "evolution", ticker: "NVDA" });
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual(mockSnapshots);
  });

  it("should return decisions list for action=decisions", async () => {
    const mockDecisions = [
      { id: 1, ticker: "NVDA", action: "BUY", rating: "买入", decidedAt: "2026-01-01" },
    ];
    mockDecisionsAll.mockResolvedValue(mockDecisions);

    const req = makeRequest({ action: "decisions" });
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual(mockDecisions);
  });

  it("should compute accuracy win rates correctly", async () => {
    const rawDecisions = [
      { action: "BUY", rating: "买入", priceAtDecision: 100, outcomePrice: 120 },   // win
      { action: "BUY", rating: "买入", priceAtDecision: 100, outcomePrice: 90 },    // loss
      { action: "SELL", rating: "卖出", priceAtDecision: 100, outcomePrice: 80 },   // win
      { action: "BUY", rating: "买入", priceAtDecision: 100, outcomePrice: null },   // excluded (no outcome)
    ];
    mockAccuracyAll.mockResolvedValue(rawDecisions);

    const req = makeRequest({ action: "accuracy" });
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body["买入"]).toEqual({ total: 2, wins: 1 });
    expect(body["卖出"]).toEqual({ total: 1, wins: 1 });
  });
});
