#!/usr/bin/env tsx
import cron from "node-cron";

const BASE_URL = `http://localhost:${process.env.PORT ?? 8888}`;

async function runScreen(themeId: string, label: string) {
  console.log(`[CRON] Running: ${label} (${themeId})`);
  try {
    const res = await fetch(`${BASE_URL}/api/cron?theme=${themeId}`);
    const data = await res.json();
    console.log(
      `[CRON] ${label}: ${data.count ?? 0} candidates, runId=${data.runId ?? "N/A"}`,
    );
  } catch (err) {
    console.error(`[CRON] Screen failed for ${label}:`, err);
  }
}

// Daily AI Infrastructure screen at 6:30 AM PT (13:30 UTC), weekdays
cron.schedule("30 13 * * 1-5", () => {
  runScreen("ai-infrastructure", "AI 基础设施");
});

// Weekly screens for other themes — Sunday 6 PM PT (Monday 01:00 UTC)
cron.schedule("0 1 * * 1", () => {
  runScreen("robotics", "机器人与自动化");
  runScreen("energy-transition", "能源转型");
  runScreen("healthcare-ai", "医疗 AI");
  runScreen("defense-reshoring", "国防与回流");
});

console.log("[CRON] Local cron scheduler running.");
console.log("  - AI Infrastructure: Mon-Fri 6:30 AM PT");
console.log("  - Other themes: Sunday 6:00 PM PT");
console.log("Press Ctrl+C to stop.");
