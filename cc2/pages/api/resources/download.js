import clientPromise from '../../../utils/mongodb';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { resourceId } = req.body;

    if (!resourceId) {
      return res.status(400).json({ error: 'Resource ID is required' });
    }

    const client = await clientPromise;
    const db = client.db();

    // Check if resource exists
    const resource = await db.collection('resources').findOne({ 
      _id: new ObjectId(resourceId) 
    });

    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    // Increment download count
    await db.collection('resources').updateOne(
      { _id: new ObjectId(resourceId) },
      { 
        $inc: { downloads: 1 },
        $set: { lastDownloaded: new Date() }
      }
    );

    const newDownloads = (resource.downloads || 0) + 1;

    res.status(200).json({
      message: 'Download tracked',
      downloads: newDownloads
    });

  } catch (error) {
    console.error('Error tracking resource download:', error);
    res.status(500).json({ error: 'Failed to track download' });
  }
}