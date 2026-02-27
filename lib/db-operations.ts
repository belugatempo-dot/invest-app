import { db } from "./db";
import { screenRuns, stockSnapshots } from "./schema";
import { and, desc, eq, isNotNull } from "drizzle-orm";
import type { ScoredStock } from "./types";

/**
 * Persist screen results: create a run record + insert stock snapshots.
 * Shared between /api/screen and /api/cron routes.
 */
export async function persistScreenResults(
  themeId: string,
  source: "web" | "cli" | "cron",
  scoredStocks: ScoredStock[],
): Promise<{ runId: number; count: number }> {
  const run = await db
    .insert(screenRuns)
    .values({
      themeId,
      source,
      candidateCount: scoredStocks.length,
    })
    .returning()
    .get();

  for (const stock of scoredStocks) {
    // Inherit thesis from the most recent snapshot that has one
    const prev = await db
      .select({ thesisZh: stockSnapshots.thesisZh })
      .from(stockSnapshots)
      .where(
        and(
          eq(stockSnapshots.ticker, stock.ticker),
          isNotNull(stockSnapshots.thesisZh),
        ),
      )
      .orderBy(desc(stockSnapshots.id))
      .limit(1)
      .get();

    await db
      .insert(stockSnapshots)
      .values({
        runId: run.id,
        ticker: stock.ticker,
        company: stock.company,
        exchange: stock.exchange ?? null,
        close: stock.close ?? null,
        changePct: stock.changePct ?? null,
        marketCap: stock.marketCap ?? null,
        pe: stock.pe ?? null,
        evEbitda: stock.evEbitda ?? null,
        revGrowth: stock.revGrowth ?? null,
        grossMargin: stock.grossMargin ?? null,
        opMargin: stock.opMargin ?? null,
        fcfMargin: stock.fcfMargin ?? null,
        rsi: stock.rsi ?? null,
        adx: stock.adx ?? null,
        sma50: stock.sma50 ?? null,
        sma200: stock.sma200 ?? null,
        high52w: stock.high52w ?? null,
        low52w: stock.low52w ?? null,
        ath: stock.ath ?? null,
        earningsDate: stock.earningsDate ?? null,
        earningsDays: stock.earningsDays ?? null,
        redditMentions: stock.redditMentions ?? null,
        redditMentions24hAgo: stock.redditMentions24hAgo ?? null,
        redditRank: stock.redditRank ?? null,
        sigValuation: stock.signals.sigValuation,
        sigGrowth: stock.signals.sigGrowth,
        sigMargins: stock.signals.sigMargins,
        sigTrend: stock.signals.sigTrend,
        sigMomentum: stock.signals.sigMomentum,
        sigPattern: stock.signals.sigPattern,
        sigCatalyst: stock.signals.sigCatalyst,
        sigSentiment: stock.signals.sigSentiment,
        signalTotal: stock.signalTotal,
        rating: stock.rating.zh,
        entryRange: stock.entryRange ?? null,
        target: stock.target ?? null,
        stop: stock.stop ?? null,
        sector: stock.sector ?? null,
        thesisZh: prev?.thesisZh ?? null,
      })
      .run();
  }

  return { runId: run.id, count: scoredStocks.length };
}
