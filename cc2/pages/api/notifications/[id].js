import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { connectToDatabase } from '../../../utils/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.query;

  if (!id || !ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid notification ID' });
  }

  const { db } = await connectToDatabase();

  if (req.method === 'PATCH') {
    try {
      const { read } = req.body;

      // Update notification as read/unread
      const result = await db
        .collection('notifications')
        .updateOne(
          { _id: new ObjectId(id), userId: session.user.id },
          { 
            $set: { 
              read: read,
              readAt: read ? new Date() : null
            }
          }
        );

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: 'Notification not found' });
      }

      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error updating notification:', error);
      res.status(500).json({ error: 'Failed to update notification' });
    }
  } else if (req.method === 'DELETE') {
    try {
      // Delete notification
      const result = await db
        .collection('notifications')
        .deleteOne({ _id: new ObjectId(id), userId: session.user.id });

      if (result.deletedCount === 0) {
        return res.status(404).json({ error: 'Notification not found' });
      }

      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error deleting notification:', error);
      res.status(500).json({ error: 'Failed to delete notification' });
    }
  } else {
    res.setHeader('Allow', ['PATCH', 'DELETE']);
    res.status(405).json({ error: 'Method not allowed' });
  }
}
