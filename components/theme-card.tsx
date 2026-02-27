"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface ThemeData {
  id: string;
  nameZh: string;
  nameEn: string;
  sectors: string[];
  lastRun?: string;
  candidateCount?: number;
  topPick?: string;
}

interface Props {
  theme: ThemeData;
  isLoading: boolean;
  onScreen: (themeId: string) => void;
}

export function ThemeCard({ theme, isLoading, onScreen }: Props) {
  return (
    <div className="rounded-lg border border-border-subtle bg-surface p-5 gold-glow transition-all hover:border-primary/30 flex flex-col">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-foreground text-lg font-medium">
            {theme.nameZh}
          </h3>
          <p className="text-text-muted text-xs font-[family-name:var(--font-mono)] mt-0.5">
            {theme.nameEn}
          </p>
        </div>
        {theme.topPick && (
          <Badge
            variant="outline"
            className="text-xs rating-buy font-[family-name:var(--font-mono)]"
          >
            {theme.topPick}
          </Badge>
        )}
      </div>

      {/* Sector tags */}
      <div className="flex flex-wrap gap-1 mb-4">
        {theme.sectors.slice(0, 4).map((s) => (
          <span
            key={s}
            className="text-[10px] px-2 py-0.5 rounded bg-surface-raised text-text-muted border border-border-subtle"
          >
            {s}
          </span>
        ))}
      </div>

      {/* Meta */}
      <div className="text-xs text-text-muted mb-4 mt-auto">
        {theme.lastRun ? (
          <span>
            上次筛选: {theme.lastRun} · {theme.candidateCount} 只
          </span>
        ) : (
          <span>尚未运行筛选</span>
        )}
      </div>

      {/* Screen button */}
      <Button
        variant="outline"
        size="sm"
        className="w-full border-primary/30 text-primary hover:bg-primary/10 disabled:opacity-50"
        onClick={() => onScreen(theme.id)}
        disabled={isLoading}
      >
        {isLoading ? "筛选中..." : "运行筛选"}
      </Button>
    </div>
  );
}
