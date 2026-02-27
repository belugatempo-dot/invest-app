import { describe, it, expect } from "vitest";
import {
  median,
  percentile,
  scoreValuation,
  scoreGrowth,
  scoreMargins,
  scoreTrend,
  scoreMomentum,
  scorePattern,
  scoreCatalyst,
  scoreSentiment,
  getRating,
  calculateLevels,
  scoreStock,
  scoreScreen,
} from "./signal-scorer";
import type { RawStockData } from "./types";

// === Utility functions ===

describe("median", () => {
  it("should return 0 for empty array", () => {
    expect(median([])).toBe(0);
  });

  it("should return single element for length-1 array", () => {
    expect(median([42])).toBe(42);
  });

  it("should return middle value for odd-length array", () => {
    expect(median([1, 3, 5])).toBe(3);
  });

  it("should return average of two middle values for even-length array", () => {
    expect(median([1, 2, 3, 4])).toBe(2.5);
  });

  it("should handle unsorted input", () => {
    expect(median([5, 1, 3])).toBe(3);
  });
});

describe("percentile", () => {
  it("should return 0 for empty array", () => {
    expect(percentile([], 75)).toBe(0);
  });

  it("should return 75th percentile correctly", () => {
    const values = [10, 20, 30, 40, 50];
    expect(percentile(values, 75)).toBe(40);
  });

  it("should return max for 100th percentile", () => {
    expect(percentile([1, 2, 3, 4, 5], 100)).toBe(5);
  });

  it("should return min for 0th percentile", () => {
    expect(percentile([1, 2, 3, 4, 5], 0)).toBe(1);
  });
});

// === Valuation scoring ===

describe("scoreValuation", () => {
  it("should return +1 when P/E < 80% of median", () => {
    expect(scoreValuation(10, 20, 30)).toBe(1);
  });

  it("should return 0 when P/E is near median", () => {
    expect(scoreValuation(19, 20, 30)).toBe(0);
  });

  it("should return -1 when P/E > 75th percentile", () => {
    expect(scoreValuation(35, 20, 30)).toBe(-1);
  });

  it("should return 0 when P/E is undefined", () => {
    expect(scoreValuation(undefined, 20, 30)).toBe(0);
  });

  it("should return 0 when median is 0", () => {
    expect(scoreValuation(10, 0, 30)).toBe(0);
  });
});

// === Growth scoring ===

describe("scoreGrowth", () => {
  it("should return +1 for revenue growth > 15%", () => {
    expect(scoreGrowth(0.2)).toBe(1);
  });

  it("should return 0 for revenue growth between 5-15%", () => {
    expect(scoreGrowth(0.1)).toBe(0);
  });

  it("should return -1 for revenue growth < 5%", () => {
    expect(scoreGrowth(0.03)).toBe(-1);
  });

  it("should return 0 when undefined", () => {
    expect(scoreGrowth(undefined)).toBe(0);
  });

  it("should return -1 for negative growth", () => {
    expect(scoreGrowth(-0.1)).toBe(-1);
  });
});

// === Margins scoring ===

describe("scoreMargins", () => {
  it("should return +1 for gross > 40% and FCF > 0", () => {
    expect(scoreMargins(0.5, 0.1)).toBe(1);
  });

  it("should return +1 for gross > 40% with FCF undefined", () => {
    expect(scoreMargins(0.5, undefined)).toBe(1);
  });

  it("should return 0 for gross between 20-40%", () => {
    expect(scoreMargins(0.3, 0.05)).toBe(0);
  });

  it("should return -1 for gross < 20%", () => {
    expect(scoreMargins(0.15, 0.05)).toBe(-1);
  });

  it("should return -1 for negative FCF", () => {
    expect(scoreMargins(0.5, -0.1)).toBe(-1);
  });

  it("should return 0 when gross undefined", () => {
    expect(scoreMargins(undefined, 0.1)).toBe(0);
  });
});

// === Trend scoring ===

