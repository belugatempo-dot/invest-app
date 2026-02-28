# CLAUDE.md — invest-app

## What This Is

Bilingual (zh-CN first) investment signal dashboard. Next.js 16 + React 19 + libSQL/Turso + TradingView data. Scores US stocks on an 8-dimension signal matrix and outputs BUY/HOLD/SELL decisions. Deployable to Vercel or run locally.

## Commands

```bash
npm run dev              # Next.js dev server on port 8888
npm run build            # Production build
npm run start            # Production server on port 8888
npm run cron:local       # Local cron scheduler (run alongside dev server)
npm run test             # Vitest (92 tests)
npm run test -- --coverage  # With v8 coverage
npm run db:push          # Apply schema to database
npm run db:seed          # Seed theme presets
npm run db:generate      # Generate Drizzle migrations
npm run db:studio        # Open Drizzle Studio GUI
```

**Port is always 8888.** Do not change this.

## Architecture

- **Server Components by default.** Only use `"use client"` when the component needs browser APIs, event handlers, or React state.
- **libSQL via @libsql/client + Drizzle ORM.** Async queries. Supports both local SQLite file (`./data/invest.db`) and Turso cloud via `DATABASE_URL` env var.
- **TradingView scan API** — Direct HTTP POST to `https://scanner.tradingview.com/america/scan`. No auth required.
- **Signal scoring is pure functions** in `lib/signal-scorer.ts`. All business logic is here, fully tested. Do not add side effects to these functions.
- **LLM abstraction** (`lib/llm.ts`) — Vercel AI SDK supporting Anthropic, OpenAI, DeepSeek. Provider-agnostic via `LLM_PROVIDER` + `LLM_API_KEY` env vars. Falls back to `claude -p` CLI when no API key configured (local dev with Claude Max). Returns 503 only when both API and CLI are unavailable.
- **Auth proxy** (`proxy.ts`) — Optional bearer token via `AUTH_TOKEN` env var. Open access when not configured.
- **Cron** — Vercel Cron Jobs in production (`vercel.json`), `scripts/cron-local.ts` for local dev.
- **Polling** for dashboard updates (30s interval). SSE kept for local dev compatibility.

## Environment Variables

See `.env.example`. All optional except `DATABASE_URL` + `DATABASE_AUTH_TOKEN` for production:

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Prod only | Turso database URL (`libsql://...`) |
| `DATABASE_AUTH_TOKEN` | Prod only | Turso auth token |
| `LLM_PROVIDER` | No | `anthropic`, `openai`, or `deepseek` |
| `LLM_API_KEY` | No | API key for the LLM provider |
| `LLM_MODEL` | No | Override default model |
| `AUTH_TOKEN` | No | Bearer token for access control |
| `CRON_SECRET` | Auto | Vercel sets this for cron security |

## Key Conventions

### Language
- UI text is **Chinese-first** (zh-CN). English is secondary.
- Variable names, code comments, and API contracts are in English.
- AI-generated theses are in Chinese by default.

