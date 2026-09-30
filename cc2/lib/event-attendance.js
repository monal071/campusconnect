import { ObjectId } from "mongodb";
import { ApiError } from "./api-errors";

export async function eventAttendance(db, eventId, userId, options = {}) {
  if (typeof eventId !== "string" || !ObjectId.isValid(eventId)) throw new ApiError(400, "Invalid event ID");
  const event = await db.collection("events").findOne({ _id: new ObjectId(eventId), status: "approved" }, options);
  if (!event) throw new ApiError(404, "Event not found");
  const rsvps = await db.collection("rsvps").find({ eventId }, options).toArray();
  const statuses = new Map((event.joined || []).map(id => [String(id), "going"]));
  // Explicit RSVPs override legacy joined entries.
  rsvps.forEach(rsvp => statuses.set(String(rsvp.userId), rsvp.status));
  const counts = { going: 0, maybe: 0, not_going: 0 };
  for (const status of statuses.values()) if (status in counts) counts[status]++;
  return { event, rsvps, statuses, counts, userStatus: statuses.get(userId) || null, reminder: rsvps.find(r => String(r.userId) === userId)?.reminder || false };
}

export async function setEventAttendance(client, db, eventId, user, status) {
  if (![null, "going", "maybe", "not_going"].includes(status)) throw new ApiError(400, "Invalid RSVP status");
  const transaction = client.startSession();
  try {
    return await transaction.withTransaction(async () => {
      const options = { session: transaction };
      const before = await eventAttendance(db, eventId, user.id, options);
      const now = new Date();
      if (status === "going" && before.userStatus !== "going" && before.event.maxAttendees && before.counts.going >= before.event.maxAttendees) throw new ApiError(409, "This event is full");
      const filter = { eventId, userId: user.id };
      if (status === null) await db.collection("rsvps").deleteMany(filter, options);
      else await db.collection("rsvps").updateOne(filter, { $set: { status, respondedAt: now }, $setOnInsert: { createdAt: now, reminder: false } }, { ...options, upsert: true });
      // Keep the existing event cards and the RSVP controls on the same state.
      await db.collection("events").updateOne({ _id: before.event._id }, status === "going"
        ? { $addToSet: { joined: user.id }, $set: { attendanceUpdatedAt: now } }
        : { $pull: { joined: { $in: [user.id, new ObjectId(user.id)] } }, $set: { attendanceUpdatedAt: now } }, options);
      const after = await eventAttendance(db, eventId, user.id, options);
      await db.collection("events").updateOne({ _id: before.event._id }, { $set: { attendees: after.counts.going } }, options);
      if (status === "going" && before.userStatus !== "going") {
        await db.collection("userActivity").insertOne({ userId: user.id, type: "event_join", content: `Joined event: ${before.event.title}`, eventId, timestamp: now, icon: "EventIcon" }, options);
        if (before.event.createdBy && String(before.event.createdBy) !== user.id) await db.collection("notifications").insertOne({ userId: String(before.event.createdBy), type: "event_rsvp", message: `${user.name} is attending your event "${before.event.title}"`, eventId, link: "/events", fromUser: user.id, read: false, createdAt: now }, options);
      }
      return { success: true, status, userStatus: status, counts: after.counts, joinedCount: after.counts.going };
    });
  } finally { await transaction.endSession(); }
}
