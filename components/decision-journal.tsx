"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Decision {
  id: number;
  ticker: string;
  action: string;
  signalTotal: number | null;
  rating: string | null;
  priceAtDecision: number | null;
  entry: string | null;
  target: string | null;
  stop: string | null;
  decidedAt: string | null;
  outcomePrice: number | null;
  outcomeDate: string | null;
  notes: string | null;
}

export function DecisionJournal({
  initialDecisions,
}: {
  initialDecisions: Decision[];
}) {
  const [decisions] = useState<Decision[]>(initialDecisions);

  const actionColor = (action: string) => {
    if (action === "BUY") return "rating-buy";
    if (action === "SELL") return "rating-sell";
    return "rating-hold";
  };

  return (
    <div className="rounded-lg border border-border-subtle overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-surface hover:bg-surface">
            <TableHead>标的</TableHead>
            <TableHead>操作</TableHead>
            <TableHead>信号</TableHead>
            <TableHead>评级</TableHead>
            <TableHead className="text-right">决策价</TableHead>
            <TableHead className="text-right">结果价</TableHead>
            <TableHead className="text-right">收益</TableHead>
            <TableHead>日期</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {decisions.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={8}
                className="text-center text-text-muted py-8"
              >
                暂无决策记录 — 在决策面板中做出买卖决策后将在此记录
              </TableCell>
            </TableRow>
          ) : (
            decisions.map((d) => {
              const pnl =
                d.outcomePrice != null && d.priceAtDecision != null
                  ? ((d.outcomePrice - d.priceAtDecision) /
                      d.priceAtDecision) *
                    100 *
                    (d.action === "SELL" ? -1 : 1)
                  : null;
              return (
                <TableRow key={d.id}>
                  <TableCell className="font-[family-name:var(--font-mono)] font-medium">
                    {d.ticker}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-xs ${actionColor(d.action)}`}
                    >
                      {d.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-[family-name:var(--font-mono)]">
                    {d.signalTotal ?? "-"}
                  </TableCell>
                  <TableCell className="text-sm">{d.rating ?? "-"}</TableCell>
                  <TableCell className="text-right font-[family-name:var(--font-mono)]">
                    {d.priceAtDecision != null
                      ? `$${d.priceAtDecision.toFixed(2)}`
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right font-[family-name:var(--font-mono)]">
                    {d.outcomePrice != null
                      ? `$${d.outcomePrice.toFixed(2)}`
                      : "-"}
                  </TableCell>
                  <TableCell
                    className={`text-right font-[family-name:var(--font-mono)] font-bold ${
                      pnl != null
                        ? pnl > 0
                          ? "text-primary"
                          : "text-destructive"
                        : "text-text-muted"
                    }`}
                  >
                    {pnl != null ? `${pnl > 0 ? "+" : ""}${pnl.toFixed(1)}%` : "-"}
                  </TableCell>
                  <TableCell className="text-xs text-text-muted">
                    {d.decidedAt?.split("T")[0] ?? "-"}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
