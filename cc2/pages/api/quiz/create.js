import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import clientPromise from '../../../utils/mongodb';
import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
  const session = await getServerSession(req, res, authOptions);
  if (!session || session.user.role !== 'faculty') return res.status(403).json({ message: 'Forbidden' });

  const { quizName, questions, deadline } = req.body;
  if (!quizName || !questions || !Array.isArray(questions) || !deadline) {
    return res.status(400).json({ message: 'Invalid input: quizName, questions, and deadline are required' });
  }

  // Validate deadline is in the future
  const deadlineDate = new Date(deadline);
  if (deadlineDate <= new Date()) {
    return res.status(400).json({ message: 'Deadline must be in the future' });
  }

  const password = crypto.randomBytes(4).toString('hex');
  const client = await clientPromise;
  const db = client.db();
  const quiz = {
    quizName,
    questions,
    password,
    deadline: deadlineDate,
    createdBy: session.user.id,
    createdAt: new Date(),
    submissions: []
  };
  const result = await db.collection('quizzes').insertOne(quiz);
  res.status(200).json({ quizId: result.insertedId, password });
}