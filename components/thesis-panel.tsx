"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  ticker: string;
  initialThesis: string | null;
}

export function ThesisPanel({ ticker, initialThesis }: Props) {
  const [thesis, setThesis] = useState<string | null>(initialThesis);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/thesis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker }),
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

  return (
    <div className="rounded-lg border border-border-subtle bg-surface p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-foreground font-medium">AI 投资论点</h3>
        <Button
          size="sm"
          variant="outline"
          className="text-xs border-primary/30 text-primary hover:bg-primary/10"
          onClick={generate}
          disabled={loading}
        >
          {loading ? "生成中..." : thesis ? "刷新论点" : "生成论点"}
        </Button>
      </div>
      {thesis ? (
        <div className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
          {thesis}
        </div>
      ) : (
        <p className="text-text-muted text-sm">
          点击"生成论点"使用 Claude 分析此标的
        </p>
      )}
    </div>
  );
}
