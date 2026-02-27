import { db } from "@/lib/db";
import { themes, screenRuns, stockSnapshots, watchlist } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { ScreenerClient } from "./screener-client";
import type { ThemeData } from "@/components/theme-card";

export const dynamic = "force-dynamic";

export default async function ScreenerPage() {
  // Load all themes with their latest run info
  const allThemes = await db.select().from(themes).all();

  const themeDataList: ThemeData[] = [];
  for (const t of allThemes) {
    const latestRun = await db
      .select()
      .from(screenRuns)
      .where(eq(screenRuns.themeId, t.id))
      .orderBy(desc(screenRuns.runAt))
      .limit(1)
      .get();

    let topPick: string | undefined;
    if (latestRun) {
      const topStock = await db
        .select()
        .from(stockSnapshots)
        .where(eq(stockSnapshots.runId, latestRun.id))
        .orderBy(desc(stockSnapshots.signalTotal))
        .limit(1)
        .get();
      topPick = topStock?.ticker;
    }

    themeDataList.push({
      id: t.id,
      nameZh: t.nameZh,
      nameEn: t.nameEn,
      market: t.market as "america" | "china",
      sectors: t.sectors as string[],
      lastRun: latestRun?.runAt ?? undefined,
      candidateCount: latestRun?.candidateCount ?? undefined,
      topPick,
    });
  }

  const watchlistRows = await db.select().from(watchlist).all();
  const watchlistTickers = watchlistRows.map((r) => r.ticker);

  return <ScreenerClient themes={themeDataList} watchlistTickers={watchlistTickers} />;
}
