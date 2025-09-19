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
      // Get all conversations for the current user
      try {
        const conversations = await db.collection('conversations')
          .find({
            participants: { $in: [currentUserId] }
          })
          .sort({ lastMessageAt: -1 })
          .toArray();

        // Populate participant details
        const populatedConversations = await Promise.all(
          conversations.map(async (conversation) => {
            const otherParticipantId = conversation.participants.find(
              id => id !== currentUserId
            );
            
            const otherUser = await db.collection('users').findOne(
              { _id: new ObjectId(otherParticipantId) },
              { projection: { name: 1, email: 1, image: 1, role: 1 } }
            );

            return {
              ...conversation,
              otherUser,
              unreadCount: conversation.unreadCounts?.[currentUserId] || 0
            };
          })
        );

        return res.status(200).json({ conversations: populatedConversations });
      } catch (error) {
        console.error('Error fetching conversations:', error);
        return res.status(500).json({ message: 'Failed to fetch conversations' });
      }
    }

    if (req.method === 'POST') {
      // Create or get existing conversation
      const { participantId } = req.body;
      
      if (!participantId) {
        return res.status(400).json({ message: 'Participant ID is required' });
      }

      if (participantId === currentUserId) {
        return res.status(400).json({ message: 'Cannot start conversation with yourself' });
      }

      try {
        // Check if conversation already exists
        const existingConversation = await db.collection('conversations').findOne({
          participants: { $all: [currentUserId, participantId] }
        });

        if (existingConversation) {
          return res.status(200).json({ 
            conversation: existingConversation,
            isNew: false 
          });
        }

        // Verify both users exist and are connected
        const [user1, user2] = await Promise.all([
          db.collection('users').findOne({ _id: new ObjectId(currentUserId) }),
          db.collection('users').findOne({ _id: new ObjectId(participantId) })
        ]);

        if (!user1 || !user2) {
          return res.status(404).json({ message: 'User not found' });
        }

        // Check if users are connected (friends)
        const areConnected = user1.friends && user1.friends.includes(participantId);
        if (!areConnected) {
          return res.status(403).json({ message: 'You can only chat with your connections' });
        }

        // Create new conversation
        const newConversation = {
          participants: [currentUserId, participantId],
          createdAt: new Date(),
          lastMessageAt: new Date(),
          lastMessage: null,
          unreadCounts: {
            [currentUserId]: 0,
            [participantId]: 0
          }
        };

        const result = await db.collection('conversations').insertOne(newConversation);
        newConversation._id = result.insertedId;

        return res.status(201).json({ 
          conversation: newConversation,
          isNew: true 
        });
      } catch (error) {
        console.error('Error creating conversation:', error);
        return res.status(500).json({ message: 'Failed to create conversation' });
      }
    }

    res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Error in conversations API:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}