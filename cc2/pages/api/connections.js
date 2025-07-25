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
    const connectionsCollection = db.collection('connections');

    // Find all connections where the current user is involved
    const connections = await connectionsCollection.find({
      $or: [
        { user1Id: session.user.email },
        { user2Id: session.user.email }
      ]
    }).toArray();

    // Get the IDs of all connected users
    const connectedUserIds = connections.map(conn => 
      conn.user1Id === session.user.email ? conn.user2Id : conn.user1Id
    );

    // If there are no connections, return empty array
    if (connectedUserIds.length === 0) {
      return res.status(200).json([]);
    }

    // Get details of all connected users
    const connectedUsers = await db.collection('users').find({
      email: { $in: connectedUserIds }
    })
    .project({
      _id: 1,
      name: 1,
      email: 1,
      image: 1,
      role: 1,
      department: 1
    })
    .toArray();

    // Add connection details to each user
    const usersWithConnectionDetails = connectedUsers.map(user => {
      const connection = connections.find(conn => 
        conn.user1Id === user.email || conn.user2Id === user.email
      );
      
      return {
        ...user,
        connectionId: connection._id,
        connectedSince: connection.createdAt
      };
    });

    return res.status(200).json(usersWithConnectionDetails);
  } catch (error) {
    console.error('Error fetching connections:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
