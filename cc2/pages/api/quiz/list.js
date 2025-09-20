import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import clientPromise from '../../../utils/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' });
  const session = await getServerSession(req, res, authOptions);
  if (!session || session.user.role !== 'faculty') return res.status(403).json({ message: 'Forbidden' });

  const client = await clientPromise;
  const db = client.db();
  const quizzes = await db.collection('quizzes').find({ createdBy: session.user.id }).toArray();
  res.status(200).json({ quizzes });
}