import {
  sqliteTable,
  text,
  integer,
  real,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const themes = sqliteTable("themes", {
  id: text("id").primaryKey(),
  nameZh: text("name_zh").notNull(),
  nameEn: text("name_en").notNull(),
  market: text("market").notNull().default("america"),
  sectors: text("sectors", { mode: "json" }).notNull().$type<string[]>(),
  filters: text("filters", { mode: "json" }).notNull().$type<Record<string, unknown>[]>(),
  schedule: text("schedule"),
});

export const screenRuns = sqliteTable("screen_runs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  themeId: text("theme_id")
    .notNull()
    .references(() => themes.id),
  source: text("source", { enum: ["web", "cli", "cron"] }).notNull(),
  runAt: text("run_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  candidateCount: integer("candidate_count"),
});

export const stockSnapshots = sqliteTable(
  "stock_snapshots",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    runId: integer("run_id")
      .notNull()
      .references(() => screenRuns.id),
    ticker: text("ticker").notNull(),
    company: text("company").notNull(),
    exchange: text("exchange"),
    // Price data
    close: real("close"),
    changePct: real("change_pct"),
    marketCap: real("market_cap"),
    // Fundamentals
    pe: real("pe"),
    evEbitda: real("ev_ebitda"),
    revGrowth: real("rev_growth"),
    grossMargin: real("gross_margin"),
    opMargin: real("op_margin"),
    fcfMargin: real("fcf_margin"),
    // Technicals
    rsi: real("rsi"),
    adx: real("adx"),
    sma50: real("sma50"),
    sma200: real("sma200"),
    high52w: real("high_52w"),
    low52w: real("low_52w"),
    ath: real("ath"),
    // Catalyst
    earningsDate: text("earnings_date"),
    earningsDays: integer("earnings_days"),
    // Reddit sentiment
    redditMentions: integer("reddit_mentions"),
    redditMentions24hAgo: integer("reddit_mentions_24h_ago"),
    redditRank: integer("reddit_rank"),
    // Signal matrix (8 dimensions, each -1/0/+1)
    sigValuation: integer("sig_valuation"),
    sigGrowth: integer("sig_growth"),
    sigMargins: integer("sig_margins"),
    sigTrend: integer("sig_trend"),
    sigMomentum: integer("sig_momentum"),
    sigPattern: integer("sig_pattern"),
    sigCatalyst: integer("sig_catalyst"),
    sigSentiment: integer("sig_sentiment"),
    signalTotal: integer("signal_total"),
    rating: text("rating"),
    // Decision levels
    entryRange: text("entry_range"),
    target: text("target"),
    stop: text("stop"),
    // AI thesis
    thesisZh: text("thesis_zh"),
    thesisEn: text("thesis_en"),
    // Chart image paths
    chartDaily: text("chart_daily"),
    chartWeekly: text("chart_weekly"),
    sector: text("sector"),
  },
  (table) => [
    uniqueIndex("stock_snapshots_run_ticker_idx").on(
      table.runId,
      table.ticker,
    ),
  ],
);

export const watchlist = sqliteTable("watchlist", {
  ticker: text("ticker").primaryKey(),
  addedAt: text("added_at").default(sql`(datetime('now'))`),
  notesZh: text("notes_zh"),
  costBasis: real("cost_basis"),
  shares: real("shares"),
});

export const decisions = sqliteTable("decisions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ticker: text("ticker").notNull(),
  action: text("action", { enum: ["BUY", "SELL", "HOLD"] }).notNull(),
  signalTotal: integer("signal_total"),
  rating: text("rating"),
  priceAtDecision: real("price_at_decision"),
  entry: text("entry"),
  target: text("target"),
  stop: text("stop"),
  thesisZh: text("thesis_zh"),
  decidedAt: text("decided_at").default(sql`(datetime('now'))`),
  outcomePrice: real("outcome_price"),
  outcomeDate: text("outcome_date"),
  notes: text("notes"),
});
