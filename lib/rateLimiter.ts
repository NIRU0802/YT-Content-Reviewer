import { log, LogType, LogLevel } from './logger';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMIT_MAX = 20;

export function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW,
    });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    log(LogType.RATE_LIMIT, `Rate limit exceeded for IP: ${ip}`, LogLevel.WARN, {
      count: entry.count,
      resetAt: new Date(entry.resetAt).toISOString(),
    });
    return false;
  }

  entry.count++;
  return true;
}

export function getRateLimitStatus(ip: string): { remaining: number; resetAt: Date } {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    return { remaining: RATE_LIMIT_MAX, resetAt: new Date(now + RATE_LIMIT_WINDOW) };
  }

  return {
    remaining: Math.max(0, RATE_LIMIT_MAX - entry.count),
    resetAt: new Date(entry.resetAt),
  };
}

export function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap.entries()) {
    if (now > entry.resetAt) {
      rateLimitMap.delete(ip);
    }
  }
}

setInterval(cleanupExpiredEntries, RATE_LIMIT_WINDOW);
