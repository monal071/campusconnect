import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import clientPromise from "../../../utils/mongodb";
import { ObjectId } from "mongodb";
import posts from "../posts";
export default async function handler(req, res) {
  if (req.method === "DELETE") return posts(req, res);
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) return res.status(401).json({ error: "Not authenticated" });
  const { id } = req.query;
  if (typeof id !== "string" || !ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid post ID" });
  try {
    const client = await clientPromise;
    const post = await client.db().collection("posts").findOne({ _id: new ObjectId(id) });
    return post ? res.status(200).json({ success: true, data: post }) : res.status(404).json({ error: "Post not found" });
  } catch { return res.status(500).json({ error: "Failed to fetch post" }); }
}
