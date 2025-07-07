import clientPromise from '../../utils/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { id } = req.query;
      if (!id) return res.status(400).json({ message: 'Missing user id' });
      const client = await clientPromise;
      const db = client.db();
      const user = await db.collection('users').findOne({ _id: new ObjectId(id) }, { projection: { password: 0 } });
      if (!user) return res.status(404).json({ message: 'User not found' });
      res.status(200).json({ user });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch user profile' });
    }
    return;
  }

  if (req.method === 'PUT') {
    try {
      const { name } = req.body;
      // You should get user id from session in production, here we use a query param for demo
      const { id } = req.query;
      if (!id || !name) return res.status(400).json({ message: 'Missing user id or name' });
      const client = await clientPromise;
      const db = client.db();
      const result = await db.collection('users').findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { name, updatedAt: new Date() } },
        { returnDocument: 'after', projection: { password: 0 } }
      );
      if (!result.value) return res.status(404).json({ message: 'User not found' });
      res.status(200).json({ user: result.value });
    } catch (error) {
      res.status(500).json({ message: 'Failed to update user name' });
    }
    return;
  }

  res.status(405).json({ message: 'Method not allowed' });
}
