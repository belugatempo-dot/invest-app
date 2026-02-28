import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { themes } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { runScreen } from "@/lib/screener";
import { scoreScreen } from "@/lib/signal-scorer";
import { enrichWithSentiment } from "@/lib/sentiment";
import { persistScreenResults } from "@/lib/db-operations";

export async function GET(request: NextRequest) {
  // Verify cron secret (Vercel sends this automatically)
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret && process.env.VERCEL) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }
  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const themeId = request.nextUrl.searchParams.get("theme");
  if (!themeId) {
    return NextResponse.json(
      { error: "Missing ?theme= parameter" },
      { status: 400 },
    );
  }

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
    const market = (theme.market ?? "america") as "america" | "china";
    const rawStocks = await runScreen(
      theme.filters as Record<string, unknown>[],
      25,
      market,
    );

    if (rawStocks.length === 0) {
      return NextResponse.json({
        theme: themeId,
        count: 0,
        source: "cron",
        message: "No candidates found",
      });
    }

    const enrichedStocks = await enrichWithSentiment(rawStocks, market);
    const scoredStocks = scoreScreen(enrichedStocks);

    const { runId, count } = await persistScreenResults(
      theme.id,
      "cron",
      scoredStocks,
    );

    return NextResponse.json({
      theme: themeId,
      runId,
      count,
      source: "cron",
    });
  } catch (error) {
    console.error(`[CRON] Screen failed for ${themeId}:`, error);
    return NextResponse.json(
      { error: "Cron screen failed" },
      { status: 500 },
    );
  }
}
