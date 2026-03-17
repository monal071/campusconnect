import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import { connectToDatabase } from "../../utils/mongodb";
import { cache, cacheKeys, cacheTTL, invalidateCache } from "../../lib/redis";
import { withRateLimit } from "../../lib/rateLimiter";
import { withErrorTracking } from "../../lib/sentry";

/**
 * Enhanced Posts API with Redis caching and rate limiting
 * GET /api/posts-cached - Fetch posts with caching
 * POST /api/posts-cached - Create post with cache invalidation
 */

async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { db } = await connectToDatabase();

  if (req.method === "GET") {
    try {
      const { page = 1, limit = 10 } = req.query;
      const cacheKey = cacheKeys.posts(page);

      // Try to get from cache first
      const cachedPosts = await cache.get(cacheKey);
      if (cachedPosts) {
        return res.json({
          posts: cachedPosts,
          cached: true,
          page: parseInt(page),
        });
      }

      // Fetch from database
      const posts = await db
        .collection("posts")
        .find({})
        .sort({ createdAt: -1 })
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit))
        .toArray();

      // Populate user data
      const postsWithUsers = await Promise.all(
        posts.map(async (post) => {
          const user = await db
            .collection("users")
            .findOne(
              { _id: post.userId },
              { projection: { name: 1, email: 1, image: 1 } },
            );
          return { ...post, user };
        }),
      );

      // Cache the results
      await cache.set(cacheKey, postsWithUsers, cacheTTL.posts);

      res.json({
        posts: postsWithUsers,
        cached: false,
        page: parseInt(page),
      });
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ error: "Failed to fetch posts" });
    }
  } else if (req.method === "POST") {
    try {
      const { text, image, hashtags, mentions } = req.body;

      // Validation
      if (!text || text.trim().length === 0) {
        return res.status(400).json({ error: "Post text is required" });
      }

      // Create post
      const newPost = {
        text,
        image,
        hashtags: hashtags || [],
        mentions: mentions || [],
        userId: session.user.id,
        likes: [],
        comments: [],
        createdAt: new Date(),
      };

      const result = await db.collection("posts").insertOne(newPost);

      // Get user data
      const user = await db
        .collection("users")
        .findOne(
          { _id: session.user.id },
          { projection: { name: 1, email: 1, image: 1 } },
        );

      const post = {
        ...newPost,
        _id: result.insertedId,
        user,
      };

      // Invalidate posts cache
      await invalidateCache.posts();

      res.status(201).json(post);
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).json({ error: "Failed to create post" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}

// Apply rate limiting and error tracking
export default withErrorTracking(withRateLimit(handler, "api"));
