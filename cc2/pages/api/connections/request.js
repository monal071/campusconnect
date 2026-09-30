import { customRateLimit } from "../../../lib/rateLimiter";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import clientPromise from "../../../utils/mongodb";
import { changeConnection } from "../../../lib/connections";
import { sendApiError } from "../../../lib/api-errors";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "private, no-store");
  if (!["POST", "PUT", "DELETE"].includes(req.method)) return res.status(405).json({ message: "Method not allowed" });
  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) return res.status(401).json({ message: "Not authenticated" });
    const { fromUserId, toUserId, userId1, userId2, action } = req.body || {};
    const actorId = session.user.id;
    const claimedActor = req.method === "POST" ? fromUserId : req.method === "PUT" ? toUserId : userId1;
    if (claimedActor && claimedActor !== actorId) return res.status(403).json({ message: "You can only manage your own connections" });
    if (req.method === "POST") {
      const limit = await customRateLimit(`connections:${actorId}`, 30, 60000);
      if (!limit.success) { res.setHeader("Retry-After", limit.retryAfter); return res.status(429).json({ message: "Please wait before sending more requests" }); }
    }
    const otherId = req.method === "POST" ? toUserId : req.method === "PUT" ? fromUserId : userId2;
    const client = await clientPromise;
    return res.status(200).json(await changeConnection(client, client.db(), actorId, otherId, req.method === "POST" ? "send" : req.method === "DELETE" ? "remove" : action));
  } catch (error) { return sendApiError(res, error); }
}
