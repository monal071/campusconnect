import { timingSafeEqual } from "crypto";
import clientPromise from "../../../utils/mongodb";
import { deliverEventReminders } from "../../../lib/event-reminders";
import { sendApiError } from "../../../lib/api-errors";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const expected = process.env.CRON_SECRET && Buffer.from(`Bearer ${process.env.CRON_SECRET}`);
  const supplied = Buffer.from(req.headers.authorization || "");
  if (!expected || expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return res.status(401).json({ error: "Unauthorized" });
  try {
    const client = await clientPromise;
    return res.status(200).json(await deliverEventReminders(client.db()));
  } catch (error) { return sendApiError(res, error); }
}
