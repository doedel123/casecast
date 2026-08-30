/**
 * In-memory sliding-window rate limiter. Per-instance only — good enough for
 * an MVP on Fluid Compute (instances are reused); swap for Upstash Ratelimit
 * when horizontal scale demands shared state.
 */
const buckets = new Map<string, number[]>();

export function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): boolean {
  const now = Date.now();
  const cutoff = now - windowMs;
  const hits = (buckets.get(key) ?? []).filter((t) => t > cutoff);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    return false;
  }
  hits.push(now);
  buckets.set(key, hits);
  if (buckets.size > 10_000) {
    for (const [k, v] of buckets) {
      if (v.every((t) => t <= cutoff)) buckets.delete(k);
    }
  }
  return true;
}