describe("scoreTrend", () => {
  it("should return +1 when close > SMA200 and SMA50 > SMA200", () => {
    expect(scoreTrend(150, 140, 130)).toBe(1);
  });

  it("should return -1 when close < SMA200", () => {
    expect(scoreTrend(120, 140, 130)).toBe(-1);
  });

  it("should return 0 in crossover state (close > SMA200 but SMA50 < SMA200)", () => {
    expect(scoreTrend(135, 125, 130)).toBe(0);
  });

  it("should return 0 when close or SMA200 is undefined", () => {
    expect(scoreTrend(undefined, 140, 130)).toBe(0);
    expect(scoreTrend(150, 140, undefined)).toBe(0);
  });

  it("should handle SMA50 undefined (close > SMA200 but can't confirm alignment)", () => {
    expect(scoreTrend(150, undefined, 130)).toBe(0);
  });
});

// === Momentum scoring ===

describe("scoreMomentum", () => {
  it("should return +1 for RSI in oversold recovery (35-55)", () => {
    expect(scoreMomentum(45, 100, 110)).toBe(1);
  });

  it("should return -1 for RSI > 70 near 52-week high", () => {
    expect(scoreMomentum(75, 108, 110)).toBe(-1);
  });

  it("should return 0 for RSI > 70 but NOT near 52-week high", () => {
    expect(scoreMomentum(75, 80, 110)).toBe(0);
  });

  it("should return 0 for RSI in neutral range (56-60)", () => {
    expect(scoreMomentum(58, 100, 110)).toBe(0);
  });

  it("should return 0 when RSI is undefined", () => {
    expect(scoreMomentum(undefined, 100, 110)).toBe(0);
  });
});

// === Pattern scoring ===

describe("scorePattern", () => {
  it("should return +1 for ADX > 25 within 10% of 52-week high", () => {
    expect(scorePattern(30, 105, 110)).toBe(1);
  });

  it("should return -1 for ADX < 15", () => {
    expect(scorePattern(10, 100, 110)).toBe(-1);
  });

  it("should return 0 for ADX 15-25", () => {
    expect(scorePattern(20, 100, 110)).toBe(0);
  });

  it("should return 0 for ADX > 25 but far from 52-week high", () => {
    expect(scorePattern(30, 80, 110)).toBe(0);
  });

  it("should return 0 when ADX is undefined", () => {
    expect(scorePattern(undefined, 100, 110)).toBe(0);
  });
});

// === Catalyst scoring ===

describe("scoreCatalyst", () => {
  it("should return 0 when earnings > 60 days", () => {
    expect(scoreCatalyst(90)).toBe(0);
  });

  it("should return 0 when earnings < 30 days (neutral default)", () => {
    expect(scoreCatalyst(15)).toBe(0);
  });

  it("should return 0 when earnings between 30-60 days", () => {
    expect(scoreCatalyst(45)).toBe(0);
  });

  it("should return 0 when undefined", () => {
    expect(scoreCatalyst(undefined)).toBe(0);
  });
});

// === Sentiment scoring ===

describe("scoreSentiment", () => {
  it("should return +1 when rank ≤ 100 and mentions rising > 20%", () => {
    expect(scoreSentiment(50, 200, 150)).toBe(1);
  });

  it("should return +1 at boundary: rank=100, ratio exactly 1.21", () => {
    expect(scoreSentiment(100, 121, 100)).toBe(1);
  });

  it("should return 0 when ratio is exactly 1.2 (not strictly >1.2)", () => {
    expect(scoreSentiment(50, 120, 100)).toBe(0);
  });

  it("should return -1 when rank ≤ 20 and mentions falling > 30%", () => {
    expect(scoreSentiment(10, 60, 100)).toBe(-1);
  });

  it("should return -1 at boundary: rank=20, ratio exactly 0.69", () => {
    expect(scoreSentiment(20, 69, 100)).toBe(-1);
  });

  it("should return 0 when rank ≤ 20 but ratio is exactly 0.7 (not strictly <0.7)", () => {
    expect(scoreSentiment(20, 70, 100)).toBe(0);
  });

  it("should return 0 when no reddit data (all undefined)", () => {
    expect(scoreSentiment(undefined, undefined, undefined)).toBe(0);
  });

  it("should return 0 when rank > 100 even with rising mentions", () => {
    expect(scoreSentiment(150, 200, 100)).toBe(0);
  });

  it("should return 0 when rank ≤ 100 but mentions stable", () => {
    expect(scoreSentiment(50, 100, 100)).toBe(0);
  });

  it("should return 0 when mentions24hAgo is 0 (avoid division by zero)", () => {
    expect(scoreSentiment(10, 200, 0)).toBe(0);
  });

  it("should return 0 when mentions is undefined but rank exists", () => {
    expect(scoreSentiment(5, undefined, 100)).toBe(0);
  });
});

