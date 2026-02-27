"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface SignalPoint {
  date: string;
  signalTotal: number;
}

interface Props {
  data: SignalPoint[];
  ticker: string;
}

export function SignalHistoryChart({ data, ticker }: Props) {
  if (data.length < 2) {
    return (
      <div className="rounded-lg border border-border-subtle bg-surface p-8 text-center">
        <p className="text-text-muted text-sm">
          需要至少 2 次筛选记录才能显示趋势
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border-subtle bg-surface p-4">
      <h3 className="text-sm text-text-secondary mb-4">
        {ticker} 信号得分历史
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#253d5e" />
          <XAxis
            dataKey="date"
            stroke="#5a7fa0"
            tick={{ fill: "#5a7fa0", fontSize: 10 }}
          />
          <YAxis
            domain={[-7, 7]}
            stroke="#5a7fa0"
            tick={{ fill: "#5a7fa0", fontSize: 10 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1c3050",
              border: "1px solid #2d5a8a",
              borderRadius: 8,
              color: "#e2e8f0",
              fontSize: 12,
            }}
          />
          <ReferenceLine y={0} stroke="#2d5a8a" strokeDasharray="3 3" />
          <ReferenceLine y={3} stroke="#FFD43B" strokeDasharray="2 2" opacity={0.3} />
          <ReferenceLine y={-2} stroke="#ef4444" strokeDasharray="2 2" opacity={0.3} />
          <Line
            type="monotone"
            dataKey="signalTotal"
            stroke="#FFD43B"
            strokeWidth={2}
            dot={{ r: 4, fill: "#FFD43B" }}
            activeDot={{ r: 6, fill: "#FFD43B" }}
            name="信号总分"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
