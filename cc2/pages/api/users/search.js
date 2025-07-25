import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import clientPromise from '../../../utils/mongodb';

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (req.method !== 'GET') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    const { q } = req.query;
    
    if (!q || q.trim() === '') {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const client = await clientPromise;
    const db = client.db();
    const usersCollection = db.collection('users');
    const requestsCollection = db.collection('connectionRequests');
    const connectionsCollection = db.collection('connections');

    // Get connections for the current user
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

    // Find users matching the search query
    const searchResults = await usersCollection.find({
      $and: [
        {
          $or: [
            { name: { $regex: q, $options: 'i' } },
            { email: { $regex: q, $options: 'i' } }
          ]
        },
        { email: { $ne: session.user.email } } // Exclude current user
      ]
    })
    .project({
      _id: 1,
      name: 1,
      email: 1,
      image: 1,
      role: 1,
      department: 1
    })
    .limit(20)
    .toArray();

    // Add a flag indicating if they are already connected
    const resultsWithConnectionStatus = searchResults.map(user => ({
      ...user,
      isConnected: connectedUserIds.includes(user.email)
    }));

    return res.status(200).json(resultsWithConnectionStatus);
  } catch (error) {
    console.error('Error searching users:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
