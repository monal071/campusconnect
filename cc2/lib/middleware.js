import { withRateLimit } from "./rateLimiter";
import { withErrorTracking } from "./sentry";
import { cache, cacheKeys } from "./redis";

/**
 * Compose multiple middleware functions
 * Usage: export default compose(withAuth, withRateLimit, withErrorTracking)(handler)
 */
export function compose(...middlewares) {
  return (handler) => {
    return middlewares.reduceRight(
      (acc, middleware) => middleware(acc),
      handler
    );
  };
}

/**
 * Cache middleware - automatically cache GET requests
 */
export function withCache(handler, options = {}) {
  const {
    keyPrefix = "api",
    ttl = 300,
    getCacheKey = (req) => `${keyPrefix}:${req.url}`,
  } = options;

  return async (req, res) => {
    // Only cache GET requests
    if (req.method === "GET") {
      const cacheKey = getCacheKey(req);

      // Try cache first
      const cached = await cache.get(cacheKey);
      if (cached) {
        res.setHeader("X-Cache", "HIT");
        return res.json(cached);
      }

      // Intercept res.json to cache the response
      const originalJson = res.json.bind(res);
      res.json = (data) => {
        cache.set(cacheKey, data, ttl);
        res.setHeader("X-Cache", "MISS");
        return originalJson(data);
      };
    }

    return handler(req, res);
  };
}

/**
 * Performance monitoring middleware
 */
export function withPerformanceMonitoring(handler) {
  return async (req, res) => {
    const startTime = Date.now();

    // Intercept res.json to log performance
    const originalJson = res.json.bind(res);
    const originalStatus = res.status.bind(res);

    let statusCode = 200;
    res.status = (code) => {
      statusCode = code;
      return originalStatus(code);
    };

    res.json = (data) => {
      const duration = Date.now() - startTime;

      // Log slow requests
      if (duration > 1000) {
        console.warn(
          `Slow API request: ${req.method} ${req.url} - ${duration}ms`
        );
      }

      // Add performance headers
      res.setHeader("X-Response-Time", `${duration}ms`);

      return originalJson(data);
    };

    return handler(req, res);
  };
}

/**
 * Request logging middleware
 */
export function withLogging(handler) {
  return async (req, res) => {
    const startTime = Date.now();

    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);

    // Intercept response
    const originalJson = res.json.bind(res);
    res.json = (data) => {
      const duration = Date.now() - startTime;
      console.log(
        `[${new Date().toISOString()}] ${req.method} ${req.url} - ${
          res.statusCode
        } - ${duration}ms`
      );
      return originalJson(data);
    };

    return handler(req, res);
  };
}

/**
 * CORS middleware
 */
export function withCORS(handler, options = {}) {
  const {
    origin = "*",
    methods = "GET,POST,PUT,DELETE,OPTIONS",
    credentials = true,
  } = options;

  return async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", methods);
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );
    if (credentials) {
      res.setHeader("Access-Control-Allow-Credentials", "true");
    }

    // Handle preflight
    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    return handler(req, res);
  };
}

/**
 * Validation middleware
 */
export function withValidation(handler, schema) {
  return async (req, res) => {
    try {
      // Validate request body against schema
      if (schema.body && req.body) {
        const validated = await schema.body.validate(req.body);
        req.body = validated;
      }

      // Validate query params
      if (schema.query && req.query) {
        const validated = await schema.query.validate(req.query);
        req.query = validated;
      }

      return handler(req, res);
    } catch (error) {
      return res.status(400).json({
        error: "Validation error",
        details: error.errors || [error.message],
      });
    }
  };
}

/**
 * Common middleware stacks
 */
export const standardMiddleware = compose(
  withErrorTracking,
  withRateLimit,
  withPerformanceMonitoring
);

export const cachedMiddleware = (ttl = 300) =>
  compose(
    withErrorTracking,
    withRateLimit,
    withPerformanceMonitoring,
    (handler) => withCache(handler, { ttl })
  );

export const protectedMiddleware = compose(
  withErrorTracking,
  withRateLimit,
  withPerformanceMonitoring
);

/**
 * Usage examples:
 *
 * // Standard API endpoint
 * export default standardMiddleware(handler);
 *
 * // Cached endpoint (5 minutes)
 * export default cachedMiddleware(300)(handler);
 *
 * // Custom composition
 * export default compose(
 *   withErrorTracking,
 *   (h) => withRateLimit(h, 'auth'),
 *   withLogging
 * )(handler);
 */

export default {
  compose,
  withCache,
  withPerformanceMonitoring,
  withLogging,
  withCORS,
  withValidation,
  standardMiddleware,
  cachedMiddleware,
  protectedMiddleware,
};
