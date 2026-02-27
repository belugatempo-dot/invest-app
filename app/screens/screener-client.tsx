"use client";

import { useState } from "react";
import { ThemeCard, type ThemeData } from "@/components/theme-card";
import { StockCard } from "@/components/stock-card";
import { Button } from "@/components/ui/button";
import { useWatchlist } from "@/lib/use-watchlist";

interface ScreenResult {
  ticker: string;
  company: string;
  close: number | null;
  signalTotal: number;
  rating: { zh: string; en: string };
  marketCap: number | null;
  sector: string | null;
}

interface ScreenerClientProps {
  themes: ThemeData[];
  watchlistTickers: string[];
}

type MarketFilter = "all" | "america" | "china";

export function ScreenerClient({ themes, watchlistTickers }: ScreenerClientProps) {
  const { isWatched, toggle } = useWatchlist(watchlistTickers);
  const [loadingThemes, setLoadingThemes] = useState<Set<string>>(new Set());
  const [results, setResults] = useState<Map<string, ScreenResult[]>>(
    new Map(),
  );
  const [activeTheme, setActiveTheme] = useState<string | null>(null);
  const [screenAllLoading, setScreenAllLoading] = useState(false);
  const [marketFilter, setMarketFilter] = useState<MarketFilter>("all");

  const filteredThemes = marketFilter === "all"
    ? themes
    : themes.filter((t) => t.market === marketFilter);

  const americaCount = themes.filter((t) => t.market === "america").length;
  const chinaCount = themes.filter((t) => t.market === "china").length;

  const runScreen = async (themeId: string) => {
    setLoadingThemes((prev) => new Set(prev).add(themeId));
    try {
      const res = await fetch(`/api/screen?theme=${themeId}`);
      const data = await res.json();
      if (data.stocks) {
        setResults((prev) => {
          const next = new Map(prev);
          next.set(themeId, data.stocks);
          return next;
        });
        setActiveTheme(themeId);
      }
    } catch (err) {
      console.error("Screen failed:", err);
    } finally {
      setLoadingThemes((prev) => {
        const next = new Set(prev);
        next.delete(themeId);
        return next;
      });
    }
  };

  const screenAll = async () => {
    setScreenAllLoading(true);
    await Promise.all(filteredThemes.map((t) => runScreen(t.id)));
    setScreenAllLoading(false);
  };

  const activeResults = activeTheme ? results.get(activeTheme) : null;
  const activeThemeData = themes.find((t) => t.id === activeTheme);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-[family-name:var(--font-serif)] text-3xl text-foreground tracking-tight">
              主题<span className="text-primary">筛选</span>
            </h1>
            <p className="text-text-secondary text-sm mt-2">
              Thematic Screener — 选择投资主题，一键筛选候选标的
            </p>
          </div>
          <Button
            variant="outline"
            className="border-primary/30 text-primary hover:bg-primary/10"
            onClick={screenAll}
            disabled={screenAllLoading}
          >
            {screenAllLoading ? "筛选中..." : "一键筛选全部"}
          </Button>
        </div>
        <div className="gold-divider mt-4" />
      </div>

      {/* Market filter tabs */}
      <div className="flex gap-2 mb-6">
        {([
          { key: "all" as MarketFilter, label: `全部 (${themes.length})` },
          { key: "america" as MarketFilter, label: `美股 US (${americaCount})` },
          { key: "china" as MarketFilter, label: `A股 CN (${chinaCount})` },
        ]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setMarketFilter(tab.key);
              if (tab.key !== "all" && activeTheme) {
                const td = themes.find((t) => t.id === activeTheme);
                if (td?.market !== tab.key) {
                  const fallback = Array.from(results.keys()).find((id) => {
                    const t = themes.find((th) => th.id === id);
                    return t?.market === tab.key;
                  });
                  setActiveTheme(fallback ?? null);
                }
              }
            }}
            className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
              marketFilter === tab.key
                ? "bg-primary/10 text-primary border border-primary/30"
                : "bg-surface text-text-muted border border-border-subtle hover:text-text-secondary"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Theme cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {filteredThemes.map((theme) => (
          <ThemeCard
            key={theme.id}
            theme={{
              ...theme,
              candidateCount:
                results.get(theme.id)?.length ?? theme.candidateCount,
            }}
            isLoading={loadingThemes.has(theme.id)}
            onScreen={runScreen}
          />
        ))}
      </div>

      {/* Results section */}
      {activeResults && activeResults.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-xl text-foreground">
              {activeThemeData?.nameZh ?? activeTheme} 筛选结果
            </h2>
            <span className="text-sm text-text-muted font-[family-name:var(--font-mono)]">
              {activeResults.length} 只标的
            </span>
          </div>
          <div className="gold-divider mb-6" />

          {/* Theme tabs */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {Array.from(results.keys())
              .filter((themeId) => {
                if (marketFilter === "all") return true;
                const td = themes.find((t) => t.id === themeId);
                return td?.market === marketFilter;
              })
              .map((themeId) => {
              const td = themes.find((t) => t.id === themeId);
              return (
                <button
                  key={themeId}
                  onClick={() => setActiveTheme(themeId)}
                  className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                    activeTheme === themeId
                      ? "bg-primary/10 text-primary border border-primary/30"
                      : "bg-surface text-text-muted border border-border-subtle hover:text-text-secondary"
                  }`}
                >
                  {td?.nameZh ?? themeId}
                </button>
              );
            })}
          </div>

          {/* Stock grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {activeResults.map((stock) => (
              <StockCard
                key={stock.ticker}
                ticker={stock.ticker}
                company={stock.company}
                close={stock.close}
                signalTotal={stock.signalTotal}
                rating={stock.rating.zh}
                marketCap={stock.marketCap}
                isWatched={isWatched(stock.ticker)}
                onToggleWatch={() => toggle(stock.ticker)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
