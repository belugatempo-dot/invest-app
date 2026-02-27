import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getXueqiuToken,
  normalizeCode,
  deriveRatio,
  fetchXueqiuSentiment,
  mergeXueqiuData,
  type XueqiuSentiment,
} from "./xueqiu-sentiment";
import type { RawStockData } from "./types";

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
  delete process.env.XUEQIU_TOKEN;
});

describe("normalizeCode", () => {
  it("should strip SH prefix", () => {
    expect(normalizeCode("SH600519")).toBe("600519");
  });

  it("should strip SZ prefix", () => {
    expect(normalizeCode("SZ000858")).toBe("000858");
  });

  it("should be case-insensitive", () => {
    expect(normalizeCode("sh601318")).toBe("601318");
    expect(normalizeCode("sz300750")).toBe("300750");
  });

  it("should return as-is when no prefix", () => {
    expect(normalizeCode("600519")).toBe("600519");
  });
});

describe("deriveRatio", () => {
  it("should return 1.3 for increase > 5 (rising heat)", () => {
    expect(deriveRatio(10)).toBe(1.3);
    expect(deriveRatio(6)).toBe(1.3);
  });

  it("should return 0.6 for increase < -5 (fading heat)", () => {
    expect(deriveRatio(-10)).toBe(0.6);
    expect(deriveRatio(-6)).toBe(0.6);
  });

  it("should return 1.0 for stable range (-5 to 5)", () => {
    expect(deriveRatio(0)).toBe(1.0);
    expect(deriveRatio(5)).toBe(1.0);
    expect(deriveRatio(-5)).toBe(1.0);
    expect(deriveRatio(3)).toBe(1.0);
  });
});

describe("getXueqiuToken", () => {
  it("should use XUEQIU_TOKEN env var when available", async () => {
    process.env.XUEQIU_TOKEN = "test-token-123";
    const token = await getXueqiuToken();
    expect(token).toBe("test-token-123");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("should extract xq_a_token from Set-Cookie header", async () => {
    mockFetch.mockResolvedValueOnce({
      headers: new Headers({
        "set-cookie": "xq_a_token=abc123; Path=/; Domain=.xueqiu.com",
      }),
    });

    const token = await getXueqiuToken();
    expect(token).toBe("abc123");
  });

  it("should throw when Set-Cookie does not contain xq_a_token", async () => {
    mockFetch.mockResolvedValueOnce({
      headers: new Headers({
        "set-cookie": "other_cookie=value; Path=/",
      }),
    });

    await expect(getXueqiuToken()).rejects.toThrow(
      "Failed to extract xq_a_token",
    );
  });

  it("should throw when no Set-Cookie header", async () => {
    mockFetch.mockResolvedValueOnce({
      headers: new Headers(),
    });

    await expect(getXueqiuToken()).rejects.toThrow(
      "Failed to extract xq_a_token",
    );
  });
});

describe("fetchXueqiuSentiment", () => {
  function mockTokenAndApi(items: unknown[]) {
    // First call: homepage for token
    mockFetch.mockResolvedValueOnce({
      headers: new Headers({
        "set-cookie": "xq_a_token=mock-token; Path=/",
      }),
    });
    // Second call: hot stock API
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { items } }),
    });
  }

  it("should fetch and parse hot stocks correctly", async () => {
    mockTokenAndApi([
      {
        code: "SH600519",
        name: "贵州茅台",
        follow_count: 500000,
        tweet_count: 12000,
        increase: 8,
        rank: 1,
      },
      {
        code: "SZ000858",
        name: "五粮液",
        follow_count: 300000,
        tweet_count: 8000,
        increase: -3,
        rank: 2,
      },
    ]);

    const map = await fetchXueqiuSentiment();

    expect(map.size).toBe(2);
    expect(map.get("600519")).toEqual({
      rank: 1,
      code: "SH600519",
      name: "贵州茅台",
      followCount: 500000,
      tweetCount: 12000,
      increase: 8,
    });
    expect(map.get("000858")).toEqual({
      rank: 2,
      code: "SZ000858",
      name: "五粮液",
      followCount: 300000,
      tweetCount: 8000,
      increase: -3,
    });
  });

  it("should assign index-based rank when rank not provided", async () => {
    mockTokenAndApi([
      {
        code: "SH601318",
        name: "中国平安",
        follow_count: 200000,
        tweet_count: 5000,
        increase: 2,
      },
    ]);

    const map = await fetchXueqiuSentiment();
    expect(map.get("601318")?.rank).toBe(1);
  });

  it("should return empty map when API returns non-ok response", async () => {
    mockFetch.mockResolvedValueOnce({
      headers: new Headers({
        "set-cookie": "xq_a_token=mock-token; Path=/",
      }),
    });
    mockFetch.mockResolvedValueOnce({ ok: false, status: 403 });

    const map = await fetchXueqiuSentiment();
    expect(map.size).toBe(0);
  });

  it("should return empty map when token fetch fails", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const map = await fetchXueqiuSentiment();
    expect(map.size).toBe(0);
  });

  it("should return empty map when API call fails", async () => {
    mockFetch.mockResolvedValueOnce({
      headers: new Headers({
        "set-cookie": "xq_a_token=mock-token; Path=/",
      }),
    });
    mockFetch.mockRejectedValueOnce(new Error("Timeout"));

    const map = await fetchXueqiuSentiment();
    expect(map.size).toBe(0);
  });

  it("should handle missing data.items gracefully", async () => {
    mockFetch.mockResolvedValueOnce({
      headers: new Headers({
        "set-cookie": "xq_a_token=mock-token; Path=/",
      }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: {} }),
    });

    const map = await fetchXueqiuSentiment();
    expect(map.size).toBe(0);
  });

  it("should use XUEQIU_TOKEN env var and skip homepage fetch", async () => {
    process.env.XUEQIU_TOKEN = "env-token";
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          items: [
            {
              code: "SH600519",
              name: "贵州茅台",
              follow_count: 100,
              tweet_count: 50,
              increase: 0,
              rank: 1,
            },
          ],
        },
      }),
    });

    const map = await fetchXueqiuSentiment();
    expect(map.size).toBe(1);
    // Only 1 fetch call (API), no homepage call
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});

