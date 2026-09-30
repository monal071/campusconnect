import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import clientPromise from "../../../utils/mongodb";
import { ObjectId } from "mongodb";
import { connectionState, publicUserFields } from "../../../lib/connections";
import { sendApiError } from "../../../lib/api-errors";
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "private, no-store");
  if (req.method !== "GET") return res.status(405).json({ message: "Method not allowed" });
  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) return res.status(401).json({ message: "Not authenticated" });
    if (req.query.id && req.query.id !== session.user.id) return res.status(403).json({ message: "Access denied" });
    const client = await clientPromise;
    const db = client.db();
    const state = await connectionState(db, session.user.id);
    const people = await db.collection("users").find({ _id: { $in: state.friends.map(id => new ObjectId(id)) } }).project(publicUserFields).toArray();
    return res.status(200).json({ friends: people });
  } catch (error) { return sendApiError(res, error); }
}
