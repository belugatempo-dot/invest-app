import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { themes } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { runScreen } from "@/lib/screener";
import { scoreScreen } from "@/lib/signal-scorer";
import { enrichWithSentiment } from "@/lib/sentiment";
import { persistScreenResults } from "@/lib/db-operations";

export async function GET(request: NextRequest) {
  const themeId = request.nextUrl.searchParams.get("theme");

  if (!themeId) {
    return NextResponse.json(
      { error: "Missing ?theme= parameter" },
      { status: 400 },
    );
  }

  // Look up theme preset
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

  try {
    // Run TradingView screen
    const market = (theme.market ?? "america") as "america" | "china";
    const rawStocks = await runScreen(
      theme.filters as Record<string, unknown>[],
      25,
      market,
    );

    if (rawStocks.length === 0) {
      return NextResponse.json({
        theme: themeId,
        stocks: [],
        message: "No candidates found with current filters",
      });
    }

    // Enrich with sentiment data (Reddit for US, Xueqiu for A-shares)
    const enrichedStocks = await enrichWithSentiment(rawStocks, market);

    // Score via signal matrix (8 dimensions including sentiment)
    const scoredStocks = scoreScreen(enrichedStocks);

    // Persist to database
    const { runId } = await persistScreenResults(
      theme.id,
      "web",
      scoredStocks,
    );

    return NextResponse.json({
      theme: themeId,
      runId,
      count: scoredStocks.length,
      stocks: scoredStocks,
    });
  } catch (error) {
    console.error("Screen error:", error);
    return NextResponse.json(
      {
        error: "Screen failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
