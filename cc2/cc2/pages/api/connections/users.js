// Minimal backend for /api/connections/users
import clientPromise from '../../../utils/mongodb';

export default async function handler(req, res) {
  if (req.method === 'DELETE') {
    try {
      const { id } = req.body;
      if (!id) return res.status(400).json({ message: 'Missing user id' });
      const client = await clientPromise;
      const db = client.db();
      const result = await db.collection('users').deleteOne({ _id: typeof id === 'string' ? new (await import('mongodb')).ObjectId(id) : id });
      if (result.deletedCount === 1) {
        return res.status(200).json({ success: true });
      } else {
        return res.status(404).json({ message: 'User not found' });
      }
    } catch (error) {
      return res.status(500).json({ message: 'Failed to delete user' });
    }
  }
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  try {
    const q = req.query.q?.toLowerCase() || '';
    const client = await clientPromise;
    const db = client.db();
    // Search by name or email, case-insensitive, partial match
    const users = await db.collection('users').find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ]
    }).project({ password: 0 }).limit(20).toArray();
    res.status(200).json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch users' });
  }
}
