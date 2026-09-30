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
    const id = session.user.id;
    const state = await connectionState(db, id);
    const outgoing = await db.collection("users").find({ requests: { $in: [id, new ObjectId(id)] } }).project({ _id: 1 }).toArray();
    const legacy = await db.collection("connectionRequests").find({ senderId: session.user.email, status: "pending" }).project({ receiverId: 1 }).toArray();
    const excluded = [id, ...state.friends, ...state.incoming, ...outgoing.map(u => String(u._id))].map(v => new ObjectId(v));
    const recommendations = await db.collection("users").find({ _id: { $nin: excluded }, email: { $nin: legacy.map(r => r.receiverId) } }).project(publicUserFields).limit(10).toArray();
    return res.status(200).json({ recommendations });
  } catch (error) { return sendApiError(res, error); }
}
