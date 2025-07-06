import { getAllItems } from '../../../utils/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  try {
    // Use 'users' collection (lowercase, consistent)
    const result = await getAllItems('users');
    // Filter for users with a 'friends' array
    const friends = (result.data || []).filter(u => Array.isArray(u.friends) && u.friends.length > 0);
    res.status(200).json({ friends });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch friends' });
  }
}
