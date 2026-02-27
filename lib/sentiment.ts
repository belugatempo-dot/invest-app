import type { RawStockData } from "./types";
import { fetchRedditSentiment, mergeRedditData } from "./reddit-sentiment";
import {
  fetchXueqiuSentiment,
  mergeXueqiuData,
} from "./xueqiu-sentiment";

/**
 * Enrich stocks with sentiment data from the appropriate source:
 *   - "america" → Reddit (ApeWisdom)
 *   - "china"   → Xueqiu (雪球)
 */
export async function enrichWithSentiment(
  stocks: RawStockData[],
  market: "america" | "china",
): Promise<RawStockData[]> {
  if (market === "china") {
    const map = await fetchXueqiuSentiment();
    return mergeXueqiuData(stocks, map);
  }
  const map = await fetchRedditSentiment();
  return mergeRedditData(stocks, map);
}
