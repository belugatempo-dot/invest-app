import type { RawStockData, SignalScores, ScoredStock, Rating } from "./types";
import { RATING_SCALE } from "./types";

type Signal = -1 | 0 | 1;

/**
 * Calculate the median of a numeric array.
 */
export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Calculate the nth percentile of a numeric array.
 */
export function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

/**
 * Score Valuation dimension.
 * +1: P/E < screen median
 * 0: within ±20% of median
 * -1: P/E > 75th percentile
 */
export function scoreValuation(
  pe: number | undefined,
  medianPe: number,
  p75Pe: number,
): Signal {
  if (pe == null || medianPe === 0) return 0;
  if (pe < medianPe * 0.8) return 1;
  if (pe > p75Pe) return -1;
  return 0;
}

/**
 * Score Growth dimension.
 * +1: Revenue growth > 15%
 * 0: 5-15%
 * -1: < 5%
 */
export function scoreGrowth(revGrowth: number | undefined): Signal {
  if (revGrowth == null) return 0;
  if (revGrowth > 0.15) return 1;
  if (revGrowth < 0.05) return -1;
  return 0;
}

/**
 * Score Margins dimension.
 * +1: Gross margin > 40% AND FCF margin > 0
 * 0: Gross margin 20-40%
 * -1: Gross margin < 20% OR FCF margin < 0
 */
export function scoreMargins(
  grossMargin: number | undefined,
  fcfMargin: number | undefined,
): Signal {
  if (grossMargin == null) return 0;
  if (grossMargin < 0.2 || (fcfMargin != null && fcfMargin < 0)) return -1;
  if (grossMargin > 0.4 && (fcfMargin == null || fcfMargin > 0)) return 1;
  return 0;
}

/**
 * Score Trend dimension.
 * +1: close > SMA200 AND SMA50 > SMA200 (bullish alignment)
 * 0: crossover state
 * -1: close < SMA200
 */
export function scoreTrend(
  close: number | undefined,
  sma50: number | undefined,
  sma200: number | undefined,
): Signal {
  if (close == null || sma200 == null) return 0;
  if (close < sma200) return -1;
  if (sma50 != null && close > sma200 && sma50 > sma200) return 1;
  return 0;
}

/**
 * Score Momentum dimension.
 * +1: RSI 35-55 (oversold recovery)
 * 0: RSI 40-60 (neutral, broader overlap handled)
 * -1: RSI > 70 near 52-week high
 */
export function scoreMomentum(
  rsi: number | undefined,
  close: number | undefined,
  high52w: number | undefined,
): Signal {
  if (rsi == null) return 0;
  if (rsi >= 35 && rsi <= 55) return 1;
  if (
    rsi > 70 &&
    close != null &&
    high52w != null &&
    high52w > 0 &&
    close / high52w > 0.95
  )
    return -1;
  if (rsi >= 40 && rsi <= 60) return 0;
  return 0;
}

/**
 * Score Pattern dimension.
 * +1: ADX > 25 AND within 10% of 52-week high (strong uptrend)
 * 0: ADX 15-25
 * -1: ADX < 15 (no trend)
 */
export function scorePattern(
  adx: number | undefined,
  close: number | undefined,
  high52w: number | undefined,
): Signal {
  if (adx == null) return 0;
  if (adx < 15) return -1;
  if (
    adx > 25 &&
    close != null &&
    high52w != null &&
    high52w > 0 &&
    close / high52w > 0.9
  )
    return 1;
  if (adx >= 15 && adx <= 25) return 0;
  return 0;
}

/**
 * Score Catalyst dimension.
 * +1: Earnings < 30 days away (opportunity for positive surprise)
 * 0: Earnings > 60 days away (no near-term catalyst)
 * -1: default for <30 days (binary risk without thesis)
 *
 * Note: The "+1 with positive thesis" vs "-1 binary risk" distinction
 * requires AI thesis, so default to 0 for <30d. Override via thesis generation.
 */
