import { MongoClient } from 'mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

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
    if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' });
    
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const { password } = req.query;
    if (!password) return res.status(400).json({ message: 'Password required' });

    const client = await clientPromise;
    const db = client.db('campusconnect');
    
    // Search for quiz by password (case-insensitive)
    const quiz = await db.collection('quizzes').findOne({ password: password.trim() });
    
    if (!quiz) {
      console.log('Quiz not found for password:', password);
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Check if quiz is active (manual teacher control)
    if (quiz.isActive === false) {
      return res.status(403).json({ 
        message: 'Quiz is not active', 
        isActive: false
      });
    }

    const responseQuiz = {
      _id: quiz._id,
      quizName: quiz.quizName,
      description: quiz.description,
      questions: quiz.questions,
      totalQuestions: quiz.totalQuestions,
      totalPoints: quiz.totalPoints,
      timeLimit: quiz.timeLimit,
      isActive: quiz.isActive,
      isPublic: quiz.isPublic,
      allowRetakes: quiz.allowRetakes,
      showResults: quiz.showResults,
      category: quiz.category,
      difficulty: quiz.difficulty,
      password: quiz.password,
      createdByName: quiz.createdByName || 'Unknown',
      createdAt: quiz.createdAt
    };

    res.status(200).json({ quiz: responseQuiz });
  } catch (error) {
    console.error('Quiz get API error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}