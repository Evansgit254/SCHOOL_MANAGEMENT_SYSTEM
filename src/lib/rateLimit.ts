type Bucket = {
  tokens: number;
  lastRefill: number;
};

const buckets: Map<string, Bucket> = new Map();

export type RateLimitConfig = {
  tokensPerInterval: number; // e.g., 60
  intervalMs: number; // e.g., 60_000
};

const DEFAULT_CONFIG: RateLimitConfig = {
  tokensPerInterval: 60,
  intervalMs: 60_000,
};

export function rateLimitConsume(key: string, config: RateLimitConfig = DEFAULT_CONFIG): { allowed: boolean; remaining: number; resetMs: number } {
  // If Redis is available, use it for distributed rate limiting
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    // Prefer async API when Redis exists; callers should use rateLimitConsumeAsync
    return inMemoryConsume(key, config);
  }
  return inMemoryConsume(key, config);
}

export async function rateLimitConsumeAsync(key: string, config: RateLimitConfig = DEFAULT_CONFIG): Promise<{ allowed: boolean; remaining: number; resetMs: number }>{
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) return rateLimitConsume(key, config);
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Redis = require('ioredis');
  const client = new Redis(redisUrl);
  const window = Math.floor(Date.now() / config.intervalMs);
  const redisKey = `rl:${key}:${window}`;
  try {
    const count = await client.incr(redisKey);
    if (count === 1) {
      await client.pexpire(redisKey, config.intervalMs);
    }
    const remaining = Math.max(0, config.tokensPerInterval - count);
    const ttlMs = await client.pttl(redisKey);
    const allowed = count <= config.tokensPerInterval;
    return { allowed, remaining, resetMs: ttlMs > 0 ? ttlMs : config.intervalMs };
  } catch {
    return rateLimitConsume(key, config);
  } finally {
    client.disconnect();
  }
}

function inMemoryConsume(key: string, config: RateLimitConfig): { allowed: boolean; remaining: number; resetMs: number } {
  const now = Date.now();
  const bucket = buckets.get(key) ?? { tokens: config.tokensPerInterval, lastRefill: now };

  const elapsed = now - bucket.lastRefill;
  if (elapsed > 0) {
    const refill = (elapsed / config.intervalMs) * config.tokensPerInterval;
    bucket.tokens = Math.min(config.tokensPerInterval, bucket.tokens + refill);
    bucket.lastRefill = now;
  }

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    buckets.set(key, bucket);
    const remaining = Math.floor(bucket.tokens);
    const resetMs = config.intervalMs - (now - bucket.lastRefill);
    return { allowed: true, remaining, resetMs };
  }

  const resetMs = Math.max(0, config.intervalMs - (now - bucket.lastRefill));
  buckets.set(key, bucket);
  return { allowed: false, remaining: 0, resetMs };
}

export function getClientIp(req: Request | { headers: { get(name: string): string | null } }): string {
  // Next.js Request
  const h = 'headers' in req ? req.headers : new Headers();
  const xfwd = h.get('x-forwarded-for') || '';
  const realIp = h.get('x-real-ip') || '';
  const ip = xfwd.split(',')[0].trim() || realIp || 'unknown';
  return ip;
}


