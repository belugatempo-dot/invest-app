import { db } from "@/lib/db";
import { stockSnapshots, screenRuns } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { SIGNAL_DIMENSIONS } from "@/lib/types";
import { PriceChart } from "@/components/price-chart";
import { SignalHistoryChart } from "@/components/signal-history";
import { ThesisPanel } from "@/components/thesis-panel";
import { RatingTooltip } from "@/components/rating-tooltip";
import Link from "next/link";

export const dynamic = "force-dynamic";

function ratingClass(rating: string | null): string {
  if (!rating) return "rating-hold";
  if (rating.includes("强烈买入")) return "rating-strong-buy";
  if (rating.includes("买入")) return "rating-buy";
  if (rating.includes("偏多")) return "rating-lean-buy";
  if (rating.includes("卖出") && rating.includes("强烈")) return "rating-strong-sell";
  if (rating.includes("卖出")) return "rating-sell";
  return "rating-hold";
}

function signalLabel(val: number | null): { text: string; color: string; detail: string } {
  if (val === 1) return { text: "+1", color: "text-gold bg-gold-dim", detail: "看多" };
  if (val === -1) return { text: "-1", color: "text-destructive bg-destructive/10", detail: "看空" };
  return { text: "0", color: "text-text-muted bg-surface", detail: "中性" };
}

interface StockPageProps {
  params: Promise<{ ticker: string }>;
}

