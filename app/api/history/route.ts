import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { screenRuns, stockSnapshots, themes, decisions } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

const TICKER_RE = /^[A-Z0-9.\-]{1,10}$/;

export async function GET(request: NextRequest) {
  const action = request.nextUrl.searchParams.get("action");

  switch (action) {
    case "runs": {
      const runs = await db
        .select({
          id: screenRuns.id,
          themeId: screenRuns.themeId,
          themeName: themes.nameZh,
          source: screenRuns.source,
          runAt: screenRuns.runAt,
          candidateCount: screenRuns.candidateCount,
        })
        .from(screenRuns)
        .leftJoin(themes, eq(screenRuns.themeId, themes.id))
        .orderBy(desc(screenRuns.runAt))
        .limit(50)
        .all();
      return NextResponse.json(runs);
    }

    case "evolution": {
      const ticker = request.nextUrl.searchParams.get("ticker");
      if (!ticker) {
        return NextResponse.json({ error: "Missing ticker" }, { status: 400 });
      }
      if (!TICKER_RE.test(ticker.toUpperCase())) {
        return NextResponse.json({ error: "Invalid ticker" }, { status: 400 });
      }
      const snapshots = await db
        .select({
          runAt: screenRuns.runAt,
          themeId: screenRuns.themeId,
          signalTotal: stockSnapshots.signalTotal,
          rating: stockSnapshots.rating,
          sigValuation: stockSnapshots.sigValuation,
          sigGrowth: stockSnapshots.sigGrowth,
          sigMargins: stockSnapshots.sigMargins,
          sigTrend: stockSnapshots.sigTrend,
          sigMomentum: stockSnapshots.sigMomentum,
          sigPattern: stockSnapshots.sigPattern,
          sigCatalyst: stockSnapshots.sigCatalyst,
          sigSentiment: stockSnapshots.sigSentiment,
          close: stockSnapshots.close,
        })
        .from(stockSnapshots)
        .innerJoin(screenRuns, eq(stockSnapshots.runId, screenRuns.id))
        .where(eq(stockSnapshots.ticker, ticker.toUpperCase()))
        .orderBy(screenRuns.runAt)
        .all();
      return NextResponse.json(snapshots);
    }

    case "decisions": {
      const allDecisions = await db
        .select()
        .from(decisions)
        .orderBy(desc(decisions.decidedAt))
        .all();
      return NextResponse.json(allDecisions);
    }

    case "accuracy": {
      // Framework accuracy: group by rating, compute outcomes
      const allDecisionsRaw = await db
        .select()
        .from(decisions)
        .all();
      const allDecisionsWithOutcome = allDecisionsRaw
        .filter((d) => d.outcomePrice != null && d.priceAtDecision != null);

      const byRating: Record<string, { total: number; wins: number }> = {};
      for (const d of allDecisionsWithOutcome) {
        const key = d.rating ?? "unknown";
        if (!byRating[key]) byRating[key] = { total: 0, wins: 0 };
        byRating[key].total++;
        if (d.action === "BUY" && d.outcomePrice! > d.priceAtDecision!) {
          byRating[key].wins++;
        } else if (d.action === "SELL" && d.outcomePrice! < d.priceAtDecision!) {
          byRating[key].wins++;
        }
      }

      return NextResponse.json(byRating);
    }

    default:
      return NextResponse.json(
        { error: "Unknown action. Use ?action=runs|evolution|decisions|accuracy" },
        { status: 400 },
      );
  }
}
