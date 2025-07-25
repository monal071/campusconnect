import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import clientPromise from '../../utils/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const client = await clientPromise;
    const db = client.db();
    const usersCollection = db.collection('users');
    const requestsCollection = db.collection('connectionRequests');

    // GET - Fetch connection requests for the current user
    if (req.method === 'GET') {
      // Find received requests where this user is the receiver
      const receivedRequests = await requestsCollection.aggregate([
        { 
          $match: { 
            receiverId: session.user.email,
            status: 'pending'
          } 
        },
        {
          $lookup: {
            from: 'users',
            localField: 'senderId',
            foreignField: 'email',
            as: 'sender'
          }
        },
        {
          $unwind: '$sender'
        },
        {
          $project: {
            _id: 1,
            senderId: 1,
            createdAt: 1,
            status: 1,
            'sender.name': 1,
            'sender.email': 1,
            'sender.image': 1
          }
        }
      ]).toArray();

      // Find sent requests where this user is the sender
      const sentRequests = await requestsCollection.find({
        senderId: session.user.email,
        status: 'pending'
      }).toArray();

      return res.status(200).json({
        receivedRequests,
        sentRequests
      });
    }
    
    // POST - Send a connection request
    if (req.method === 'POST') {
      const { receiverId } = req.body;
      
      if (!receiverId) {
        return res.status(400).json({ message: 'Receiver ID is required' });
      }

      // Check if user is trying to send request to themselves
      if (receiverId === session.user.email) {
        return res.status(400).json({ message: 'Cannot send connection request to yourself' });
      }

      // Check if receiver exists
      const receiver = await usersCollection.findOne({ email: receiverId });
      if (!receiver) {
        return res.status(404).json({ message: 'Receiver not found' });
      }

      // Check if request already exists
      const existingRequest = await requestsCollection.findOne({
        senderId: session.user.email,
        receiverId,
        status: 'pending'
      });

      if (existingRequest) {
        return res.status(400).json({ message: 'Request already sent' });
      }

      // Check if they are already connected
      const existingConnection = await db.collection('connections').findOne({
        $or: [
          { user1Id: session.user.email, user2Id: receiverId },
          { user1Id: receiverId, user2Id: session.user.email }
        ]
      });

      if (existingConnection) {
        return res.status(400).json({ message: 'Already connected with this user' });
      }

      // Create the request
      await requestsCollection.insertOne({
        senderId: session.user.email,
        receiverId,
        status: 'pending',
        createdAt: new Date()
      });

      return res.status(201).json({ message: 'Connection request sent' });
    }
    
    // PUT - Accept or reject a connection request
    if (req.method === 'PUT') {
      const { requestId, action } = req.body;
      
      if (!requestId || !action) {
        return res.status(400).json({ message: 'Request ID and action are required' });
      }

      if (action !== 'accept' && action !== 'reject') {
        return res.status(400).json({ message: 'Invalid action' });
      }

      // Find the request
      const request = await requestsCollection.findOne({
        _id: new ObjectId(requestId),
        receiverId: session.user.email,
        status: 'pending'
      });

      if (!request) {
        return res.status(404).json({ message: 'Request not found' });
      }

      if (action === 'accept') {
        // Create a connection
        await db.collection('connections').insertOne({
          user1Id: request.senderId,
          user2Id: request.receiverId,
          createdAt: new Date()
        });

        // Update request status
        await requestsCollection.updateOne(
          { _id: new ObjectId(requestId) },
          { $set: { status: 'accepted' } }
        );

        return res.status(200).json({ message: 'Connection request accepted' });
      } else {
        // Update request status to rejected
        await requestsCollection.updateOne(
          { _id: new ObjectId(requestId) },
          { $set: { status: 'rejected' } }
        );

        return res.status(200).json({ message: 'Connection request rejected' });
      }
    }

    // Method not allowed
    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Connection requests error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
