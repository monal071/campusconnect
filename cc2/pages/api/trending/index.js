import clientPromise from "../../../utils/mongodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { cache, cacheTTL } from "../../../lib/redis";

const TRENDING_TTL = 5 * 60; // 5 minutes

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { type = "all", limit = 10 } = req.query;
    const limitNum = parseInt(limit);

    // Try Redis cache first — key includes type + limit so different queries are cached separately
    const cacheKey = `trending:${type}:${limitNum}`;
    const cached = await cache.get(cacheKey);
    if (cached) {
      res.setHeader("X-Cache", "HIT");
      return res.status(200).json(cached);
    }

    const client = await clientPromise;
    const db = client.db();

    const results = {};

    // Get trending posts (by likes, last 7 days)
    if (type === "all" || type === "posts") {
      const posts = await db
        .collection("posts")
        .find({
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        })
        .sort({ likes: -1 })
        .limit(limitNum)
        .toArray();
      results.posts = posts;
    }

    // Get most viewed resources
    if (type === "all" || type === "resources") {
      const resources = await db
        .collection("resources")
        .find({})
        .sort({ views: -1, likes: -1 })
        .limit(limitNum)
        .toArray();
      results.resources = resources;
    }

    // Get popular quizzes (by submission count)
    if (type === "all" || type === "quizzes") {
      const quizzes = await db
        .collection("quizzes")
        .aggregate([
          {
            $addFields: {
              submissionCount: { $size: { $ifNull: ["$submissions", []] } },
            },
          },
          { $sort: { submissionCount: -1 } },
          { $limit: limitNum },
        ])
        .toArray();
      results.quizzes = quizzes;
    }

    // Get upcoming popular events
    if (type === "all" || type === "events") {
      const events = await db
        .collection("events")
        .find({ date: { $gte: new Date() } })
        .sort({ attendees: -1 })
        .limit(limitNum)
        .toArray();
      results.events = events;
    }

    // Get trending communities (by member count)
    if (type === "all" || type === "communities") {
      const communities = await db
        .collection("communities")
        .aggregate([
          {
            $addFields: {
              memberCount: { $size: { $ifNull: ["$members", []] } },
            },
          },
          { $sort: { memberCount: -1 } },
          { $limit: limitNum },
        ])
        .toArray();
      results.communities = communities;
    }

    // Cache results for 5 minutes
    await cache.set(cacheKey, results, TRENDING_TTL);

    res.setHeader("X-Cache", "MISS");
    res.status(200).json(results);
  } catch (error) {
    console.error("Trending API error:", error);
    res.status(500).json({ error: "Failed to fetch trending items" });
  }
}
