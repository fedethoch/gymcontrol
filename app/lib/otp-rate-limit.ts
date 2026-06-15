import "server-only";

const OTP_EMAIL_COOLDOWN_MS = 30_000;
const OTP_WINDOW_MS = 15 * 60_000;
const OTP_MAX_REQUESTS_PER_EMAIL = 5;
const OTP_MAX_REQUESTS_PER_IP = 20;

type RateLimitBucket = {
  timestamps: number[];
  lastRequestAt: number | null;
};

const emailBuckets = new Map<string, RateLimitBucket>();
const ipBuckets = new Map<string, RateLimitBucket>();

function pruneWindow(bucket: RateLimitBucket, now: number) {
  bucket.timestamps = bucket.timestamps.filter((timestamp) => now - timestamp < OTP_WINDOW_MS);
}

function getBucket(store: Map<string, RateLimitBucket>, key: string) {
  const bucket = store.get(key);

  if (bucket) {
    return bucket;
  }

  const nextBucket: RateLimitBucket = {
    timestamps: [],
    lastRequestAt: null,
  };

  store.set(key, nextBucket);
  return nextBucket;
}

export function getRequestIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (!forwardedFor) {
    return "unknown";
  }

  const firstForwardedIp = forwardedFor
    .split(",")
    .map((value) => value.trim())
    .find(Boolean);

  return firstForwardedIp ?? "unknown";
}

export function consumeOtpRequestRateLimit(email: string, ip: string, now = Date.now()) {
  const emailBucket = getBucket(emailBuckets, email);
  const ipBucket = getBucket(ipBuckets, ip);

  pruneWindow(emailBucket, now);
  pruneWindow(ipBucket, now);

  if (
    emailBucket.lastRequestAt !== null &&
    now - emailBucket.lastRequestAt < OTP_EMAIL_COOLDOWN_MS
  ) {
    return { ok: false as const };
  }

  if (emailBucket.timestamps.length >= OTP_MAX_REQUESTS_PER_EMAIL) {
    return { ok: false as const };
  }

  if (ipBucket.timestamps.length >= OTP_MAX_REQUESTS_PER_IP) {
    return { ok: false as const };
  }

  emailBucket.lastRequestAt = now;
  emailBucket.timestamps.push(now);
  ipBucket.lastRequestAt = now;
  ipBucket.timestamps.push(now);

  return { ok: true as const };
}
