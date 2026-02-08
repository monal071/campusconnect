import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";
import clientPromise from "../../../../utils/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { resourceId } = req.query;
    if (!resourceId) {
      return res.status(400).json({ error: "Resource ID required" });
    }

    const client = await clientPromise;
    const db = client.db();
    const userId = session.user.id;

    let objectId;
    try {
      objectId = new ObjectId(resourceId);
    } catch {
      return res.status(400).json({ error: "Invalid resource ID" });
    }

    const resource = await db
      .collection("resources")
      .findOne({ _id: objectId });
    if (!resource) {
      return res.status(404).json({ error: "Resource not found" });
    }

    const likedBy = resource.likedBy || [];
    const hasLiked = likedBy.includes(userId);

    if (hasLiked) {
      // Unlike
      await db.collection("resources").updateOne(
        { _id: objectId },
        {
          $pull: { likedBy: userId },
          $inc: { likes: -1 },
        },
      );
      return res
        .status(200)
        .json({ liked: false, likes: (resource.likes || 1) - 1 });
    } else {
      // Like
      await db.collection("resources").updateOne(
        { _id: objectId },
        {
          $addToSet: { likedBy: userId },
          $inc: { likes: 1 },
        },
      );
      return res
        .status(200)
        .json({ liked: true, likes: (resource.likes || 0) + 1 });
    }
  } catch (error) {
    console.error("Error liking resource:", error);
    return res.status(500).json({ error: "Failed to update like" });
  }
}
