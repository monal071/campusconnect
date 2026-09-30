import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import clientPromise from "../../../utils/mongodb";
import { ObjectId } from "mongodb";
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });
  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) return res.status(401).json({ message: "Not authenticated" });
    const { resourceId } = req.body || {};
    if (typeof resourceId !== "string" || !ObjectId.isValid(resourceId)) return res.status(400).json({ message: "Invalid resource ID" });
    const client = await clientPromise;
    const id = session.user.id;
    const resource = await client.db().collection("resources").findOneAndUpdate({ _id: new ObjectId(resourceId) }, [
      { $set: { dislikedBy: { $cond: [{ $in: [id, { $ifNull: ["$dislikedBy", []] }] }, { $setDifference: ["$dislikedBy", [id]] }, { $setUnion: [{ $ifNull: ["$dislikedBy", []] }, [id]] }] }, likedBy: { $setDifference: [{ $ifNull: ["$likedBy", []] }, [id]] } } },
      { $set: { likes: { $size: "$likedBy" }, dislikes: { $size: "$dislikedBy" } } },
    ], { returnDocument: "after" });
    if (!resource) return res.status(404).json({ message: "Resource not found" });
    return res.status(200).json({ liked: resource.likedBy.includes(id), disliked: resource.dislikedBy.includes(id), likes: resource.likes, dislikes: resource.dislikes });
  } catch { return res.status(500).json({ message: "Failed to update resource reaction" }); }
}
