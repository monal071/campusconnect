import { ObjectId } from "mongodb";
import { ApiError } from "./api-errors";

export async function changeChat(client, db, conversationId, userId, action, body = {}) {
  const transaction = client.startSession();
  try {
    return await transaction.withTransaction(async () => {
      const options = { session: transaction };
      const filter = { _id: new ObjectId(conversationId), participants: userId };
      const conversation = await db.collection("conversations").findOne(filter, options);
      if (!conversation) throw new ApiError(404, "Conversation not found");
      // All mutations write the conversation so concurrent sends/reads/clears
      // conflict and retry against a consistent transaction snapshot.
      if (action === "send") {
        const message = { _id: new ObjectId(), conversationId: conversation._id, senderId: userId,
          content: body.content?.trim() || "", imageUrl: body.imageUrl || null,
          createdAt: new Date(), readBy: [userId], messageType: body.imageUrl ? "image" : "text" };
        await db.collection("messages").insertOne(message, options);
        const increments = Object.fromEntries(conversation.participants.filter(id => id !== userId).map(id => [`unreadCounts.${id}`, 1]));
        await db.collection("conversations").updateOne(filter, {
          $set: { lastMessageAt: message.createdAt, lastMessage: { content: message.content || "Sent an image", senderId: userId, createdAt: message.createdAt } },
          ...(Object.keys(increments).length ? { $inc: increments } : {}),
        }, options);
        return message;
      }
      let deletedCount = 0;
      if (action === "clear") {
        ({ deletedCount } = await db.collection("messages").deleteMany({ conversationId: conversation._id }, options));
      } else {
        await db.collection("messages").updateMany({ conversationId: conversation._id, readBy: { $ne: userId } }, { $addToSet: { readBy: userId } }, options);
      }
      await db.collection("conversations").updateOne(filter, { $set: action === "clear"
        ? { unreadCounts: Object.fromEntries(conversation.participants.map(id => [id, 0])), lastMessage: null, lastMessageAt: new Date() }
        : { [`unreadCounts.${userId}`]: 0, updatedAt: new Date() } }, options);
      return { deletedCount };
    });
  } finally { await transaction.endSession(); }
}
