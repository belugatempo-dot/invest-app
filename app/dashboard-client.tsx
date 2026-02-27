"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useWatchlist } from "@/lib/use-watchlist";
import { WatchlistSection } from "@/components/watchlist-section";
import { SignalMatrix, type StockRow } from "@/components/signal-matrix";

interface DashboardClientProps {
  stocks: StockRow[];
  watchlistTickers: string[];
  latestRunId?: number;
}

export function DashboardClient({ stocks, watchlistTickers, latestRunId }: DashboardClientProps) {
  const { watchedTickers, toggle } = useWatchlist(watchlistTickers);
  const router = useRouter();
  const knownRunId = useRef(latestRunId);

  // Poll for new screen runs every 30 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/history?action=runs");
        if (!res.ok) return;
        const runs = await res.json();
        if (runs[0]?.id && runs[0].id !== knownRunId.current) {
          knownRunId.current = runs[0].id;
          router.refresh();
        }
      } catch {
        // Silently ignore polling errors
      }
    }, 30_000);
    return () => clearInterval(interval);
  }, [router]);

  // Filter stocks in current run that are watched
  const watchedStocks = stocks.filter((s) => watchedTickers.has(s.ticker));

  return (
    <>
      <WatchlistSection stocks={watchedStocks} onToggleWatch={toggle} />
      <SignalMatrix
        stocks={stocks}
        watchedTickers={watchedTickers}
        onToggleWatch={toggle}
      />
    </>
  );
}
