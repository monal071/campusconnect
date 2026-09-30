import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import clientPromise from "../../../utils/mongodb";
import { sendApiError } from "../../../lib/api-errors";
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) return res.status(401).json({ error: "Not authenticated" });
    const { content, type } = req.body || {};
    if (!["notes", "tasks"].includes(type) || (type === "notes" ? typeof content !== "string" : !Array.isArray(content)) || JSON.stringify(content).length > 50000) return res.status(400).json({ error: "Invalid or oversized content" });
    const client = await clientPromise;
    await client.db().collection("dashboardContent").updateOne({ _id: `${session.user.id}:${type}` }, { $set: { userId: session.user.id, type, content, updatedAt: new Date() } }, { upsert: true });
    return res.status(200).json({ success: true });
  } catch (error) { return sendApiError(res, error); }
}
