"use client";

import { useState } from "react";
import { SignalHistoryChart } from "@/components/signal-history";

interface Props {
  tickers: string[];
}

interface EvolutionPoint {
  runAt: string;
  signalTotal: number | null;
  rating: string | null;
  sigValuation: number | null;
  sigGrowth: number | null;
  sigMargins: number | null;
  sigTrend: number | null;
  sigMomentum: number | null;
  sigPattern: number | null;
  sigCatalyst: number | null;
  sigSentiment: number | null;
  close: number | null;
}

export function HistoryEvolution({ tickers }: Props) {
  const [selectedTicker, setSelectedTicker] = useState<string>("");
  const [data, setData] = useState<EvolutionPoint[]>([]);
  const [loading, setLoading] = useState(false);

  const loadEvolution = async (ticker: string) => {
    setSelectedTicker(ticker);
    if (!ticker) {
      setData([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/history?action=evolution&ticker=${ticker}`);
      const result = await res.json();
      setData(result);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const chartData = data.map((d) => ({
    date: d.runAt?.split("T")[0] ?? "",
    signalTotal: d.signalTotal ?? 0,
  }));

  return (
    <div className="space-y-4">
      {/* Ticker picker */}
      <div className="flex flex-wrap gap-2">
        {tickers.map((ticker) => (
          <button
            key={ticker}
            onClick={() => loadEvolution(ticker)}
            className={`px-3 py-1 rounded-md text-sm font-[family-name:var(--font-mono)] transition-colors ${
              selectedTicker === ticker
                ? "bg-primary/10 text-primary border border-primary/30"
                : "bg-surface text-text-muted border border-border-subtle hover:text-text-secondary"
            }`}
          >
            {ticker}
          </button>
        ))}
        {tickers.length === 0 && (
          <p className="text-text-muted text-sm">运行筛选后将显示可选标的</p>
        )}
      </div>

      {/* Evolution chart */}
      {loading ? (
        <div className="rounded-lg border border-border-subtle bg-surface p-8 text-center">
          <p className="text-text-muted">加载中...</p>
        </div>
      ) : selectedTicker ? (
        <SignalHistoryChart data={chartData} ticker={selectedTicker} />
      ) : null}

      {/* Detail table */}
      {data.length > 0 && (
        <div className="rounded-lg border border-border-subtle overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface text-text-muted text-xs">
                <th className="px-3 py-2 text-left">日期</th>
                <th className="px-3 py-2 text-right">价格</th>
                <th className="px-3 py-2 text-center">估值</th>
                <th className="px-3 py-2 text-center">增长</th>
                <th className="px-3 py-2 text-center">利润率</th>
                <th className="px-3 py-2 text-center">趋势</th>
                <th className="px-3 py-2 text-center">动量</th>
                <th className="px-3 py-2 text-center">形态</th>
                <th className="px-3 py-2 text-center">催化剂</th>
                <th className="px-3 py-2 text-center">情绪</th>
                <th className="px-3 py-2 text-center">总分</th>
                <th className="px-3 py-2 text-center">评级</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d, i) => (
                <tr key={i} className="border-t border-border-subtle">
                  <td className="px-3 py-2 font-[family-name:var(--font-mono)] text-xs text-text-secondary">
                    {d.runAt?.split("T")[0]}
                  </td>
                  <td className="px-3 py-2 text-right font-[family-name:var(--font-mono)]">
                    {d.close != null ? `$${d.close.toFixed(2)}` : "-"}
                  </td>
                  {[
                    d.sigValuation,
                    d.sigGrowth,
                    d.sigMargins,
                    d.sigTrend,
                    d.sigMomentum,
                    d.sigPattern,
                    d.sigCatalyst,
                    d.sigSentiment,
                  ].map((val, j) => (
                    <td key={j} className="px-3 py-2 text-center">
                      <span
                        className={`inline-block w-6 h-6 leading-6 rounded text-[10px] font-bold ${
                          val === 1
                            ? "text-gold bg-gold-dim"
                            : val === -1
                              ? "text-destructive bg-destructive/10"
                              : "text-text-muted bg-surface"
                        }`}
                      >
                        {val === 1 ? "+1" : val === -1 ? "-1" : "0"}
                      </span>
                    </td>
                  ))}
                  <td className="px-3 py-2 text-center font-[family-name:var(--font-mono)] font-bold">
                    <span
                      className={
                        (d.signalTotal ?? 0) >= 3
                          ? "text-primary"
                          : (d.signalTotal ?? 0) <= -2
                            ? "text-destructive"
                            : "text-text-secondary"
                      }
                    >
                      {d.signalTotal ?? "-"}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center text-xs">
                    {d.rating ?? "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
