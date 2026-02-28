import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// --- Mocks ---

const mockAll = vi.fn();
const mockInsertRun = vi.fn();
const mockDeleteRun = vi.fn();
vi.mock("@/lib/db", () => ({
  db: {
    select: () => ({
      from: () => ({
        all: mockAll,
      }),
    }),
    insert: () => ({
      values: () => ({
        onConflictDoNothing: () => ({
          run: mockInsertRun,
        }),
      }),
    }),
    delete: () => ({
      where: () => ({
        run: mockDeleteRun,
      }),
    }),
  },
}));

vi.mock("@/lib/schema", () => ({
  watchlist: { ticker: "ticker" },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn(),
}));

// Import route handlers AFTER mocks
const { GET, POST, DELETE: DELETE_HANDLER } = await import("./route");

// --- Helpers ---

function makePostRequest(body: unknown) {
  return new NextRequest("http://localhost:8888/api/watchlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeDeleteRequest(params?: Record<string, string>) {
  const url = new URL("http://localhost:8888/api/watchlist");
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }
  }
  return new NextRequest(url, { method: "DELETE" });
}

// --- Tests ---

describe("GET /api/watchlist", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return ticker array", async () => {
    mockAll.mockResolvedValue([{ ticker: "NVDA" }, { ticker: "AAPL" }]);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.tickers).toEqual(["NVDA", "AAPL"]);
  });
});

describe("POST /api/watchlist", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 400 when ticker is missing", async () => {
    const req = makePostRequest({});
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Missing ticker");
  });

  it("should return 400 for invalid ticker format", async () => {
    const req = makePostRequest({ ticker: "!!!" });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Invalid ticker");
  });

  it("should return 200 and add valid ticker", async () => {
    mockInsertRun.mockResolvedValue(undefined);

    const req = makePostRequest({ ticker: "NVDA" });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.ticker).toBe("NVDA");
    expect(mockInsertRun).toHaveBeenCalled();
  });

  it("should normalize lowercase ticker to uppercase", async () => {
    mockInsertRun.mockResolvedValue(undefined);

    const req = makePostRequest({ ticker: "aapl" });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ticker).toBe("AAPL");
  });
});

describe("DELETE /api/watchlist", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 400 when ticker param is missing", async () => {
    const req = makeDeleteRequest();
    const res = await DELETE_HANDLER(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Missing ?ticker= parameter");
  });

  it("should return 400 for invalid ticker format", async () => {
    const req = makeDeleteRequest({ ticker: "!!!" });
    const res = await DELETE_HANDLER(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Invalid ticker");
  });

  it("should return 200 for valid deletion", async () => {
    mockDeleteRun.mockResolvedValue(undefined);

    const req = makeDeleteRequest({ ticker: "NVDA" });
    const res = await DELETE_HANDLER(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.ticker).toBe("NVDA");
    expect(mockDeleteRun).toHaveBeenCalled();
  });
});
