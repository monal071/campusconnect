import { getAllItems, getItem } from '../../../utils/db';
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
    
    // Get all users
    const result = await getAllItems('users');
    const users = result.data || [];
    
    // Get current user
    const currentUser = users.find(u => u._id.toString() === userId);
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Find users who have sent connection requests to this user
    const incoming = users.filter(u => 
      Array.isArray(u.requests) && 
      u.requests.some(reqId => reqId === userId || reqId.toString() === userId)
    );
    
    res.status(200).json({ incoming });
  } catch (error) {
    console.error('Error fetching incoming requests:', error);
    res.status(500).json({ message: 'Failed to fetch incoming requests' });
  }
}
