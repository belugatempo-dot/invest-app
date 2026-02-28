import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { screenRuns, stockSnapshots, themes } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { sse } from "@/lib/sse";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { theme: themeId, stocks } = body;

    if (!themeId || !Array.isArray(stocks)) {
      return NextResponse.json(
        { error: "Body must include 'theme' (string) and 'stocks' (array)" },
        { status: 400 },
      );
    }

    // Verify theme exists
    const theme = await db
      .select()
      .from(themes)
      .where(eq(themes.id, themeId))
      .get();

    if (!theme) {
      return NextResponse.json(
        { error: `Theme '${themeId}' not found` },
        { status: 404 },
      );
    }

    // Create screen run
    const run = await db
      .insert(screenRuns)
      .values({
        themeId,
        source: "cli",
        candidateCount: stocks.length,
      })
      .returning()
      .get();

    // Insert stock snapshots
    for (const stock of stocks) {
      await db.insert(stockSnapshots)
        .values({
          runId: run.id,
          ticker: stock.ticker,
          company: stock.company ?? stock.ticker,
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
          sigValuation: stock.sigValuation ?? stock.signals?.sigValuation ?? null,
          sigGrowth: stock.sigGrowth ?? stock.signals?.sigGrowth ?? null,
          sigMargins: stock.sigMargins ?? stock.signals?.sigMargins ?? null,
          sigTrend: stock.sigTrend ?? stock.signals?.sigTrend ?? null,
          sigMomentum: stock.sigMomentum ?? stock.signals?.sigMomentum ?? null,
          sigPattern: stock.sigPattern ?? stock.signals?.sigPattern ?? null,
          sigCatalyst: stock.sigCatalyst ?? stock.signals?.sigCatalyst ?? null,
          sigSentiment: stock.sigSentiment ?? stock.signals?.sigSentiment ?? null,
          signalTotal: stock.signalTotal ?? null,
          rating: stock.rating?.zh ?? stock.rating ?? null,
          entryRange: stock.entryRange ?? null,
          target: stock.target ?? null,
          stop: stock.stop ?? null,
          thesisZh: stock.thesisZh ?? stock.thesis_zh ?? null,
          thesisEn: stock.thesisEn ?? stock.thesis_en ?? null,
          chartDaily: stock.chartDaily ?? stock.chart_daily ?? null,
          chartWeekly: stock.chartWeekly ?? stock.chart_weekly ?? null,
          sector: stock.sector ?? null,
        })
        .run();
    }

    // Broadcast SSE event
    sse.emit("screen_update", {
      runId: run.id,
      themeId,
      themeName: theme.nameZh,
      count: stocks.length,
    });

    return NextResponse.json({
      runId: run.id,
      count: stocks.length,
      message: `Persisted ${stocks.length} stocks from CLI push`,
    });
  } catch (error) {
    console.error("Push error:", error);
    return NextResponse.json(
      { error: "Push failed" },
      { status: 500 },
    );
  }
}
