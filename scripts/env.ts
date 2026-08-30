import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Minimal .env.local loader for CLI scripts (drizzle-kit / tsx do not load
 * Next.js env files on their own). Existing process env always wins.
 */
export function loadEnvLocal(file = ".env.local") {
  try {
    const content = readFileSync(resolve(process.cwd(), file), "utf8");
    for (const line of content.split("\n")) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!match) continue;
      const key = match[1];
      let value = match[2];
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch {
    // No .env.local — rely on the ambient environment.
  }
}
