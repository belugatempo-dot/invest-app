import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// --- Mocks ---

const mockLlmPrompt = vi.fn();
vi.mock("@/lib/llm", () => {
  class LLMNotConfiguredError extends Error {
    constructor(msg = "LLM not configured") {
      super(msg);
      this.name = "LLMNotConfiguredError";
    }
  }
  return {
    llmPrompt: (...args: unknown[]) => mockLlmPrompt(...args),
    LLMNotConfiguredError,
  };
});

const mockDbGet = vi.fn();
const mockDbRun = vi.fn();
vi.mock("@/lib/db", () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({
          orderBy: () => ({
            limit: () => ({
              get: mockDbGet,
            }),
          }),
        }),
      }),
    }),
    update: () => ({
      set: () => ({
        where: () => ({
          run: mockDbRun,
        }),
      }),
    }),
  },
}));

vi.mock("@/lib/schema", () => ({
  stockSnapshots: { ticker: "ticker", id: "id" },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn(),
  desc: vi.fn(),
}));

// Import route handler AFTER mocks
const { POST } = await import("./route");
const { LLMNotConfiguredError } = await import("@/lib/llm");

// --- Helpers ---

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost:8888/api/thesis", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const mockSnapshot = {
  id: 1,
  ticker: "NVDA",
  company: "NVIDIA Corporation",
  close: 130.5,
  marketCap: 3.2e12,
  pe: 65.2,
  revGrowth: 0.122,
  grossMargin: 0.751,
  rsi: 58.3,
  signalTotal: 5,
  rating: "偏多",
  entryRange: "$125-130",
  target: "$150",
  stop: "$110",
};

// --- Tests ---

describe("POST /api/thesis", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 400 when ticker is missing", async () => {
    const req = makeRequest({});
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Missing 'ticker' in request body");
  });

  it("should return 503 when LLMNotConfiguredError is thrown", async () => {
    mockDbGet.mockResolvedValue(undefined);
    mockLlmPrompt.mockRejectedValue(new LLMNotConfiguredError());

    const req = makeRequest({ ticker: "NVDA" });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body.error).toBe("AI 功能未配置");
  });

  it("should return 500 on generic LLM error", async () => {
    mockDbGet.mockResolvedValue(undefined);
    mockLlmPrompt.mockRejectedValue(new Error("OpenAI timeout"));

    const req = makeRequest({ ticker: "NVDA" });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe("Thesis generation failed");
  });

  it("should return 200 with thesis when snapshot exists", async () => {
    mockDbGet.mockResolvedValue(mockSnapshot);
    mockLlmPrompt.mockResolvedValue("这是投资论点...");
    mockDbRun.mockResolvedValue(undefined);

    const req = makeRequest({ ticker: "NVDA" });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ticker).toBe("NVDA");
    expect(body.thesis).toBe("这是投资论点...");
    expect(mockLlmPrompt).toHaveBeenCalledWith(expect.stringContaining("NVIDIA Corporation"));
    expect(mockDbRun).toHaveBeenCalled();
  });

  it("should return 200 with thesis when no snapshot exists", async () => {
    mockDbGet.mockResolvedValue(undefined);
    mockLlmPrompt.mockResolvedValue("基本论点...");

    const req = makeRequest({ ticker: "TSLA" });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ticker).toBe("TSLA");
    expect(body.thesis).toBe("基本论点...");
    expect(mockLlmPrompt).toHaveBeenCalledWith(expect.stringContaining("Stock: TSLA"));
    expect(mockDbRun).not.toHaveBeenCalled();
  });

  it("should update DB with thesis text when snapshot exists", async () => {
    mockDbGet.mockResolvedValue(mockSnapshot);
    mockLlmPrompt.mockResolvedValue("更新论点...");
    mockDbRun.mockResolvedValue(undefined);

    const req = makeRequest({ ticker: "NVDA" });
    await POST(req);

    expect(mockDbRun).toHaveBeenCalledTimes(1);
  });
});
