import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import clientPromise from "../../utils/mongodb";
import { ObjectId } from "mongodb";
import { connectionState, changeConnection, publicUserFields } from "../../lib/connections";
import { sendApiError } from "../../lib/api-errors";
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "private, no-store");
  if (!["GET", "POST", "PUT"].includes(req.method)) return res.status(405).json({ message: "Method not allowed" });
  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) return res.status(401).json({ message: "Not authenticated" });
    const client = await clientPromise;
    const db = client.db();
    const id = session.user.id;
    if (req.method === "GET") {
      const state = await connectionState(db, id);
      const incoming = await db.collection("users").find({ _id: { $in: state.incoming.map(v => new ObjectId(v)) } }).project(publicUserFields).toArray();
      const outgoing = await db.collection("users").find({ requests: { $in: [id, new ObjectId(id)] } }).project(publicUserFields).toArray();
      return res.status(200).json({ receivedRequests: incoming.map(sender => ({ _id: String(sender._id), senderId: sender.email, sender, status: "pending" })), sentRequests: outgoing.map(receiver => ({ _id: String(receiver._id), receiverId: receiver.email, status: "pending" })) });
    }
    let other;
    if (req.method === "POST") {
      if (typeof req.body.receiverId !== "string") return res.status(400).json({ message: "Receiver email required" });
      other = await db.collection("users").findOne({ email: req.body.receiverId });
    } else {
      const requestId = req.body.requestId;
      if (typeof requestId !== "string" || !ObjectId.isValid(requestId)) return res.status(400).json({ message: "Invalid request ID" });
      const old = await db.collection("connectionRequests").findOne({ _id: new ObjectId(requestId), receiverId: session.user.email });
      other = await db.collection("users").findOne(old ? { email: old.senderId } : { _id: new ObjectId(requestId) });
    }
    if (!other) return res.status(404).json({ message: "User not found" });
    return res.status(200).json(await changeConnection(client, db, id, String(other._id), req.method === "POST" ? "send" : req.body.action));
  } catch (error) { return sendApiError(res, error); }
}
