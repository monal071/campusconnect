import { connectToDatabase } from '../../../utils/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' });
  const { password } = req.query;
  if (!password) return res.status(400).json({ message: 'Password required' });

  const { db } = await connectToDatabase();
  const quiz = await db.collection('quizzes').findOne({ password });
  if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

  res.status(200).json({ quiz });
}