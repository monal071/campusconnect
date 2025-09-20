import clientPromise from '../../utils/mongodb';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const client = await clientPromise;
      const db = client.db();
      
      // Get query parameters for pagination, filtering, and sorting
      const { 
        limit, 
        sort, 
        page = 1, 
        type, 
        search, 
        category,
        tags
      } = req.query;
      
      const limitNum = parseInt(limit) || 20;
      const pageNum = parseInt(page) || 1;
      const skipNum = (pageNum - 1) * limitNum;
      
      // Build filter query
      let filterQuery = {};
      
      // Filter by type
      if (type && type !== 'all') {
        filterQuery.type = type;
      }
      
      // Filter by category
      if (category && category !== 'all') {
        filterQuery.category = category;
      }
      
      // Search functionality
      if (search) {
        filterQuery.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } }
        ];
      }
      
      // Filter by tags
      if (tags) {
        const tagArray = tags.split(',').map(tag => tag.trim());
        filterQuery.tags = { $in: tagArray };
      }
      
      // Build sort query
      let sortQuery = { createdAt: -1 }; // Default: newest first
      
      if (sort === 'popular') {
        sortQuery = { likes: -1, createdAt: -1 };
      } else if (sort === 'oldest') {
        sortQuery = { createdAt: 1 };
      } else if (sort === 'title') {
        sortQuery = { title: 1 };
      } else if (sort === 'updated') {
        sortQuery = { updatedAt: -1 };
      }
      
      // Get total count for pagination
      const totalCount = await db.collection('resources').countDocuments(filterQuery);
      
      const resources = await db.collection('resources')
        .find(filterQuery)
        .sort(sortQuery)
        .skip(skipNum)
        .limit(limitNum)
        .toArray();
      
      // Add user details for each resource
      const resourcesWithUsers = await Promise.all(
        resources.map(async (resource) => {
          if (resource.userId) {
            try {
              const user = await db.collection('users').findOne(
                { _id: new ObjectId(resource.userId) },
                { projection: { name: 1, email: 1, image: 1 } }
              );
              return {
                ...resource,
                author: user?.name || 'Unknown User',
                authorEmail: user?.email || '',
                authorImage: user?.image || null
              };
            } catch (error) {
              return {
                ...resource,
                author: 'Unknown User',
                authorEmail: '',
                authorImage: null
              };
            }
          }
          return {
            ...resource,
            author: resource.author || 'Unknown User',
            authorEmail: '',
            authorImage: null
          };
        })
      );
      
      res.status(200).json({ 
        data: resourcesWithUsers,
        total: totalCount,
        page: pageNum,
        totalPages: Math.ceil(totalCount / limitNum),
        hasMore: pageNum * limitNum < totalCount
      });
    } catch (error) {
      console.error('Error fetching resources:', error);
      res.status(500).json({ error: 'Failed to fetch resources' });
    }
  } else if (req.method === 'POST') {
    try {
      // Check authentication
      const session = await getServerSession(req, res, authOptions);
      if (!session || !session.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      const client = await clientPromise;
      const db = client.db();
      
      // Get user details
      const user = await db.collection('users').findOne({ 
        email: session.user.email.toLowerCase() 
      });
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      const { 
        title, 
        description, 
        type, 
        category, 
        url, 
        downloadUrl, 
        tags, 
        fileSize,
        fileName,
        isPublic = true
      } = req.body;
      
      // Validate required fields
      if (!title || !description || !type) {
        return res.status(400).json({ 
          error: 'Missing required fields: title, description, type' 
        });
      }
      
      // Validate URL if provided
      if (url) {
        try {
          new URL(url);
        } catch {
          return res.status(400).json({ error: 'Invalid URL format' });
        }
      }
      
      const resource = {
        title: title.trim(),
        description: description.trim(),
        type,
        category: category || 'general',
        url: url || null,
        downloadUrl: downloadUrl || null,
        tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim()) : []),
        fileSize: fileSize || null,
        fileName: fileName || null,
        isPublic,
        likes: 0,
        likedBy: [],
        downloads: 0,
        views: 0,
        userId: user._id,
        author: user.name,
        authorEmail: user.email,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const result = await db.collection('resources').insertOne(resource);
      
      // Return the created resource with user info
      const createdResource = {
        ...resource,
        _id: result.insertedId,
        authorImage: user.image || null
      };
      
      res.status(201).json({ 
        message: 'Resource added successfully',
        data: createdResource
      });
    } catch (error) {
      console.error('Error adding resource:', error);
      res.status(500).json({ error: 'Failed to add resource' });
    }
  } else if (req.method === 'PUT') {
    try {
      // Check authentication
      const session = await getServerSession(req, res, authOptions);
      if (!session || !session.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      const { resourceId, ...updateData } = req.body;
      
      if (!resourceId) {
        return res.status(400).json({ error: 'Resource ID is required' });
      }
      
      const client = await clientPromise;
      const db = client.db();
      
      // Check if resource exists and user owns it
      const resource = await db.collection('resources').findOne({ 
        _id: new ObjectId(resourceId) 
      });
      
      if (!resource) {
        return res.status(404).json({ error: 'Resource not found' });
      }
      
      const user = await db.collection('users').findOne({ 
        email: session.user.email.toLowerCase() 
      });
      
      // Check ownership or admin role
      if (resource.userId.toString() !== user._id.toString() && user.role !== 'admin') {
        return res.status(403).json({ error: 'Permission denied' });
      }
      
      // Update resource
      const updatedResource = {
        ...updateData,
        updatedAt: new Date()
      };
      
      await db.collection('resources').updateOne(
        { _id: new ObjectId(resourceId) },
        { $set: updatedResource }
      );
      
      res.status(200).json({ 
        message: 'Resource updated successfully',
        data: { ...resource, ...updatedResource }
      });
    } catch (error) {
      console.error('Error updating resource:', error);
      res.status(500).json({ error: 'Failed to update resource' });
    }
  } else if (req.method === 'DELETE') {
    try {
      // Check authentication
      const session = await getServerSession(req, res, authOptions);
      if (!session || !session.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      const { resourceId } = req.body;
      
      if (!resourceId) {
        return res.status(400).json({ error: 'Resource ID is required' });
      }
      
      const client = await clientPromise;
      const db = client.db();
      
      // Check if resource exists and user owns it
      const resource = await db.collection('resources').findOne({ 
        _id: new ObjectId(resourceId) 
      });
      
      if (!resource) {
        return res.status(404).json({ error: 'Resource not found' });
      }
      
      const user = await db.collection('users').findOne({ 
        email: session.user.email.toLowerCase() 
      });
      
      // Check ownership or admin role
      if (resource.userId.toString() !== user._id.toString() && user.role !== 'admin') {
        return res.status(403).json({ error: 'Permission denied' });
      }
      
      // Delete resource
      await db.collection('resources').deleteOne({ 
        _id: new ObjectId(resourceId) 
      });
      
      res.status(200).json({ 
        message: 'Resource deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting resource:', error);
      res.status(500).json({ error: 'Failed to delete resource' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
