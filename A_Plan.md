# invest-app 接入 A 股市场 — 实施计划与记录

## 背景

invest-app 原先硬编码 `markets: ["america"]`，仅支持美股。经验证 TradingView screener API 完全支持 A 股（`markets: ["china"]`），SSE/SZSE 数据齐全：PE、营收增长、毛利率、RSI、SMA、ADX、52 周高低等字段均可用。行业分类使用与美股相同的 TradingView 体系（"Electronic Technology"、"Finance" 等）。

**目标**：让 invest-app 同时支持美股和 A 股筛选，并新增 5 个 A 股主题筛选策略。

---

## 改动总览

| 文件 | 改动 |
|------|------|
| `lib/types.ts` | `RawStockData` 加 `market` 字段 |
| `lib/themes.ts` | `ThemePreset` 加 `market` 字段；新增 5 个 A 股主题 |
| `lib/screener.ts` | `runScreen()` 接受 `market` 参数，动态拼接 API URL |
| `lib/signal-scorer.ts` | `calculateLevels()` 支持 ¥ 货币符号 |
| `lib/schema.ts` | `themes` 表加 `market` 列 |
| `lib/seed.ts` | 种子数据包含新 A 股主题 |
| `app/api/screen/route.ts` | 从 theme 读取 market 传给 screener |
| `server.ts` | 新增 A 股 cron 任务（北京时间收盘后） |
| `lib/signal-scorer.test.ts` | 新增 market/currency 相关测试用例 |

---

## Step 1: RawStockData 加 market 字段

**文件**: `lib/types.ts`

在 `RawStockData` 接口中新增：

```typescript
market?: "america" | "china";
```

放在 `sector` 之后。评分逻辑已是 screen-relative，不依赖具体市场，因此 `SignalScores`、`ScoredStock` 等类型无需改动。

---

## Step 2: ThemePreset 加 market 字段 + 5 个 A 股主题

**文件**: `lib/themes.ts`

### 2.1 接口变更

```typescript
export interface ThemePreset {
  id: string;
  nameZh: string;
  nameEn: string;
  market: "america" | "china";  // 新增
  sectors: string[];
  filters: Record<string, unknown>[];
  schedule: string | null;
}
```

### 2.2 现有美股主题

所有 5 个现有主题加 `market: "america"`。

### 2.3 新增 A 股主题

| ID | 中文名 | 行业 (TradingView) | 关键筛选条件 |
|----|--------|-------------------|-------------|
| `a-ai-computing` | AI 算力 | Electronic Technology, Technology Services | 市值>200亿, 营收增长>15%, 毛利率>25% |
| `a-new-energy` | 新能源车产业链 | Producer Manufacturing, Electronic Technology | 市值>100亿, 营收增长>10% |
| `a-consumer-leaders` | 消费白马 | Consumer Non-Durables, Consumer Durables | 市值>500亿, 毛利率>30%, ROE>15% |
| `a-high-dividend` | 高股息红利 | Finance, Utilities, Energy Minerals | 市值>500亿, 股息率>3%, 营业利润率>10% |
| `a-semiconductor` | 半导体国产替代 | Electronic Technology | 市值>100亿, 营收增长>10% |

**注意**：A 股银行 `gross_margin_ttm` 为 null，高股息主题改用 `dividend_yield_recent` + `operating_margin_ttm` 替代。

---

## Step 3: screener.ts 支持多市场

**文件**: `lib/screener.ts`

### 3.1 URL 参数化

原先硬编码：
```typescript
const SCAN_URL = "https://scanner.tradingview.com/america/scan";
```