// === Rating ===

describe("getRating", () => {
  it("should return 强烈买入 for score +6 to +8", () => {
    expect(getRating(6)).toEqual({ zh: "强烈买入", en: "STRONG BUY" });
    expect(getRating(8)).toEqual({ zh: "强烈买入", en: "STRONG BUY" });
  });

  it("should return 买入 for score +4 to +5", () => {
    expect(getRating(4)).toEqual({ zh: "买入", en: "BUY" });
    expect(getRating(5)).toEqual({ zh: "买入", en: "BUY" });
  });

  it("should return 偏多 for score +1 to +3", () => {
    expect(getRating(1)).toEqual({ zh: "偏多", en: "LEAN BUY" });
    expect(getRating(3)).toEqual({ zh: "偏多", en: "LEAN BUY" });
  });

  it("should return 持有 for score -1 to 0", () => {
    expect(getRating(0)).toEqual({ zh: "持有", en: "HOLD" });
    expect(getRating(-1)).toEqual({ zh: "持有", en: "HOLD" });
  });

  it("should return 卖出 for score -2 to -3", () => {
    expect(getRating(-2)).toEqual({ zh: "卖出", en: "SELL" });
    expect(getRating(-3)).toEqual({ zh: "卖出", en: "SELL" });
  });

  it("should return 强烈卖出 for score -4 to -8", () => {
    expect(getRating(-4)).toEqual({ zh: "强烈卖出", en: "STRONG SELL" });
    expect(getRating(-8)).toEqual({ zh: "强烈卖出", en: "STRONG SELL" });
  });
});

// === Calculate Levels ===

describe("calculateLevels", () => {
  it("should calculate entry/target/stop levels with $ for US stocks", () => {
    const stock: RawStockData = {
      ticker: "NVDA",
      company: "NVIDIA",
      close: 100,
      sma200: 90,
      high52w: 120,
      low52w: 70,
    };
    const levels = calculateLevels(stock);
    expect(levels.entryRange).toMatch(/^\$[\d.]+ - \$[\d.]+$/);
    expect(levels.target).toBe("$120.00");
    expect(levels.stop).toMatch(/^\$[\d.]+$/);
  });

  it("should use $ prefix when market is 'america'", () => {
    const stock: RawStockData = {
      ticker: "AAPL",
      company: "Apple",
      market: "america",
      close: 200,
      sma200: 180,
      high52w: 220,
      low52w: 150,
    };
    const levels = calculateLevels(stock);
    expect(levels.entryRange).toMatch(/^\$/);
    expect(levels.target).toMatch(/^\$/);
    expect(levels.stop).toMatch(/^\$/);
  });

  it("should use ¥ prefix when market is 'china'", () => {
    const stock: RawStockData = {
      ticker: "600519",
      company: "贵州茅台",
      market: "china",
      close: 1800,
      sma200: 1700,
      high52w: 2000,
      low52w: 1500,
    };
    const levels = calculateLevels(stock);
    expect(levels.entryRange).toMatch(/^¥[\d.]+ - ¥[\d.]+$/);
    expect(levels.target).toBe("¥2000.00");
    expect(levels.stop).toMatch(/^¥[\d.]+$/);
  });

  it("should default to $ prefix when market is undefined", () => {
    const stock: RawStockData = {
      ticker: "TEST",
      company: "Test Inc",
      close: 50,
    };
    const levels = calculateLevels(stock);
    expect(levels.entryRange).toMatch(/^\$/);
    expect(levels.target).toMatch(/^\$/);
    expect(levels.stop).toMatch(/^\$/);
  });

  it("should handle missing data gracefully", () => {
    const stock: RawStockData = {
      ticker: "TEST",
      company: "Test Inc",
      close: 50,
    };
    const levels = calculateLevels(stock);
    expect(levels.entryRange).toBeDefined();
    expect(levels.target).toBeDefined();
    expect(levels.stop).toBeDefined();
  });
});

// === Score Stock ===

