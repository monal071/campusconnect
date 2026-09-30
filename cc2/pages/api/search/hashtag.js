import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import clientPromise from "../../../utils/mongodb";

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method === "GET") {
    try {
      const { tag, type = "all", limit = 20 } = req.query;

      if (typeof tag !== "string" || !tag.trim() || tag.length > 100) {
        return res.status(400).json({ error: "Tag is required" });
      }

      const safeTag = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const client = await clientPromise;
      const db = client.db();
      const results = {};

      // Search in posts
      if (type === "all" || type === "posts") {
        const posts = await db
          .collection("posts")
          .find({
            content: { $regex: `#${safeTag}`, $options: "i" },
          })
          .sort({ createdAt: -1 })
          .limit(Math.min(50, Math.max(1, parseInt(limit, 10) || 20)))
          .toArray();

        results.posts = posts;
      }

      // Search in resources
      if (type === "all" || type === "resources") {
        const resources = await db
          .collection("resources")
          .find({
            $or: [
              { title: { $regex: `#${safeTag}`, $options: "i" } },
              { description: { $regex: `#${safeTag}`, $options: "i" } },
              { tags: { $regex: tag, $options: "i" } },
            ],
          })
          .sort({ createdAt: -1 })
          .limit(Math.min(50, Math.max(1, parseInt(limit, 10) || 20)))
          .toArray();

        results.resources = resources;
      }

      // Search in communities
      if (type === "all" || type === "communities") {
        const communities = await db
          .collection("communities")
          .find({
            $or: [
              { name: { $regex: `#${safeTag}`, $options: "i" } },
              { description: { $regex: `#${safeTag}`, $options: "i" } },
              { tags: { $regex: tag, $options: "i" } },
            ],
          })
          .sort({ createdAt: -1 })
          .limit(Math.min(50, Math.max(1, parseInt(limit, 10) || 20)))
          .toArray();

        results.communities = communities;
      }

      return res.status(200).json(results);
    } catch (error) {
      console.error("Hashtag search error:", error);
      return res.status(500).json({ error: "Failed to search hashtag" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
