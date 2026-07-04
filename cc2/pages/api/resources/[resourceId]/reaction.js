import clientPromise from "../../../../utils/mongodb";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";
import { z } from "zod";
import { invalidateCache } from "../../../../lib/redis";

const reactionSchema = z.object({
  emoji: z.string().min(1, "Emoji is required").max(10, "Invalid emoji"),
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { resourceId } = req.query;
    if (!resourceId || !ObjectId.isValid(resourceId)) {
      return res.status(400).json({ error: "Invalid resource ID" });
    }

    const parse = reactionSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({
        error: "Validation failed",
        message: parse.error.errors[0].message,
      });
    }

    const { emoji } = parse.data;
    const userId = session.user.email || session.user.id;

    const client = await clientPromise;
    const db = client.db();

    const resource = await db
      .collection("resources")
      .findOne({ _id: new ObjectId(resourceId) });

    if (!resource) {
      return res.status(404).json({ error: "Resource not found" });
    }

    const reactions = resource.reactions || {};

    if (!reactions[emoji]) {
      reactions[emoji] = [];
    }

    const userIndex = reactions[emoji].indexOf(userId);
    if (userIndex > -1) {
      reactions[emoji].splice(userIndex, 1);
      if (reactions[emoji].length === 0) {
        delete reactions[emoji];
      }
    } else {
      reactions[emoji].push(userId);
    }

    await db
      .collection("resources")
      .updateOne({ _id: new ObjectId(resourceId) }, { $set: { reactions } });

    // Invalidate resource cache
    await invalidateCache.resource(resourceId);

    return res.status(200).json({ reactions });
  } catch (error) {
    console.error("Resource reaction error:", error);
    return res.status(500).json({ error: "Failed to update reaction" });
  }
}
