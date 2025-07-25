import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import clientPromise from '../../../utils/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ message: 'Connection ID is required' });
    }

    // Only handle DELETE requests
    if (req.method !== 'DELETE') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    const client = await clientPromise;
    const db = client.db();
    const connectionsCollection = db.collection('connections');

    // Find the connection to verify the current user is part of it
    const connection = await connectionsCollection.findOne({
      _id: new ObjectId(id),
      $or: [
        { user1Id: session.user.email },
        { user2Id: session.user.email }
      ]
    });

    if (!connection) {
      return res.status(404).json({ message: 'Connection not found or you do not have permission' });
    }

    // Delete the connection
    await connectionsCollection.deleteOne({ _id: new ObjectId(id) });

    return res.status(200).json({ message: 'Connection removed successfully' });
  } catch (error) {
    console.error('Error removing connection:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
