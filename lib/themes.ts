export interface ThemePreset {
  id: string;
  nameZh: string;
  nameEn: string;
  market: "america" | "china";
  sectors: string[];
  filters: Record<string, unknown>[];
  schedule: string | null;
}

// TradingView sector names (not standard GICS):
// Electronic Technology, Technology Services, Health Technology, Health Services,
// Producer Manufacturing, Industrial Services, Non-Energy Minerals, Energy Minerals,
// Process Industries, Distribution Services, Consumer Durables, Consumer Non-Durables, etc.
//
// TradingView stores margins as percentages (0-100), not decimals (0-1).
// Revenue growth is stored as percentage too.

export const themePresets: ThemePreset[] = [
  {
    id: "ai-infrastructure",
    nameZh: "AI 基础设施",
    nameEn: "AI Infrastructure",
    market: "america",
    sectors: ["Semiconductors", "Cloud", "Data Centers", "Networking"],
    filters: [
      { left: "market_cap_basic", operation: "greater", right: 5e9 },
      { left: "sector", operation: "in_range", right: ["Electronic Technology", "Technology Services"] },
      { left: "gross_margin_ttm", operation: "greater", right: 40 },
      { left: "total_revenue_yoy_growth_ttm", operation: "greater", right: 12 },
    ],
    schedule: "30 6 * * 1-5",
  },
  {
    id: "robotics",
    nameZh: "机器人与自动化",
    nameEn: "Robotics & Automation",
    market: "america",
    sectors: ["Industrial Machinery", "Semi Equipment", "Electronic Equipment"],
    filters: [
      { left: "market_cap_basic", operation: "greater", right: 2e9 },
      { left: "sector", operation: "in_range", right: ["Producer Manufacturing", "Electronic Technology"] },
      { left: "total_revenue_yoy_growth_ttm", operation: "greater", right: 8 },
    ],
    schedule: "0 18 * * 0",
  },
  {
    id: "energy-transition",
    nameZh: "能源转型",
    nameEn: "Energy Transition",
    market: "america",
    sectors: ["Solar", "Renewables", "Electrical Equipment"],
    filters: [
      { left: "market_cap_basic", operation: "greater", right: 1e9 },
      { left: "sector", operation: "in_range", right: ["Utilities", "Industrial Services", "Producer Manufacturing"] },
      { left: "total_revenue_yoy_growth_ttm", operation: "greater", right: 5 },
    ],
    schedule: "0 18 * * 0",
  },
  {
    id: "healthcare-ai",
    nameZh: "医疗 AI",
    nameEn: "Healthcare AI",
    market: "america",
    sectors: ["MedTech", "Health IT", "Diagnostics"],
    filters: [
      { left: "market_cap_basic", operation: "greater", right: 1e9 },
      { left: "sector", operation: "in_range", right: ["Health Technology", "Health Services"] },
      { left: "total_revenue_yoy_growth_ttm", operation: "greater", right: 10 },
    ],
    schedule: "0 18 * * 0",
  },
  {
    id: "defense-reshoring",
    nameZh: "国防与回流",
    nameEn: "Defense & Reshoring",
    market: "america",
    sectors: ["Aerospace", "Specialty Chemicals", "Defense"],
    filters: [
      { left: "market_cap_basic", operation: "greater", right: 2e9 },
      { left: "sector", operation: "in_range", right: ["Electronic Technology", "Producer Manufacturing", "Industrial Services"] },
      { left: "total_revenue_yoy_growth_ttm", operation: "greater", right: 5 },
    ],
    schedule: "0 18 * * 0",
  },

  // === A-share (China) themes ===

  {
    id: "a-ai-computing",
    nameZh: "AI 算力",
    nameEn: "A-Share AI Computing",
    market: "china",
    sectors: ["Semiconductors", "Cloud", "Data Centers"],
    filters: [
      { left: "market_cap_basic", operation: "greater", right: 2e10 },
      { left: "sector", operation: "in_range", right: ["Electronic Technology", "Technology Services"] },
      { left: "total_revenue_yoy_growth_ttm", operation: "greater", right: 15 },
      { left: "gross_margin_ttm", operation: "greater", right: 25 },
    ],
    schedule: "30 7 * * 1-5",
  },
  {
    id: "a-new-energy",
    nameZh: "新能源车产业链",
    nameEn: "A-Share New Energy Vehicle",
    market: "china",
    sectors: ["EV", "Batteries", "Auto Parts"],
    filters: [
      { left: "market_cap_basic", operation: "greater", right: 1e10 },
      { left: "sector", operation: "in_range", right: ["Producer Manufacturing", "Electronic Technology"] },
      { left: "total_revenue_yoy_growth_ttm", operation: "greater", right: 10 },
    ],
    schedule: "0 8 * * 5",
  },
  {
    id: "a-consumer-leaders",
    nameZh: "消费白马",
    nameEn: "A-Share Consumer Leaders",
    market: "china",
    sectors: ["Consumer Staples", "Consumer Durables", "Beverages"],
    filters: [
      { left: "market_cap_basic", operation: "greater", right: 5e10 },
      { left: "sector", operation: "in_range", right: ["Consumer Non-Durables", "Consumer Durables"] },
      { left: "gross_margin_ttm", operation: "greater", right: 30 },
      { left: "return_on_equity", operation: "greater", right: 15 },
    ],
    schedule: "0 8 * * 5",
  },
  {
    id: "a-high-dividend",
    nameZh: "高股息红利",
    nameEn: "A-Share High Dividend",
    market: "china",
    sectors: ["Banks", "Utilities", "Energy"],
    filters: [
      { left: "market_cap_basic", operation: "greater", right: 5e10 },
      { left: "sector", operation: "in_range", right: ["Finance", "Utilities", "Energy Minerals"] },
      { left: "dividend_yield_recent", operation: "greater", right: 3 },
      { left: "operating_margin_ttm", operation: "greater", right: 10 },
    ],
    schedule: "0 8 * * 5",
  },
  {
    id: "a-semiconductor",
    nameZh: "半导体国产替代",
    nameEn: "A-Share Semiconductor",
    market: "china",
    sectors: ["Semiconductors", "Chip Design", "Foundry"],
    filters: [
      { left: "market_cap_basic", operation: "greater", right: 1e10 },
      { left: "sector", operation: "in_range", right: ["Electronic Technology"] },
      { left: "total_revenue_yoy_growth_ttm", operation: "greater", right: 10 },
    ],
    schedule: "30 7 * * 1-5",
  },
];
