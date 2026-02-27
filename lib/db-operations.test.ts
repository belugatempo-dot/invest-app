import { describe, it, expect, beforeEach, vi } from "vitest";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { sql } from "drizzle-orm";
import * as schema from "./schema";
import type { ScoredStock } from "./types";

// In-memory DB for tests
const client = createClient({ url: ":memory:" });
const testDb = drizzle(client, { schema });

// Mock the db module to use our in-memory db
vi.mock("./db", () => ({ db: testDb }));

// Import AFTER mock is set up
const { persistScreenResults } = await import("./db-operations");

function makeScoredStock(overrides: Partial<ScoredStock> = {}): ScoredStock {
  return {
    ticker: "AAPL",
    company: "Apple Inc.",
    exchange: "NASDAQ",
    close: 200,
    changePct: 0.5,
    marketCap: 3e12,
    pe: 30,
    revGrowth: 0.08,
    grossMargin: 0.45,
    opMargin: 0.30,
    fcfMargin: 0.25,
    rsi: 55,
    adx: 25,
    sma50: 195,
    sma200: 180,
    high52w: 210,
    low52w: 150,
    signals: {
      sigValuation: 0,
      sigGrowth: 1,
      sigMargins: 1,
      sigTrend: 1,
      sigMomentum: 0,
      sigPattern: 0,
      sigCatalyst: 0,
      sigSentiment: 0,
    },
    signalTotal: 3,
    rating: { zh: "偏多", en: "LEAN BUY" },
    entryRange: "$195-200",
    target: "$220",
    stop: "$185",
    ...overrides,
  };
}

async function createSchema() {
  await testDb.run(sql`CREATE TABLE IF NOT EXISTS themes (
    id TEXT PRIMARY KEY,
    name_zh TEXT NOT NULL,
    name_en TEXT NOT NULL,
    market TEXT NOT NULL DEFAULT 'america',
    sectors TEXT NOT NULL,
    filters TEXT NOT NULL,
    schedule TEXT
  )`);

  await testDb.run(sql`CREATE TABLE IF NOT EXISTS screen_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    theme_id TEXT NOT NULL REFERENCES themes(id),
    source TEXT NOT NULL,
    run_at TEXT NOT NULL DEFAULT (datetime('now')),
    candidate_count INTEGER
  )`);

  await testDb.run(sql`CREATE TABLE IF NOT EXISTS stock_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id INTEGER NOT NULL REFERENCES screen_runs(id),
    ticker TEXT NOT NULL,
    company TEXT NOT NULL,
    exchange TEXT,
    close REAL, change_pct REAL, market_cap REAL,
    pe REAL, ev_ebitda REAL, rev_growth REAL,
    gross_margin REAL, op_margin REAL, fcf_margin REAL,
    rsi REAL, adx REAL, sma50 REAL, sma200 REAL,
    high_52w REAL, low_52w REAL, ath REAL,
    earnings_date TEXT, earnings_days INTEGER,
    reddit_mentions INTEGER, reddit_mentions_24h_ago INTEGER, reddit_rank INTEGER,
    sig_valuation INTEGER, sig_growth INTEGER, sig_margins INTEGER,
    sig_trend INTEGER, sig_momentum INTEGER, sig_pattern INTEGER,
    sig_catalyst INTEGER, sig_sentiment INTEGER,
    signal_total INTEGER, rating TEXT,
    entry_range TEXT, target TEXT, stop TEXT,
    thesis_zh TEXT, thesis_en TEXT,
    chart_daily TEXT, chart_weekly TEXT, sector TEXT
  )`);

  await testDb.run(
    sql`CREATE UNIQUE INDEX IF NOT EXISTS stock_snapshots_run_ticker_idx ON stock_snapshots(run_id, ticker)`,
  );

  // Seed a theme
  await testDb.run(
    sql`INSERT OR IGNORE INTO themes (id, name_zh, name_en, sectors, filters) VALUES ('ai-infra', 'AI 基础设施', 'AI Infrastructure', '[]', '[]')`,
  );
}

async function clearData() {
  await testDb.run(sql`DELETE FROM stock_snapshots`);
  await testDb.run(sql`DELETE FROM screen_runs`);
}

describe("persistScreenResults", () => {
  beforeEach(async () => {
    await createSchema();
    await clearData();
  });

  it("should set thesisZh to null on first screen for a new ticker", async () => {
    const stocks = [makeScoredStock({ ticker: "NVDA", company: "NVIDIA" })];
    const { runId } = await persistScreenResults("ai-infra", "web", stocks);

    const snapshot = await testDb.run(
      sql`SELECT thesis_zh FROM stock_snapshots WHERE run_id = ${runId} AND ticker = 'NVDA'`,
    );
    expect(snapshot.rows[0].thesis_zh).toBeNull();
  });

  it("should inherit thesisZh from previous snapshot when screening again", async () => {
    // Step 1: Create initial snapshot with a thesis
    const stocks = [makeScoredStock({ ticker: "AAPL" })];
    const { runId: firstRunId } = await persistScreenResults(
      "ai-infra",
      "web",
      stocks,
    );

    // Manually set thesis on the first snapshot (simulating /api/thesis)
    await testDb.run(
      sql`UPDATE stock_snapshots SET thesis_zh = '苹果AI生态前景广阔' WHERE run_id = ${firstRunId} AND ticker = 'AAPL'`,
    );

    // Step 2: Run screen again — new snapshot should carry forward the thesis
    const { runId: secondRunId } = await persistScreenResults(
      "ai-infra",
      "cron",
      stocks,
    );

    const snapshot = await testDb.run(
      sql`SELECT thesis_zh FROM stock_snapshots WHERE run_id = ${secondRunId} AND ticker = 'AAPL'`,
    );
    expect(snapshot.rows[0].thesis_zh).toBe("苹果AI生态前景广阔");
  });

  it("should inherit the latest thesis when multiple snapshots exist", async () => {
    const stocks = [makeScoredStock({ ticker: "MSFT", company: "Microsoft" })];

    // First screen — no thesis
    await persistScreenResults("ai-infra", "web", stocks);

    // Second screen — add thesis afterward
    const { runId: secondRunId } = await persistScreenResults(
      "ai-infra",
      "cron",
      stocks,
    );
    await testDb.run(
      sql`UPDATE stock_snapshots SET thesis_zh = '云计算增长强劲' WHERE run_id = ${secondRunId} AND ticker = 'MSFT'`,
    );

    // Third screen — should inherit from second
    const { runId: thirdRunId } = await persistScreenResults(
      "ai-infra",
      "cron",
      stocks,
    );

    const snapshot = await testDb.run(
      sql`SELECT thesis_zh FROM stock_snapshots WHERE run_id = ${thirdRunId} AND ticker = 'MSFT'`,
    );
    expect(snapshot.rows[0].thesis_zh).toBe("云计算增长强劲");
  });
});
