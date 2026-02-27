/** Raw stock data from TradingView screener */
export interface RawStockData {
  ticker: string;
  company: string;
  exchange?: string;
  sector?: string;
  market?: "america" | "china";
  close?: number;
  changePct?: number;
  marketCap?: number;
  // Fundamentals
  pe?: number;
  evEbitda?: number;
  revGrowth?: number;
  grossMargin?: number;
  opMargin?: number;
  fcfMargin?: number;
  // Technicals
  rsi?: number;
  adx?: number;
  sma50?: number;
  sma200?: number;
  high52w?: number;
  low52w?: number;
  ath?: number;
  // Catalyst
  earningsDate?: string;
  earningsDays?: number;
  // Sentiment (Reddit for US, Xueqiu for A-shares)
  sentimentRank?: number;
  sentimentMentions?: number;
  sentimentMentionsPrev?: number;
  sentimentSource?: "reddit" | "xueqiu";
}

/** Signal scores for 8 dimensions (-1, 0, or +1) */
export interface SignalScores {
  sigValuation: -1 | 0 | 1;
  sigGrowth: -1 | 0 | 1;
  sigMargins: -1 | 0 | 1;
  sigTrend: -1 | 0 | 1;
  sigMomentum: -1 | 0 | 1;
  sigPattern: -1 | 0 | 1;
  sigCatalyst: -1 | 0 | 1;
  sigSentiment: -1 | 0 | 1;
}

/** Rating with Chinese and English labels */
export interface Rating {
  zh: string;
  en: string;
}

/** Fully scored stock */
export interface ScoredStock extends RawStockData {
  signals: SignalScores;
  signalTotal: number;
  rating: Rating;
  entryRange?: string;
  target?: string;
  stop?: string;
}

/** Rating scale mapping (8 dimensions, range -8..+8) */
export const RATING_SCALE: { min: number; max: number; zh: string; en: string }[] = [
  { min: 6, max: 8, zh: "强烈买入", en: "STRONG BUY" },
  { min: 4, max: 5, zh: "买入", en: "BUY" },
  { min: 1, max: 3, zh: "偏多", en: "LEAN BUY" },
  { min: -1, max: 0, zh: "持有", en: "HOLD" },
  { min: -3, max: -2, zh: "卖出", en: "SELL" },
  { min: -8, max: -4, zh: "强烈卖出", en: "STRONG SELL" },
];

/** Signal dimension names for display */
export const SIGNAL_DIMENSIONS = {
  sigValuation: { zh: "估值", en: "Valuation" },
  sigGrowth: { zh: "增长", en: "Growth" },
  sigMargins: { zh: "利润率", en: "Margins" },
  sigTrend: { zh: "趋势", en: "Trend" },
  sigMomentum: { zh: "动量", en: "Momentum" },
  sigPattern: { zh: "形态", en: "Pattern" },
  sigCatalyst: { zh: "催化剂", en: "Catalyst" },
  sigSentiment: { zh: "情绪", en: "Sentiment" },
} as const;
