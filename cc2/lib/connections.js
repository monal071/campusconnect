import { ObjectId } from "mongodb";
import { ApiError } from "./api-errors";

export const publicUserFields = { name: 1, email: 1, image: 1, role: 1, department: 1, institute: 1, bio: 1 };
const strings = (values = []) => [...new Set(values.map(String))];
const variants = (id) => [id, new ObjectId(id)];
const pair = (a, b) => ({ $or: [{ user1Id: a, user2Id: b }, { user1Id: b, user2Id: a }] });

export async function connectionState(db, userId, options = {}) {
  if (typeof userId !== "string" || !ObjectId.isValid(userId)) throw new ApiError(400, "Invalid user ID");
  const user = await db.collection("users").findOne({ _id: new ObjectId(userId) }, options);
  if (!user) throw new ApiError(404, "User not found");
  // Include older email-based records without moving or deleting existing data.
  const legacy = await db.collection("connections").find({ $or: [{ user1Id: user.email }, { user2Id: user.email }] }, options).toArray();
  const requests = await db.collection("connectionRequests").find({ receiverId: user.email, status: "pending" }, options).toArray();
  const emails = [...legacy.map(c => c.user1Id === user.email ? c.user2Id : c.user1Id), ...requests.map(r => r.senderId)];
  const people = emails.length ? await db.collection("users").find({ email: { $in: emails } }, options).project({ email: 1 }).toArray() : [];
  const byEmail = new Map(people.map(p => [p.email, String(p._id)]));
  const friends = strings([...(user.friends || []), ...legacy.map(c => byEmail.get(c.user1Id === user.email ? c.user2Id : c.user1Id)).filter(Boolean)]).filter(id => ObjectId.isValid(id));
  const incoming = strings([...(user.requests || []), ...requests.map(r => byEmail.get(r.senderId)).filter(Boolean)])
    .filter(id => ObjectId.isValid(id) && id !== userId && !friends.includes(id));
  return { user, friends, incoming };
}

export async function changeConnection(client, db, actorId, otherId, action) {
  if (![actorId, otherId].every(id => typeof id === "string" && ObjectId.isValid(id))) throw new ApiError(400, "Invalid user ID");
  if (actorId === otherId) throw new ApiError(400, "Choose another user");
  if (!["send", "accept", "reject", "remove"].includes(action)) throw new ApiError(400, "Invalid action");
  const transaction = client.startSession();
  try {
    return await transaction.withTransaction(async () => {
      const options = { session: transaction };
      const actor = await connectionState(db, actorId, options);
      const other = await connectionState(db, otherId, options);
      const users = db.collection("users");
      const notifications = db.collection("notifications");
      const now = new Date();
      const resolve = async (recipient, sender, status) => {
        await notifications.updateMany({ userId: { $in: variants(recipient) }, senderId: { $in: variants(sender) }, type: "friend_request" }, { $set: { status, read: true, resolvedAt: now } }, options);
      };
      if (action === "send") {
        if (actor.friends.includes(otherId) || other.friends.includes(actorId)) throw new ApiError(409, "You are already connected");
        if (actor.incoming.includes(otherId)) throw new ApiError(409, "This person has already sent you a request. Accept it from your requests.");
        if (other.incoming.includes(actorId)) return { success: true, message: "Request already sent" };
        // Touch both users to serialize crossed requests as well as retries.
        await users.updateOne({ _id: actor.user._id }, { $set: { connectionsUpdatedAt: now } }, options);
        await users.updateOne({ _id: other.user._id }, { $addToSet: { requests: actorId } }, options);
        await notifications.insertOne({ userId: otherId, senderId: actorId, senderName: actor.user.name, senderEmail: actor.user.email, type: "friend_request", status: "pending", message: `${actor.user.name} sent you a friend request`, link: "/connections", read: false, createdAt: now }, options);
      } else if (action === "remove") {
        await users.updateOne({ _id: actor.user._id }, { $pull: { friends: { $in: variants(otherId) }, requests: { $in: variants(otherId) } } }, options);
        await users.updateOne({ _id: other.user._id }, { $pull: { friends: { $in: variants(actorId) }, requests: { $in: variants(actorId) } } }, options);
        await db.collection("connections").deleteMany(pair(actor.user.email, other.user.email), options);
        await db.collection("friendships").updateMany(pair(actorId, otherId), { $set: { status: "removed", removedAt: now } }, options);
        await db.collection("connectionRequests").updateMany({ $or: [{ senderId: actor.user.email, receiverId: other.user.email }, { senderId: other.user.email, receiverId: actor.user.email }], status: "pending" }, { $set: { status: "cancelled", updatedAt: now } }, options);
        await resolve(actorId, otherId, "removed");
        await resolve(otherId, actorId, "removed");
      } else {
        const pending = actor.incoming.includes(otherId);
        if (action === "accept" && !pending && !actor.friends.includes(otherId)) throw new ApiError(409, "This request is no longer pending");
        if (action === "accept" && pending) {
          await users.updateOne({ _id: actor.user._id }, { $addToSet: { friends: otherId }, $pull: { requests: { $in: variants(otherId) } } }, options);
          await users.updateOne({ _id: other.user._id }, { $addToSet: { friends: actorId }, $pull: { requests: { $in: variants(actorId) } } }, options);
          const [user1Id, user2Id] = [actorId, otherId].sort();
          await db.collection("friendships").updateOne({ _id: `${user1Id}:${user2Id}` }, { $set: { user1Id, user2Id, status: "active", acceptedAt: now }, $setOnInsert: { createdAt: now } }, { ...options, upsert: true });
          await notifications.insertOne({ userId: otherId, type: "approval", message: `${actor.user.name} accepted your friend request`, link: "/connections", read: false, createdAt: now }, options);
          await db.collection("userActivity").insertMany([actorId, otherId].map(id => ({ userId: id, type: "connection_accepted", content: `Connected with ${id === actorId ? other.user.name : actor.user.name}`, timestamp: now, icon: "PeopleIcon" })), options);
        } else {
          await users.updateOne({ _id: actor.user._id }, { $pull: { requests: { $in: variants(otherId) } } }, options);
        }
        await db.collection("connectionRequests").updateMany({ senderId: other.user.email, receiverId: actor.user.email, status: "pending" }, { $set: { status: action === "accept" ? "accepted" : "rejected", updatedAt: now } }, options);
        await resolve(actorId, otherId, action === "accept" ? "accepted" : "rejected");
        if (action === "accept") await resolve(otherId, actorId, "accepted");
      }
      return { success: true, message: action === "send" ? "Connection request sent" : action === "remove" ? "Connection removed" : `Connection request ${action === "accept" ? "accepted" : "declined"}` };
    });
  } finally { await transaction.endSession(); }
}
