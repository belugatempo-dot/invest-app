# invest-app — Investment Signal Dashboard

A bilingual (Chinese/English) investment analysis platform that screens US stocks via TradingView, scores them on an 8-dimension signal matrix, and presents actionable BUY/HOLD/SELL decisions through an interactive dark-themed dashboard.

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16, React 19, TypeScript 5 |
| Database | libSQL / Turso (@libsql/client + Drizzle ORM) |
| Styling | Tailwind CSS v4, shadcn/ui (New York), Starry Blue theme |
| Charts | Recharts, lightweight-charts v5 |
| Scheduling | Vercel Cron (production), local script (dev) |
| Data Source | TradingView scan API (direct HTTP, no auth) |
| AI Thesis | Vercel AI SDK (Anthropic, OpenAI, DeepSeek) |
| Testing | Vitest v4, v8 coverage (92 tests) |

## Views

| Route | Name | Description |
|-------|------|-------------|
| `/` | 决策面板 (Dashboard) | Signal matrix heatmap, sortable stock cards, click-through to detail |
| `/screens` | 主题筛选 (Screens) | 5 investment theme cards with one-click screening |
| `/stock/[ticker]` | 个股深研 (Stock Detail) | Price chart, signal breakdown, AI thesis, decision recording |
| `/history` | 历史追踪 (History) | Screening run timeline, signal evolution, decision journal |

## Signal Matrix

Each stock is scored across 8 dimensions (-1 / 0 / +1 each, total range -8 to +8):

| Dimension | +1 (Bullish) | 0 (Neutral) | -1 (Bearish) |
|-----------|-------------|-------------|--------------|
| 估值 Valuation | P/E < sector median | Within ±20% of median | P/E > 75th percentile |
| 增长 Growth | Revenue growth > 15% | 5–15% | < 5% |
| 利润率 Margins | Gross > 40% & FCF > 0 | Gross 20–40% | Gross < 20% or FCF < 0 |
| 趋势 Trend | Close > SMA200, SMA50 > SMA200 | Crossover zone | Close < SMA200 |
| 动量 Momentum | RSI 35–55 (dip buy zone) | RSI 40–60 | RSI > 70 near 52w high |
| 形态 Pattern | ADX > 25, within 10% of 52w high | ADX 15–25 | ADX < 15 |
| 催化剂 Catalyst | Earnings < 30 days | > 60 days | Binary event risk |
| 情绪 Sentiment | Reddit mentions rank high & rising | Moderate mentions | Low or declining mentions |

**Rating scale:** +6 to +8 = Strong Buy, +4 to +5 = Buy, +1 to +3 = Lean Buy, -1 to 0 = Hold, -2 to -3 = Sell, -4 to -8 = Strong Sell.

## Themed Screening Presets

| Theme | Sectors | Key Filters |
|-------|---------|-------------|
| AI Infrastructure | Semiconductors, Cloud, Data Centers | Rev Growth > 12%, Gross Margin > 40%, MCap > $5B |
| Robotics & Automation | Industrial Machinery, Semi Equipment | Rev Growth > 8%, ROE > 10%, MCap > $2B |
| Energy Transition | Solar, Renewables, Electrical Equipment | Rev Growth > 5%, FCF Margin > 0%, MCap > $1B |
| Healthcare AI | MedTech, Health IT, Diagnostics | R&D > 10%, Rev Growth > 10% |
| Defense & Reshoring | Aerospace, Specialty Chemicals | Rev Growth > 5% |

## Getting Started

### Prerequisites

- Node.js >= 20
- npm

### Install & Setup

```bash
npm install
npm run db:push    # Create database schema
npm run db:seed    # Insert 5 theme presets
```

### Run

```bash
# Development (no cron)
npm run dev

# Development with cron scheduling (run in a separate terminal)
npm run cron:local

# Production
npm run build && npm run start
```

The app runs at **http://localhost:8888**.

### Test

```bash
npm run test                # Run all 92 tests
npm run test -- --coverage  # With coverage report
```

92 tests covering `lib/signal-scorer.ts` (100% coverage), `lib/llm.ts`, and `lib/reddit-sentiment.ts`.

## Environment Variables

See `.env.example` for the full template. Copy to `.env.local` and fill in values.

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Prod only | Turso database URL (`libsql://...`) |
| `DATABASE_AUTH_TOKEN` | Prod only | Turso auth token |
| `LLM_PROVIDER` | No | `anthropic`, `openai`, or `deepseek` |
| `LLM_API_KEY` | No | API key for the LLM provider |
| `LLM_MODEL` | No | Override default model |
| `AUTH_TOKEN` | No | Bearer token for access control |
| `CRON_SECRET` | Auto | Vercel sets this for cron security |

When `DATABASE_URL` is not set, the app uses a local SQLite file at `./data/invest.db`.

