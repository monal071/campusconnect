import clientPromise from '../../utils/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const client = await clientPromise;
      const db = client.db();
      
      // Get query parameters
      const { limit, sort } = req.query;
      const limitNum = parseInt(limit) || 10;
      
      let sortQuery = { createdAt: -1 }; // Default: newest first
      
      // Handle different sort options
      if (sort === 'popular') {
        sortQuery = { likes: -1 }; // Most liked first
      } else if (sort === 'oldest') {
        sortQuery = { createdAt: 1 }; // Oldest first
      }
      
      const resources = await db.collection('resources')
        .find({})
        .sort(sortQuery)
        .limit(limitNum)
        .toArray();
      
      // Add user details for each resource
      const resourcesWithUsers = await Promise.all(
        resources.map(async (resource) => {
          if (resource.userId) {
            try {
              const user = await db.collection('users').findOne(
                { _id: new ObjectId(resource.userId) },
                { projection: { name: 1, email: 1 } }
              );
              return {
                ...resource,
                author: user?.name || 'Unknown User',
                authorEmail: user?.email || ''
              };
            } catch (error) {
              return {
                ...resource,
                author: 'Unknown User',
                authorEmail: ''
              };
            }
          }
          return {
            ...resource,
            author: 'Unknown User',
            authorEmail: ''
          };
        })
      );
      
      res.status(200).json({ 
        data: resourcesWithUsers,
        total: resourcesWithUsers.length 
      });
    } catch (error) {
      console.error('Error fetching resources:', error);
      res.status(500).json({ error: 'Failed to fetch resources' });
    }
  } else if (req.method === 'POST') {
    try {
      const client = await clientPromise;
      const db = client.db();
      
      const resource = {
        ...req.body,
        likes: 0, // Initialize likes to 0
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const result = await db.collection('resources').insertOne(resource);
      
      res.status(201).json({ 
        message: 'Resource added successfully',
        id: result.insertedId 
      });
    } catch (error) {
      console.error('Error adding resource:', error);
      res.status(500).json({ error: 'Failed to add resource' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
