import { changeChat } from "../../../lib/chat";
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
    
    if (typeof conversationId !== "string" || !ObjectId.isValid(conversationId)) {
      return res.status(400).json({ message: 'Conversation ID is required' });
    }

    const { client, db } = await connectToDatabase();
    const userId = session.user.id;

    const deleteResult = await changeChat(client, db, conversationId, userId, "clear");

    res.status(200).json({ 
      message: 'Chat cleared successfully',
      deletedCount: deleteResult.deletedCount
    });

  } catch (error) {
    console.error('Clear chat error:', error);
    res.status(error.status || 500).json({ message: error.status ? error.message : 'Internal server error' });
  }
}