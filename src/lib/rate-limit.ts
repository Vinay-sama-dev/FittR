// Sliding-window rate limiter for serverless & edge runtimes
interface RateLimitRecord {
  timestamps: number[];
}

const rateLimitMap = new Map<string, RateLimitRecord>();

// Clean up stale entries every 5 minutes using forEach for broad target compatibility
setInterval(() => {
  const now = Date.now();
  rateLimitMap.forEach((record, key) => {
    const validTimestamps = record.timestamps.filter((t) => now - t < 300000);
    if (validTimestamps.length === 0) {
      rateLimitMap.delete(key);
    } else {
      rateLimitMap.set(key, { timestamps: validTimestamps });
    }
  });
}, 300000);

export function rateLimit(
  identifier: string,
  limit: number = 5,
  windowMs: number = 60000
): { success: boolean; remaining: number; resetMs: number } {
  const now = Date.now();
  const record = rateLimitMap.get(identifier) || { timestamps: [] };

  // Filter timestamps within current window
  const recentTimestamps = record.timestamps.filter((t) => now - t < windowMs);

  if (recentTimestamps.length >= limit) {
    const oldest = recentTimestamps[0];
    const resetMs = Math.max(0, windowMs - (now - oldest));
    return { success: false, remaining: 0, resetMs };
  }

  recentTimestamps.push(now);
  rateLimitMap.set(identifier, { timestamps: recentTimestamps });

  return {
    success: true,
    remaining: limit - recentTimestamps.length,
    resetMs: windowMs,
  };
}
