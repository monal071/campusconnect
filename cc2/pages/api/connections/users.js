import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import clientPromise from "../../../utils/mongodb";
import { publicUserFields } from "../../../lib/connections";
export default async function handler(req, res) {
  // Account deletion belongs to the authenticated account settings endpoint.
  if (req.method !== "GET") return res.status(405).json({ message: "Method not allowed" });
  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) return res.status(401).json({ message: "Not authenticated" });
    const q = typeof req.query.q === "string" ? req.query.q.slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, "\\$&") : "";
    const client = await clientPromise;
    const users = await client.db().collection("users").find({ $or: [{ name: { $regex: q, $options: "i" } }, { email: { $regex: q, $options: "i" } }] }).project(publicUserFields).limit(20).toArray();
    return res.status(200).json({ users });
  } catch { return res.status(500).json({ message: "Failed to fetch users" }); }
}
