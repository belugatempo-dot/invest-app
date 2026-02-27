import { db } from "./db";
import { themes } from "./schema";
import { themePresets } from "./themes";

async function seed() {
  console.log("Seeding theme presets...");

  for (const preset of themePresets) {
    await db
      .insert(themes)
      .values({
        id: preset.id,
        nameZh: preset.nameZh,
        nameEn: preset.nameEn,
        market: preset.market,
        sectors: preset.sectors,
        filters: preset.filters,
        schedule: preset.schedule,
      })
      .onConflictDoUpdate({
        target: themes.id,
        set: {
          nameZh: preset.nameZh,
          nameEn: preset.nameEn,
          market: preset.market,
          sectors: preset.sectors,
          filters: preset.filters,
          schedule: preset.schedule,
        },
      })
      .run();
  }

  console.log(`Seeded ${themePresets.length} themes.`);
}

seed().catch(console.error);
