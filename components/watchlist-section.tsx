"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { StockRow } from "@/components/signal-matrix";

interface WatchlistSectionProps {
  stocks: StockRow[];
  onToggleWatch: (ticker: string) => void;
}

function ratingClass(rating: string | null): string {
  if (!rating) return "rating-hold";
  if (rating.includes("强烈买入")) return "rating-strong-buy";
  if (rating.includes("买入")) return "rating-buy";
  if (rating.includes("偏多")) return "rating-lean-buy";
  if (rating.includes("卖出") && rating.includes("强烈")) return "rating-strong-sell";
  if (rating.includes("卖出")) return "rating-sell";
  return "rating-hold";
}

export function WatchlistSection({ stocks, onToggleWatch }: WatchlistSectionProps) {
  const [expanded, setExpanded] = useState(true);

  if (stocks.length === 0) return null;

  return (
    <div className="mb-6">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 mb-3 text-sm text-text-secondary hover:text-foreground transition-colors"
      >
        {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        <Star size={14} className="fill-[var(--gold)] text-[var(--gold)]" />
        <span>自选股</span>
        <span className="text-text-muted font-[family-name:var(--font-mono)]">
          {stocks.length}
        </span>
      </button>

      {expanded && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {stocks.map((stock) => (
            <div
              key={stock.ticker}
              className="rounded-lg border border-[var(--gold)]/40 bg-surface p-4 transition-all hover:border-[var(--gold)]/70"
            >
              <div className="flex items-center justify-between mb-2">
                <a
                  href={`/stock/${stock.ticker}`}
                  className="font-[family-name:var(--font-mono)] font-bold text-foreground hover:text-primary transition-colors"
                >
                  {stock.ticker}
                </a>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={`text-xs ${ratingClass(stock.rating)}`}
                  >
                    {stock.rating ?? "持有"}
                  </Badge>
                  <button
                    type="button"
                    onClick={() => onToggleWatch(stock.ticker)}
                    className="inline-flex items-center justify-center rounded p-1 transition-colors hover:bg-gold-dim"
                    aria-label="取消收藏"
                  >
                    <Star size={14} className="fill-[var(--gold)] text-[var(--gold)]" />
                  </button>
                </div>
              </div>
              <p className="text-text-muted text-xs truncate mb-2">{stock.company}</p>
              <div className="flex items-center justify-between text-sm">
                <span className="font-[family-name:var(--font-mono)] text-foreground">
                  {stock.close != null ? `$${stock.close.toFixed(2)}` : "-"}
                </span>
                <span
                  className={`font-[family-name:var(--font-mono)] font-bold ${
                    (stock.signalTotal ?? 0) >= 3
                      ? "text-primary"
                      : (stock.signalTotal ?? 0) <= -2
                        ? "text-destructive"
                        : "text-text-secondary"
                  }`}
                >
                  {stock.signalTotal != null
                    ? (stock.signalTotal > 0 ? "+" : "") + stock.signalTotal
                    : "-"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
