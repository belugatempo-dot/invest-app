import { defineConfig } from "drizzle-kit";

const isTurso =
  !!process.env.DATABASE_URL &&
  process.env.DATABASE_URL.startsWith("libsql:");

export default defineConfig(
  isTurso
    ? {
        schema: "./lib/schema.ts",
        out: "./drizzle",
        dialect: "turso",
        dbCredentials: {
          url: process.env.DATABASE_URL!,
          authToken: process.env.DATABASE_AUTH_TOKEN,
        },
      }
    : {
        schema: "./lib/schema.ts",
        out: "./drizzle",
        dialect: "sqlite",
        dbCredentials: {
          url: process.env.DATABASE_URL ?? "file:./data/invest.db",
        },
      },
);
