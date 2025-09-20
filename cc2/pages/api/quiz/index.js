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

// Generate random password for quiz
function generateQuizPassword(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const client = await clientPromise;
    const db = client.db('campusconnect');

    if (req.method === 'POST') {
      // Create new quiz (Faculty only)
      if (session.user.role !== 'faculty' && session.user.role !== 'admin') {
        return res.status(403).json({ message: 'Only faculty can create quizzes' });
      }

      const { quizName, questions, timeLimit = 30 } = req.body;

      if (!quizName || !questions || !Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({ message: 'Quiz name and questions are required' });
      }

      // Validate questions format
      for (const q of questions) {
        if (!q.question || !q.options || !Array.isArray(q.options) || q.options.length < 2 || typeof q.correctAnswer !== 'number') {
          return res.status(400).json({ message: 'Invalid question format' });
        }
      }

      const quizPassword = generateQuizPassword();
      
      const quiz = {
        quizName,
        questions,
        timeLimit,
        password: quizPassword,
        createdBy: new ObjectId(session.user.id),
        createdByName: session.user.name,
        createdAt: new Date(),
        isActive: true,
        submissions: []
      };

      const result = await db.collection('quizzes').insertOne(quiz);
      
      res.status(201).json({
        message: 'Quiz created successfully',
        quizId: result.insertedId,
        password: quizPassword
      });

    } else if (req.method === 'GET') {
      // Get quizzes based on role
      if (session.user.role === 'faculty' || session.user.role === 'admin') {
        // Faculty/Admin: Get their created quizzes
        const quizzes = await db.collection('quizzes')
          .find({ 
            createdBy: new ObjectId(session.user.id),
            isActive: true 
          })
          .project({ 
            questions: 0 // Don't send questions in list view
          })
          .sort({ createdAt: -1 })
          .toArray();

        res.status(200).json({ quizzes });
      } else {
        // Students: No access to quiz list
        res.status(403).json({ message: 'Students cannot view quiz list' });
      }

    } else if (req.method === 'DELETE') {
      // Delete quiz (Faculty only)
      if (session.user.role !== 'faculty' && session.user.role !== 'admin') {
        return res.status(403).json({ message: 'Only faculty can delete quizzes' });
      }

      const { quizId } = req.query;
      
      if (!quizId) {
        return res.status(400).json({ message: 'Quiz ID is required' });
      }

      const result = await db.collection('quizzes').updateOne(
        { 
          _id: new ObjectId(quizId),
          createdBy: new ObjectId(session.user.id)
        },
        { 
          $set: { isActive: false, deletedAt: new Date() }
        }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ message: 'Quiz not found or not authorized' });
      }

      res.status(200).json({ message: 'Quiz deleted successfully' });

    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Quiz API error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}