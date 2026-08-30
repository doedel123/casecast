import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Lazy init keeps `next build` from crashing when DATABASE_URL is not set yet
// (e.g. first deploy before the integration is provisioned).
let _db: NeonHttpDatabase<typeof schema> | null = null;

export function getDb() {
  if (!_db) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error(
        "DATABASE_URL is not set. Run `vercel env pull .env.local --yes` or configure your Postgres connection.",
      );
    }
    _db = drizzle(neon(url), { schema });
  }
  return _db;
}

export { schema };
