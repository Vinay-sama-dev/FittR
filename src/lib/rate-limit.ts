// Sliding-window rate limiter & Account Lockout manager for auth security
interface RateLimitRecord {
  timestamps: number[];
}

interface LockoutRecord {
  failedAttempts: number;
  lockedUntil: number | null;
  lastAttempt: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();
const lockoutMap = new Map<string, LockoutRecord>();

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes lockout
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000; // 15-minute sliding window

// Clean up stale entries every 5 minutes
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

  lockoutMap.forEach((record, key) => {
    if (record.lockedUntil && record.lockedUntil < now) {
      lockoutMap.delete(key);
    } else if (now - record.lastAttempt > ATTEMPT_WINDOW_MS) {
      lockoutMap.delete(key);
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

export function checkAccountLockout(identifier: string): {
  isLocked: boolean;
  remainingMinutes: number;
} {
  const now = Date.now();
  const record = lockoutMap.get(identifier);

  if (!record || !record.lockedUntil) {
    return { isLocked: false, remainingMinutes: 0 };
  }

  if (record.lockedUntil > now) {
    const remainingMinutes = Math.ceil((record.lockedUntil - now) / 60000);
    return { isLocked: true, remainingMinutes };
  }

  // Lockout expired
  lockoutMap.delete(identifier);
  return { isLocked: false, remainingMinutes: 0 };
}

export function recordFailedAttempt(identifier: string): {
  isLocked: boolean;
  attemptsLeft: number;
  remainingMinutes: number;
} {
  const now = Date.now();
  const record = lockoutMap.get(identifier) || {
    failedAttempts: 0,
    lockedUntil: null,
    lastAttempt: now,
  };

  // Reset count if previous attempt was outside sliding window
  if (now - record.lastAttempt > ATTEMPT_WINDOW_MS && !record.lockedUntil) {
    record.failedAttempts = 0;
  }

  record.failedAttempts += 1;
  record.lastAttempt = now;

  if (record.failedAttempts >= MAX_FAILED_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_DURATION_MS;
    lockoutMap.set(identifier, record);
    return {
      isLocked: true,
      attemptsLeft: 0,
      remainingMinutes: Math.ceil(LOCKOUT_DURATION_MS / 60000),
    };
  }

  lockoutMap.set(identifier, record);
  return {
    isLocked: false,
    attemptsLeft: MAX_FAILED_ATTEMPTS - record.failedAttempts,
    remainingMinutes: 0,
  };
}

export function clearFailedAttempts(identifier: string): void {
  lockoutMap.delete(identifier);
}
