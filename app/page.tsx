import { db } from "@/lib/db";
import { screenRuns, stockSnapshots, themes, watchlist } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import type { StockRow } from "@/components/signal-matrix";
import { DashboardClient } from "@/app/dashboard-client";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // Get latest screen run
  const latestRun = await db
    .select()
    .from(screenRuns)
    .orderBy(desc(screenRuns.runAt))
    .limit(1)
    .get();

  const watchlistRows = await db.select().from(watchlist).all();
  const watchlistTickers = watchlistRows.map((r) => r.ticker);

  let stocks: StockRow[] = [];
  let themeName: string | null = null;
  let runDate: string | null = null;

  if (latestRun) {
    const theme = await db
      .select()
      .from(themes)
      .where(eq(themes.id, latestRun.themeId))
      .get();
    themeName = theme?.nameZh ?? latestRun.themeId;
    runDate = latestRun.runAt;

    const rows = await db
      .select()
      .from(stockSnapshots)
      .where(eq(stockSnapshots.runId, latestRun.id))
      .all();

    stocks = rows.map((r) => ({
      id: r.id,
      ticker: r.ticker,
      company: r.company,
      close: r.close,
      changePct: r.changePct,
      marketCap: r.marketCap,
      sigValuation: r.sigValuation,
      sigGrowth: r.sigGrowth,
      sigMargins: r.sigMargins,
      sigTrend: r.sigTrend,
      sigMomentum: r.sigMomentum,
      sigPattern: r.sigPattern,
      sigCatalyst: r.sigCatalyst,
      sigSentiment: r.sigSentiment,
      signalTotal: r.signalTotal,
      rating: r.rating,
      entryRange: r.entryRange,
      target: r.target,
      stop: r.stop,
      pe: r.pe,
      revGrowth: r.revGrowth,
      grossMargin: r.grossMargin,
      rsi: r.rsi,
      adx: r.adx,
      sma50: r.sma50,
      sma200: r.sma200,
      high52w: r.high52w,
      earningsDays: r.earningsDays,
      sector: r.sector,
      thesisZh: r.thesisZh,
    }));
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-5">
        <h1 className="font-[family-name:var(--font-serif)] text-3xl text-foreground tracking-tight">
          决策<span className="text-primary">面板</span>
        </h1>
        <p className="text-text-secondary text-sm mt-2">
          Signal Matrix — 信号矩阵决策引擎
        </p>
        <div className="gold-divider mt-4" />
      </div>

      {stocks.length > 0 ? (
        <>
          {/* Meta info */}
          <div className="flex items-center gap-4 mb-4 text-sm text-text-muted">
            <span>
              主题:{" "}
              <span className="text-text-secondary">{themeName}</span>
            </span>
            <span>·</span>
            <span>
              {stocks.length} 只标的
            </span>
            <span>·</span>
            <span className="font-[family-name:var(--font-mono)]">
              {runDate}
            </span>
          </div>

          {/* Watchlist + Signal matrix */}
          <DashboardClient stocks={stocks} watchlistTickers={watchlistTickers} latestRunId={latestRun?.id} />
        </>
      ) : (
        <div className="rounded-lg border border-border-subtle bg-surface p-12 text-center">
          <p className="text-text-muted text-lg mb-4">尚无筛选数据</p>
          <Link
            href="/screens"
            className="inline-block rounded-md bg-primary/10 border border-primary/30 text-primary px-6 py-2 text-sm hover:bg-primary/20 transition-colors"
          >
            前往主题筛选 →
          </Link>
        </div>
      )}
    </div>
  );
}