describe("mergeXueqiuData", () => {
  const baseStocks: RawStockData[] = [
    { ticker: "600519", company: "贵州茅台" },
    { ticker: "000858", company: "五粮液" },
    { ticker: "601318", company: "中国平安" },
  ];

  const sentimentMap = new Map<string, XueqiuSentiment>([
    [
      "600519",
      {
        rank: 1,
        code: "SH600519",
        name: "贵州茅台",
        followCount: 500000,
        tweetCount: 12000,
        increase: 8,
      },
    ],
    [
      "000858",
      {
        rank: 5,
        code: "SZ000858",
        name: "五粮液",
        followCount: 300000,
        tweetCount: 8000,
        increase: -10,
      },
    ],
  ]);

  it("should merge xueqiu data into matching stocks", () => {
    const merged = mergeXueqiuData(baseStocks, sentimentMap);

    expect(merged[0].sentimentRank).toBe(1);
    expect(merged[0].sentimentMentions).toBe(12000);
    expect(merged[0].sentimentSource).toBe("xueqiu");

    // For increase=8 (>5), ratio=1.3, mentionsPrev = 12000 / 1.3 ≈ 9231
    expect(merged[0].sentimentMentionsPrev).toBe(Math.round(12000 / 1.3));

    expect(merged[1].sentimentRank).toBe(5);
    expect(merged[1].sentimentSource).toBe("xueqiu");
    // For increase=-10 (<-5), ratio=0.6, mentionsPrev = 8000 / 0.6 ≈ 13333
    expect(merged[1].sentimentMentionsPrev).toBe(Math.round(8000 / 0.6));
  });

  it("should leave unmatched stocks without sentiment data", () => {
    const merged = mergeXueqiuData(baseStocks, sentimentMap);

    expect(merged[2].sentimentRank).toBeUndefined();
    expect(merged[2].sentimentSource).toBeUndefined();
  });

  it("should not mutate the original stocks array", () => {
    const merged = mergeXueqiuData(baseStocks, sentimentMap);

    expect(baseStocks[0].sentimentRank).toBeUndefined();
    expect(merged[0].sentimentRank).toBe(1);
  });

  it("should handle empty sentiment map", () => {
    const merged = mergeXueqiuData(baseStocks, new Map());

    expect(merged.length).toBe(3);
    expect(merged[0].sentimentRank).toBeUndefined();
  });

  it("should handle empty stocks array", () => {
    const merged = mergeXueqiuData([], sentimentMap);
    expect(merged.length).toBe(0);
  });

  it("should match SH/SZ-prefixed tickers via normalizeCode fallback", () => {
    const prefixedStocks: RawStockData[] = [
      { ticker: "SH600519", company: "贵州茅台" },
    ];

    const merged = mergeXueqiuData(prefixedStocks, sentimentMap);
    expect(merged[0].sentimentRank).toBe(1);
    expect(merged[0].sentimentSource).toBe("xueqiu");
  });

  it("should handle zero tweetCount correctly", () => {
    const zeroMap = new Map<string, XueqiuSentiment>([
      [
        "600519",
        {
          rank: 1,
          code: "SH600519",
          name: "贵州茅台",
          followCount: 100,
          tweetCount: 0,
          increase: 5,
        },
      ],
    ]);

    const merged = mergeXueqiuData(
      [{ ticker: "600519", company: "贵州茅台" }],
      zeroMap,
    );

    expect(merged[0].sentimentMentions).toBe(0);
    expect(merged[0].sentimentMentionsPrev).toBe(0);
  });
});
