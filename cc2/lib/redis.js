import Redis from "ioredis";

let redis = null;

/**
 * Get Redis client instance (singleton)
 */
export function getRedisClient() {
  if (!redis) {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      // If no REDIS_URL is provided, gracefully disable Redis caching
      return null;
    }

    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      retryStrategy: (times) => {
        if (times > 1) {
          return null; // Stop retrying after 1 attempt
        }
        return 1000;
      },
      reconnectOnError: (err) => {
        const targetError = "READONLY";
        if (err.message.includes(targetError)) {
          return true;
        }
        return false;
      },
    });

    redis.on("error", (err) => {
      // Suppress noisy connection errors in development
      if (err.code !== 'ECONNREFUSED') {
        console.error("Redis error:", err.message);
      }
    });

    redis.on("connect", () => {
      console.log("Redis connected successfully");
    });
  }

  return redis;
}

/**
 * Cache wrapper with automatic serialization
 */
export const cache = {
  /**
   * Get value from cache
   */
  async get(key) {
    try {
      const client = getRedisClient();
      if (!client) return null;
      const value = await client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      if (error.message !== 'Connection is closed.') {
        console.error("Redis GET error:", error.message);
      }
      return null;
    }
  },

  /**
   * Set value in cache with TTL (seconds)
   */
  async set(key, value, ttl = 300) {
    try {
      const client = getRedisClient();
      if (!client) return false;
      const serialized = JSON.stringify(value);
      if (ttl) {
        await client.setex(key, ttl, serialized);
      } else {
        await client.set(key, serialized);
      }
      return true;
    } catch (error) {
      if (error.message !== 'Connection is closed.') {
        console.error("Redis SET error:", error.message);
      }
      return false;
    }
  },

  /**
   * Delete value from cache
   */
  async del(key) {
    try {
      const client = getRedisClient();
      if (!client) return false;
      await client.del(key);
      return true;
    } catch (error) {
      if (error.message !== 'Connection is closed.') {
        console.error("Redis DEL error:", error.message);
      }
      return false;
    }
  },

  /**
   * Delete multiple keys by pattern
   */
  async delPattern(pattern) {
    try {
      const client = getRedisClient();
      if (!client) return false;
      const keys = await client.keys(pattern);
      if (keys.length > 0) {
        await client.del(...keys);
      }
      return true;
    } catch (error) {
      if (error.message !== 'Connection is closed.') {
        console.error("Redis DEL PATTERN error:", error.message);
      }
      return false;
    }
  },

  /**
   * Check if key exists
   */
  async exists(key) {
    try {
      const client = getRedisClient();
      if (!client) return false;
      const result = await client.exists(key);
      return result === 1;
    } catch (error) {
      if (error.message !== 'Connection is closed.') {
        console.error("Redis EXISTS error:", error.message);
      }
      return false;
    }
  },

  /**
   * Increment counter
   */
  async incr(key, amount = 1) {
    try {
      const client = getRedisClient();
      if (!client) return null;
      return await client.incrby(key, amount);
    } catch (error) {
      if (error.message !== 'Connection is closed.') {
        console.error("Redis INCR error:", error.message);
      }
      return null;
    }
  },

  /**
   * Set expiration on existing key
   */
  async expire(key, ttl) {
    try {
      const client = getRedisClient();
      if (!client) return false;
      await client.expire(key, ttl);
      return true;
    } catch (error) {
      if (error.message !== 'Connection is closed.') {
        console.error("Redis EXPIRE error:", error.message);
      }
      return false;
    }
  },

  /**
   * Get multiple keys at once
   */
  async mget(keys) {
    try {
      const client = getRedisClient();
      if (!client) return keys.map(() => null);
      const values = await client.mget(...keys);
      return values.map((v) => (v ? JSON.parse(v) : null));
    } catch (error) {
      if (error.message !== 'Connection is closed.') {
        console.error("Redis MGET error:", error.message);
      }
      return keys.map(() => null);
    }
  },
};

/**
 * Cache key generators
 */
export const cacheKeys = {
  user: (userId) => `user:${userId}`,
  userProfile: (userId) => `user:${userId}:profile`,
  posts: (page = 1) => `posts:page:${page}`,
  post: (postId) => `post:${postId}`,
  communities: (userId) => `communities:user:${userId}`,
  resources: (filters = "") => `resources:${filters}`,
  resource: (resourceId) => `resource:${resourceId}`,
  quiz: (quizId) => `quiz:${quizId}`,
  quizSubmissions: (quizId) => `quiz:${quizId}:submissions`,
  events: (page = 1, limit = 20) => `events:page:${page}:limit:${limit}`,
  event: (eventId) => `event:${eventId}`,
  connections: (userId) => `connections:${userId}`,
  notifications: (userId) => `notifications:${userId}`,
  trending: () => "trending:posts",
  search: (query) => `search:${query}`,
};

/**
 * Cached data TTLs (in seconds)
 */
export const cacheTTL = {
  user: 600, // 10 minutes
  posts: 300, // 5 minutes
  communities: 300, // 5 minutes
  resources: 600, // 10 minutes
  quiz: 1800, // 30 minutes
  events: 600, // 10 minutes
  trending: 600, // 10 minutes
  search: 300, // 5 minutes
  notifications: 60, // 1 minute
};

/**
 * Cache invalidation helpers
 */
export const invalidateCache = {
  async user(userId) {
    await cache.delPattern(`user:${userId}*`);
  },

  async posts() {
    await cache.delPattern("posts:*");
    await cache.del(cacheKeys.trending());
  },

  async post(postId) {
    await cache.del(cacheKeys.post(postId));
    await this.posts();
  },

  async resources() {
    await cache.delPattern("resources:*");
  },

  async resource(resourceId) {
    await cache.del(cacheKeys.resource(resourceId));
    await this.resources();
  },

  async quiz(quizId) {
    await cache.delPattern(`quiz:${quizId}*`);
  },

  async events() {
    await cache.delPattern("events:*");
  },

  async communities(userId) {
    if (userId) {
      await cache.del(`communities:user:${userId}`);
    } else {
      await cache.delPattern("communities:*");
    }
  },

  async event(eventId) {
    await cache.del(cacheKeys.event(eventId));
    await this.events();
  },
};

export default cache;
