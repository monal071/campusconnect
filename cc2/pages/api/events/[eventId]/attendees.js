import { connectToDatabase } from "../../../../utils/mongodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";
import { ObjectId } from "mongodb";
import { eventAttendance } from "../../../../lib/event-attendance";
import { sendApiError } from "../../../../lib/api-errors";
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "private, no-store");
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) return res.status(401).json({ error: "Not authenticated" });
    const status = req.query.status || "going";
    if (!["going", "maybe", "not_going"].includes(status)) return res.status(400).json({ error: "Invalid status" });
    const { db } = await connectToDatabase();
    const { statuses, rsvps } = await eventAttendance(db, req.query.eventId, session.user.id);
    const ids = [...statuses].filter(([id, value]) => value === status && ObjectId.isValid(id)).map(([id]) => new ObjectId(id));
    const users = await db.collection("users").find({ _id: { $in: ids } }).project({ name: 1, image: 1 }).toArray();
    const attendees = users.map(user => ({ ...user, status, respondedAt: rsvps.find(r => String(r.userId) === String(user._id))?.respondedAt }));
    return res.status(200).json({ attendees, count: attendees.length });
  } catch (error) { return sendApiError(res, error); }
}
