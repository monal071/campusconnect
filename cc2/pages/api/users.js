import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import clientPromise from "../../utils/mongodb";
import { ObjectId } from "mongodb";
import { publicUserFields } from "../../lib/connections";
import { sendApiError } from "../../lib/api-errors";
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "private, no-store");
  if (!["GET", "PUT"].includes(req.method)) return res.status(405).json({ message: "Method not allowed" });
  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) return res.status(401).json({ message: "Not authenticated" });
    const id = req.query.id || session.user.id;
    if (typeof id !== "string" || !ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid user ID" });
    if (req.method === "PUT" && id !== session.user.id) return res.status(403).json({ message: "You can only edit your own profile" });
    const client = await clientPromise;
    const users = client.db().collection("users");
    if (req.method === "PUT") {
      const { name } = req.body || {};
      if (typeof name !== "string" || !name.trim() || name.length > 100) return res.status(400).json({ message: "Name must contain 1–100 characters" });
      const user = await users.findOneAndUpdate({ _id: new ObjectId(id) }, { $set: { name: name.trim(), updatedAt: new Date() } }, { returnDocument: "after", projection: publicUserFields });
      return user ? res.status(200).json({ user }) : res.status(404).json({ message: "User not found" });
    }
    const user = await users.findOne({ _id: new ObjectId(id) }, { projection: id === session.user.id ? { password: 0 } : publicUserFields });
    return user ? res.status(200).json({ user }) : res.status(404).json({ message: "User not found" });
  } catch (error) { return sendApiError(res, error); }
}
