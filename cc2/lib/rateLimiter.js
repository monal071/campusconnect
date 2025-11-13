import { cache } from './redis';

/**
 * Rate limiter configuration
 */
const rateLimitConfig = {
  // API endpoints
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
  },
  // Authentication endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
  },
  // File upload endpoints
  upload: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 20,
  },
  // Heavy operations
  heavy: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
  },
};

/**
 * Rate limiter middleware for API routes
 */
export async function rateLimit(req, identifier, limitType = 'api') {
  const config = rateLimitConfig[limitType] || rateLimitConfig.api;
  const key = `ratelimit:${limitType}:${identifier}`;
  
  try {
    // Get current count
    const current = await cache.get(key);
    
    if (!current) {
      // First request in window
      await cache.set(key, { count: 1, resetAt: Date.now() + config.windowMs }, config.windowMs / 1000);
      return {
        success: true,
        limit: config.maxRequests,
        remaining: config.maxRequests - 1,
        resetAt: Date.now() + config.windowMs,
      };
    }
    
    // Check if limit exceeded
    if (current.count >= config.maxRequests) {
      const resetIn = Math.ceil((current.resetAt - Date.now()) / 1000);
      return {
        success: false,
        limit: config.maxRequests,
        remaining: 0,
        resetAt: current.resetAt,
        retryAfter: resetIn,
      };
    }
    
    // Increment counter
    current.count += 1;
    await cache.set(key, current, Math.ceil((current.resetAt - Date.now()) / 1000));
    
    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - current.count,
      resetAt: current.resetAt,
    };
  } catch (error) {
    console.error('Rate limit error:', error);
    // Allow request if Redis fails (fail open)
    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests,
    };
  }
}

/**
 * Middleware wrapper for Next.js API routes
 */
export function withRateLimit(handler, limitType = 'api') {
  return async (req, res) => {
    // Get identifier (IP or user ID)
    const identifier = req.headers['x-forwarded-for'] || 
                      req.connection.remoteAddress || 
                      req.session?.user?.id || 
                      'anonymous';
    
    const result = await rateLimit(req, identifier, limitType);
    
    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', result.limit);
    res.setHeader('X-RateLimit-Remaining', result.remaining);
    if (result.resetAt) {
      res.setHeader('X-RateLimit-Reset', new Date(result.resetAt).toISOString());
    }
    
    if (!result.success) {
      res.setHeader('Retry-After', result.retryAfter);
      return res.status(429).json({
        error: 'Too many requests',
        message: `Rate limit exceeded. Try again in ${result.retryAfter} seconds.`,
        retryAfter: result.retryAfter,
      });
    }
    
    return handler(req, res);
  };
}

/**
 * Rate limit by user ID
 */
export async function rateLimitByUser(userId, limitType = 'api') {
  return await rateLimit({}, userId, limitType);
}

/**
 * Rate limit by IP address
 */
export async function rateLimitByIP(req, limitType = 'api') {
  const ip = req.headers['x-forwarded-for'] || 
             req.connection.remoteAddress || 
             'unknown';
  return await rateLimit(req, ip, limitType);
}

/**
 * Custom rate limit with specific config
 */
export async function customRateLimit(identifier, maxRequests, windowMs) {
  const key = `ratelimit:custom:${identifier}`;
  
  try {
    const current = await cache.get(key);
    
    if (!current) {
      await cache.set(key, { count: 1, resetAt: Date.now() + windowMs }, windowMs / 1000);
      return { success: true, remaining: maxRequests - 1 };
    }
    
    if (current.count >= maxRequests) {
      return { 
        success: false, 
        remaining: 0,
        retryAfter: Math.ceil((current.resetAt - Date.now()) / 1000),
      };
    }
    
    current.count += 1;
    await cache.set(key, current, Math.ceil((current.resetAt - Date.now()) / 1000));
    
    return { success: true, remaining: maxRequests - current.count };
  } catch (error) {
    console.error('Custom rate limit error:', error);
    return { success: true };
  }
}

/**
 * Reset rate limit for identifier
 */
export async function resetRateLimit(identifier, limitType = 'api') {
  const key = `ratelimit:${limitType}:${identifier}`;
  await cache.del(key);
}

export default withRateLimit;
