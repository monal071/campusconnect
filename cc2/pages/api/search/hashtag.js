import { getSession } from "next-auth/react";
import clientPromise from "../../../utils/mongodb";

export default async function handler(req, res) {
  const session = await getSession({ req });

  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method === "GET") {
    try {
      const { tag, type = "all", limit = 20 } = req.query;

      if (!tag) {
        return res.status(400).json({ error: "Tag is required" });
      }

      const client = await clientPromise;
      const db = client.db();
      const results = {};

      // Search in resources
      if (type === "all" || type === "resources") {
        const resources = await db
          .collection("resources")
          .find({
            $or: [
              { title: { $regex: `#${tag}`, $options: "i" } },
              { description: { $regex: `#${tag}`, $options: "i" } },
              { tags: { $regex: tag, $options: "i" } },
            ],
          })
          .sort({ createdAt: -1 })
          .limit(parseInt(limit))
          .toArray();

        results.resources = resources;
      }

      // Search in communities
      if (type === "all" || type === "communities") {
        const communities = await db
          .collection("communities")
          .find({
            $or: [
              { name: { $regex: `#${tag}`, $options: "i" } },
              { description: { $regex: `#${tag}`, $options: "i" } },
              { tags: { $regex: tag, $options: "i" } },
            ],
          })
          .sort({ createdAt: -1 })
          .limit(parseInt(limit))
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
