import clientPromise from '../../../utils/mongodb';
import { ObjectId } from 'mongodb';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get the user's session
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const { resourceId } = req.body;
    const userId = session.user.id;

    if (!resourceId) {
      return res.status(400).json({ message: 'Resource ID is required' });
    }

    const client = await clientPromise;
    const db = client.db();

    // Get the resource
    const resource = await db.collection('resources').findOne({
      _id: new ObjectId(resourceId)
    });

    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    // Check if user already liked this resource
    const likedBy = resource.likedBy || [];
    const hasLiked = likedBy.includes(userId);

    if (hasLiked) {
      // Unlike the resource
      await db.collection('resources').updateOne(
        { _id: new ObjectId(resourceId) },
        {
          $pull: { likedBy: userId },
          $inc: { likes: -1 }
        }
      );
      
      return res.status(200).json({ 
        message: 'Resource unliked',
        liked: false,
        likes: Math.max(0, (resource.likes || 0) - 1)
      });
    } else {
      // Like the resource
      await db.collection('resources').updateOne(
        { _id: new ObjectId(resourceId) },
        {
          $addToSet: { likedBy: userId },
          $inc: { likes: 1 }
        }
      );
      
      return res.status(200).json({ 
        message: 'Resource liked',
        liked: true,
        likes: (resource.likes || 0) + 1
      });
    }
  } catch (error) {
    console.error('Error handling resource like:', error);
    return res.status(500).json({ message: 'Failed to process like' });
  }
}