### Styling
- **Starry Blue theme** — dark navy background (#0a1628), gold accent (#FFD43B).
- Use Tailwind CSS utility classes. Do not add CSS modules or inline styles.
- Use **shadcn/ui** components (New York style). Do not build custom components when a shadcn primitive exists.
- Theme tokens are defined as CSS custom properties in `app/globals.css`.

### Fonts
- DM Serif Display — headings
- Instrument Sans — English body text
- Noto Sans SC — Chinese text
- JetBrains Mono — numeric data, code

### Database
- Schema is in `lib/schema.ts` (5 tables: themes, screenRuns, stockSnapshots, watchlist, decisions).
- All timestamps are UTC (`datetime('now')`).
- After schema changes, run `npm run db:generate && npm run db:push`.
- `stockSnapshots` has a unique index on `(runId, ticker)`.
- All DB queries are async (use `await`).

### TradingView API Gotchas
- **Sector names are NOT GICS.** TradingView uses its own taxonomy: "Electronic Technology" (not "Semiconductors"), "Technology Services" (not "Software"), "Health Technology" (not "Healthcare"), "Producer Manufacturing" (not "Industrials").
- **Margins and growth** are returned as percentages 0–100 (e.g., 71.07 = 71.07%). `lib/screener.ts` normalizes to decimals (÷100) for the signal scorer.
- **Filter values** must use percentage format in requests (e.g., `gross_margin_ttm > 40` not `> 0.4`).
- `research_and_dev_ratio_ttm` does NOT exist. Do not use it in filters.

### lightweight-charts v5
- API changed from v4: use `chart.addSeries(LineSeries, options)` not `chart.addLineSeries(options)`.
- Import series types: `import { LineSeries } from "lightweight-charts"`.

## Testing

- **Framework:** Vitest v4 with globals enabled.
- **Coverage target:** 100% on `lib/signal-scorer.ts` (business logic). Enforced in `vitest.config.ts`.
- **Test file convention:** `*.test.ts` co-located with source.
- Signal scorer tests cover all 8 scoring functions, rating derivation, level calculations, edge cases.
- Run `npm run test -- --coverage` and verify 100% before merging changes to signal-scorer.

## File Map

| File | Role |
|------|------|
| `lib/signal-scorer.ts` | Core business logic — 8 scoring functions, rating, levels (pure, no I/O) |
| `lib/signal-scorer.test.ts` | 71 tests, 100% coverage |
| `lib/screener.ts` | TradingView HTTP client, field mapping, filter builder |
| `lib/themes.ts` | Themed screening presets with sector filters |
| `lib/schema.ts` | Drizzle ORM schema (5 tables) |
| `lib/types.ts` | RawStockData, SignalScores, ScoredStock, Rating interfaces |
| `lib/db.ts` | libSQL/Turso connection (auto-detects local vs cloud) |
| `lib/llm.ts` | LLM abstraction — Anthropic/OpenAI/DeepSeek via AI SDK |
| `lib/db-operations.ts` | Shared persist logic for screen results |
| `lib/sse.ts` | SSE event broadcaster (local dev) |
| `proxy.ts` | Optional bearer token auth |
| `vercel.json` | Vercel Cron job definitions |
| `scripts/cron-local.ts` | Local cron scheduler |
| `app/api/screen/` | Run themed screen → score → persist |
| `app/api/cron/` | Cron endpoint (called by Vercel Cron or local script) |
| `app/api/thesis/` | Generate AI investment thesis via LLM |
| `app/globals.css` | Starry Blue theme tokens |

## Deployment

### Local Dev
```bash
npm install && npm run db:push && npm run db:seed && npm run dev
```

### Vercel
1. Push to GitHub
2. Connect repo in Vercel dashboard
3. Set environment variables: `DATABASE_URL`, `DATABASE_AUTH_TOKEN`, optionally `LLM_PROVIDER`/`LLM_API_KEY`/`AUTH_TOKEN`
4. Deploy — cron jobs auto-register from `vercel.json`

## Signal Matrix Reference

8 dimensions, each scored -1 / 0 / +1. Total range: -8 to +8.

| Dimension | Source Fields |
|-----------|-------------|
| Valuation | price_earnings_ttm vs sector median/p75 |
| Growth | total_revenue_yoy_growth_ttm |
| Margins | gross_margin_ttm, free_cash_flow_margin_ttm |
| Trend | close, SMA50, SMA200 |
| Momentum | RSI, close, price_52_week_high |
| Pattern | ADX, close, price_52_week_high |
| Catalyst | earnings_release_next_trading_date_fq |
| Sentiment | Reddit mentions rank and momentum |

Rating: +6..+8 = Strong Buy, +4..+5 = Buy, +1..+3 = Lean Buy, -1..0 = Hold, -2..-3 = Sell, -4..-8 = Strong Sell.