export default async function StockDeepDivePage({ params }: StockPageProps) {
  const { ticker } = await params;

  // Get latest snapshot for this ticker
  const snapshot = await db
    .select()
    .from(stockSnapshots)
    .where(eq(stockSnapshots.ticker, ticker.toUpperCase()))
    .orderBy(desc(stockSnapshots.id))
    .limit(1)
    .get();

  // Get historical signal data
  const allSnapshots = await db
    .select({
      signalTotal: stockSnapshots.signalTotal,
      runAt: screenRuns.runAt,
    })
    .from(stockSnapshots)
    .innerJoin(screenRuns, eq(stockSnapshots.runId, screenRuns.id))
    .where(eq(stockSnapshots.ticker, ticker.toUpperCase()))
    .orderBy(screenRuns.runAt)
    .all();

  const signalHistory = allSnapshots.map((s) => ({
    date: s.runAt?.split("T")[0] ?? "",
    signalTotal: s.signalTotal ?? 0,
  }));

  if (!snapshot) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <h1 className="font-[family-name:var(--font-serif)] text-3xl text-foreground tracking-tight">
            个股<span className="text-primary">深研</span>
          </h1>
          <div className="gold-divider mt-4" />
        </div>
        <div className="rounded-lg border border-border-subtle bg-surface p-12 text-center">
          <p className="text-primary font-[family-name:var(--font-mono)] text-2xl mb-4">
            {ticker}
          </p>
          <p className="text-text-muted text-lg mb-4">暂无该标的数据</p>
          <Link
            href="/screens"
            className="inline-block rounded-md bg-primary/10 border border-primary/30 text-primary px-6 py-2 text-sm hover:bg-primary/20 transition-colors"
          >
            前往筛选 →
          </Link>
        </div>
      </div>
    );
  }

  const signalKeys = Object.keys(SIGNAL_DIMENSIONS) as Array<keyof typeof SIGNAL_DIMENSIONS>;

  const signalDescriptions: Record<string, { metric: string; logic: string }> = {
    sigValuation: {
      metric: `P/E: ${snapshot.pe?.toFixed(1) ?? "N/A"}`,
      logic: "P/E < 筛选中位数 → +1; > 75分位 → -1",
    },
    sigGrowth: {
      metric: `营收增长: ${snapshot.revGrowth != null ? (snapshot.revGrowth * 100).toFixed(1) + "%" : "N/A"}`,
      logic: ">15% → +1; 5-15% → 0; <5% → -1",
    },
    sigMargins: {
      metric: `毛利率: ${snapshot.grossMargin != null ? (snapshot.grossMargin * 100).toFixed(1) + "%" : "N/A"}`,
      logic: "毛利率>40% 且 FCF>0 → +1; <20% → -1",
    },
    sigTrend: {
      metric: `SMA50: ${snapshot.sma50?.toFixed(2) ?? "N/A"} | SMA200: ${snapshot.sma200?.toFixed(2) ?? "N/A"}`,
      logic: "价格>SMA200 且 SMA50>SMA200 → +1",
    },
    sigMomentum: {
      metric: `RSI: ${snapshot.rsi?.toFixed(1) ?? "N/A"}`,
      logic: "RSI 35-55 → +1 (超卖恢复); >70 → -1",
    },
    sigPattern: {
      metric: `ADX: ${snapshot.adx?.toFixed(1) ?? "N/A"}`,
      logic: "ADX>25 且接近52周高点 → +1; <15 → -1",
    },
    sigCatalyst: {
      metric: `财报: ${snapshot.earningsDays != null ? snapshot.earningsDays + "天后" : "N/A"}`,
      logic: "<30天催化剂; >60天无催化",
    },
    sigSentiment: {
      metric: `${snapshot.sentimentSource === "xueqiu" ? "雪球排名" : "Reddit排名"}: ${snapshot.sentimentRank ?? "N/A"} | 提及: ${snapshot.sentimentMentions ?? "N/A"}`,
      logic: "Top100热度↑>20% → +1; Top20热度↓>30% → -1",
    },
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="relative flex items-center gap-4">
          <h1 className="font-[family-name:var(--font-serif)] text-3xl text-foreground tracking-tight">
            {snapshot.ticker}
          </h1>
          <Badge
            variant="outline"
            className={`text-sm px-3 py-1 ${ratingClass(snapshot.rating)}`}
          >
            {snapshot.rating ?? "持有"}
          </Badge>
          <span className="font-[family-name:var(--font-mono)] text-2xl font-bold text-primary">
            {snapshot.signalTotal != null
              ? (snapshot.signalTotal > 0 ? "+" : "") + snapshot.signalTotal
              : "-"}
            <span className="text-text-muted text-sm font-normal ml-1">/ 8</span>
          </span>
          <RatingTooltip />
        </div>
        <p className="text-text-secondary text-sm mt-1">
          {snapshot.company}
          {snapshot.sector && <span className="text-text-muted"> · {snapshot.sector}</span>}
        </p>
        <div className="gold-divider mt-4" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Chart + Signal History */}
        <div className="lg:col-span-2 space-y-6">
          {/* Price Chart */}
          <PriceChart
            ticker={snapshot.ticker}
            close={snapshot.close}
            sma50={snapshot.sma50}
            sma200={snapshot.sma200}
            high52w={snapshot.high52w}
            low52w={snapshot.low52w}
            entry={snapshot.entryRange}
            target={snapshot.target}
            stop={snapshot.stop}
          />

          {/* Price levels */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-border-subtle bg-surface p-4 text-center">
              <p className="text-xs text-text-muted mb-1">入场区间</p>
              <p className="font-[family-name:var(--font-mono)] text-foreground">
                {snapshot.entryRange ?? "-"}
              </p>
            </div>
            <div className="rounded-lg border border-border-subtle bg-surface p-4 text-center">
              <p className="text-xs text-text-muted mb-1">目标价</p>
              <p className="font-[family-name:var(--font-mono)] text-primary">
                {snapshot.target ?? "-"}
              </p>
            </div>
            <div className="rounded-lg border border-border-subtle bg-surface p-4 text-center">
              <p className="text-xs text-text-muted mb-1">止损位</p>
              <p className="font-[family-name:var(--font-mono)] text-destructive">
                {snapshot.stop ?? "-"}
              </p>
            </div>
          </div>

          {/* Signal History */}
          <SignalHistoryChart data={signalHistory} ticker={snapshot.ticker} />

          {/* AI Thesis */}
          <ThesisPanel ticker={snapshot.ticker} initialThesis={snapshot.thesisZh} />
        </div>

        {/* Right column: Signal Breakdown */}
        <div className="space-y-4">
          <h3 className="text-foreground font-medium">信号明细</h3>
          {signalKeys.map((key) => {
            const dim = SIGNAL_DIMENSIONS[key];
            const val = snapshot[key as keyof typeof snapshot] as number | null;
            const { text, color, detail } = signalLabel(val);
            const desc = signalDescriptions[key];
            return (
              <div
                key={key}
                className="rounded-lg border border-border-subtle bg-surface p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-foreground">
                    {dim.zh}{" "}
                    <span className="text-text-muted text-xs">{dim.en}</span>
                  </span>
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${color}`}
                  >
                    {detail} {text}
                  </span>
                </div>
                <p className="text-xs text-text-secondary font-[family-name:var(--font-mono)]">
                  {desc.metric}
                </p>
                <p className="text-[10px] text-text-muted mt-1">{desc.logic}</p>
              </div>
            );
          })}

          {/* Key metrics summary */}
          <div className="rounded-lg border border-border-subtle bg-surface p-4">
            <h4 className="text-sm text-foreground mb-3">关键指标</h4>
            <div className="space-y-2 text-xs">
              {[
                { label: "当前价格", value: snapshot.close != null ? `$${snapshot.close.toFixed(2)}` : "-" },
                { label: "市值", value: snapshot.marketCap != null ? `$${(snapshot.marketCap / 1e9).toFixed(1)}B` : "-" },
                { label: "52周高点", value: snapshot.high52w != null ? `$${snapshot.high52w.toFixed(2)}` : "-" },
                { label: "52周低点", value: snapshot.low52w != null ? `$${snapshot.low52w.toFixed(2)}` : "-" },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between">
                  <span className="text-text-muted">{label}</span>
                  <span className="font-[family-name:var(--font-mono)] text-foreground">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
