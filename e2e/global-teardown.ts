import fs from "fs";
import path from "path";

export default async function globalTeardown() {
  const dataDir = path.resolve("data");
  const patterns = ["test.db", "test.db-journal", "test.db-wal"];

  for (const name of patterns) {
    const filePath = path.join(dataDir, name);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`[E2E] Deleted ${filePath}`);
    }
  }
}
