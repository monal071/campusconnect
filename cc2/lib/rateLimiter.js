import { createHash } from "crypto";
import clientPromise from "../utils/mongodb";
const configs = { api: { windowMs: 900000, maxRequests: 100 }, auth: { windowMs: 900000, maxRequests: 5 }, upload: { windowMs: 3600000, maxRequests: 20 }, heavy: { windowMs: 3600000, maxRequests: 10 } };

// Atomic MongoDB counters work across Vercel instances without a Redis account.
async function consume(identifier, maxRequests, windowMs, scope) {
  const now = Date.now();
  const window = Math.floor(now / windowMs);
  const resetAt = (window + 1) * windowMs;
  const digest = createHash("sha256").update(String(identifier)).digest("hex");
  const client = await clientPromise;
  const counters = client.db().collection("rateLimits");
  const key = `${scope}:${windowMs}:${window}:${digest}`;
  let counter;
  try {
    counter = await counters.findOneAndUpdate({ _id: key }, { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date(resetAt) } }, { upsert: true, returnDocument: "after" });
  } catch (error) {
    if (error.code !== 11000) throw error;
    counter = await counters.findOneAndUpdate({ _id: key }, { $inc: { count: 1 } }, { returnDocument: "after" });
  }
  return { success: counter.count <= maxRequests, limit: maxRequests, remaining: Math.max(0, maxRequests - counter.count), resetAt, retryAfter: Math.max(1, Math.ceil((resetAt - now) / 1000)) };
}
export function rateLimit(req, identifier, limitType = "api") {
  const config = configs[limitType] || configs.api;
  return consume(identifier, config.maxRequests, config.windowMs, limitType);
}
const ip = req => String(req.headers?.["x-forwarded-for"] || req.socket?.remoteAddress || "anonymous").split(",")[0].trim();
export function withRateLimit(handler, limitType = "api") {
  return async (req, res) => {
    let result;
    try { result = await rateLimit(req, ip(req), limitType); }
    catch { return res.status(503).json({ error: "Service temporarily unavailable. Please try again." }); }
    res.setHeader("X-RateLimit-Limit", result.limit);
    res.setHeader("X-RateLimit-Remaining", result.remaining);
    res.setHeader("X-RateLimit-Reset", new Date(result.resetAt).toISOString());
    if (!result.success) {
      res.setHeader("Retry-After", result.retryAfter);
      return res.status(429).json({ error: "Too many requests. Please try again later.", retryAfter: result.retryAfter });
    }
    return handler(req, res);
  };
}
export const rateLimitByUser = (userId, type = "api") => rateLimit({}, userId, type);
export const rateLimitByIP = (req, type = "api") => rateLimit(req, ip(req), type);
export const customRateLimit = (identifier, maxRequests, windowMs) => consume(identifier, maxRequests, windowMs, "custom");
export async function resetRateLimit(identifier, type = "api") {
  const config = configs[type] || configs.api;
  const key = `${type}:${config.windowMs}:${Math.floor(Date.now() / config.windowMs)}:${createHash("sha256").update(String(identifier)).digest("hex")}`;
  const client = await clientPromise;
  await client.db().collection("rateLimits").deleteOne({ _id: key });
}
export default withRateLimit;
