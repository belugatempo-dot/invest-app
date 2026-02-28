import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { watchlist } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const rows = await db.select().from(watchlist).all();
  return NextResponse.json({ tickers: rows.map((r) => r.ticker) });
}

const TICKER_RE = /^[A-Z0-9.\-]{1,10}$/;

export async function POST(request: NextRequest) {
  const body = await request.json();
  const ticker = body.ticker?.trim()?.toUpperCase();

  if (!ticker) {
    return NextResponse.json(
      { error: "Missing ticker" },
      { status: 400 },
    );
  }

  if (!TICKER_RE.test(ticker)) {
    return NextResponse.json(
      { error: "Invalid ticker" },
      { status: 400 },
    );
  }

  await db.insert(watchlist)
    .values({ ticker })
    .onConflictDoNothing()
    .run();

  return NextResponse.json({ ok: true, ticker });
}

export async function DELETE(request: NextRequest) {
  const ticker = request.nextUrl.searchParams.get("ticker")?.trim()?.toUpperCase();

  if (!ticker) {
    return NextResponse.json(
      { error: "Missing ?ticker= parameter" },
      { status: 400 },
    );
  }

  if (!TICKER_RE.test(ticker)) {
    return NextResponse.json(
      { error: "Invalid ticker" },
      { status: 400 },
    );
  }

  await db.delete(watchlist).where(eq(watchlist.ticker, ticker)).run();

  return NextResponse.json({ ok: true, ticker });
}