describe("scoreStock", () => {
  it("should produce a fully scored stock", () => {
    const stock: RawStockData = {
      ticker: "NVDA",
      company: "NVIDIA",
      close: 130,
      marketCap: 3.2e12,
      pe: 25,
      revGrowth: 0.6,
      grossMargin: 0.74,
      fcfMargin: 0.35,
      sma50: 125,
      sma200: 110,
      rsi: 48,
      adx: 28,
      high52w: 140,
      low52w: 80,
    };

    const scored = scoreStock(stock, { medianPe: 35, p75Pe: 50 });

    expect(scored.ticker).toBe("NVDA");
    expect(scored.signals.sigValuation).toBe(1); // 25 < 35*0.8=28
    expect(scored.signals.sigGrowth).toBe(1); // 60% > 15%
    expect(scored.signals.sigMargins).toBe(1); // gross 74% > 40%, FCF > 0
    expect(scored.signals.sigTrend).toBe(1); // close > SMA200, SMA50 > SMA200
    expect(scored.signals.sigMomentum).toBe(1); // RSI 48 in 35-55 range
    expect(scored.signals.sigPattern).toBe(1); // ADX 28 > 25, close/high52w > 0.9
    expect(scored.signals.sigSentiment).toBe(0); // no Reddit data
    expect(scored.signalTotal).toBeGreaterThanOrEqual(6);
    expect(scored.rating.zh).toBe("强烈买入");
    expect(scored.rating.en).toBe("STRONG BUY");
  });

  it("should handle a bearish stock", () => {
    const stock: RawStockData = {
      ticker: "BEAR",
      company: "Bearish Co",
      close: 40,
      pe: 100,
      revGrowth: 0.02,
      grossMargin: 0.15,
      fcfMargin: -0.1,
      sma50: 50,
      sma200: 55,
      rsi: 75,
      adx: 10,
      high52w: 42,
    };

    const scored = scoreStock(stock, { medianPe: 30, p75Pe: 60 });

    expect(scored.signals.sigValuation).toBe(-1); // 100 > 60
    expect(scored.signals.sigGrowth).toBe(-1); // 2% < 5%
    expect(scored.signals.sigMargins).toBe(-1); // gross < 20%
    expect(scored.signals.sigTrend).toBe(-1); // close < SMA200
    expect(scored.signals.sigPattern).toBe(-1); // ADX < 15
    expect(scored.signalTotal).toBeLessThanOrEqual(-3);
  });
});

// === Score Screen ===

describe("scoreScreen", () => {
  it("should score and sort stocks by signal total", () => {
    const stocks: RawStockData[] = [
      {
        ticker: "LOW",
        company: "Low Score",
        pe: 100,
        revGrowth: 0.01,
        grossMargin: 0.1,
        close: 40,
        sma200: 50,
      },
      {
        ticker: "HIGH",
        company: "High Score",
        pe: 15,
        revGrowth: 0.25,
        grossMargin: 0.6,
        fcfMargin: 0.2,
        close: 150,
        sma50: 140,
        sma200: 120,
        rsi: 45,
        adx: 30,
        high52w: 155,
      },
    ];

    const scored = scoreScreen(stocks);

    expect(scored.length).toBe(2);
    expect(scored[0].ticker).toBe("HIGH");
    expect(scored[1].ticker).toBe("LOW");
    expect(scored[0].signalTotal).toBeGreaterThan(scored[1].signalTotal);
  });

  it("should compute screen-relative P/E metrics", () => {
    const stocks: RawStockData[] = [
      { ticker: "A", company: "A Co", pe: 10 },
      { ticker: "B", company: "B Co", pe: 20 },
      { ticker: "C", company: "C Co", pe: 30 },
      { ticker: "D", company: "D Co", pe: 40 },
    ];

    const scored = scoreScreen(stocks);
    // Median P/E = 25, 75th = 32.5
    // Stock A (pe=10) should get +1 valuation (10 < 25*0.8=20)
    const stockA = scored.find((s) => s.ticker === "A");
    expect(stockA?.signals.sigValuation).toBe(1);

    // Stock D (pe=40) should get -1 valuation (40 > 32.5)
    const stockD = scored.find((s) => s.ticker === "D");
    expect(stockD?.signals.sigValuation).toBe(-1);
  });

  it("should handle empty array", () => {
    expect(scoreScreen([])).toEqual([]);
  });
});
