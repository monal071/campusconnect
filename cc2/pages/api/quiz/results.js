import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { connectToDatabase } from '../../../utils/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Only faculty and admin can view results
    if (session.user.role !== 'faculty' && session.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only faculty can view quiz results' });
    }

    const { db } = await connectToDatabase();

    if (req.method === 'GET') {
      const { quizId } = req.query;

      if (!quizId) {
        return res.status(400).json({ message: 'Quiz ID is required' });
      }

      // Get quiz with submissions
      const quiz = await db.collection('quizzes').findOne(
        { 
          _id: new ObjectId(quizId),
          createdBy: new ObjectId(session.user.id),
          isActive: true
        }
      );

      if (!quiz) {
        return res.status(404).json({ message: 'Quiz not found or not authorized' });
      }

      // Format results
      const results = {
        quizName: quiz.quizName,
        totalQuestions: quiz.questions.length,
        submissions: quiz.submissions || [],
        submissionCount: quiz.submissions?.length || 0,
        averageScore: quiz.submissions?.length > 0 
          ? Math.round(quiz.submissions.reduce((sum, sub) => sum + sub.score, 0) / quiz.submissions.length)
          : 0,
        createdAt: quiz.createdAt,
        timeLimit: quiz.timeLimit
      };

      res.status(200).json({ results });

    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Quiz results API error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}