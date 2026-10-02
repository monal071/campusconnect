import { ObjectId } from "mongodb";
import { createHash } from "crypto";

// In-app reminders for opted-in attendees. The deterministic ObjectId makes
// overlapping cron jobs and notification reads idempotent without a migration.
export async function deliverEventReminders(db, { userId, now = new Date() } = {}) {
  const subscriptions = db.collection("rsvps").find({ reminder: true, status: "going", ...(userId ? { userId } : {}) });
  let delivered = 0;
  for await (const rsvp of subscriptions) {
    if (!ObjectId.isValid(rsvp.eventId)) continue;
    const event = await db.collection("events").findOne({ _id: new ObjectId(rsvp.eventId), status: "approved" }, { projection: { title: 1, date: 1 } });
    const date = new Date(event?.date);
    const until = date.getTime() - now.getTime();
    if (!event || !Number.isFinite(until) || until <= 0 || until > 48 * 3600000) continue;
    const _id = new ObjectId(createHash("sha256").update(`event-reminder:${rsvp.eventId}:${rsvp.userId}:${date.toISOString()}`).digest("hex").slice(0, 24));
    try {
      const result = await db.collection("notifications").updateOne({ _id }, { $setOnInsert: {
        userId: String(rsvp.userId), type: "event_reminder", title: "Upcoming event",
        message: `Reminder: ${event.title} starts ${date.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" })} IST.`,
        eventId: String(rsvp.eventId), link: "/events", read: false, createdAt: now,
      } }, { upsert: true });
      delivered += result.upsertedCount;
    } catch (error) { if (error.code !== 11000) throw error; }
  }
  return { delivered };
}
