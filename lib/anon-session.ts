import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { getDb, schema } from "@/lib/db";

const COOKIE_NAME = "cc_sid";
const ONE_YEAR = 60 * 60 * 24 * 365;

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value && process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET must be set in production.");
  }
  return value ?? "casecast-dev-secret";
}

function sign(id: string) {
  return createHmac("sha256", secret()).update(id).digest("base64url").slice(0, 32);
}

export function parseAnonCookie(value: string | undefined | null): string | null {
  if (!value) return null;
  const dot = value.lastIndexOf(".");
  if (dot <= 0) return null;
  const id = value.slice(0, dot);
  const sig = value.slice(dot + 1);
  const expected = sign(id);
  if (sig.length !== expected.length) return null;
  try {
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  } catch {
    return null;
  }
  return id;
}

/** Read-only: safe to call while rendering server components. */
export async function readAnonSessionId(): Promise<string | null> {
  const store = await cookies();
  return parseAnonCookie(store.get(COOKIE_NAME)?.value);
}

/**
 * Get or create the anonymous device session. Sets a signed, httpOnly cookie —
 * therefore only callable from Server Actions or Route Handlers.
 */
export async function ensureAnonSession(meta: {
  ipHash: string | null;
  userAgent: string | null;
}): Promise<string> {
  const store = await cookies();
  const existing = parseAnonCookie(store.get(COOKIE_NAME)?.value);
  const id = existing ?? randomUUID();
  // Row must exist for the votes FK; tolerate a cookie that outlived a DB reset.
  await getDb()
    .insert(schema.anonymousSessions)
    .values({ id, ipHash: meta.ipHash, userAgent: meta.userAgent })
    .onConflictDoNothing();
  if (!existing) {
    store.set(COOKIE_NAME, `${id}.${sign(id)}`, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: ONE_YEAR,
      path: "/",
    });
  }
  return id;
}
