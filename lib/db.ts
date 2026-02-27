import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";
import path from "path";
import fs from "fs";

// Local mode: ensure data directory exists for SQLite file
if (!process.env.DATABASE_URL) {
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

const client = createClient({
  url: process.env.DATABASE_URL ?? `file:${path.join(process.cwd(), "data", "invest.db")}`,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });
