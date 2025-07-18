import { getAllItems } from '../../../utils/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  try {
    // Use 'users' collection (lowercase, consistent)
    const result = await getAllItems('users');
    // Recommend users who are not friends and not the current user (mock, needs real logic)
    const recommendations = (result.data || []).slice(0, 10); // Just return first 10 for now
    res.status(200).json({ recommendations });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch recommendations' });
  }
}
