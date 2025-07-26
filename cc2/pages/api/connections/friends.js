import clientPromise from '../../../utils/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  try {
    const userId = req.query.id;
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    const client = await clientPromise;
    const db = client.db();
    
    // Get current user
    const currentUser = await db.collection('users').findOne({ 
      _id: new ObjectId(userId) 
    });
    
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get friends list
    const friendIds = Array.isArray(currentUser.friends) ? currentUser.friends : [];
    
    if (friendIds.length === 0) {
      return res.status(200).json({ friends: [] });
    }
    
    // Convert string IDs to ObjectIds for MongoDB query
    const objectIds = friendIds.map(id => {
      try {
        return new ObjectId(id);
      } catch {
        return id; // Keep as string if conversion fails
      }
    });
    
    // Find friends by their IDs
    const friends = await db.collection('users').find({
      _id: { $in: objectIds }
    }).project({ 
      password: 0, 
      requests: 0,
      friends: 0 
    }).toArray();
    
    res.status(200).json({ friends });
  } catch (error) {
    console.error('Error fetching friends:', error);
    res.status(500).json({ message: 'Failed to fetch friends' });
  }
}
