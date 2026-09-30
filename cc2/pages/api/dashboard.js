import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import clientPromise from "../../utils/mongodb";
import { dashboardStats, upcomingEvents } from "../../lib/dashboard";
import { sendApiError } from "../../lib/api-errors";
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "private, no-store");
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) return res.status(401).json({ error: "Not authenticated" });
    const client = await clientPromise;
    const db = client.db();
    const [stats, upcoming, recentActivity, recentPosts] = await Promise.all([
      dashboardStats(client, db, session.user), upcomingEvents(db, session.user.id),
      db.collection("userActivity").find({ userId: { $in: [session.user.id, session.user.email] } }).sort({ timestamp: -1 }).limit(5).toArray(),
      db.collection("posts").find({ "author.id": session.user.id }).sort({ createdAt: -1 }).limit(5).toArray(),
    ]);
    return res.status(200).json({ user: session.user, stats, upcomingEvents: upcoming, recentActivity, recentPosts });
  } catch (error) { return sendApiError(res, error); }
}
