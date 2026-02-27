"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { StockDetailPanel } from "@/components/stock-detail-sheet";
import { StarButton } from "@/components/star-button";
import { SIGNAL_DIMENSIONS } from "@/lib/types";

export interface StockRow {
  id: number;
  ticker: string;
  company: string;
  close: number | null;
  changePct: number | null;
  marketCap: number | null;
  sigValuation: number | null;
  sigGrowth: number | null;
  sigMargins: number | null;
  sigTrend: number | null;
  sigMomentum: number | null;
  sigPattern: number | null;
  sigCatalyst: number | null;
  sigSentiment: number | null;
  signalTotal: number | null;
  rating: string | null;
  entryRange: string | null;
  target: string | null;
  stop: string | null;
  pe: number | null;
  revGrowth: number | null;
  grossMargin: number | null;
  rsi: number | null;
  adx: number | null;
  sma50: number | null;
  sma200: number | null;
  high52w: number | null;
  earningsDays: number | null;
  sector: string | null;
  thesisZh: string | null;
}

type SortKey =
  | "ticker"
  | "signalTotal"
  | "sigValuation"
  | "sigGrowth"
  | "sigMargins"
  | "sigTrend"
  | "sigMomentum"
  | "sigPattern"
  | "sigCatalyst"
  | "sigSentiment"
  | "close"
  | "marketCap";

function signalColor(val: number | null): string {
  if (val === 1) return "text-gold bg-gold-dim";
  if (val === -1) return "text-destructive bg-destructive/10";
  return "text-text-muted bg-surface";
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

function formatMarketCap(val: number | null): string {
  if (val == null) return "-";
  if (val >= 1e12) return `$${(val / 1e12).toFixed(1)}T`;
  if (val >= 1e9) return `$${(val / 1e9).toFixed(1)}B`;
  if (val >= 1e6) return `$${(val / 1e6).toFixed(0)}M`;
  return `$${val.toFixed(0)}`;
}

const signalKeys: { key: keyof typeof SIGNAL_DIMENSIONS; label: string }[] = [
  { key: "sigValuation", label: "估值" },
  { key: "sigGrowth", label: "增长" },
  { key: "sigMargins", label: "利润率" },
  { key: "sigTrend", label: "趋势" },
  { key: "sigMomentum", label: "动量" },
  { key: "sigPattern", label: "形态" },
  { key: "sigCatalyst", label: "催化剂" },
  { key: "sigSentiment", label: "情绪" },
];

interface SignalMatrixProps {
  stocks: StockRow[];
  watchedTickers?: Set<string>;
  onToggleWatch?: (ticker: string) => void;
}

export function SignalMatrix({ stocks, watchedTickers, onToggleWatch }: SignalMatrixProps) {
  const [sortKey, setSortKey] = useState<SortKey>("signalTotal");
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedStock, setSelectedStock] = useState<StockRow | null>(null);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const sorted = [...stocks].sort((a, b) => {
    const aVal = a[sortKey] ?? -999;
    const bVal = b[sortKey] ?? -999;
    if (typeof aVal === "string" && typeof bVal === "string") {
      return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    return sortAsc
      ? (aVal as number) - (bVal as number)
      : (bVal as number) - (aVal as number);
  });

  const SortHeader = ({
    label,
    sortKeyVal,
  }: {
    label: string;
    sortKeyVal: SortKey;
  }) => (
    <TableHead
      className="cursor-pointer select-none hover:text-primary transition-colors text-center whitespace-nowrap"
      onClick={() => handleSort(sortKeyVal)}
    >
      {label}
      {sortKey === sortKeyVal && (
        <span className="ml-1 text-primary">{sortAsc ? "↑" : "↓"}</span>
      )}
    </TableHead>
  );

  return (
    <div className="flex items-start gap-0">
      <div className="flex-1 min-w-0 overflow-x-auto">
        <div className="rounded-lg border border-border-subtle overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-surface hover:bg-surface">
                {onToggleWatch && <TableHead className="w-10" />}
                <SortHeader label="标的" sortKeyVal="ticker" />
                <SortHeader label="价格" sortKeyVal="close" />
                <SortHeader label="市值" sortKeyVal="marketCap" />
                {signalKeys.map((sk) => (
                  <SortHeader
                    key={sk.key}
                    label={sk.label}
                    sortKeyVal={sk.key as SortKey}
                  />
                ))}
                <SortHeader label="总分" sortKeyVal="signalTotal" />
                <TableHead className="text-center">评级</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((stock) => (
                <TableRow
                  key={stock.id}
                  className={`cursor-pointer hover:bg-surface-raised/50 transition-colors ${
                    selectedStock?.id === stock.id ? "bg-surface-raised/70" : ""
                  }`}
                  onClick={() => setSelectedStock(stock)}
                >
                  {onToggleWatch && (
                    <TableCell className="p-1 text-center">
                      <StarButton
                        watched={watchedTickers?.has(stock.ticker) ?? false}
                        onToggle={() => onToggleWatch(stock.ticker)}
                        size={14}
                      />
                    </TableCell>
                  )}
                  <TableCell className="font-medium text-foreground">
                    <div className="font-[family-name:var(--font-mono)]">{stock.ticker}</div>
                    <div className="text-xs text-text-muted truncate max-w-[140px]">{stock.company}</div>
                  </TableCell>
                  <TableCell className="text-right font-[family-name:var(--font-mono)]">
                    {stock.close != null ? `$${stock.close.toFixed(2)}` : "-"}
                  </TableCell>
                  <TableCell className="text-right text-text-secondary">
                    {formatMarketCap(stock.marketCap)}
                  </TableCell>
                  {signalKeys.map((sk) => {
                    const val = stock[sk.key as keyof StockRow] as number | null;
                    return (
                      <TableCell key={sk.key} className="text-center p-1">
                        <span
                          className={`inline-block w-9 h-9 leading-9 rounded text-sm font-bold ${signalColor(val)}`}
                        >
                          {val === 1 ? "+1" : val === -1 ? "-1" : "0"}
                        </span>
                      </TableCell>
                    );
                  })}
                  <TableCell className="text-center font-[family-name:var(--font-mono)] font-bold text-lg">
                    <span
                      className={
                        (stock.signalTotal ?? 0) >= 3
                          ? "text-primary"
                          : (stock.signalTotal ?? 0) <= -2
                            ? "text-destructive"
                            : "text-text-secondary"
                      }
                    >
                      {stock.signalTotal != null
                        ? (stock.signalTotal > 0 ? "+" : "") +
                          stock.signalTotal
                        : "-"}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant="outline"
                      className={`text-xs ${ratingClass(stock.rating)}`}
                    >
                      {stock.rating ?? "持有"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {selectedStock && (
        <StockDetailPanel
          stock={selectedStock}
          onClose={() => setSelectedStock(null)}
        />
      )}
    </div>
  );
}
