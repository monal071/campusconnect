// Minimal backend for /api/connections/incoming
import { getAllItems } from '../../../utils/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  try {
    // Use 'users' collection (lowercase, consistent)
    const result = await getAllItems('users');
    // Filter for users with pending requests (customize as needed)
    const incoming = (result.data || []).filter(u => u.requests && u.requests.length > 0);
    res.status(200).json({ incoming });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch incoming requests' });
  }
}
