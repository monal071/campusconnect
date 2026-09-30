import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import clientPromise from "../../../utils/mongodb";
import { invalidateCache } from "../../../lib/redis";
import { ObjectId } from "mongodb";

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session || session.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied. Admin only." });
    }

    const client = await clientPromise;
    const db = client.db();

    if (req.method === "GET") {
      // Get all pending approvals
      const pendingJobs = await db
        .collection("pending_jobs")
        .find({ status: "pending" })
        .toArray();
      const pendingEvents = await db
        .collection("pending_events")
        .find({ status: "pending" })
        .toArray();

      return res.status(200).json({
        success: true,
        data: {
          jobs: pendingJobs,
          events: pendingEvents,
          total: pendingJobs.length + pendingEvents.length,
        },
      });
    }

    if (req.method === "POST") {
      const { type, itemId, action, reason = "" } = req.body || {};
      if (!["job", "event"].includes(type) || !["approve", "reject"].includes(action) || typeof itemId !== "string" || !ObjectId.isValid(itemId) || typeof reason !== "string") return res.status(400).json({ error: "Invalid approval request" });
      const collectionName = type === "job" ? "pending_jobs" : "pending_events";
      const approvedCollectionName = type === "job" ? "jobs" : "events";
      const transaction = client.startSession();
      try {
        await transaction.withTransaction(async () => {
          const options = { session: transaction };
          const pending = await db.collection(collectionName).findOne({ _id: new ObjectId(itemId) }, options);
          if (!pending) throw Object.assign(new Error("Submission not found"), { status: 404 });
          const status = action === "approve" ? "approved" : "rejected";
          if (pending.status === status) return;
          if (pending.status !== "pending") throw Object.assign(new Error("This submission has already been reviewed"), { status: 409 });
          const now = new Date();
          await db.collection(collectionName).updateOne({ _id: pending._id }, { $set: { status, reviewedBy: session.user.id, reviewedAt: now, rejectionReason: action === "reject" ? reason.slice(0, 1000) : "" } }, options);
          if (action === "approve") await db.collection(approvedCollectionName).updateOne({ _id: pending._id }, { $setOnInsert: { ...pending, status, approvedBy: session.user.id, approvedAt: now } }, { ...options, upsert: true });
          await db.collection("notifications").insertOne({ userId: String(pending.createdBy), type, message: `Your ${type} "${pending.title}" has been ${status}.${action === "reject" && reason ? " Reason: " + reason.slice(0, 1000) : ""}`, link: action === "approve" ? `/${approvedCollectionName}` : "/dashboard", read: false, createdAt: now }, options);
        });
      } finally { await transaction.endSession(); }
      if (type === "event") await invalidateCache.events();
      return res.status(200).json({ success: true, message: `Submission ${action === "approve" ? "approved" : "rejected"}` });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Pending approvals API error:", error);
    return res.status(error.status || 500).json({ error: error.status ? error.message : "Internal server error" });
  }
}
