import type { RawStockData } from "./types";

const APEWISDOM_BASE = "https://apewisdom.io/api/v1.0/filter/all-stocks/page";

export interface RedditSentiment {
  rank: number;
  mentions: number;
  mentions24hAgo: number;
}

interface ApeWisdomResult {
  ticker: string;
  mentions: number;
  mentions_24h_ago: number;
  rank: number;
  upvotes: number;
}

/**
 * Fetch Reddit sentiment data from ApeWisdom API.
 * Returns a Map of ticker → RedditSentiment.
 * On any failure, returns an empty map (graceful degradation).
 */
export async function fetchRedditSentiment(
  maxPages = 2,
): Promise<Map<string, RedditSentiment>> {
  const map = new Map<string, RedditSentiment>();

  try {
    const pages = Array.from({ length: maxPages }, (_, i) => i + 1);
    const responses = await Promise.all(
      pages.map((page) =>
        fetch(`${APEWISDOM_BASE}/${page}`, {
          signal: AbortSignal.timeout(10_000),
        }),
      ),
    );

    for (const res of responses) {
      if (!res.ok) return new Map();
      const data = (await res.json()) as { results: ApeWisdomResult[] };
      for (const item of data.results) {
        map.set(item.ticker, {
          rank: item.rank,
          mentions: item.mentions,
          mentions24hAgo: item.mentions_24h_ago,
        });
      }
    }
  } catch {
    return new Map();
  }

  return map;
}

/**
 * Merge Reddit sentiment data into stock array (pure function, no mutation).
 */
export function mergeRedditData(
  stocks: RawStockData[],
  sentimentMap: Map<string, RedditSentiment>,
): RawStockData[] {
  return stocks.map((stock) => {
    const sentiment = sentimentMap.get(stock.ticker);
    if (!sentiment) return { ...stock };
    return {
      ...stock,
      sentimentRank: sentiment.rank,
      sentimentMentions: sentiment.mentions,
      sentimentMentionsPrev: sentiment.mentions24hAgo,
      sentimentSource: "reddit" as const,
    };
  });
}
