import { defineConfig } from "drizzle-kit";
import { loadEnvLocal } from "./scripts/env";

loadEnvLocal();

// Schema changes should go through the unpooled connection.
const url =
  process.env.DATABASE_URL_UNPOOLED ??
  process.env.POSTGRES_URL_NON_POOLING ??
  process.env.DATABASE_URL;

if (!url) {
  throw new Error("DATABASE_URL is not set — run `vercel env pull .env.local --yes` first.");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url },
});
