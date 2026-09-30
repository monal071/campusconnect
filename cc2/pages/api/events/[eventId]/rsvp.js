import { connectToDatabase } from "../../../../utils/mongodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";
import { eventAttendance, setEventAttendance } from "../../../../lib/event-attendance";
import { sendApiError } from "../../../../lib/api-errors";
import { invalidateCache } from "../../../../lib/redis";
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "private, no-store");
  if (!["GET", "POST", "DELETE"].includes(req.method)) return res.status(405).json({ error: "Method not allowed" });
  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) return res.status(401).json({ error: "Not authenticated" });
    const { client, db } = await connectToDatabase();
    if (req.method === "GET") {
      const { userStatus, reminder, counts } = await eventAttendance(db, req.query.eventId, session.user.id);
      return res.status(200).json({ userStatus, reminder, counts });
    }
    const result = await setEventAttendance(client, db, req.query.eventId, session.user, req.method === "DELETE" ? null : req.body.status);
    await invalidateCache.events();
    return res.status(200).json(result);
  } catch (error) { return sendApiError(res, error); }
}
