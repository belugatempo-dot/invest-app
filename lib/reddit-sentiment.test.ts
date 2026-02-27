import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  fetchRedditSentiment,
  mergeRedditData,
  type RedditSentiment,
} from "./reddit-sentiment";
import type { RawStockData } from "./types";

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

function makePage(
  tickers: { ticker: string; mentions: number; mentions_24h_ago: number; rank: number; upvotes: number }[],
) {
  return {
    ok: true,
    json: async () => ({ results: tickers }),
  };
}

describe("fetchRedditSentiment", () => {
  it("should return a map of ticker → RedditSentiment for 2 pages", async () => {
    mockFetch
      .mockResolvedValueOnce(
        makePage([
          { ticker: "NVDA", mentions: 1038, mentions_24h_ago: 800, rank: 1, upvotes: 5000 },
          { ticker: "AAPL", mentions: 500, mentions_24h_ago: 600, rank: 2, upvotes: 3000 },
        ]),
      )
      .mockResolvedValueOnce(
        makePage([
          { ticker: "TSLA", mentions: 200, mentions_24h_ago: 150, rank: 101, upvotes: 1000 },
        ]),
      );

    const map = await fetchRedditSentiment(2);

    expect(map.size).toBe(3);
    expect(map.get("NVDA")).toEqual({
      rank: 1,
      mentions: 1038,
      mentions24hAgo: 800,
    });
    expect(map.get("TSLA")).toEqual({
      rank: 101,
      mentions: 200,
      mentions24hAgo: 150,
    });
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("should return empty map when API fails", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));

    const map = await fetchRedditSentiment(2);

    expect(map.size).toBe(0);
  });

  it("should return empty map when API returns non-ok response", async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500 });

    const map = await fetchRedditSentiment(1);

    expect(map.size).toBe(0);
  });

  it("should default to 2 pages", async () => {
    mockFetch
      .mockResolvedValueOnce(makePage([]))
      .mockResolvedValueOnce(makePage([]));

    await fetchRedditSentiment();

    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("should handle partial page failure gracefully (page 2 fails)", async () => {
    mockFetch
      .mockResolvedValueOnce(
        makePage([
          { ticker: "NVDA", mentions: 500, mentions_24h_ago: 400, rank: 1, upvotes: 2000 },
        ]),
      )
      .mockRejectedValueOnce(new Error("timeout"));

    const map = await fetchRedditSentiment(2);

    // Should still return data from page 1
    expect(map.size).toBe(0); // entire call fails → empty map (safe degradation)
  });
});

describe("mergeRedditData", () => {
  const baseStocks: RawStockData[] = [
    { ticker: "NVDA", company: "NVIDIA" },
    { ticker: "AAPL", company: "Apple" },
    { ticker: "UNKNOWN", company: "Unknown Corp" },
  ];

  it("should merge reddit data into matching stocks", () => {
    const sentimentMap = new Map<string, RedditSentiment>([
      ["NVDA", { rank: 1, mentions: 1038, mentions24hAgo: 800 }],
      ["AAPL", { rank: 5, mentions: 500, mentions24hAgo: 600 }],
    ]);

    const merged = mergeRedditData(baseStocks, sentimentMap);

    expect(merged[0].sentimentRank).toBe(1);
    expect(merged[0].sentimentMentions).toBe(1038);
    expect(merged[0].sentimentMentionsPrev).toBe(800);
    expect(merged[0].sentimentSource).toBe("reddit");
    expect(merged[1].sentimentRank).toBe(5);
    expect(merged[1].sentimentSource).toBe("reddit");
    // Stock not in reddit data should have undefined fields
    expect(merged[2].sentimentRank).toBeUndefined();
    expect(merged[2].sentimentMentions).toBeUndefined();
    expect(merged[2].sentimentSource).toBeUndefined();
  });

  it("should not mutate the original stocks array", () => {
    const sentimentMap = new Map<string, RedditSentiment>([
      ["NVDA", { rank: 1, mentions: 500, mentions24hAgo: 400 }],
    ]);

    const merged = mergeRedditData(baseStocks, sentimentMap);

    expect(baseStocks[0].sentimentRank).toBeUndefined();
    expect(merged[0].sentimentRank).toBe(1);
  });

  it("should handle empty sentiment map", () => {
    const merged = mergeRedditData(baseStocks, new Map());

    expect(merged.length).toBe(3);
    expect(merged[0].sentimentRank).toBeUndefined();
  });

  it("should handle empty stocks array", () => {
    const sentimentMap = new Map<string, RedditSentiment>([
      ["NVDA", { rank: 1, mentions: 500, mentions24hAgo: 400 }],
    ]);

    const merged = mergeRedditData([], sentimentMap);

    expect(merged.length).toBe(0);
  });
});
