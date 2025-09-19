import { getServerSession } from 'next-auth/next';
import clientPromise from '../../../utils/mongodb';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (req.method !== 'GET') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    const client = await clientPromise;
    const db = client.db();
    const currentUserId = session.user.id;

    // Get total unread messages count across all conversations
    const conversations = await db.collection('conversations')
      .find({
        participants: { $in: [currentUserId] }
      })
      .toArray();

    const totalUnreadCount = conversations.reduce((total, conversation) => {
      return total + (conversation.unreadCounts?.[currentUserId] || 0);
    }, 0);

    return res.status(200).json({ unreadCount: totalUnreadCount });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}