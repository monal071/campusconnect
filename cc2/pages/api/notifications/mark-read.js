import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import clientPromise from '../../../utils/mongodb';

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const client = await clientPromise;
    const db = client.db();

    // Mark all user's notifications as read
    await db.collection('notifications').updateMany(
      { userId: session.user.id, read: false },
      { $set: { read: true, readAt: new Date() } }
    );

    return res.status(200).json({ success: true });
    
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
