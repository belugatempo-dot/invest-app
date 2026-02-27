import type { RawStockData } from "./types";

const XUEQIU_HOME = "https://xueqiu.com";
const XUEQIU_HOT_API =
  "https://stock.xueqiu.com/v5/stock/hot_stock/list.json?size=100&type=12";

export interface XueqiuSentiment {
  rank: number;
  code: string;
  name: string;
  followCount: number;
  tweetCount: number;
  increase: number; // rank change (positive = rising)
}

/**
 * Get xq_a_token by visiting Xueqiu homepage and extracting Set-Cookie.
 * Can be overridden via XUEQIU_TOKEN env var.
 */
export async function getXueqiuToken(): Promise<string> {
  const envToken = process.env.XUEQIU_TOKEN;
  if (envToken) return envToken;

  const res = await fetch(XUEQIU_HOME, {
    signal: AbortSignal.timeout(10_000),
    redirect: "manual",
  });

  const setCookie = res.headers.get("set-cookie") ?? "";
  const match = setCookie.match(/xq_a_token=([^;]+)/);
  if (!match) throw new Error("Failed to extract xq_a_token from Xueqiu");
  return match[1];
}

/**
 * Normalize Xueqiu stock code: "SH600519" → "600519", "SZ000858" → "000858".
 */
export function normalizeCode(code: string): string {
  return code.replace(/^(SH|SZ)/i, "");
}

/**
 * Derive a mentions ratio from Xueqiu's `increase` (rank change) field.
 * Maps to the same ratio thresholds used by scoreSentiment():
 *   increase > 5  → ratio 1.3 (rising heat, maps to +1)
 *   increase < -5 → ratio 0.6 (fading heat, maps to -1)
 *   otherwise     → ratio 1.0 (stable, maps to 0)
 */
export function deriveRatio(increase: number): number {
  if (increase > 5) return 1.3;
  if (increase < -5) return 0.6;
  return 1.0;
}

/**
 * Fetch A-share hot stock sentiment from Xueqiu.
 * Returns a Map of ticker (normalized code) → XueqiuSentiment.
 * On any failure, returns an empty map (graceful degradation).
 */
export async function fetchXueqiuSentiment(): Promise<
  Map<string, XueqiuSentiment>
> {
  const map = new Map<string, XueqiuSentiment>();

  try {
    const token = await getXueqiuToken();

    const res = await fetch(XUEQIU_HOT_API, {
      signal: AbortSignal.timeout(10_000),
      headers: {
        Cookie: `xq_a_token=${token}`,
      },
    });

    if (!res.ok) return new Map();

    const data = (await res.json()) as {
      data: {
        items: Array<{
          code: string;
          name: string;
          follow_count: number;
          tweet_count: number;
          increase: number;
          rank?: number;
        }>;
      };
    };

    const items = data.data?.items ?? [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const normalizedCode = normalizeCode(item.code);
      map.set(normalizedCode, {
        rank: item.rank ?? i + 1,
        code: item.code,
        name: item.name,
        followCount: item.follow_count,
        tweetCount: item.tweet_count,
        increase: item.increase ?? 0,
      });
    }
  } catch {
    return new Map();
  }

  return map;
}

/**
 * Merge Xueqiu sentiment data into stock array (pure function, no mutation).
 * Uses deriveRatio to convert rank change into a mentions ratio
 * compatible with the existing scoreSentiment function.
 */
export function mergeXueqiuData(
  stocks: RawStockData[],
  sentimentMap: Map<string, XueqiuSentiment>,
): RawStockData[] {
  return stocks.map((stock) => {
    // Try both raw ticker and normalized forms
    const sentiment =
      sentimentMap.get(stock.ticker) ??
      sentimentMap.get(normalizeCode(stock.ticker));
    if (!sentiment) return { ...stock };

    const ratio = deriveRatio(sentiment.increase);
    // Use tweetCount as "mentions" and derive prev from ratio
    const mentions = sentiment.tweetCount;
    const mentionsPrev = mentions > 0 ? Math.round(mentions / ratio) : 0;

    return {
      ...stock,
      sentimentRank: sentiment.rank,
      sentimentMentions: mentions,
      sentimentMentionsPrev: mentionsPrev,
      sentimentSource: "xueqiu" as const,
    };
  });
}
