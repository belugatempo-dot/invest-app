import { describe, it, expect, vi, beforeEach } from "vitest";
import type { RawStockData } from "./types";

// Mock both sentiment modules
vi.mock("./reddit-sentiment", () => ({
  fetchRedditSentiment: vi.fn(),
  mergeRedditData: vi.fn(),
}));

vi.mock("./xueqiu-sentiment", () => ({
  fetchXueqiuSentiment: vi.fn(),
  mergeXueqiuData: vi.fn(),
}));

// Import after mocks
import { enrichWithSentiment } from "./sentiment";
import {
  fetchRedditSentiment,
  mergeRedditData,
} from "./reddit-sentiment";
import {
  fetchXueqiuSentiment,
  mergeXueqiuData,
} from "./xueqiu-sentiment";

const mockFetchReddit = vi.mocked(fetchRedditSentiment);
const mockMergeReddit = vi.mocked(mergeRedditData);
const mockFetchXueqiu = vi.mocked(fetchXueqiuSentiment);
const mockMergeXueqiu = vi.mocked(mergeXueqiuData);

beforeEach(() => {
  vi.clearAllMocks();
});

const usStocks: RawStockData[] = [
  { ticker: "NVDA", company: "NVIDIA" },
  { ticker: "AAPL", company: "Apple" },
];

const cnStocks: RawStockData[] = [
  { ticker: "600519", company: "贵州茅台" },
  { ticker: "000858", company: "五粮液" },
];

describe("enrichWithSentiment", () => {
  it("should route to Reddit for america market", async () => {
    const redditMap = new Map();
    mockFetchReddit.mockResolvedValue(redditMap);
    const enriched = usStocks.map((s) => ({
      ...s,
      sentimentSource: "reddit" as const,
    }));
    mockMergeReddit.mockReturnValue(enriched);

    const result = await enrichWithSentiment(usStocks, "america");

    expect(mockFetchReddit).toHaveBeenCalledOnce();
    expect(mockMergeReddit).toHaveBeenCalledWith(usStocks, redditMap);
    expect(mockFetchXueqiu).not.toHaveBeenCalled();
    expect(mockMergeXueqiu).not.toHaveBeenCalled();
    expect(result).toBe(enriched);
  });

  it("should route to Xueqiu for china market", async () => {
    const xueqiuMap = new Map();
    mockFetchXueqiu.mockResolvedValue(xueqiuMap);
    const enriched = cnStocks.map((s) => ({
      ...s,
      sentimentSource: "xueqiu" as const,
    }));
    mockMergeXueqiu.mockReturnValue(enriched);

    const result = await enrichWithSentiment(cnStocks, "china");

    expect(mockFetchXueqiu).toHaveBeenCalledOnce();
    expect(mockMergeXueqiu).toHaveBeenCalledWith(cnStocks, xueqiuMap);
    expect(mockFetchReddit).not.toHaveBeenCalled();
    expect(mockMergeReddit).not.toHaveBeenCalled();
    expect(result).toBe(enriched);
  });
});
