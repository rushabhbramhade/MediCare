const WINDOW_MS = 60_000; // matches the API's RATE_LIMIT_TTL_MS default
const MAX_KEYS = 10_000;

interface Window {
  count: number;
  resetAt: number;
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

// Per-process fixed window. Supabase still enforces its own OTP limits, but a
// shared store is required to enforce one limit across multiple web replicas.
const windows = new Map<string, Window>();

export function checkRateLimit(
  key: string,
  limit: number,
  now = Date.now(),
  windowMs = WINDOW_MS,
): RateLimitResult {
  if (windows.size > MAX_KEYS) {
    for (const [id, window] of windows) {
      if (window.resetAt <= now) windows.delete(id);
    }
  }

  const existing = windows.get(key);
  if (!existing || existing.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (existing.count >= limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

export function resetRateLimits(): void {
  windows.clear();
}
