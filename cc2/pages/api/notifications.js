import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import clientPromise from '../../utils/mongodb';
import { ObjectId } from 'mongodb';
import { connectionState } from '../../lib/connections';

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "private, no-store");
  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const client = await clientPromise;
    const db = client.db();

    if (req.method === 'GET') {
      const state = await connectionState(db, session.user.id);
      // Only actual pending requests are actionable, including old unresolved notifications.
      const pendingIds = state.incoming.flatMap(id => [id, new ObjectId(id)]);
      // Get user's notifications
      const notifications = await db.collection('notifications')
        .find({ userId: { $in: [session.user.id, new ObjectId(session.user.id)] }, $or: [
          { type: { $ne: "friend_request" } },
          { type: "friend_request", senderId: { $in: pendingIds }, resolvedAt: { $exists: false } }
        ] })
        .sort({ createdAt: -1 })
        .limit(50)
        .toArray();

      return res.status(200).json({ 
        success: true,
        notifications: notifications.filter((notif, index, all) => notif.type !== "friend_request" || all.findIndex(n => n.type === "friend_request" && String(n.senderId) === String(notif.senderId)) === index).map(notif => ({
          ...notif,
          _id: notif._id.toString()
        }))
      });
    }

    if (req.method === 'PATCH') {
      // Mark notification as read
      const { notificationId } = req.body;
      
      if (typeof notificationId !== "string" || !ObjectId.isValid(notificationId)) {
        return res.status(400).json({ error: 'Notification ID required' });
      }

      await db.collection('notifications').updateOne(
        { _id: new ObjectId(notificationId), userId: { $in: [session.user.id, new ObjectId(session.user.id)] } },
        { $set: { read: true, readAt: new Date() } }
      );

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
    
  } catch (error) {
    console.error('Error with notifications:', error);
    return res.status(500).json({ error: 'Failed to process notifications' });
  }
}