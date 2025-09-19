import { getServerSession } from 'next-auth/next';
import clientPromise from '../../../utils/mongodb';
import { authOptions } from '../auth/[...nextauth]';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const client = await clientPromise;
    const db = client.db();
    const currentUserId = session.user.id;

    if (req.method === 'GET') {
      // Get messages for a conversation
      const { conversationId, page = 1, limit = 50 } = req.query;
      
      if (!conversationId) {
        return res.status(400).json({ message: 'Conversation ID is required' });
      }

      try {
        // Verify user is part of the conversation
        const conversation = await db.collection('conversations').findOne({
          _id: new ObjectId(conversationId),
          participants: { $in: [currentUserId] }
        });

        if (!conversation) {
          return res.status(404).json({ message: 'Conversation not found' });
        }

        // Get messages with pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const messages = await db.collection('messages')
          .find({ conversationId: new ObjectId(conversationId) })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .toArray();

        // Reverse to show oldest first
        messages.reverse();

        return res.status(200).json({ 
          messages,
          hasMore: messages.length === parseInt(limit)
        });
      } catch (error) {
        console.error('Error fetching messages:', error);
        return res.status(500).json({ message: 'Failed to fetch messages' });
      }
    }

    if (req.method === 'POST') {
      // Send a message
      const { conversationId, content } = req.body;
      
      if (!conversationId || !content?.trim()) {
        return res.status(400).json({ message: 'Conversation ID and content are required' });
      }

      try {
        // Verify user is part of the conversation
        const conversation = await db.collection('conversations').findOne({
          _id: new ObjectId(conversationId),
          participants: { $in: [currentUserId] }
        });

        if (!conversation) {
          return res.status(404).json({ message: 'Conversation not found' });
        }

        // Create new message
        const newMessage = {
          conversationId: new ObjectId(conversationId),
          senderId: currentUserId,
          content: content.trim(),
          createdAt: new Date(),
          readBy: [currentUserId], // Sender has read the message
          messageType: 'text'
        };

        const result = await db.collection('messages').insertOne(newMessage);
        newMessage._id = result.insertedId;

        // Update conversation with last message info
        const otherParticipantId = conversation.participants.find(
          id => id !== currentUserId
        );

        await db.collection('conversations').updateOne(
          { _id: new ObjectId(conversationId) },
          {
            $set: {
              lastMessageAt: newMessage.createdAt,
              lastMessage: {
                content: content.trim(),
                senderId: currentUserId,
                createdAt: newMessage.createdAt
              }
            },
            $inc: {
              [`unreadCounts.${otherParticipantId}`]: 1
            }
          }
        );

        // Get sender info for the response
        const sender = await db.collection('users').findOne(
          { _id: new ObjectId(currentUserId) },
          { projection: { name: 1, image: 1 } }
        );

        return res.status(201).json({ 
          message: {
            ...newMessage,
            sender
          }
        });
      } catch (error) {
        console.error('Error sending message:', error);
        return res.status(500).json({ message: 'Failed to send message' });
      }
    }

    if (req.method === 'PUT') {
      // Mark messages as read
      const { conversationId } = req.body;
      
      if (!conversationId) {
        return res.status(400).json({ message: 'Conversation ID is required' });
      }

      try {
        // Verify user is part of the conversation
        const conversation = await db.collection('conversations').findOne({
          _id: new ObjectId(conversationId),
          participants: { $in: [currentUserId] }
        });

        if (!conversation) {
          return res.status(404).json({ message: 'Conversation not found' });
        }

        // Mark all messages in conversation as read by current user
        await db.collection('messages').updateMany(
          { 
            conversationId: new ObjectId(conversationId),
            readBy: { $ne: currentUserId }
          },
          { 
            $addToSet: { readBy: currentUserId }
          }
        );

        // Reset unread count for current user
        await db.collection('conversations').updateOne(
          { _id: new ObjectId(conversationId) },
          {
            $set: {
              [`unreadCounts.${currentUserId}`]: 0
            }
          }
        );

        return res.status(200).json({ message: 'Messages marked as read' });
      } catch (error) {
        console.error('Error marking messages as read:', error);
        return res.status(500).json({ message: 'Failed to mark messages as read' });
      }
    }

    res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Error in messages API:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}