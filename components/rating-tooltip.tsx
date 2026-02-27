"use client";

import { useState } from "react";
import { RATING_SCALE } from "@/lib/types";

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

export function RatingTooltip() {
  const [showRatingInfo, setShowRatingInfo] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowRatingInfo((v) => !v)}
        className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full border border-text-muted/40 text-text-muted text-xs hover:border-primary hover:text-primary transition-colors"
        aria-label="评分规则说明"
      >
        ?
      </button>
      {showRatingInfo && (
        <div className="absolute top-full left-0 mt-2 z-10 rounded-lg border border-border-subtle bg-surface-raised p-4 text-sm w-80">
          <p className="font-semibold text-foreground mb-2">评分规则</p>
          <p className="text-text-secondary mb-3">
            每只股票按 8 个维度评分，每维度 -1/0/+1：
            <br />
            估值 · 增长 · 利润率 · 趋势 · 动量 · 形态 · 催化剂 · 情绪
          </p>
          <p className="text-text-muted mb-1.5">总分 → 评级：</p>
          <div className="space-y-1">
            {RATING_SCALE.map((r) => (
              <div
                key={r.zh}
                className={`flex justify-between rounded px-3 py-1 ${ratingClass(r.zh)}`}
              >
                <span>
                  {r.min > 0 ? "+" : ""}
                  {r.min} ~ {r.max > 0 ? "+" : ""}
                  {r.max}
                </span>
                <span className="font-semibold">{r.zh}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
