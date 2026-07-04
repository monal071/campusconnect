import clientPromise from "../../../utils/mongodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { cache, cacheKeys, cacheTTL } from "../../../lib/redis";

// Returns distinct tags used across posts — consumed by AdvancedFilters.jsx
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Try cache first
    const cacheKey = "posts:tags";
    const cached = await cache.get(cacheKey);
    if (cached) {
      return res.status(200).json({ tags: cached });
    }

    const client = await clientPromise;
    const db = client.db();

    // Get distinct tags from posts collection
    const tags = await db.collection("posts").distinct("tags");

    // Filter out null/empty and sort alphabetically
    const cleanTags = tags
      .filter((tag) => tag && typeof tag === "string" && tag.trim())
      .sort();

    // Cache for 10 minutes
    await cache.set(cacheKey, cleanTags, cacheTTL.posts);

    res.status(200).json({ tags: cleanTags });
  } catch (error) {
    console.error("Posts tags error:", error);
    res.status(500).json({ error: "Failed to fetch tags" });
  }
}
