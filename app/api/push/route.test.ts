import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// --- Mocks ---

const mockThemeGet = vi.fn();
const mockInsertRun = vi.fn();
const mockInsertSnapshot = vi.fn();
vi.mock("@/lib/db", () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({
          get: mockThemeGet,
        }),
      }),
    }),
    insert: (table: { _name?: string }) => {
      // Route calls insert on screenRuns (returning().get()) and stockSnapshots (.run())
      if (table._name === "screen_runs") {
        return {
          values: () => ({
            returning: () => ({
              get: mockInsertRun,
            }),
          }),
        };
      }
      return {
        values: () => ({
          run: mockInsertSnapshot,
        }),
      };
    },
  },
}));

vi.mock("@/lib/schema", () => ({
  themes: { id: "id", _name: "themes" },
  screenRuns: { _name: "screen_runs" },
  stockSnapshots: { _name: "stock_snapshots" },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn(),
}));

const mockSseEmit = vi.fn();
vi.mock("@/lib/sse", () => ({
  sse: {
    emit: (...args: unknown[]) => mockSseEmit(...args),
  },
}));

// Import route handler AFTER mocks
const { POST } = await import("./route");

// --- Helpers ---

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost:8888/api/push", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const mockTheme = {
  id: "ai-infra",
  nameZh: "AI 基础设施",
  nameEn: "AI Infrastructure",
  market: "america",
};

const mockStock = {
  ticker: "NVDA",
  company: "NVIDIA Corporation",
  exchange: "NASDAQ",
  close: 130,
  signals: { sigGrowth: 1, sigMargins: 1 },
  signalTotal: 3,
  rating: { zh: "偏多" },
};

// --- Tests ---

describe("POST /api/push", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 400 when theme is missing", async () => {
    const req = makeRequest({ stocks: [] });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Body must include 'theme' (string) and 'stocks' (array)");
  });

  it("should return 400 when stocks is missing", async () => {
    const req = makeRequest({ theme: "ai-infra" });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Body must include 'theme' (string) and 'stocks' (array)");
  });

  it("should return 404 when theme is not found", async () => {
    mockThemeGet.mockResolvedValue(undefined);

    const req = makeRequest({ theme: "nonexistent", stocks: [mockStock] });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Theme 'nonexistent' not found");
  });

  it("should return 200 and persist stocks on happy path", async () => {
    mockThemeGet.mockResolvedValue(mockTheme);
    mockInsertRun.mockResolvedValue({ id: 42 });
    mockInsertSnapshot.mockResolvedValue(undefined);

    const req = makeRequest({ theme: "ai-infra", stocks: [mockStock] });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.runId).toBe(42);
    expect(body.count).toBe(1);
    expect(body.message).toBe("Persisted 1 stocks from CLI push");
    expect(mockInsertSnapshot).toHaveBeenCalledTimes(1);
    expect(mockSseEmit).toHaveBeenCalledWith("screen_update", {
      runId: 42,
      themeId: "ai-infra",
      themeName: mockTheme.nameZh,
      count: 1,
    });
  });

  it("should return 500 when DB insert throws", async () => {
    mockThemeGet.mockResolvedValue(mockTheme);
    mockInsertRun.mockRejectedValue(new Error("DB write failed"));

    const req = makeRequest({ theme: "ai-infra", stocks: [mockStock] });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe("Push failed");
  });
});
