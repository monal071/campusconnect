import { withResourceAccess } from "../../../../../lib/resource-access";
import { ObjectId } from "mongodb";
import { connectToDatabase } from "../../../../../utils/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]";

async function handler(req, res) {
  const { resourceId } = req.query;

  if (typeof resourceId !== "string" || !ObjectId.isValid(resourceId)) {
    return res.status(400).json({ error: "Resource ID is required" });
  }

  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { db } = await connectToDatabase();
    const { commentId, reason } = req.body;

    if (!commentId || !reason?.trim()) {
      return res
        .status(400)
        .json({ error: "Comment ID and reason are required" });
    }

    if (typeof commentId !== "string" || !ObjectId.isValid(commentId) || !await db.collection("resourceComments").findOne({ _id: new ObjectId(commentId), resourceId })) return res.status(404).json({ error: "Comment not found" });
    // Check if already reported
    const existingReport = await db.collection("commentReports").findOne({
      commentId,
      reportedBy: session.user.id,
    });

    if (existingReport) {
      return res
        .status(400)
        .json({ error: "You have already reported this comment" });
    }

    // Create report
    await db.collection("commentReports").insertOne({
      commentId,
      resourceId,
      reportedBy: session.user.id,
      reason: reason.trim(),
      status: "pending", // pending, reviewed, resolved
      createdAt: new Date(),
    });

    // Get comment details for notification
    const comment = await db
      .collection("resourceComments")
      .findOne({ _id: new ObjectId(commentId) });

    // Notify admins
    const admins = await db
      .collection("users")
      .find({ role: "admin" })
      .project({ _id: 1 })
      .toArray();

    const adminNotifications = admins.map((admin) => ({
      userId: admin._id,
      type: "comment_reported",
      message: `A comment has been reported for: ${reason.trim()}`,
      resourceId,
      commentId,
      fromUser: session.user.id,
      read: false,
      createdAt: new Date(),
    }));

    if (adminNotifications.length > 0) {
      await db.collection("notifications").insertMany(adminNotifications);
    }

    return res.status(200).json({
      success: true,
      message: "Comment reported successfully",
    });
  } catch (error) {
    console.error("Report API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export default withResourceAccess(handler);
