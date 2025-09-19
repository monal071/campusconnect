import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import clientPromise from '../../utils/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const client = await clientPromise;
    const db = client.db();

    if (req.method === 'GET') {
      // Get user's notifications
      const notifications = await db.collection('notifications')
        .find({ userId: session.user.id })
        .sort({ createdAt: -1 })
        .limit(50)
        .toArray();

      return res.status(200).json({ 
        success: true,
        notifications: notifications.map(notif => ({
          ...notif,
          _id: notif._id.toString()
        }))
      });
    }

    if (req.method === 'PATCH') {
      // Mark notification as read
      const { notificationId } = req.body;
      
      if (!notificationId) {
        return res.status(400).json({ error: 'Notification ID required' });
      }

      await db.collection('notifications').updateOne(
        { _id: new ObjectId(notificationId), userId: session.user.id },
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