改为动态函数：
```typescript
function getScanUrl(market: string): string {
  return `https://scanner.tradingview.com/${market}/scan`;
}
```

### 3.2 runScreen 加 market 参数

```typescript
export async function runScreen(
  filters: Record<string, unknown>[],
  limit: number = 25,
  market: "america" | "china" = "america",  // 新增，默认美股
): Promise<RawStockData[]>
```

请求体的 `markets` 数组和 fetch URL 都使用传入的 market 值。

### 3.3 mapRow 传递 market

```typescript
function mapRow(symbol: string, d: unknown[], market: "america" | "china"): RawStockData
```

将 market 附加到返回的 `RawStockData` 对象上。

---

## Step 4: 货币符号适配

**文件**: `lib/signal-scorer.ts` → `calculateLevels()`

```typescript
const currency = stock.market === "china" ? "¥" : "$";
```

entry/target/stop 输出格式从 `$xxx.xx` 变为 `${currency}xxx.xx`。

评分逻辑（`scoreValuation`、`scoreGrowth` 等）已经是相对评分（screen-relative），**不需要改动**。

---

## Step 5: schema.ts 加 market 列

**文件**: `lib/schema.ts`

themes 表新增一列：
```typescript
market: text("market").notNull().default("america"),
```

使用 `db:push` 直接推送 schema 变更，现有数据自动获得默认值 `"america"`。

---

## Step 6: seed.ts 更新种子数据

**文件**: `lib/seed.ts`

`insert` 和 `onConflictDoUpdate` 的 `values`/`set` 中均加入 `market: preset.market`。

执行后 seed 输出：`Seeded 10 themes.`（5 美股 + 5 A 股）。

---

## Step 7: API route 传递 market

**文件**: `app/api/screen/route.ts`

从数据库 theme 记录读取 market 字段并传递给 screener：

```typescript
const market = (theme.market ?? "america") as "america" | "china";
const rawStocks = await runScreen(
  theme.filters as Record<string, unknown>[],
  25,
  market,
);
```

Reddit sentiment 对 A 股不可用——已有的 `scoreSentiment` 在数据为 null 时返回 0，无需额外处理。

---

## Step 8: cron 时间调整

**文件**: `server.ts`

A 股收盘时间为北京时间 15:00（UTC 07:00）。新增两条 cron：

```typescript
// A 股日频筛选：工作日 15:30 北京时间（07:30 UTC）
cron.schedule("30 7 * * 1-5", () => {
  runScheduledScreen("a-ai-computing", "AI 算力");
  runScheduledScreen("a-semiconductor", "半导体国产替代");
});

// A 股周频筛选：周五 16:00 北京时间（08:00 UTC）
cron.schedule("0 8 * * 5", () => {
  runScheduledScreen("a-new-energy", "新能源车产业链");
  runScheduledScreen("a-consumer-leaders", "消费白马");
  runScheduledScreen("a-high-dividend", "高股息红利");
});
```

---

## Step 9: 测试

### 新增测试用例 (`lib/signal-scorer.test.ts`)

| 测试 | 描述 |
|------|------|
| `should use $ prefix when market is 'america'` | 验证美股返回 `$` 前缀 |
| `should use ¥ prefix when market is 'china'` | 验证 A 股返回 `¥` 前缀，target 为 `¥2000.00` |
| `should default to $ prefix when market is undefined` | 验证 market 缺失时默认 `$` |

### 测试结果

```
✓ lib/reddit-sentiment.test.ts (9 tests)
✓ lib/signal-scorer.test.ts (71 tests)

Test Files  2 passed (2)
     Tests  80 passed (80)

Coverage:
  signal-scorer.ts  99.05% Stmts | 100% Branch | 100% Funcs | 98.68% Lines
```

### 手动验证步骤

1. `npm run db:push && npm run db:seed` → 确认输出 `Seeded 10 themes.`
2. `npm run dev` 启动 → 访问 screens 页面 → 看到 A 股主题卡片
3. 点击 A 股主题运行筛选 → 返回 SSE/SZSE 股票数据，价格显示 ¥
4. 信号评分正常工作（相对评分，不依赖市场）

---

## 不需要改动的部分

| 模块 | 原因 |
|------|------|
| `signal-scorer.ts` 的评分函数 | screen-relative，对任何市场通用 |
| UI 组件（ThemeCard 等） | 主题名本身区分市场，无需额外标注 |
| `watchlist` / `decisions` 表 | ticker 字段已包含交易所信息 |
| Reddit sentiment | null 时自动返回 0，A 股无影响 |

---

## 关键设计决策

1. **market 字段绑定在 theme 上**，而非全局配置。每个主题自带市场属性，筛选时自动路由到正确的 TradingView API endpoint。
2. **评分逻辑完全复用**。7 维信号矩阵全部是 screen-relative（相对于同一批筛选结果的中位数/百分位），对 A 股和美股同样适用。
3. **高股息主题避开 gross_margin**。A 股银行的 `gross_margin_ttm` 返回 null，改用 `dividend_yield_recent` + `operating_margin_ttm` 组合筛选。
4. **货币符号仅在展示层处理**（`calculateLevels`），不影响任何数值计算。
