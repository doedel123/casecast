import { createHash } from "node:crypto";
import { headers } from "next/headers";

/**
 * Salted, truncated hash of the caller's IP — used for abuse detection and
 * rate limiting. Plaintext IPs are never persisted.
 */
export async function getRequestMeta() {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  const ip =
    forwarded?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  const ipHash = createHash("sha256")
    .update(`${process.env.AUTH_SECRET ?? "callthecase"}:ip:${ip}`)
    .digest("hex")
    .slice(0, 32);
  const userAgent = (h.get("user-agent") ?? "").slice(0, 250) || null;
  return { ipHash, userAgent };
}