export function scoreCatalyst(earningsDays: number | undefined): Signal {
  if (earningsDays == null) return 0;
  if (earningsDays > 60) return 0;
  if (earningsDays <= 30) return 0; // neutral by default, overridden by thesis
  return 0;
}

/**
 * Score Sentiment dimension (Reddit/social media heat).
 * +1: rank ≤ 100 AND mentions/mentions24hAgo > 1.2 (rising heat)
 *  0: no Reddit data / stable heat
 * -1: rank ≤ 20 AND mentions/mentions24hAgo < 0.7 (top-of-mind fading — contrarian signal)
 */
export function scoreSentiment(
  rank: number | undefined,
  mentions: number | undefined,
  mentions24hAgo: number | undefined,
): Signal {
  if (rank == null || mentions == null || mentions24hAgo == null) return 0;
  if (mentions24hAgo === 0) return 0;
  const ratio = mentions / mentions24hAgo;
  if (rank <= 20 && ratio < 0.7) return -1;
  if (rank <= 100 && ratio > 1.2) return 1;
  return 0;
}

/**
 * Derive rating from signal total score.
 */
export function getRating(signalTotal: number): Rating {
  for (const scale of RATING_SCALE) {
    if (signalTotal >= scale.min && signalTotal <= scale.max) {
      return { zh: scale.zh, en: scale.en };
    }
  }
  return { zh: "持有", en: "HOLD" };
}

/**
 * Calculate entry/target/stop levels.
 */
export function calculateLevels(stock: RawStockData): {
  entryRange: string;
  target: string;
  stop: string;
} {
  const currency = stock.market === "china" ? "¥" : "$";
  const close = stock.close ?? 0;
  const sma200 = stock.sma200 ?? close * 0.9;
  const high52w = stock.high52w ?? close * 1.1;
  const low52w = stock.low52w ?? close * 0.8;

  const entryLow = Math.min(close * 0.97, sma200 * 1.02);
  const entryHigh = close * 1.02;
  const target = high52w;
  const stop = Math.max(sma200 * 0.95, low52w);

  return {
    entryRange: `${currency}${entryLow.toFixed(2)} - ${currency}${entryHigh.toFixed(2)}`,
    target: `${currency}${target.toFixed(2)}`,
    stop: `${currency}${stop.toFixed(2)}`,
  };
}

/**
 * Score a single stock against the 8-dimension signal matrix.
 */
export function scoreStock(
  stock: RawStockData,
  context: { medianPe: number; p75Pe: number },
): ScoredStock {
  const signals: SignalScores = {
    sigValuation: scoreValuation(stock.pe, context.medianPe, context.p75Pe),
    sigGrowth: scoreGrowth(stock.revGrowth),
    sigMargins: scoreMargins(stock.grossMargin, stock.fcfMargin),
    sigTrend: scoreTrend(stock.close, stock.sma50, stock.sma200),
    sigMomentum: scoreMomentum(stock.rsi, stock.close, stock.high52w),
    sigPattern: scorePattern(stock.adx, stock.close, stock.high52w),
    sigCatalyst: scoreCatalyst(stock.earningsDays),
    sigSentiment: scoreSentiment(stock.redditRank, stock.redditMentions, stock.redditMentions24hAgo),
  };

  const signalTotal = Object.values(signals).reduce(
    (sum, val) => sum + val,
    0,
  );
  const rating = getRating(signalTotal);
  const levels = calculateLevels(stock);

  return {
    ...stock,
    signals,
    signalTotal,
    rating,
    ...levels,
  };
}

/**
 * Score an entire screen of stocks.
 * Computes screen-relative metrics (median P/E, 75th percentile P/E)
 * then scores each stock.
 */
export function scoreScreen(stocks: RawStockData[]): ScoredStock[] {
  const peValues = stocks
    .map((s) => s.pe)
    .filter((pe): pe is number => pe != null && pe > 0);

  const context = {
    medianPe: median(peValues),
    p75Pe: percentile(peValues, 75),
  };

  return stocks
    .map((stock) => scoreStock(stock, context))
    .sort((a, b) => b.signalTotal - a.signalTotal);
}
