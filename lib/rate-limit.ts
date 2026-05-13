const bucket = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string) {
  const max = Number(process.env.RATE_LIMIT_MAX || 60);
  const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000);
  const now = Date.now();
  const current = bucket.get(key);

  if (!current || current.resetAt < now) {
    bucket.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: max - 1 };
  }

  if (current.count >= max) return { allowed: false, remaining: 0 };
  current.count += 1;
  return { allowed: true, remaining: max - current.count };
}
