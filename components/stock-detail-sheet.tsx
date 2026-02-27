"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { StockRow } from "@/components/signal-matrix";
import { SIGNAL_DIMENSIONS } from "@/lib/types";
import { RatingTooltip } from "@/components/rating-tooltip";
import { useState, useEffect } from "react";
import Link from "next/link";

function signalLabel(val: number | null): { text: string; color: string } {
  if (val === 1) return { text: "看多 (+1)", color: "text-gold" };
  if (val === -1) return { text: "看空 (-1)", color: "text-destructive" };
  return { text: "中性 (0)", color: "text-text-muted" };
}

function ratingClass(rating: string | null): string {
  if (!rating) return "rating-hold";
  if (rating.includes("强烈买入")) return "rating-strong-buy";
  if (rating.includes("买入")) return "rating-buy";
  if (rating.includes("偏多")) return "rating-lean-buy";
  if (rating.includes("卖出") && rating.includes("强烈"))
    return "rating-strong-sell";
  if (rating.includes("卖出")) return "rating-sell";
  return "rating-hold";
}

interface Props {
  stock: StockRow;
  onClose: () => void;
}

export function StockDetailPanel({ stock, onClose }: Props) {
  const [thesis, setThesis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // Reset thesis state when stock changes
  useEffect(() => {
    setThesis(null);
  }, [stock.ticker]);

  const generateThesis = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/thesis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker: stock.ticker }),
      });
      const data = await res.json();
      if (!res.ok) {
        setThesis(`论点生成失败: ${data.details || data.error || "未知错误"}`);
        return;
      }
      setThesis(data.thesis ?? "论点生成失败");
    } catch {
      setThesis("论点生成失败 — 请确保 Claude CLI 已安装");
    } finally {
      setLoading(false);
    }
  };

  const signalKeys = Object.keys(SIGNAL_DIMENSIONS) as Array<
    keyof typeof SIGNAL_DIMENSIONS
  >;

  return (
    <aside className="w-[560px] shrink-0 sticky top-0 max-h-screen overflow-y-auto border-l border-border-subtle bg-surface">
      <div className="p-6">
        {/* Header with close button */}
        <div className="flex items-start justify-between mb-1">
          <div>
            <h2 className="font-[family-name:var(--font-serif)] text-foreground text-2xl font-bold">
              {stock.ticker}
            </h2>
            <p className="text-text-secondary text-base mt-0.5">
              {stock.company}
              {stock.sector && (
                <span className="ml-2 text-text-muted">· {stock.sector}</span>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-foreground transition-colors p-1 -mr-1 -mt-1"
            aria-label="关闭面板"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Rating + Score */}
        <div className="relative flex items-center gap-4 mt-3">
          <Badge
            variant="outline"
            className={`text-sm px-3 py-1 ${ratingClass(stock.rating)}`}
          >
            {stock.rating ?? "持有"}
          </Badge>
          <span className="font-[family-name:var(--font-mono)] text-2xl font-bold text-primary">
            {stock.signalTotal != null
              ? (stock.signalTotal > 0 ? "+" : "") + stock.signalTotal
              : "-"}
          </span>
          <span className="text-text-muted text-base">/ 8</span>
          <RatingTooltip />
        </div>

        <Separator className="my-4 bg-border-subtle" />

        {/* Price levels */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-text-secondary">
            价格水平
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-md bg-surface-raised p-3 text-center">
              <p className="text-sm text-text-muted mb-1">入场区间</p>
              <p className="font-[family-name:var(--font-mono)] text-lg text-foreground">
                {stock.entryRange ?? "-"}
              </p>
            </div>
            <div className="rounded-md bg-surface-raised p-3 text-center">
              <p className="text-sm text-text-muted mb-1">目标价</p>
              <p className="font-[family-name:var(--font-mono)] text-lg text-primary">
                {stock.target ?? "-"}
              </p>
            </div>
            <div className="rounded-md bg-surface-raised p-3 text-center">
              <p className="text-sm text-text-muted mb-1">止损位</p>
              <p className="font-[family-name:var(--font-mono)] text-lg text-destructive">
                {stock.stop ?? "-"}
              </p>
            </div>
          </div>
        </div>

        <Separator className="my-4 bg-border-subtle" />

        {/* Signal breakdown */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-text-secondary">
            信号明细
          </h3>
          <div className="space-y-2">
            {signalKeys.map((key) => {
              const dim = SIGNAL_DIMENSIONS[key];
              const val = stock[key as keyof StockRow] as number | null;
              const { text, color } = signalLabel(val);
              return (
                <div
                  key={key}
                  className="flex items-center justify-between rounded-md bg-surface-raised px-4 py-2.5"
                >
                  <span className="text-base">
                    {dim.zh}{" "}
                    <span className="text-text-muted text-sm">
                      {dim.en}
                    </span>
                  </span>
                  <span
                    className={`font-[family-name:var(--font-mono)] text-base font-semibold ${color}`}
                  >
                    {text}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <Separator className="my-4 bg-border-subtle" />

        {/* Key metrics */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-text-secondary">
            关键指标
          </h3>
          <div className="grid grid-cols-2 gap-2.5 text-base">
            {[
              { label: "P/E", value: stock.pe?.toFixed(1) },
              {
                label: "营收增长",
                value:
                  stock.revGrowth != null
                    ? (stock.revGrowth * 100).toFixed(1) + "%"
                    : null,
              },
              {
                label: "毛利率",
                value:
                  stock.grossMargin != null
                    ? (stock.grossMargin * 100).toFixed(1) + "%"
                    : null,
              },
              { label: "RSI", value: stock.rsi?.toFixed(1) },
              { label: "ADX", value: stock.adx?.toFixed(1) },
              {
                label: "52W High",
                value:
                  stock.high52w != null
                    ? "$" + stock.high52w.toFixed(2)
                    : null,
              },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="flex justify-between rounded bg-surface-raised px-4 py-2"
              >
                <span className="text-text-muted">{label}</span>
                <span className="font-[family-name:var(--font-mono)] text-foreground">
                  {value ?? "-"}
                </span>
              </div>
            ))}
          </div>
        </div>

        <Separator className="my-4 bg-border-subtle" />

        {/* AI Thesis */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-text-secondary">
              AI 投资论点
            </h3>
            <Button
              size="sm"
              variant="outline"
              className="border-primary/30 text-primary hover:bg-primary/10"
              onClick={generateThesis}
              disabled={loading}
            >
              {loading ? "生成中..." : thesis || stock.thesisZh ? "刷新论点" : "生成论点"}
            </Button>
          </div>
          {thesis ? (
            <div className="rounded-md bg-surface-raised p-4 text-base text-text-secondary leading-relaxed whitespace-pre-wrap">
              {thesis}
            </div>
          ) : stock.thesisZh ? (
            <div className="rounded-md bg-surface-raised p-4 text-base text-text-secondary leading-relaxed whitespace-pre-wrap">
              {stock.thesisZh}
            </div>
          ) : (
            <p className="text-text-muted text-base">
              点击"生成论点"使用 Claude 分析
            </p>
          )}
        </div>

        {/* Link to deep dive */}
        <div className="mt-6">
          <Link href={`/stock/${stock.ticker}`}>
            <Button
              variant="outline"
              className="w-full border-border-subtle text-text-secondary hover:text-foreground hover:border-primary/30"
            >
              查看完整深研 →
            </Button>
          </Link>
        </div>
      </div>
    </aside>
  );
}
