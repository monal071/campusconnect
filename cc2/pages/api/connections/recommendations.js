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
    
    // Get current user to find existing connections and pending requests
    const currentUser = await db.collection('users').findOne({ 
      _id: new ObjectId(userId) 
    });
    
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get all users except current user
    const excludeIds = [userId];
    
    // Exclude existing friends
    if (currentUser.friends && Array.isArray(currentUser.friends)) {
      excludeIds.push(...currentUser.friends.map(id => id.toString()));
    }
    
    // Exclude users who already have pending requests from current user
    if (currentUser.requests && Array.isArray(currentUser.requests)) {
      excludeIds.push(...currentUser.requests.map(id => id.toString()));
    }
    
    // Find users who have sent requests to current user (to exclude them too)
    const usersWithPendingRequests = await db.collection('users').find({
      requests: { $in: [userId, new ObjectId(userId)] }
    }).project({ _id: 1 }).toArray();
    
    excludeIds.push(...usersWithPendingRequests.map(u => u._id.toString()));
    
    // Get recommendations - users not in exclude list
    const recommendations = await db.collection('users').find({
      _id: { $nin: excludeIds.map(id => {
        try {
          return new ObjectId(id);
        } catch {
          return id;
        }
      })}
    }).project({ 
      password: 0, 
      requests: 0,
      friends: 0 
    }).limit(10).toArray();
    
    res.status(200).json({ recommendations });
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({ message: 'Failed to fetch recommendations' });
  }
}
