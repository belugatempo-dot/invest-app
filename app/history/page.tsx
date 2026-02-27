import { db } from "@/lib/db";
import { screenRuns, stockSnapshots, themes, decisions } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DecisionJournal } from "@/components/decision-journal";
import { HistoryEvolution } from "./history-evolution";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  // Screen run timeline
  const runs = await db
    .select({
      id: screenRuns.id,
      themeId: screenRuns.themeId,
      themeName: themes.nameZh,
      source: screenRuns.source,
      runAt: screenRuns.runAt,
      candidateCount: screenRuns.candidateCount,
    })
    .from(screenRuns)
    .leftJoin(themes, eq(screenRuns.themeId, themes.id))
    .orderBy(desc(screenRuns.runAt))
    .limit(50)
    .all();

  // Get unique tickers from all snapshots for evolution picker
  const uniqueTickerRows = await db
    .selectDistinct({ ticker: stockSnapshots.ticker })
    .from(stockSnapshots)
    .all();
  const uniqueTickers = uniqueTickerRows.map((r) => r.ticker);

  // Decision journal
  const allDecisions = await db
    .select()
    .from(decisions)
    .orderBy(desc(decisions.decidedAt))
    .all();

  const sourceLabel = (s: string) => {
    if (s === "web") return "网页";
    if (s === "cli") return "CLI";
    if (s === "cron") return "定时";
    return s;
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-[family-name:var(--font-serif)] text-3xl text-foreground tracking-tight">
          历史<span className="text-primary">追踪</span>
        </h1>
        <p className="text-text-secondary text-sm mt-2">
          Historical Tracker — 跟踪信号演变与决策效果
        </p>
        <div className="gold-divider mt-4" />
      </div>

      {/* Screen Run Timeline */}
      <section className="mb-10">
        <h2 className="text-lg text-foreground mb-4">筛选记录</h2>
        {runs.length > 0 ? (
          <div className="rounded-lg border border-border-subtle overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-surface hover:bg-surface">
                  <TableHead>时间</TableHead>
                  <TableHead>主题</TableHead>
                  <TableHead>来源</TableHead>
                  <TableHead className="text-right">标的数</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {runs.map((run) => (
                  <TableRow key={run.id}>
                    <TableCell className="font-[family-name:var(--font-mono)] text-sm text-text-secondary">
                      {run.runAt}
                    </TableCell>
                    <TableCell>{run.themeName ?? run.themeId}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="text-xs border-border-subtle text-text-muted"
                      >
                        {sourceLabel(run.source)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-[family-name:var(--font-mono)]">
                      {run.candidateCount ?? "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="rounded-lg border border-border-subtle bg-surface p-8 text-center">
            <p className="text-text-muted">尚无筛选记录</p>
          </div>
        )}
      </section>

      {/* Signal Evolution */}
      <section className="mb-10">
        <h2 className="text-lg text-foreground mb-4">信号演变</h2>
        <HistoryEvolution tickers={uniqueTickers} />
      </section>

      {/* Decision Journal */}
      <section>
        <h2 className="text-lg text-foreground mb-4">决策日志</h2>
        <DecisionJournal initialDecisions={allDecisions} />
      </section>
    </div>
  );
}
