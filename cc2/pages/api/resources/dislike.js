import clientPromise from "../../../utils/mongodb";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { resourceId } = req.body;
    const userId = session.user.id;

    if (!resourceId) {
      return res.status(400).json({ message: "Resource ID is required" });
    }

    const client = await clientPromise;
    const db = client.db();

    const resource = await db.collection("resources").findOne({
      _id: new ObjectId(resourceId),
    });

    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    const dislikedBy = resource.dislikedBy || [];
    const likedBy = resource.likedBy || [];
    const hasDisliked = dislikedBy.includes(userId);
    const hasLiked = likedBy.includes(userId);

    if (hasDisliked) {
      // Remove dislike
      await db.collection("resources").updateOne(
        { _id: new ObjectId(resourceId) },
        {
          $pull: { dislikedBy: userId },
          $inc: { dislikes: -1 },
        },
      );

      return res.status(200).json({
        message: "Dislike removed",
        disliked: false,
        dislikes: Math.max(0, (resource.dislikes || 0) - 1),
        likes: resource.likes || 0,
      });
    } else {
      // Add dislike and remove like if exists
      const updateOps = {
        $addToSet: { dislikedBy: userId },
        $inc: { dislikes: 1 },
      };

      // If user had liked, remove the like
      if (hasLiked) {
        updateOps.$pull = { likedBy: userId };
        updateOps.$inc.likes = -1;
      }

      await db
        .collection("resources")
        .updateOne({ _id: new ObjectId(resourceId) }, updateOps);

      return res.status(200).json({
        message: "Resource disliked",
        disliked: true,
        dislikes: (resource.dislikes || 0) + 1,
        likes: hasLiked
          ? Math.max(0, (resource.likes || 0) - 1)
          : resource.likes || 0,
        liked: false,
      });
    }
  } catch (error) {
    console.error("Error handling resource dislike:", error);
    return res.status(500).json({ message: "Failed to process dislike" });
  }
}
