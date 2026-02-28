import { execSync } from "child_process";
import { createClient } from "@libsql/client";
import { TEST_THEMES } from "./fixtures/db-seed";

export default async function globalSetup() {
  console.log("[E2E] Pushing schema to test.db...");
  execSync("npx drizzle-kit push --force", {
    env: { ...process.env, DATABASE_URL: "file:./data/test.db" },
    stdio: "pipe",
  });

  console.log("[E2E] Seeding test themes...");
  const client = createClient({ url: "file:./data/test.db" });

  for (const theme of TEST_THEMES) {
    await client.execute({
      sql: `INSERT OR REPLACE INTO themes (id, name_zh, name_en, market, sectors, filters, schedule)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        theme.id,
        theme.nameZh,
        theme.nameEn,
        theme.market,
        JSON.stringify(theme.sectors),
        JSON.stringify(theme.filters),
        theme.schedule ?? null,
      ],
    });
  }

  client.close();
  console.log(`[E2E] Seeded ${TEST_THEMES.length} test themes.`);
}
