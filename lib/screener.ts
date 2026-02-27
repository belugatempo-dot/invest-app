import type { RawStockData } from "./types";

/** Build the TradingView scan API URL for the given market. */
function getScanUrl(market: string): string {
  return `https://scanner.tradingview.com/${market}/scan`;
}

/** Fields to request from TradingView */
const SCREEN_FIELDS = [
  "name",
  "description",
  "exchange",
  "sector",
  "close",
  "change",
  "market_cap_basic",
  "price_earnings_ttm",
  "enterprise_value_ebitda_ttm",
  "total_revenue_yoy_growth_ttm",
  "gross_margin_ttm",
  "operating_margin_ttm",
  "free_cash_flow_margin_ttm",
  "RSI",
  "ADX",
  "SMA50",
  "SMA200",
  "price_52_week_high",
  "price_52_week_low",
  "High.All",
  "earnings_release_next_trading_date_fq",
];

/**
 * Calculate days until earnings from timestamp.
 */
function daysUntilEarnings(earningsDate: unknown): number | undefined {
  if (typeof earningsDate !== "number" || earningsDate === 0) return undefined;
  const now = Date.now() / 1000;
  const days = Math.round((earningsDate - now) / 86400);
  return days > 0 ? days : undefined;
}

/**
 * Map TradingView row (symbol + data array) to RawStockData.
 */
function mapRow(symbol: string, d: unknown[], market: "america" | "china"): RawStockData {
  const get = (i: number) => d[i] as number | string | null | undefined;
  const num = (i: number) => {
    const v = d[i];
    return typeof v === "number" ? v : undefined;
  };

  const name = String(get(0) ?? "");
  const ticker = name.includes(":") ? name.split(":")[1] : name;

  return {
    ticker,
    company: String(get(1) ?? ticker),
    exchange: get(2) as string | undefined,
    sector: get(3) as string | undefined,
    market,
    close: num(4),
    changePct: num(5),
    marketCap: num(6),
    pe: num(7),
    evEbitda: num(8),
    // TradingView returns growth as percentage (0-100), normalize to decimal
    revGrowth: num(9) != null ? num(9)! / 100 : undefined,
    // TradingView returns margins as percentages (0-100), normalize to decimals (0-1)
    grossMargin: num(10) != null ? num(10)! / 100 : undefined,
    opMargin: num(11) != null ? num(11)! / 100 : undefined,
    fcfMargin: num(12) != null ? num(12)! / 100 : undefined,
    rsi: num(13),
    adx: num(14),
    sma50: num(15),
    sma200: num(16),
    high52w: num(17),
    low52w: num(18),
    ath: num(19),
    earningsDays: daysUntilEarnings(d[20]),
    earningsDate:
      typeof d[20] === "number"
        ? new Date((d[20] as number) * 1000).toISOString().split("T")[0]
        : undefined,
  };
}

/**
 * Build TradingView filter array from our filter format.
 */
function buildFilters(
  filters: Record<string, unknown>[],
): Record<string, unknown>[] {
  return filters.map((f) => {
    const left = f.left as string;
    const op = f.operation as string;
    const right = f.right;

    switch (op) {
      case "greater":
        return { left, operation: "greater", right };
      case "less":
        return { left, operation: "less", right };
      case "in_range":
        return { left, operation: "in_range", right };
      case "between":
        return { left, operation: "in_range", right };
      default:
        return { left, operation: op, right };
    }
  });
}

/**
 * Run a thematic stock screen via direct HTTP to TradingView scan API.
 */
export async function runScreen(
  filters: Record<string, unknown>[],
  limit: number = 25,
  market: "america" | "china" = "america",
): Promise<RawStockData[]> {
  const body = {
    markets: [market],
    symbols: { query: { types: [] }, tickers: [] },
    options: { lang: "en" },
    columns: SCREEN_FIELDS,
    filter: buildFilters(filters),
    sort: { sortBy: "market_cap_basic", sortOrder: "desc" },
    // Over-fetch to compensate for duplicates (OTC/multi-class shares)
    range: [0, Math.ceil(limit * 1.5)],
  };

  const res = await fetch(getScanUrl(market), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`TradingView API ${res.status}: ${text}`);
  }

  const data: { totalCount: number; data: { s: string; d: unknown[] }[] } =
    await res.json();

  if (!data.data || data.data.length === 0) {
    return [];
  }

  const rows = data.data.map((item) => mapRow(item.s, item.d, market));

  // Deduplicate by company name — keep highest market cap listing.
  // This removes OTC pink sheets (ASMLF, SAPGF) and multi-class shares (GOOG vs GOOGL).
  const byCompany = new Map<string, RawStockData>();
  for (const row of rows) {
    const key = row.company.toLowerCase();
    const existing = byCompany.get(key);
    if (!existing || (row.marketCap ?? 0) > (existing.marketCap ?? 0)) {
      byCompany.set(key, row);
    }
  }

  return Array.from(byCompany.values()).slice(0, limit);
}
