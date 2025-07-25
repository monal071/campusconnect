import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import clientPromise from '../../utils/mongodb';

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
    const usersCollection = db.collection('users');
    const requestsCollection = db.collection('connectionRequests');
    const connectionsCollection = db.collection('connections');

    // Get current user's connections
    const connections = await connectionsCollection.find({
      $or: [
        { user1Id: session.user.email },
        { user2Id: session.user.email }
      ]
    }).toArray();

    // Get IDs of users the current user is already connected with
    const connectedUserIds = connections.map(conn => 
      conn.user1Id === session.user.email ? conn.user2Id : conn.user1Id
    );

    // Get pending requests sent or received by current user
    const pendingRequests = await requestsCollection.find({
      $or: [
        { senderId: session.user.email, status: 'pending' },
        { receiverId: session.user.email, status: 'pending' }
      ]
    }).toArray();

    // Get IDs of users with pending requests
    const pendingUserIds = pendingRequests.map(req => 
      req.senderId === session.user.email ? req.receiverId : req.senderId
    );

    // Combine connected and pending users to exclude from recommendations
    const excludeUserIds = [...connectedUserIds, ...pendingUserIds, session.user.email];

    // Find users who are not connected and don't have pending requests
    const recommendedUsers = await usersCollection.find({
      email: { $nin: excludeUserIds }
    })
    .project({
      _id: 1,
      name: 1,
      email: 1,
      image: 1,
      role: 1,
      department: 1
    })
    .limit(10)  // Limit to 10 recommendations
    .toArray();

    return res.status(200).json(recommendedUsers);
  } catch (error) {
    console.error('Error fetching recommended users:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
