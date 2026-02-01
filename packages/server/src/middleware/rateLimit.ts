import type { Request, Response, NextFunction } from "express";
import { Bucket, RateLimitOptions } from "../types/rateLimiter";

const store = new Map<string, Bucket>();

function cleanupExpired(): void {
  const now = Date.now();
  for (const [key, bucket] of store.entries()) {
    if (now > bucket.resetAt) store.delete(key);
  }
}

/**
 * In-memory rate limiter. Keys by req.ip. Lazy-cleans expired buckets.
 */
export function createRateLimiter(
  options: RateLimitOptions,
): (req: Request, res: Response, next: NextFunction) => void {
  const { windowMs, maxRequests } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip ?? "unknown";
    const now = Date.now();

    let bucket = store.get(key);
    if (!bucket || now > bucket.resetAt) {
      cleanupExpired();
      bucket = { count: 1, resetAt: now + windowMs };
      store.set(key, bucket);
      return next();
    }

    bucket.count++;
    if (bucket.count > maxRequests) {
      res
        .status(429)
        .json({ error: "Too many requests. Please try again later." });
      return;
    }
    next();
  };
}
