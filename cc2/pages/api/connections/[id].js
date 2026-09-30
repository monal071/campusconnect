import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import clientPromise from "../../../utils/mongodb";
import { ObjectId } from "mongodb";
import { changeConnection } from "../../../lib/connections";
import { sendApiError } from "../../../lib/api-errors";
export default async function handler(req, res) {
  if (req.method !== "DELETE") return res.status(405).json({ message: "Method not allowed" });
  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) return res.status(401).json({ message: "Not authenticated" });
    const { id } = req.query;
    if (typeof id !== "string" || !ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid connection ID" });
    const client = await clientPromise;
    const db = client.db();
    const old = await db.collection("connections").findOne({ _id: new ObjectId(id), $or: [{ user1Id: session.user.email }, { user2Id: session.user.email }] });
    const other = old ? await db.collection("users").findOne({ email: old.user1Id === session.user.email ? old.user2Id : old.user1Id }) : null;
    return res.status(200).json(await changeConnection(client, db, session.user.id, other ? String(other._id) : id, "remove"));
  } catch (error) { return sendApiError(res, error); }
}
