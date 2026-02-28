# invest-app — 投资信号仪表盘 | Investment Signal Dashboard

**线上地址 / Live:** https://invest.beluga-tempo.com

[中文](#中文) | [English](#english)

---

## 中文

一个中英双语投资分析平台，通过 TradingView 筛选美股和 A 股，基于 8 维信号矩阵打分，输出可执行的 买入/持有/卖出 决策，以暗色主题交互式仪表盘呈现。

### 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Next.js 16, React 19, TypeScript 5 |
| 数据库 | libSQL / Turso (@libsql/client + Drizzle ORM) |
| 样式 | Tailwind CSS v4, shadcn/ui (New York), Starry Blue 主题 |
| 图表 | Recharts, lightweight-charts v5 |
| 定时任务 | Vercel Cron（生产）/ 本地脚本（开发）|
| 数据源 | TradingView scan API（直接 HTTP，无需认证）|
| AI 研报 | Vercel AI SDK（Anthropic、OpenAI、DeepSeek），本地开发自动 fallback 到 `claude -p` CLI |
| 测试 | Vitest v4（124 个单元测试）+ Playwright（37 个 E2E 测试）|

### 页面

| 路由 | 名称 | 描述 |
|------|------|------|
| `/` | 决策面板 | 信号矩阵热力图，可排序股票卡片，点击进入详情 |
| `/screens` | 主题筛选 | 10 个投资主题卡片（5 美股 + 5 A 股），一键筛选 |
| `/dashboard` | 仪表盘 | 信号矩阵概览（替代视图）|
| `/stock/[ticker]` | 个股深研 | 价格图表、信号拆解、AI 研报、决策记录 |
| `/history` | 历史追踪 | 筛选运行时间线、信号演变、决策日志 |

### 信号矩阵

每只股票按 8 个维度打分（每维 -1 / 0 / +1，总分范围 -8 至 +8）：

| 维度 | +1（看多）| 0（中性）| -1（看空）|
|------|----------|---------|----------|
| 估值 | P/E < 行业中位数 | 中位数 ±20% 内 | P/E > 75 分位 |
| 增长 | 营收增长 > 15% | 5–15% | < 5% |
| 利润率 | 毛利率 > 40% 且 FCF > 0 | 毛利率 20–40% | 毛利率 < 20% 或 FCF < 0 |
| 趋势 | 收盘价 > SMA200，SMA50 > SMA200 | 交叉区域 | 收盘价 < SMA200 |
| 动量 | RSI 35–55（逢低买入区）| RSI 40–60 | RSI > 70 且接近 52 周高点 |
| 形态 | ADX > 25，距 52 周高点 10% 内 | ADX 15–25 | ADX < 15 |
| 催化剂 | 财报 < 30 天 | > 60 天 | 二元事件风险 |
| 情绪 | Reddit（美股）/ 雪球（A 股）提及排名高且上升 | 适度提及 | 提及低或下降 |

**评级：** +6 至 +8 = 强烈买入，+4 至 +5 = 买入，+1 至 +3 = 倾向买入，-1 至 0 = 持有，-2 至 -3 = 卖出，-4 至 -8 = 强烈卖出

### 主题筛选预设

| 主题 | 行业 | 关键筛选条件 |
|------|------|------------|
| AI 基础设施 | 半导体、云计算、数据中心 | 营收增长 > 12%，毛利率 > 40%，市值 > $5B |
| 机器人与自动化 | 工业机械、半导体设备 | 营收增长 > 8%，ROE > 10%，市值 > $2B |
| 能源转型 | 太阳能、可再生能源、电气设备 | 营收增长 > 5%，FCF 利润率 > 0%，市值 > $1B |
| 医疗 AI | 医疗科技、健康 IT、诊断 | 研发 > 10%，营收增长 > 10% |
| 国防与回流 | 航空航天、特种化工 | 营收增长 > 5% |
| **A 股 AI 算力** | 半导体、云计算、数据中心 | 营收增长 > 15%，毛利率 > 25%，市值 > ¥200 亿 |
| **新能源车产业链** | 电动车、电池、汽车零部件 | 营收增长 > 10%，市值 > ¥100 亿 |
| **消费白马** | 消费必需品、耐用消费品、饮料 | 毛利率 > 30%，ROE > 15%，市值 > ¥500 亿 |
| **高股息红利** | 银行、公用事业、能源 | 股息率 > 3%，营业利润率 > 10%，市值 > ¥500 亿 |
| **半导体国产替代** | 半导体、芯片设计、代工 | 营收增长 > 10%，市值 > ¥100 亿 |

### 快速开始

#### 前置要求

- Node.js >= 20
- npm

#### 安装

```bash
npm install
npm run db:push    # 创建数据库表结构
npm run db:seed    # 插入 10 个主题预设（5 美股 + 5 A 股）
```

#### 运行

```bash
# 开发模式（无定时任务）
npm run dev

# 开发模式 + 定时任务（在另一个终端运行）
npm run cron:local

# 生产模式
npm run build && npm run start
```

应用运行在 **http://localhost:8888**。

#### 测试

```bash
# 单元测试
npm run test                # 运行全部 124 个单元测试
npm run test -- --coverage  # 带覆盖率报告

# E2E 测试（Playwright）
npm run test:e2e            # 运行 35 个 E2E 测试（自动启动 dev server）
npm run test:e2e:ui         # Playwright 交互式 UI 模式
npm run test:e2e:smoke      # 2 个冒烟测试（需联网，调用真实 TradingView API）
```

124 个单元测试覆盖 `lib/signal-scorer.ts`（100% 覆盖率）、`lib/llm.ts`、`lib/reddit-sentiment.ts`、`lib/sentiment.ts`、`lib/xueqiu-sentiment.ts`、`lib/db-operations.ts` 和 `proxy.ts`。

37 个 E2E 测试覆盖全部 7 个 API 路由（错误路径、CRUD、评分流水线）和 5 个页面（导航、筛选、面板、历史、个股详情），使用隔离的 `data/test.db`。

### 环境变量

参见 `.env.example`，复制为 `.env.local` 并填入值。

| 变量 | 必填 | 用途 |
|------|------|------|
| `DATABASE_URL` | 仅生产 | Turso 数据库 URL（`libsql://...`）|
| `DATABASE_AUTH_TOKEN` | 仅生产 | Turso 认证令牌 |
| `LLM_PROVIDER` | 否 | `anthropic`、`openai` 或 `deepseek` |
| `LLM_API_KEY` | 否 | LLM 提供商 API 密钥 |
| `LLM_MODEL` | 否 | 覆盖默认模型 |
| `AUTH_TOKEN` | 否 | 访问控制 Bearer 令牌 |
| `CRON_SECRET` | 自动 | Vercel 自动设置，用于 cron 安全 |

未设置 `DATABASE_URL` 时使用本地 SQLite 文件（`./data/invest.db`）。

未设置 `LLM_PROVIDER`/`LLM_API_KEY` 时，自动 fallback 到 `claude -p` CLI（需安装 Claude Code CLI）。CLI 也不可用时返回 503。

### 认证

通过 `AUTH_TOKEN` 环境变量启用可选的 Bearer 令牌认证。设置后，所有请求必须通过以下方式携带令牌：

- `Authorization: Bearer <token>` 请求头，或
- `?token=<token>` 查询参数

未设置 `AUTH_TOKEN` 时，开放访问（无需认证）。

### 项目结构

```
invest-app/
├── app/                        # Next.js App Router
│   ├── layout.tsx              # 根布局（Starry Blue 主题、字体）
│   ├── page.tsx                # 决策面板（信号矩阵概览）
│   ├── dashboard/              # 仪表盘（替代视图）
│   ├── dashboard-client.tsx    # 仪表盘客户端组件
│   ├── screens/                # 主题筛选 UI
│   ├── stock/[ticker]/         # 个股详情
│   ├── history/                # 历史记录与决策日志
│   └── api/
│       ├── screen/             # GET — 运行主题筛选
│       ├── analyze/            # POST — 对提交的股票打分
│       ├── thesis/             # POST — AI 生成投资研报
│       ├── cron/               # GET — 定时任务端点
│       ├── events/             # GET — SSE 实时更新
│       ├── history/            # GET — 历史数据
│       ├── watchlist/          # GET/POST — 自选股管理
│       └── push/               # POST — CLI 工作流数据接入
├── components/                 # React 组件
│   ├── sidebar.tsx             # 导航侧栏
│   ├── signal-matrix.tsx       # 8 维信号网格
│   ├── stock-card.tsx          # 股票概要卡片
│   ├── stock-detail-sheet.tsx  # 详情底部弹出层
│   ├── price-chart.tsx         # lightweight-charts K 线图
│   ├── thesis-panel.tsx        # AI 研报展示
│   ├── decision-journal.tsx    # 买入/卖出/持有记录
│   ├── rating-tooltip.tsx      # 评级提示气泡
│   ├── signal-history.tsx      # 信号历史趋势
│   ├── star-button.tsx         # 自选股收藏按钮
│   ├── theme-card.tsx          # 主题预设卡片
│   ├── watchlist-section.tsx   # 自选股管理区域
│   └── ui/                     # shadcn/ui 基础组件
├── lib/
│   ├── signal-scorer.ts        # 8 维打分（纯函数）
│   ├── signal-scorer.test.ts   # 71 个测试，100% 覆盖率
│   ├── screener.ts             # TradingView scan API 客户端
│   ├── themes.ts               # 10 个主题预设（5 美股 + 5 A 股）
│   ├── schema.ts               # Drizzle ORM 数据表（5 张表）
│   ├── db.ts                   # libSQL/Turso 连接（自动识别本地/云端）
│   ├── db-operations.ts        # 筛选结果持久化逻辑
│   ├── llm.ts                  # LLM 抽象层 — 通过 AI SDK 支持多提供商
│   ├── llm.test.ts             # LLM 单元测试
│   ├── sentiment.ts            # 市场感知情绪路由（美股→Reddit，A股→雪球）
│   ├── sentiment.test.ts       # 情绪路由测试
│   ├── reddit-sentiment.ts     # Reddit 情绪打分
│   ├── reddit-sentiment.test.ts # Reddit 情绪测试
│   ├── xueqiu-sentiment.ts    # 雪球情绪打分（A 股）
│   ├── xueqiu-sentiment.test.ts # 雪球情绪测试
│   ├── db-operations.test.ts   # DB 操作测试
│   ├── sse.ts                  # SSE 事件广播（本地开发）
│   ├── types.ts                # TypeScript 接口定义
│   ├── use-watchlist.ts        # 自选股 React Hook
│   ├── seed.ts                 # 数据库种子脚本
│   └── utils.ts                # Tailwind cn() 工具函数
├── e2e/                        # Playwright E2E 测试
│   ├── global-setup.ts         # 创建 test.db、推送 schema、种子数据
│   ├── global-teardown.ts      # 删除 test.db
│   ├── fixtures/               # 测试数据、Mock 响应、路由拦截器
│   ├── api/                    # API 集成测试（7 文件，20 个测试）
│   ├── pages/                  # 页面 E2E 测试（5 文件，15 个测试）
│   └── smoke/                  # 冒烟测试（真实 TradingView API）
├── scripts/
│   └── cron-local.ts           # 本地定时任务调度器
├── drizzle/                    # 数据库迁移元数据
├── data/                       # SQLite 数据库（已 gitignore）
├── proxy.ts                    # 可选 Bearer 令牌认证
├── proxy.test.ts               # 认证代理测试
├── playwright.config.ts        # Playwright E2E 配置
├── vercel.json                 # Vercel Cron 任务定义
├── .env.example                # 环境变量模板
├── vitest.config.ts            # 单元测试配置
├── drizzle.config.ts           # ORM 配置
└── package.json
```

### 数据库表结构

由 Drizzle ORM 管理的 5 张表：

- **themes** — 投资主题定义（行业、筛选条件、定时计划）
- **screenRuns** — 筛选执行日志（主题、来源、时间戳、数量）
- **stockSnapshots** — 股票时序数据（价格、基本面、技术面、信号评分）
- **watchlist** — 用户自选股（含成本基础）
- **decisions** — 投资决策日志（操作、入场/目标/止损、研报、结果）

### 定时任务

| 主题 | 时间（UTC）| Cron 表达式 |
|------|-----------|------------|
| AI 基础设施 | 周一至五 13:30 UTC（太平洋时间 6:30 AM）| `30 13 * * 1-5` |
| 机器人与自动化 | 周一 01:00 UTC（周日太平洋时间 6:00 PM）| `0 1 * * 1` |
| 能源转型 | 周一 01:00 UTC | `0 1 * * 1` |
| 医疗 AI | 周一 01:00 UTC | `0 1 * * 1` |
| 国防与回流 | 周一 01:00 UTC | `0 1 * * 1` |
| A 股 AI 算力 | 周一至五 07:30 UTC（北京时间 15:30）| `30 7 * * 1-5` |
| 半导体国产替代 | 周一至五 07:30 UTC（北京时间 15:30）| `30 7 * * 1-5` |
| 新能源车产业链 | 周五 08:00 UTC（北京时间 16:00）| `0 8 * * 5` |
| 消费白马 | 周五 08:00 UTC（北京时间 16:00）| `0 8 * * 5` |
| 高股息红利 | 周五 08:00 UTC（北京时间 16:00）| `0 8 * * 5` |

**生产环境：** Vercel Cron Jobs 按计划调用 `/api/cron?theme=<slug>`（定义在 `vercel.json`）。

**本地开发：** 在另一个终端运行 `npm run cron:local`。

### 部署

#### 生产环境（已上线）

- **地址:** https://invest.beluga-tempo.com
- **平台:** Vercel（iad1 — 美国东部）
- **数据库:** Turso `invest-db`（aws-us-east-1 — 弗吉尼亚）
- **认证:** 需要 Bearer 令牌（`AUTH_TOKEN` 环境变量，64 位 hex 随机字符串）
- **环境变量:** 全部存储在 Vercel 加密环境变量中，不在代码里

```bash
vercel --prod   # 部署并自动绑定 invest.beluga-tempo.com
```

#### 本地开发

```bash
npm install && npm run db:push && npm run db:seed && npm run dev
```

未设置 `DATABASE_URL` 时使用本地 SQLite（`./data/invest.db`）。

#### Turso 数据库管理

```bash
turso db shell invest-db              # 交互式 SQL 终端
turso db show invest-db               # 查看数据库信息
turso db tokens create invest-db      # 轮换认证令牌
```

### 设计

**Starry Blue** 暗色主题 — 深蓝背景 (#0a1628)，金色强调 (#FFD43B)，中英双语。

字体：DM Serif Display（标题）、Instrument Sans（英文正文）、Noto Sans SC（中文）、JetBrains Mono（数据）。

---

## English

A bilingual (Chinese/English) investment analysis platform that screens US and A-share stocks via TradingView, scores them on an 8-dimension signal matrix, and presents actionable BUY/HOLD/SELL decisions through an interactive dark-themed dashboard.

### Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16, React 19, TypeScript 5 |
| Database | libSQL / Turso (@libsql/client + Drizzle ORM) |
| Styling | Tailwind CSS v4, shadcn/ui (New York), Starry Blue theme |
| Charts | Recharts, lightweight-charts v5 |
| Scheduling | Vercel Cron (production), local script (dev) |
| Data Source | TradingView scan API (direct HTTP, no auth) |
| AI Thesis | Vercel AI SDK (Anthropic, OpenAI, DeepSeek); falls back to `claude -p` CLI for local dev |
| Testing | Vitest v4 (124 unit tests) + Playwright (37 E2E tests) |

### Views

| Route | Name | Description |
|-------|------|-------------|
| `/` | Dashboard | Signal matrix heatmap, sortable stock cards, click-through to detail |
| `/screens` | Screens | 10 investment theme cards (5 US + 5 A-share) with one-click screening |
| `/dashboard` | Dashboard | Signal matrix overview (alternate view) |
| `/stock/[ticker]` | Stock Detail | Price chart, signal breakdown, AI thesis, decision recording |
| `/history` | History | Screening run timeline, signal evolution, decision journal |

### Signal Matrix

Each stock is scored across 8 dimensions (-1 / 0 / +1 each, total range -8 to +8):

| Dimension | +1 (Bullish) | 0 (Neutral) | -1 (Bearish) |
|-----------|-------------|-------------|--------------|
| Valuation | P/E < sector median | Within ±20% of median | P/E > 75th percentile |
| Growth | Revenue growth > 15% | 5–15% | < 5% |
| Margins | Gross > 40% & FCF > 0 | Gross 20–40% | Gross < 20% or FCF < 0 |
| Trend | Close > SMA200, SMA50 > SMA200 | Crossover zone | Close < SMA200 |
| Momentum | RSI 35–55 (dip buy zone) | RSI 40–60 | RSI > 70 near 52w high |
| Pattern | ADX > 25, within 10% of 52w high | ADX 15–25 | ADX < 15 |
| Catalyst | Earnings < 30 days | > 60 days | Binary event risk |
| Sentiment | Reddit (US) / Xueqiu (A-shares) mentions rank high & rising | Moderate mentions | Low or declining mentions |

**Rating scale:** +6 to +8 = Strong Buy, +4 to +5 = Buy, +1 to +3 = Lean Buy, -1 to 0 = Hold, -2 to -3 = Sell, -4 to -8 = Strong Sell.

### Themed Screening Presets

| Theme | Sectors | Key Filters |
|-------|---------|-------------|
| AI Infrastructure | Semiconductors, Cloud, Data Centers | Rev Growth > 12%, Gross Margin > 40%, MCap > $5B |
| Robotics & Automation | Industrial Machinery, Semi Equipment | Rev Growth > 8%, ROE > 10%, MCap > $2B |
| Energy Transition | Solar, Renewables, Electrical Equipment | Rev Growth > 5%, FCF Margin > 0%, MCap > $1B |
| Healthcare AI | MedTech, Health IT, Diagnostics | R&D > 10%, Rev Growth > 10% |
| Defense & Reshoring | Aerospace, Specialty Chemicals | Rev Growth > 5% |
| **A-Share AI Computing** | Semiconductors, Cloud, Data Centers | Rev Growth > 15%, Gross Margin > 25%, MCap > ¥20B |
| **A-Share New Energy Vehicle** | EV, Batteries, Auto Parts | Rev Growth > 10%, MCap > ¥10B |
| **A-Share Consumer Leaders** | Consumer Staples, Durables, Beverages | Gross Margin > 30%, ROE > 15%, MCap > ¥50B |
| **A-Share High Dividend** | Banks, Utilities, Energy | Div Yield > 3%, Op Margin > 10%, MCap > ¥50B |
| **A-Share Semiconductor** | Semiconductors, Chip Design, Foundry | Rev Growth > 10%, MCap > ¥10B |

### Getting Started

#### Prerequisites

- Node.js >= 20
- npm

#### Install & Setup

```bash
npm install
npm run db:push    # Create database schema
npm run db:seed    # Insert 10 theme presets (5 US + 5 A-share)
```

#### Run

```bash
# Development (no cron)
npm run dev

# Development with cron scheduling (run in a separate terminal)
npm run cron:local

# Production
npm run build && npm run start
```

The app runs at **http://localhost:8888**.

#### Test

```bash
# Unit tests
npm run test                # Run all 124 unit tests
npm run test -- --coverage  # With coverage report

# E2E tests (Playwright)
npm run test:e2e            # Run 35 E2E tests (auto-starts dev server)
npm run test:e2e:ui         # Playwright interactive UI mode
npm run test:e2e:smoke      # 2 smoke tests (requires internet, hits real TradingView API)
```

124 unit tests covering `lib/signal-scorer.ts` (100% coverage), `lib/llm.ts`, `lib/reddit-sentiment.ts`, `lib/sentiment.ts`, `lib/xueqiu-sentiment.ts`, `lib/db-operations.ts`, and `proxy.ts`.

37 E2E tests covering all 7 API routes (error paths, CRUD, scoring pipeline) and 5 pages (navigation, screens, dashboard, history, stock detail), using an isolated `data/test.db`.

### Environment Variables

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

When `LLM_PROVIDER`/`LLM_API_KEY` are not set, the app falls back to `claude -p` CLI (requires Claude Code CLI installed). Returns 503 only when both API and CLI are unavailable.

### Authentication

Optional bearer token auth via the `AUTH_TOKEN` environment variable. When set, all requests must include the token via:

- `Authorization: Bearer <token>` header, or
- `?token=<token>` query parameter

When `AUTH_TOKEN` is not set, access is open (no authentication required).

### Project Structure

```
invest-app/
├── app/                        # Next.js App Router
│   ├── layout.tsx              # Root layout (Starry Blue theme, fonts)
│   ├── page.tsx                # Dashboard (signal matrix overview)
│   ├── dashboard/              # Dashboard (alternate view)
│   ├── dashboard-client.tsx    # Dashboard client component
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
│   ├── rating-tooltip.tsx      # Rating tooltip popup
│   ├── signal-history.tsx      # Signal history trends
│   ├── star-button.tsx         # Watchlist star button
│   ├── theme-card.tsx          # Theme preset card
│   ├── watchlist-section.tsx   # Watchlist management section
│   └── ui/                     # shadcn/ui primitives
├── lib/
│   ├── signal-scorer.ts        # 8-dimension scoring (pure functions)
│   ├── signal-scorer.test.ts   # 71 tests, 100% coverage
│   ├── screener.ts             # TradingView scan API client
│   ├── themes.ts               # 10 theme presets (5 US + 5 A-share)
│   ├── schema.ts               # Drizzle ORM schema (5 tables)
│   ├── db.ts                   # libSQL/Turso connection (auto-detects local vs cloud)
│   ├── db-operations.ts        # Shared persist logic for screen results
│   ├── llm.ts                  # LLM abstraction — Anthropic/OpenAI/DeepSeek via AI SDK
│   ├── llm.test.ts             # LLM unit tests
│   ├── sentiment.ts            # Market-aware sentiment router (US→Reddit, A-shares→Xueqiu)
│   ├── sentiment.test.ts       # Sentiment router tests
│   ├── reddit-sentiment.ts     # Reddit sentiment scoring
│   ├── reddit-sentiment.test.ts # Reddit sentiment tests
│   ├── xueqiu-sentiment.ts    # Xueqiu (雪球) sentiment (A-shares)
│   ├── xueqiu-sentiment.test.ts # Xueqiu sentiment tests
│   ├── db-operations.test.ts   # DB operations tests
│   ├── sse.ts                  # SSE broadcaster (local dev)
│   ├── types.ts                # TypeScript interfaces
│   ├── use-watchlist.ts        # Watchlist React hook
│   ├── seed.ts                 # DB seed script
│   └── utils.ts                # Tailwind cn() helper
├── e2e/                        # Playwright E2E tests
│   ├── global-setup.ts         # Create test.db, push schema, seed data
│   ├── global-teardown.ts      # Delete test.db
│   ├── fixtures/               # Test data, mock responses, route interceptors
│   ├── api/                    # API integration tests (7 files, 20 tests)
│   ├── pages/                  # Page E2E tests (5 files, 15 tests)
│   └── smoke/                  # Smoke tests (real TradingView API)
├── scripts/
│   └── cron-local.ts           # Local cron scheduler
├── drizzle/                    # Migration metadata
├── data/                       # SQLite database (gitignored)
├── proxy.ts                    # Optional bearer token auth
├── proxy.test.ts               # Auth proxy tests
├── playwright.config.ts        # Playwright E2E configuration
├── vercel.json                 # Vercel Cron job definitions
├── .env.example                # Environment variable template
├── vitest.config.ts            # Unit test configuration
├── drizzle.config.ts           # ORM configuration
└── package.json
```

### Database Schema

5 tables managed by Drizzle ORM:

- **themes** — Investment theme definitions (sectors, filters, cron schedule)
- **screenRuns** — Screening execution log (theme, source, timestamp, count)
- **stockSnapshots** — Time-series stock data (price, fundamentals, technicals, signal scores)
- **watchlist** — User-tracked tickers with cost basis
- **decisions** — Investment decision journal (action, entry/target/stop, thesis, outcome)

### Cron Schedule

| Theme | Schedule (UTC) | Vercel Cron |
|-------|---------------|-------------|
| AI Infrastructure | Mon–Fri 13:30 UTC (6:30 AM PT) | `30 13 * * 1-5` |
| Robotics & Automation | Monday 01:00 UTC (Sun 6:00 PM PT) | `0 1 * * 1` |
| Energy Transition | Monday 01:00 UTC | `0 1 * * 1` |
| Healthcare AI | Monday 01:00 UTC | `0 1 * * 1` |
| Defense & Reshoring | Monday 01:00 UTC | `0 1 * * 1` |
| A-Share AI Computing | Mon–Fri 07:30 UTC (3:30 PM CST) | `30 7 * * 1-5` |
| A-Share Semiconductor | Mon–Fri 07:30 UTC (3:30 PM CST) | `30 7 * * 1-5` |
| A-Share New Energy Vehicle | Friday 08:00 UTC (4:00 PM CST) | `0 8 * * 5` |
| A-Share Consumer Leaders | Friday 08:00 UTC (4:00 PM CST) | `0 8 * * 5` |
| A-Share High Dividend | Friday 08:00 UTC (4:00 PM CST) | `0 8 * * 5` |

**Production:** Vercel Cron Jobs call `/api/cron?theme=<slug>` on schedule (defined in `vercel.json`).

**Local dev:** Run `npm run cron:local` in a separate terminal alongside `npm run dev`.

### Deployment

#### Production (Live)

- **URL:** https://invest.beluga-tempo.com
- **Platform:** Vercel (iad1 — US East)
- **Database:** Turso `invest-db` (aws-us-east-1 — Virginia)
- **Auth:** Bearer token required (`AUTH_TOKEN` env var, 64-char hex)
- **Env vars:** All stored in Vercel encrypted environment variables, not in code

```bash
vercel --prod   # Deploy and alias to invest.beluga-tempo.com
```

#### Local Dev

```bash
npm install && npm run db:push && npm run db:seed && npm run dev
```

Uses local SQLite (`./data/invest.db`) when `DATABASE_URL` is not set.

#### Turso DB Management

```bash
turso db shell invest-db              # Interactive SQL shell
turso db show invest-db               # View database info
turso db tokens create invest-db      # Rotate auth token
```

### Design

**Starry Blue** dark theme — navy background (#0a1628), gold accent (#FFD43B), bilingual zh-CN/en-US.

Fonts: DM Serif Display (headings), Instrument Sans (English body), Noto Sans SC (Chinese), JetBrains Mono (data).

## License

[MIT](LICENSE)
