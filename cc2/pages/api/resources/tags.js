import { resourceVisibility } from "../../../lib/resource-access";
import clientPromise from "../../../utils/mongodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { cache, cacheTTL } from "../../../lib/redis";

// Returns distinct tags/categories used across resources — consumed by AdvancedFilters.jsx
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const client = await clientPromise;
    const db = client.db();

    // Fetch distinct tags AND distinct categories in parallel
    const [tags, categories] = await Promise.all([
      db.collection("resources").distinct("tags", resourceVisibility(session.user)),
      db.collection("resources").distinct("category", resourceVisibility(session.user)),
    ]);

    const allTags = [...new Set([...tags, ...categories])]
      .filter((tag) => tag && typeof tag === "string" && tag.trim())
      .sort();

    // Cache for 10 minutes
    res.setHeader("Cache-Control", "private, no-store");

    res.status(200).json({ tags: allTags });
  } catch (error) {
    console.error("Resources tags error:", error);
    res.status(500).json({ error: "Failed to fetch tags" });
  }
}
