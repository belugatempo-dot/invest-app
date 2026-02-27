"use client";

import { useEffect, useRef } from "react";
import { createChart, ColorType, LineSeries } from "lightweight-charts";

interface Props {
  ticker: string;
  close: number | null;
  sma50: number | null;
  sma200: number | null;
  high52w: number | null;
  low52w: number | null;
  entry?: string | null;
  target?: string | null;
  stop?: string | null;
}

export function PriceChart({
  ticker,
  close,
  sma50,
  sma200,
  high52w,
  low52w,
  entry,
  target,
  stop,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || close == null) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#152238" },
        textColor: "#8baac4",
        fontFamily: "JetBrains Mono, monospace",
      },
      grid: {
        vertLines: { color: "#253d5e" },
        horzLines: { color: "#253d5e" },
      },
      width: containerRef.current.clientWidth,
      height: 350,
      crosshair: {
        horzLine: { color: "#FFD43B", labelBackgroundColor: "#FFD43B" },
        vertLine: { color: "#FFD43B", labelBackgroundColor: "#FFD43B" },
      },
      rightPriceScale: {
        borderColor: "#253d5e",
      },
      timeScale: {
        borderColor: "#253d5e",
      },
    });

    // Generate synthetic price data around current close
    const basePrice = close;
    const now = new Date();
    const data: { time: string; value: number }[] = [];

    for (let i = 250; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      if (d.getDay() === 0 || d.getDay() === 6) continue;

      const noise = (Math.random() - 0.5) * basePrice * 0.02;
      const trend = ((250 - i) / 250) * basePrice * 0.15;
      const value =
        basePrice * 0.85 + trend + noise + Math.sin(i / 20) * basePrice * 0.03;
      data.push({
        time: d.toISOString().split("T")[0],
        value: Math.max(value, basePrice * 0.5),
      });
    }

    const lineSeries = chart.addSeries(LineSeries, {
      color: "#FFD43B",
      lineWidth: 2,
    });
    lineSeries.setData(data);

    // Add price lines for key levels
    if (sma200) {
      lineSeries.createPriceLine({
        price: sma200,
        color: "#5ba4f5",
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
        title: "SMA200",
      });
    }
    if (sma50) {
      lineSeries.createPriceLine({
        price: sma50,
        color: "#76b900",
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
        title: "SMA50",
      });
    }
    if (high52w) {
      lineSeries.createPriceLine({
        price: high52w,
        color: "#f5a623",
        lineWidth: 1,
        lineStyle: 1,
        axisLabelVisible: true,
        title: "52W High",
      });
    }

    // Parse stop level for price line
    const stopNum = stop ? parseFloat(stop.replace("$", "")) : null;
    if (stopNum) {
      lineSeries.createPriceLine({
        price: stopNum,
        color: "#ef4444",
        lineWidth: 1,
        lineStyle: 1,
        axisLabelVisible: true,
        title: "止损",
      });
    }

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [ticker, close, sma50, sma200, high52w, low52w, entry, target, stop]);

  if (close == null) {
    return (
      <div className="rounded-lg border border-border-subtle bg-surface p-12 text-center">
        <p className="text-text-muted">无价格数据</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border-subtle overflow-hidden">
      <div ref={containerRef} />
    </div>
  );
}
