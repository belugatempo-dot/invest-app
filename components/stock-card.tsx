import { Badge } from "@/components/ui/badge";
import { StarButton } from "@/components/star-button";
import Link from "next/link";

interface Props {
  ticker: string;
  company: string;
  close: number | null;
  signalTotal: number | null;
  rating: string | null;
  marketCap: number | null;
  isWatched?: boolean;
  onToggleWatch?: () => void;
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

function formatCap(val: number | null): string {
  if (val == null) return "-";
  if (val >= 1e12) return `$${(val / 1e12).toFixed(1)}T`;
  if (val >= 1e9) return `$${(val / 1e9).toFixed(1)}B`;
  return `$${(val / 1e6).toFixed(0)}M`;
}

export function StockCard({ ticker, company, close, signalTotal, rating, marketCap, isWatched, onToggleWatch }: Props) {
  return (
    <Link href={`/stock/${ticker}`}>
      <div className="rounded-lg border border-border-subtle bg-surface p-4 gold-glow transition-all hover:border-primary/30 cursor-pointer">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className="font-[family-name:var(--font-mono)] font-bold text-foreground">
              {ticker}
            </span>
            {onToggleWatch && (
              <StarButton
                watched={isWatched ?? false}
                onToggle={onToggleWatch}
                size={14}
              />
            )}
          </div>
          <Badge
            variant="outline"
            className={`text-xs ${ratingClass(rating)}`}
          >
            {rating ?? "持有"}
          </Badge>
        </div>
        <p className="text-text-muted text-xs truncate mb-3">{company}</p>
        <div className="flex items-center justify-between text-sm">
          <span className="font-[family-name:var(--font-mono)] text-foreground">
            {close != null ? `$${close.toFixed(2)}` : "-"}
          </span>
          <span className="text-text-muted text-xs">{formatCap(marketCap)}</span>
          <span
            className={`font-[family-name:var(--font-mono)] font-bold ${
              (signalTotal ?? 0) >= 3
                ? "text-primary"
                : (signalTotal ?? 0) <= -2
                  ? "text-destructive"
                  : "text-text-secondary"
            }`}
          >
            {signalTotal != null
              ? (signalTotal > 0 ? "+" : "") + signalTotal
              : "-"}
          </span>
        </div>
      </div>
    </Link>
  );
}
