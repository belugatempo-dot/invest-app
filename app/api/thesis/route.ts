import { NextRequest, NextResponse } from "next/server";
import { llmPrompt, LLMNotConfiguredError } from "@/lib/llm";
import { db } from "@/lib/db";
import { stockSnapshots } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";

export async function POST(request: NextRequest) {
  let ticker: string | undefined;
  try {
    ({ ticker } = await request.json());

    if (!ticker) {
      return NextResponse.json(
        { error: "Missing 'ticker' in request body" },
        { status: 400 },
      );
    }

    // Get latest snapshot for context
    const snapshot = await db
      .select()
      .from(stockSnapshots)
      .where(eq(stockSnapshots.ticker, ticker))
      .orderBy(desc(stockSnapshots.id))
      .limit(1)
      .get();

    const context = snapshot
      ? `Stock: ${ticker} (${snapshot.company})
Price: $${snapshot.close?.toFixed(2) ?? "N/A"}
Market Cap: $${snapshot.marketCap ? (snapshot.marketCap / 1e9).toFixed(1) + "B" : "N/A"}
P/E: ${snapshot.pe?.toFixed(1) ?? "N/A"}
Revenue Growth: ${snapshot.revGrowth ? (snapshot.revGrowth * 100).toFixed(1) + "%" : "N/A"}
Gross Margin: ${snapshot.grossMargin ? (snapshot.grossMargin * 100).toFixed(1) + "%" : "N/A"}
RSI: ${snapshot.rsi?.toFixed(1) ?? "N/A"}
Signal Total: ${snapshot.signalTotal ?? "N/A"}/7
Rating: ${snapshot.rating ?? "N/A"}
Entry: ${snapshot.entryRange ?? "N/A"}
Target: ${snapshot.target ?? "N/A"}
Stop: ${snapshot.stop ?? "N/A"}`
      : `Stock: ${ticker}`;

    const prompt = `你是一位资深投资分析师。请用中文为以下股票写一段简洁的投资论点（200-300字），包含看多理由和主要风险。

${context}

格式要求：
1. 核心论点（1-2句话）
2. 看多理由（3点）
3. 主要风险（2点）
4. 总结建议`;

    const thesis = await llmPrompt(prompt);

    // Update the snapshot with the thesis
    if (snapshot) {
      await db.update(stockSnapshots)
        .set({ thesisZh: thesis })
        .where(eq(stockSnapshots.id, snapshot.id))
        .run();
    }

    return NextResponse.json({ ticker, thesis });
  } catch (error) {
    if (error instanceof LLMNotConfiguredError) {
      return NextResponse.json(
        {
          error: "AI 功能未配置",
          details: "请设置 LLM_PROVIDER 和 LLM_API_KEY 环境变量",
        },
        { status: 503 },
      );
    }
    console.error("Thesis error for", ticker ?? "unknown", error);
    return NextResponse.json(
      {
        error: "Thesis generation failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
