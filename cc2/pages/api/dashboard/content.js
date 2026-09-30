import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import clientPromise from "../../../utils/mongodb";
import { sendApiError } from "../../../lib/api-errors";
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "private, no-store");
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) return res.status(401).json({ error: "Not authenticated" });
    const { type } = req.query;
    if (!["notes", "tasks"].includes(type)) return res.status(400).json({ error: "Invalid content type" });
    const client = await clientPromise;
    const saved = await client.db().collection("dashboardContent").findOne({ _id: `${session.user.id}:${type}` });
    return res.status(200).json({ content: saved?.content ?? (type === "tasks" ? [] : "") });
  } catch (error) { return sendApiError(res, error); }
}
