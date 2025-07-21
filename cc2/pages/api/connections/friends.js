import { getAllItems } from '../../../utils/db';

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
    
    // Find users who are friends with this user
    // Assuming a user's 'friends' array contains the IDs of their friends
    const friendIds = Array.isArray(currentUser.friends) ? currentUser.friends : [];
    const friends = users.filter(u => 
      friendIds.some(fId => fId === u._id.toString() || fId.toString() === u._id.toString())
    );
    
    res.status(200).json({ friends });
  } catch (error) {
    console.error('Error fetching friends:', error);
    res.status(500).json({ message: 'Failed to fetch friends' });
  }
}
