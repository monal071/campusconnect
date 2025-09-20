import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_URI;
const options = {};

let client;
let clientPromise;

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your Mongo URI to .env.local');
}

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

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

    const client = await clientPromise;
    const db = client.db('campusconnect');

    if (req.method === 'GET') {
      const { quizId } = req.query;

      if (!quizId) {
        return res.status(400).json({ message: 'Quiz ID is required' });
      }

      // Get quiz with submissions
      const quiz = await db.collection('quizzes').findOne(
        { 
          _id: new ObjectId(quizId),
          createdBy: new ObjectId(session.user.id)
        }
      );

      if (!quiz) {
        return res.status(404).json({ message: 'Quiz not found or not authorized' });
      }

      // Check if quiz deadline has passed - only allow viewing results after deadline
      const now = new Date();
      const deadline = new Date(quiz.deadline);
      if (now <= deadline) {
        return res.status(403).json({ 
          message: 'Quiz results can only be viewed after the deadline has passed',
          deadline: quiz.deadline,
          timeRemaining: Math.max(0, Math.ceil((deadline - now) / (1000 * 60))) // minutes remaining
        });
      }

      // Format results
      const results = {
        quizName: quiz.quizName,
        deadline: quiz.deadline,
        totalQuestions: quiz.questions.length,
        submissions: quiz.submissions || [],
        submissionCount: quiz.submissions?.length || 0,
        averageScore: quiz.submissions?.length > 0 
          ? Math.round(quiz.submissions.reduce((sum, sub) => sum + sub.score, 0) / quiz.submissions.length)
          : 0,
        createdAt: quiz.createdAt,
        isExpired: now > deadline
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