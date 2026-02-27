"use client";

import { useState, useCallback, useRef } from "react";

export function useWatchlist(initialTickers: string[]) {
  const [watchedTickers, setWatchedTickers] = useState<Set<string>>(
    () => new Set(initialTickers),
  );
  const tickersRef = useRef(watchedTickers);
  tickersRef.current = watchedTickers;

  const toggle = useCallback(async (ticker: string) => {
    const wasWatched = tickersRef.current.has(ticker);

    // Optimistic update
    setWatchedTickers((prev) => {
      const next = new Set(prev);
      if (wasWatched) {
        next.delete(ticker);
      } else {
        next.add(ticker);
      }
      return next;
    });

    try {
      if (wasWatched) {
        await fetch(`/api/watchlist?ticker=${encodeURIComponent(ticker)}`, {
          method: "DELETE",
        });
      } else {
        await fetch("/api/watchlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ticker }),
        });
      }
    } catch {
      // Rollback on failure
      setWatchedTickers((prev) => {
        const next = new Set(prev);
        if (wasWatched) {
          next.add(ticker);
        } else {
          next.delete(ticker);
        }
        return next;
      });
    }
  }, []);

  const isWatched = useCallback(
    (ticker: string) => watchedTickers.has(ticker),
    [watchedTickers],
  );

  return { watchedTickers, toggle, isWatched };
}
