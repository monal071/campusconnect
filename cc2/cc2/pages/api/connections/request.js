// Minimal backend for /api/connections/request
import { updateItem } from '../../../utils/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  try {
    const { fromUserId, toUserId } = req.body;
    if (!fromUserId || !toUserId) {
      return res.status(400).json({ message: 'Missing user IDs' });
    }
    // Use 'users' collection (lowercase, consistent)
    await updateItem('users', toUserId, { $push: { requests: fromUserId } });
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Failed to send request' });
  }
}
