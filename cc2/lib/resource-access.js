import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../pages/api/auth/[...nextauth]";
import clientPromise from "../utils/mongodb";

export function resourceVisibility(user) {
  if (user?.role === "admin") return {};
  const publicOnly = { isPublic: { $ne: false } };
  if (!user?.id) return publicOnly;
  const ids = [user.id];
  if (ObjectId.isValid(user.id)) ids.push(new ObjectId(user.id));
  return { $or: [publicOnly, { userId: { $in: ids } }, { createdBy: { $in: ids } }] };
}

// Apply before every resource-specific read or interaction, including versions.
export function withResourceAccess(handler) {
  return async (req, res) => {
    res.setHeader("Cache-Control", "private, no-store");
    const resourceId = req.query.resourceId ?? req.body?.resourceId;
    if (typeof resourceId !== "string" || !ObjectId.isValid(resourceId)) return res.status(400).json({ error: "Invalid resource ID" });
    try {
      const session = await getServerSession(req, res, authOptions);
      const client = await clientPromise;
      const resource = await client.db().collection("resources").findOne({ $and: [{ _id: new ObjectId(resourceId) }, resourceVisibility(session?.user)] }, { projection: { _id: 1 } });
      if (!resource) return res.status(404).json({ error: "Resource not found" });
      return handler(req, res);
    } catch (error) {
      console.error("Resource access check failed:", error);
      return res.status(500).json({ error: "Unable to check resource access" });
    }
  };
}
