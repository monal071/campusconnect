import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { connectToDatabase } from '../../../utils/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { conversationId } = req.query;
    
    if (!conversationId) {
      return res.status(400).json({ message: 'Conversation ID is required' });
    }

    const { db } = await connectToDatabase();
    const userId = new ObjectId(session.user.id);
    const convId = new ObjectId(conversationId);

    // Verify the user is part of this conversation
    const conversation = await db.collection('conversations').findOne({
      _id: convId,
      participants: userId
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found or access denied' });
    }

    // Delete all messages in this conversation
    const deleteResult = await db.collection('messages').deleteMany({
      conversationId: convId
    });

    // Update conversation's lastMessage to null and lastMessageAt to current time
    await db.collection('conversations').updateOne(
      { _id: convId },
      {
        $set: {
          lastMessage: null,
          lastMessageAt: new Date(),
          updatedAt: new Date()
        }
      }
    );

    res.status(200).json({ 
      message: 'Chat cleared successfully',
      deletedCount: deleteResult.deletedCount
    });

  } catch (error) {
    console.error('Clear chat error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}