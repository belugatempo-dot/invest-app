import { NextRequest, NextResponse } from "next/server";
import { scoreScreen } from "@/lib/signal-scorer";
import type { RawStockData } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const stocks: RawStockData[] = body.stocks;

    if (!Array.isArray(stocks) || stocks.length === 0) {
      return NextResponse.json(
        { error: "Request body must include a non-empty 'stocks' array" },
        { status: 400 },
      );
    }

    const scoredStocks = scoreScreen(stocks);

    return NextResponse.json({
      count: scoredStocks.length,
      stocks: scoredStocks,
    });
  } catch (error) {
    console.error("Analyze error:", error);
    return NextResponse.json(
      { error: "Analysis failed" },
      { status: 500 },
    );
  }
}