When `LLM_PROVIDER`/`LLM_API_KEY` are not set, the thesis endpoint returns 503.

## Authentication

Optional bearer token auth via the `AUTH_TOKEN` environment variable. When set, all requests must include the token via:

- `Authorization: Bearer <token>` header, or
- `?token=<token>` query parameter

When `AUTH_TOKEN` is not set, access is open (no authentication required).

## Project Structure

```
invest-app/
├── app/                        # Next.js App Router
│   ├── layout.tsx              # Root layout (Starry Blue theme, fonts)
│   ├── page.tsx                # Dashboard (signal matrix overview)
│   ├── screens/                # Theme screening UI
│   ├── stock/[ticker]/         # Individual stock detail
│   ├── history/                # Historical runs & decision journal
│   └── api/
│       ├── screen/             # GET — Run themed stock screen
│       ├── analyze/            # POST — Score submitted stocks
│       ├── thesis/             # POST — AI-generated investment thesis
│       ├── cron/               # GET — Cron endpoint (Vercel Cron / local script)
│       ├── events/             # GET — SSE stream for live updates
│       ├── history/            # GET — Historical data
│       ├── watchlist/          # GET/POST — Watchlist management
│       └── push/               # POST — Ingest from CLI workflows
├── components/                 # React components
│   ├── sidebar.tsx             # Navigation sidebar
│   ├── signal-matrix.tsx       # 8-dimension signal grid
│   ├── stock-card.tsx          # Stock summary card
│   ├── stock-detail-sheet.tsx  # Detail bottom sheet
│   ├── price-chart.tsx         # lightweight-charts OHLC
│   ├── thesis-panel.tsx        # AI thesis display
│   ├── decision-journal.tsx    # BUY/SELL/HOLD recording
│   └── ui/                     # shadcn/ui primitives
├── lib/
│   ├── signal-scorer.ts        # 8-dimension scoring (pure functions)
│   ├── signal-scorer.test.ts   # 71 tests, 100% coverage
│   ├── screener.ts             # TradingView scan API client
│   ├── themes.ts               # 5 theme presets with filters
│   ├── schema.ts               # Drizzle ORM schema (5 tables)
│   ├── db.ts                   # libSQL/Turso connection (auto-detects local vs cloud)
│   ├── db-operations.ts        # Shared persist logic for screen results
│   ├── llm.ts                  # LLM abstraction — Anthropic/OpenAI/DeepSeek via AI SDK
│   ├── llm.test.ts             # LLM unit tests
│   ├── reddit-sentiment.ts     # Reddit sentiment scoring
│   ├── reddit-sentiment.test.ts # Sentiment tests
│   ├── sse.ts                  # SSE broadcaster (local dev)
│   ├── types.ts                # TypeScript interfaces
│   ├── use-watchlist.ts        # Watchlist React hook
│   ├── seed.ts                 # DB seed script
│   └── utils.ts                # Tailwind cn() helper
├── scripts/
│   └── cron-local.ts           # Local cron scheduler
├── drizzle/                    # Migration metadata
├── data/                       # SQLite database (gitignored)
├── middleware.ts                # Optional bearer token auth
├── vercel.json                 # Vercel Cron job definitions
├── .env.example                # Environment variable template
├── vitest.config.ts            # Test configuration
├── drizzle.config.ts           # ORM configuration
└── package.json
```

## Database Schema

5 tables managed by Drizzle ORM:

- **themes** — Investment theme definitions (sectors, filters, cron schedule)
- **screenRuns** — Screening execution log (theme, source, timestamp, count)
- **stockSnapshots** — Time-series stock data (price, fundamentals, technicals, signal scores)
- **watchlist** — User-tracked tickers with cost basis
- **decisions** — Investment decision journal (action, entry/target/stop, thesis, outcome)

## Cron Schedule

| Theme | Schedule (UTC) | Vercel Cron |
|-------|---------------|-------------|
| AI Infrastructure | Mon–Fri 13:30 UTC (6:30 AM PT) | `30 13 * * 1-5` |
| Robotics & Automation | Monday 01:00 UTC (Sun 6:00 PM PT) | `0 1 * * 1` |
| Energy Transition | Monday 01:00 UTC | `0 1 * * 1` |
| Healthcare AI | Monday 01:00 UTC | `0 1 * * 1` |
| Defense & Reshoring | Monday 01:00 UTC | `0 1 * * 1` |

**Production:** Vercel Cron Jobs call `/api/cron?theme=<slug>` on schedule (defined in `vercel.json`).

**Local dev:** Run `npm run cron:local` in a separate terminal alongside `npm run dev`.

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

## Design

**Starry Blue** dark theme — navy background (#0a1628), gold accent (#FFD43B), bilingual zh-CN/en-US.

Fonts: DM Serif Display (headings), Instrument Sans (English body), Noto Sans SC (Chinese), JetBrains Mono (data).
