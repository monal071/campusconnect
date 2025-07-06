import { getItem } from '../../../utils/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ message: 'Missing user id' });
    const result = await getItem('users', id);
    if (!result.data) return res.status(404).json({ message: 'User not found' });
    const { password, ...user } = result.data;
    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch user profile' });
  }
}
